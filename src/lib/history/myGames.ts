import "server-only";

import type { Prisma } from "@prisma/client";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { Cursor } from "@/lib/api/paging.types";
import { prisma } from "@/lib/prisma";
import { currentNamesFor } from "./currentNames";
import { toSummary } from "./gameHistory";
import { DEBT_ONLY, myFinishedPage, myFinishedTotal } from "./myFinished";
import { MY_FINISHED_PAGE } from "./myFinished.sort";
import { QUEUE_SELECT, positionOf, replaysFor } from "./myGamesRows";
import { waitingFirst } from "./nextGame";
import { offerIsMine, offerState, offeredSeat } from "./offers";
import { OFFER_STATES, type OfferState } from "./offers.types";
import { KEEP_FINISHED_DEFAULT, myListWindow, staysInMyList } from "./retention";
import type { GameSummary } from "./gameHistory.types";

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

/**
 * THE WHOLE QUEUE: the seven groups, plus what the one that PAGES could not say
 * about itself.
 *
 * `groups` keeps the shape it has always had — a record of seven arrays — so
 * every reader of it, including `/api/games/mine`, goes on reading arrays. What
 * is new is that `groups.finished` is ONE PAGE rather than the whole group, and a
 * page cannot report the two things the panel above it needs: how many there
 * really are, and whether there is another page.
 *
 * THOSE TWO FACTS TRAVEL BESIDE THE GROUPS RATHER THAN INSIDE THEM, and the
 * reason is worth stating because the tidier-looking arrangement is the broken
 * one. Putting a `{ items, next, total }` envelope in `groups.finished` would
 * make one of the seven a different shape from the other six, and the first
 * casualty is `Object.values(groups).reduce((n, list) => n + list.length, 0)` —
 * which is what the doorstep spec does to every group, and what would then read
 * `undefined` and answer `NaN` with nothing failing.
 *
 * AND `fetchMyGames` RETURNS THIS RATHER THAN THE GROUPS ALONE, with no second
 * door that hands back only the groups. A caller holding just the groups would
 * reach for `groups.finished.length` for the count and get the PAGE's length — a
 * number that is in range, looks right, and means something else. That is the
 * one mistake this shape exists to make impossible.
 */
export type MyQueue = {
  /** The seven groups. `finished` holds one page of itself; the rest are complete. */
  groups: MyGames;
  /** What the finished group's page cannot say about the group it came from. */
  finished: {
    /** How many finished games there are, over exactly the set the page pages. */
    total: number;
    /** Where the page ended, or null when it was the last one. */
    next: Cursor | null;
  };
};

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
 * The same bucket, for the ONE group that arrives as a page rather than whole.
 *
 * `shownGroup` above derives the total from the list it was given, which is right
 * for a complete group and would be a LIE for a page: the finished group's list
 * is five rows of however many there are, so its own length is the cap and never
 * the total. The count comes from the database (see `MyQueue.finished`), so it is
 * passed in.
 *
 * Two functions rather than one that takes an optional total, because the
 * difference between them is which fact is being trusted and a caller passing
 * nothing would get a plausible, wrong number with nothing failing. The panel
 * reads both the same way, which is the whole point: `hidden` still means "how
 * many this is not showing", and the header still cannot print the slice's length
 * and call it the total.
 */
