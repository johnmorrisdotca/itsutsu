import "server-only";

import type { Prisma } from "@prisma/client";

import { replayGame } from "@/lib/gomoku/replay";
import { GAME_STATUS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";
import { NO_CURRENT_NAMES, currentNamesFor } from "./currentNames";
import { SUMMARY_SELECT, toGameMove, toSummary } from "./gameHistory";
import { waitingFirst } from "./nextGame";
import { offerIsMine, offerState, offeredSeat } from "./offers";
import { OFFER_STATES, type OfferState } from "./offers.types";
import { KEEP_FINISHED_DEFAULT, myListWindow, staysInMyList } from "./retention";
import { type SettledPosition, settledPosition } from "./settledTurn";
import type { GameMove, GameSummary } from "./gameHistory.types";

/** A game nobody has touched for this long is flagged, so it can be dealt with. */
export const STALE_AFTER_DAYS = 14;

/**
 * The queue, in the order it is drawn.
 *
 * OFFERS TO YOU COME FIRST, ahead even of the games waiting on your move.
 * They are the same kind of debt — something is waiting on you — and they are
 * the more urgent one: a game waiting on a move is a game two people are
 * playing, while an offer is somebody who cannot start at all until you
 * answer. There are never many, so putting them at the top costs the rest of
 * the page nothing.
 *
 * YOUR OWN OFFERS sit with the games you are waiting on, because that is what
 * they are — after "their move", before the boards nobody has started.
 */
export const MY_GAME_GROUPS = [
  "offered",
  "yourMove",
  "theirMove",
  "offerSent",
  "unstarted",
  "hotSeat",
  "finished",
] as const;
export type MyGameGroup = (typeof MY_GAME_GROUPS)[number];

export type MyGame = {
  game: GameSummary;
  /**
   * The colour this browser holds in it — or, on an offer, the colour it WOULD
   * hold. An offer's seat is not yet anybody's, and the one fact a reader most
   * wants before answering is which side of the board they are being asked to
   * take, so the honest thing is to name it and let `offer` below say that it
   * is not theirs yet.
   */
  seat: Stone;
  group: MyGameGroup;
  /**
   * What this offer has become, for the two groups that hold offers, and null
   * for an ordinary game.
   *
   * Carried rather than worked out in the row, because the row would have to
   * ask the same four columns and could get a different answer — and because
   * "declined" and "withdrawn" are the two states a reader is told apart by.
   */
  offer: OfferState | null;
  /** Which side of an offer this reader is on. Null for an ordinary game. */
  offerSide: "to-me" | "from-me" | null;
  /** Whose turn it is, while the game runs. */
  toPlay: Stone | null;
  /** When something last happened, as an ISO string. */
  since: string;
  /** Running, but nobody has moved for a fortnight. */
  stale: boolean;
};

export type MyGames = Record<MyGameGroup, MyGame[]>;

/** A bucket capped for display, without losing how big the bucket actually was. */
export type ShownGroup<T> = {
  /** The capped slice, taken from the front. */
  items: T[];
  /** The bucket's own size, before the cap. */
  total: number;
  /** How many the cap left out. Zero means every one of them is shown. */
  hidden: number;
};

/**
 * Caps a bucket for display without losing how big the bucket actually was.
 *
 * The lobby caps how many of each group it shows — a "Lately finished" list
 * running to fifty rows is a page nobody reaches the bottom of — but the
 * header above the list has to say how many the bucket actually holds, not
 * how many made it past the cap. Slicing at the call site and counting
 * separately at the display site is exactly how "Lately finished 5" came to
 * sit over a bucket of fourteen: the header read the slice's own length,
 * which is never more than the cap, whatever the bucket held. Bundling the
 * slice and the bucket's true size into one answer is what keeps a header
 * from being able to make that mistake again.
 */
export function shownGroup<T>(items: readonly T[], cap: number): ShownGroup<T> {
  const shown = items.slice(0, cap);
  return { items: shown, total: items.length, hidden: items.length - shown.length };
}

/**
 * Sorts a browser's seats into the queue the turn-based sites taught: the
 * games waiting on you first, then the ones you are waiting on, the ones
 * nobody has started, and the ones that are over. "Yours" are the seats
 * bound to the account you are signed in to, and the seats this browser
 * holds by cookie — a scanned link on a phone with no account.
 */
export async function fetchMyGames(
  claims: Map<string, string>,
  memberId: string | null = null,
  now = new Date(),
  /**
   * How long this member keeps finished games in the list, in days; zero
   * keeps them all, which is what a browser holding only seat cookies gets.
   * Passed in rather than read here: this runs on the route the header's
   * badge polls, and the badge only wants the count of games waiting on you.
   */
  keepFinishedDays: number = KEEP_FINISHED_DEFAULT,
): Promise<MyGames> {
  const groups: MyGames = {
    offered: [],
    yourMove: [],
    theirMove: [],
    offerSent: [],
    unstarted: [],
    hotSeat: [],
    finished: [],
  };
  if (claims.size === 0 && memberId === null) return groups;

  /*
   * THE MEMBER'S WINDOW, IN THE QUERY RATHER THAN AFTER IT.
   *
   * This read had no date bound at all: every game the member had ever sat in
   * came back, was replayed where it could not answer for itself, sorted, and
   * then MOSTLY THROWN AWAY by `staysInMyList` below — on this page, on every
   * `/api/games/mine` the badge asks for, and on every advance to the next
   * game. `myListWindow` is the same rule as a `where`, written beside the
   * check that used to be the only one, and it carries the whole argument:
   * which branch never hides what, which index serves it, and the one case
   * (keeping everything, the default) that it cannot bound.
   *
   * NULL MEANS NO BOUND, not a window of nothing, so it is tested for rather
   * than spread in blind. And it goes in an `AND` rather than being spread
   * over the `where`: the window is itself an `OR` and one object cannot hold
   * two, so spreading it would silently replace the seats with the dates.
   *
   * AND STILL NO `take`, deliberately. The list has to be COMPLETE for the
   * groups that are a debt — every game waiting on this reader, and every
   * offer — because `shownGroup` prints the bucket's true size and
   * `useAdvanceToNextGame` walks `yourMove` looking for the oldest. A cap on
   * the read would drop games waiting on somebody and report a smaller number
   * with nothing saying so, which is worse than the cost it saves. The bound
   * is what makes the read proportional to what the page can show.
   */
  const kept = myListWindow(keepFinishedDays, now);

  const rows = await prisma.game.findMany({
    where: {
      ...(kept === null ? {} : { AND: [kept] }),
      OR: [
        { id: { in: [...claims.keys()] } },
        /*
         * THE THIRD WAY A GAME IS YOURS. A game OFFERED to you has neither
         * seat bound to you — that is the whole point of an offer — so without
         * this branch the person being asked would never see the question. On
         * its own index, on the same query as the other two, so the queue
         * costs no extra round trip.
         */
        ...(memberId === null
          ? []
          : [
              { blackMemberId: memberId },
              { whiteMemberId: memberId },
              { offeredToMemberId: memberId },
            ]),
      ],
    },
    select: {
      ...SUMMARY_SELECT,
      blackToken: true,
      whiteToken: true,
      blackMemberId: true,
      whiteMemberId: true,
      settledStatus: true,
      settledToPlay: true,
    },
  });

  const replayed = await replaysFor(rows);
  const names = await currentNamesFor(rows);

  for (const row of rows) {
    const token = claims.get(row.id);
    /*
     * WHICH SIDE OF AN OFFER THIS READER IS ON, before anything about seats —
     * because on an offer the answer to "which seat is yours" is different for
     * the two of them, and for one of them it is "none yet".
     */
    const side = offerIsMine(row, memberId);
    const offer = side === null ? null : offerState(row);
    /*
     * SAYING NO MAKES IT GO AWAY, and this is the line that makes that true.
     *
     * A refused offer is news to the person who ASKED — their queue says which
     * of their offers was declined — and it is nothing at all to the person who
     * was asked: they said no, it cost them nothing, and a row about it sitting
     * in their list afterwards would be the site keeping a note of their
     * refusal. That is the opposite of what this feature is for.
     *
     * Said outright rather than falling out of the seats. The seats of a
     * refused offer are exactly what they were, so `offeredSeat` answers for
     * it — deliberately, since the offerer needs that answer — and without
     * this the offeree would find their own refusal filed under "Your offers".
     */
    if (side === "to-me" && offer !== null && offer !== OFFER_STATES.offered) continue;
    // This browser's own seat first; the account's otherwise.
    const seat =
      token === row.blackToken
        ? STONES.black
        : token === row.whiteToken
          ? STONES.white
          : memberId !== null && row.blackMemberId === memberId
            ? STONES.black
            : memberId !== null && row.whiteMemberId === memberId
              ? STONES.white
              : // Being asked is not holding a seat, so there is none to find on
                // the row: the colour shown is the one they WOULD take. Null
                // still when that cannot be worked out, which drops the row.
                (side === "to-me" ? offeredSeat(row) : null);
    // A cookie that fits neither seat is stale itself; it names no game of ours.
    if (seat === null) continue;

    const game = toSummary(row, names);
    const { running, toPlay } = positionOf(row, replayed);
    const since = game.lastMoveAt ?? game.playedAt;
    // One token for both chairs: a game at one screen, always waiting on this browser.
    const hotSeat = row.blackToken === row.whiteToken;
    /*
     * AN OFFER IS NEVER IN THE PLAYING GROUPS, and that is checked first
     * rather than folded in below — which is the whole of how the advance to
     * the next game comes to skip one. `useAdvanceToNextGame` reads
     * `groups.yourMove` and nothing else, so an offer being absent from that
     * bucket is not a second rule anybody has to remember: an offer is
     * answered, not played, so it is not a game waiting for a move.
     *
     * A FORK MAKES THAT MORE THAN A TIDINESS. It copies moves across, so an
     * offered board has stones on it and a position with a colour to move —
     * and if that colour happens to be the offeree's, the ladder below would
     * have filed a game nobody had agreed to under "Your move" and carried
     * them onto it after their last move somewhere else.
     */
    const group: MyGameGroup =
      offer === "offered"
        ? side === "to-me"
          ? "offered"
          : "offerSent"
        : /*
           * A REFUSED OFFER IS NOT A FINISHED GAME, so it does not go in the
           * group whose hint reads "Filed in the record" — it is in no record
           * at all. It stays with the offerer's other offers, saying which of
           * them was declined and which withdrawn, and it leaves the list on
           * the same window that drops a finished game (below). That is the
           * "told once and then gone" John's queue needs, with no second
           * mechanism to mark a thing as seen.
           *
           * The offeree never reaches here: their side of a refused offer has
           * no seat on the row and no offer to derive one from, so it was
           * dropped above. Saying no makes the game disappear for them, which
           * is exactly what "costs nothing" should look like.
           */
          offer !== null
          ? "offerSent"
          : !running
            ? "finished"
            : hotSeat
              ? "hotSeat"
              : game.moveCount === 0
                ? "unstarted"
                : toPlay === seat
                  ? "yourMove"
                  : "theirMove";

    /*
     * A finished game past the member's window is left out of the list, and
     * out of nothing else. Only the finished group and a refused offer: a game
     * — or an offer — still waiting on somebody is never hidden, however old it
     * has grown.
     */
    const over = group === "finished" || (group === "offerSent" && offer !== "offered");
    if (over && !staysInMyList(since, keepFinishedDays, now)) continue;

    groups[group].push({
      game,
      seat,
      group,
      offer,
      offerSide: side,
      /*
       * NOBODY IS TO MOVE IN AN OFFER. The position has a colour to move — a
       * fork copies moves, so it may be either — and naming it here would put
       * "your move" against a game nobody has agreed to play. Null is what
       * this field already means by "there is no turn to take".
       */
      toPlay: offer === null ? toPlay : null,
      since,
      stale: running && now.getTime() - new Date(since).getTime() > STALE_AFTER_DAYS * 86_400_000,
    });
  }

  /*
   * Newest activity first within each group — except the games waiting on YOU,
   * which read oldest first.
   *
   * They are not the same kind of list. The others are history, where the last
   * thing that happened is the interesting one. The games waiting on you are a
   * debt, and the one that has been waiting longest is the one somebody is
   * most likely to be wondering about — which is how every elder
   * correspondence site ordered them, and why.
   */
  for (const group of MY_GAME_GROUPS) {
    // An offer to you reads oldest first for the same reason your move does:
    // it is a debt, and the one that has been waiting longest is the one
    // somebody is most likely to be wondering about.
    if (group === "yourMove" || group === "offered") groups[group].sort(waitingFirst);
    else groups[group].sort((a, b) => b.since.localeCompare(a.since));
  }
  return groups;
}

/** Everything about a row this list needs beyond the summary it prints. */
type SeatRow = Prisma.GameGetPayload<{ select: typeof SUMMARY_SELECT }> & {
  settledStatus: string | null;
  settledToPlay: string | null;
};

/**
 * Whether a game is still running and whose move it is, without reading a
 * stone unless there is no other way.
 *
 * Three answers, in the order that keeps the reads down:
 *
 *  1. A row filed as anything but `active` is over, whatever the stones say.
 *     That was already the rule — `running` has always been `status ===
 *     "active" && …` — so the engine's verdict could never change the answer
 *     for these, and most of a long-standing list is these.
 *  2. An active row whose writer left a settled turn behind is answered from
 *     it. See `settledTurn`: the side that applied the move wrote it down.
 *  3. An active row that has none is replayed, exactly as every row was
 *     before. Null means nobody has written one, never "nobody is to move",
 *     and a replay can always answer.
 */
function positionOf(row: SeatRow, replayed: Map<string, GameState>): SettledPosition {
  if (row.status !== "active") return { running: false, toPlay: null };
  const stored = settledPosition(row);
  if (stored !== null) return stored;
  const state = replayed.get(row.id);
  // A game whose moves could not be read is not one to guess about.
  if (state === undefined) return { running: false, toPlay: null };
  return {
    running: state.status === GAME_STATUS.playing,
    toPlay: state.status === GAME_STATUS.playing ? state.toPlay : null,
  };
}

/**
 * Replays only the games that cannot answer for themselves — the second query,
 * and on a list where every row has been written since these columns existed,
 * no query at all.
 *
 * One `findMany` for all of them rather than one each: the games needing it are
 * known before any of them is replayed, so there is no reason to go back to the
 * database once per game and every reason not to.
 */
async function replaysFor(rows: SeatRow[]): Promise<Map<string, GameState>> {
  const wanted = rows.filter((row) => row.status === "active" && settledPosition(row) === null);
  const replayed = new Map<string, GameState>();
  if (wanted.length === 0) return replayed;

  const moves = await prisma.move.findMany({
    where: { gameId: { in: wanted.map((row) => row.id) } },
    select: { ...MOVE_COLUMNS, gameId: true },
    orderBy: { number: "asc" },
  });
  const byGame = new Map<string, GameMove[]>();
  for (const move of moves) {
    const { gameId, ...columns } = move;
    const list = byGame.get(gameId);
    if (list === undefined) byGame.set(gameId, [toGameMove(columns)]);
    else list.push(toGameMove(columns));
  }
  for (const row of wanted) {
    /*
     * NO_CURRENT_NAMES, said rather than forgotten. What comes out of here is a
     * POSITION, handed to the engine to find whose turn it is — and the engine
     * reads no names at all. There is nobody to resolve for because nothing here
     * will ever be shown; the summary these rows pass through again, for the
     * screen, is the one above.
     */
    replayed.set(row.id, replayGame({ ...toSummary(row, NO_CURRENT_NAMES), moves: byGame.get(row.id) ?? [] }));
  }
  return replayed;
}

const MOVE_COLUMNS = {
  number: true,
  row: true,
  col: true,
  stone: true,
  kind: true,
  fromRow: true,
  fromCol: true,
  twistQuadrant: true,
  twistClockwise: true,
  cells: true,
  createdAt: true,
} as const;
