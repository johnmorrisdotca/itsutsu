import "server-only";

import type { Prisma } from "@prisma/client";

import { replayGame } from "@/lib/gomoku/replay";
import { GAME_STATUS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";
import { SUMMARY_SELECT, toGameMove, toSummary } from "./gameHistory";
import { waitingFirst } from "./nextGame";
import { KEEP_FINISHED_DEFAULT, staysInMyList } from "./retention";
import { type SettledPosition, settledPosition } from "./settledTurn";
import type { GameMove, GameSummary } from "./gameHistory.types";

/** A game nobody has touched for this long is flagged, so it can be dealt with. */
export const STALE_AFTER_DAYS = 14;

export const MY_GAME_GROUPS = ["yourMove", "theirMove", "unstarted", "hotSeat", "finished"] as const;
export type MyGameGroup = (typeof MY_GAME_GROUPS)[number];

export type MyGame = {
  game: GameSummary;
  /** The colour this browser holds in it. */
  seat: Stone;
  group: MyGameGroup;
  /** Whose turn it is, while the game runs. */
  toPlay: Stone | null;
  /** When something last happened, as an ISO string. */
  since: string;
  /** Running, but nobody has moved for a fortnight. */
  stale: boolean;
};

export type MyGames = Record<MyGameGroup, MyGame[]>;

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
  const groups: MyGames = { yourMove: [], theirMove: [], unstarted: [], hotSeat: [], finished: [] };
  if (claims.size === 0 && memberId === null) return groups;

  const rows = await prisma.game.findMany({
    where: {
      OR: [
        { id: { in: [...claims.keys()] } },
        ...(memberId === null ? [] : [{ blackMemberId: memberId }, { whiteMemberId: memberId }]),
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

  for (const row of rows) {
    const token = claims.get(row.id);
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
              : null;
    // A cookie that fits neither seat is stale itself; it names no game of ours.
    if (seat === null) continue;

    const game = toSummary(row);
    const { running, toPlay } = positionOf(row, replayed);
    const since = game.lastMoveAt ?? game.playedAt;
    // One token for both chairs: a game at one screen, always waiting on this browser.
    const hotSeat = row.blackToken === row.whiteToken;
    const group: MyGameGroup = !running
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
     * out of nothing else. Only the finished group: a game still waiting on
     * somebody is never hidden, however old it has grown.
     */
    if (group === "finished" && !staysInMyList(since, keepFinishedDays, now)) continue;

    groups[group].push({
      game,
      seat,
      group,
      toPlay,
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
    if (group === "yourMove") groups[group].sort(waitingFirst);
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
    replayed.set(row.id, replayGame({ ...toSummary(row), moves: byGame.get(row.id) ?? [] }));
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