export function pagedGroup<T>(page: readonly T[], total: number): ShownGroup<T> {
  return { items: [...page], total, hidden: Math.max(0, total - page.length) };
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
  /**
   * Which page of the finished group, and how big — the only group that pages.
   *
   * An OBJECT rather than two more positional arguments. There would be six of
   * them by now, three of them optional and two of them a number and a string a
   * caller could hand over the wrong way round without anything failing.
   * `FilterSeats` is named for the same reason and says it at more length.
   */
  finished: { limit?: number; cursor?: Cursor | null } = {},
): Promise<MyQueue> {
  const groups: MyGames = {
    offered: [],
    yourMove: [],
    theirMove: [],
    offerSent: [],
    unstarted: [],
    hotSeat: [],
    finished: [],
  };
  if (claims.size === 0 && memberId === null) {
    return { groups, finished: { total: 0, next: null } };
  }

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
   * over a `where`: the window is itself an `OR` and one object cannot hold
   * two, so spreading it would silently replace the seats with the dates.
   */
  const kept = myListWindow(keepFinishedDays, now);

  /*
   * WHICH GAMES ARE THIS READER'S — the one definition, built once and handed to
   * both halves of the read below, so the two cannot come to disagree about it.
   */
  const seats: Prisma.GameWhereInput = {
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
  };

  /*
   * ─────────────────────────────────────────────────────────────────────────
   * TWO READS: THE DEBT COMPLETE, THE FINISHED GROUP ONE PAGE
   * ─────────────────────────────────────────────────────────────────────────
   *
   * The window above bounded this read for everybody who has CHOSEN a window. It
   * could not bound the DEFAULT — "keep finished games for ever" — because there
   * is no date to bound it with, so a member who has never touched the setting
   * still read every game they had ever sat in. That is 571 rows on John's own
   * account, on the page he opens daily and on every `/api/games/mine` the badge
   * asks for, replayed where they could not answer for themselves and resolved
   * to current names. The page shows five of them.
   *
   * SO THE FINISHED GROUP PAGES AND NOTHING ELSE DOES, and the asymmetry is the
   * design rather than a compromise:
   *
   *  - THE DEBT GROUPS STAY COMPLETE. Every game waiting on this reader, every
   *    board nobody has started, every offer in any state. `shownGroup` prints
   *    the bucket's TRUE size and `useAdvanceToNextGame` walks `yourMove`
   *    looking for the oldest, so a cap on this half would drop a game somebody
   *    is waiting on and report a smaller number with nothing saying so. It
   *    needs no cap either: it is bounded by the twenty-games-at-once limit on
   *    playing and by how many offers a person can have outstanding.
   *  - THE FINISHED GROUP IS HISTORY. It grows without anybody deciding to, it
   *    is the half the page shows five of, and it is the only half whose "rest"
   *    has somewhere else to be seen — the record, which is built to hold it. So
   *    it is the half that pages.
   *
   * BOTH AT ONCE, because they are independent reads and waiting for one before
   * asking for the other would add a round trip to every visit for nothing.
   */
  const [debt, page] = await Promise.all([
    prisma.game.findMany({
      where: { AND: [DEBT_ONLY, seats, ...(kept === null ? [] : [kept])] },
      select: QUEUE_SELECT,
    }),
    myFinishedPage({
      seats,
      window: kept,
      limit: finished.limit ?? MY_FINISHED_PAGE,
      cursor: finished.cursor ?? null,
    }),
  ]);

  /*
   * One list from here on, because everything below — the seat, the offer, the
   * group, the retention check — is decided per row and does not care which read
   * a row arrived on. The two are exact complements (see `FINISHED_ONLY` and
   * `DEBT_ONLY`), so concatenating them cannot double-count anything.
   */
  const rows = [...debt, ...page.rows];
  /** Which ids came off the paged half, for the count below. */
  const paged = new Set(page.rows.map((row) => row.id));

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

  return { groups, finished: { total: await finishedTotal(), next: page.next } };

  /**
   * HOW MANY FINISHED GAMES THERE ARE, and the two ways of knowing one.
   *
   * A count is a second query, so it is asked only where the page cannot answer
   * on its own — which is not most readers. A FIRST page with no cursor after it
   * IS the whole group, so its own length is the exact total and nothing is
   * asked: a member with three finished games pays for no count at all, ever.
   *
   * BOTH HALVES OF THAT CONDITION ARE LOAD-BEARING, and the first one is the half
   * that is easy to leave out. `page.next === null` alone means "nothing follows
   * this page", which is true of the LAST page of forty as well as of the only
   * page of three — so on its own it would have reported the last page's length
   * as the size of the whole group. A number in range, plausible, and wrong, on
   * exactly the page a reader had walked furthest to reach. `myFinished.test.ts`
   * caught it; nothing else would have.
   *
   * Past that, it is the count over exactly the set the page is a page of, PLUS
   * the rows in this group that did not come off it. Those are the active rows
   * the ENGINE has decided and nobody has filed — a Reversi board that filled
   * up, `status` still `active` until something settles it — which arrive on the
   * debt read because no `where` can ask whether a position is over. They are
   * bounded by the twenty-active-games cap, they are shown with the first page,
   * and they have to be added here or the heading would under-count the group it
   * sits over by however many of them there are.
   */
  async function finishedTotal(): Promise<number> {
    const whole = (finished.cursor ?? null) === null && page.next === null;
    if (whole) return groups.finished.length;
    const engineOver = groups.finished.filter((one) => !paged.has(one.game.id)).length;
    return engineOver + (await myFinishedTotal({ seats, window: kept }));
  }
}
