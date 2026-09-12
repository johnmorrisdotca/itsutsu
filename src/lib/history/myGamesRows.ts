import "server-only";

import type { Prisma } from "@prisma/client";

import { replayGame } from "@/lib/gomoku/replay";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import type { GameState } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";
import { NO_CURRENT_NAMES } from "./currentNames";
import { SUMMARY_SELECT, toGameMove, toSummary } from "./gameHistory";
import { type SettledPosition, settledPosition } from "./settledTurn";
import type { GameMove } from "./gameHistory.types";

/**
 * WHAT THE QUEUE READS OFF A ROW, AND HOW IT ANSWERS "IS THIS GAME OVER".
 *
 * Split out of `myGames.ts` when the queue's read became two reads — the debt
 * groups complete, the finished group one page (see `myFinished.ts`). Both halves
 * need the same projection and the same reading of a position, and a projection
 * defined in the module that sorts seats into groups would have had the paged
 * read importing it back, which is a cycle. It is also one job rather than that
 * file's: whether a game is still running and whose move it is, which `myGames.ts`
 * only ever asks and never decides.
 */

/** Everything the queue needs off a row, for either half of its read. */
export const QUEUE_SELECT = {
  ...SUMMARY_SELECT,
  blackToken: true,
  whiteToken: true,
  blackMemberId: true,
  whiteMemberId: true,
  settledStatus: true,
  settledToPlay: true,
} as const;

/**
 * A row as the queue reads it — the projection above, and nothing hand-written.
 *
 * DERIVED FROM `QUEUE_SELECT` RATHER THAN RESTATED. It used to be the summary
 * payload plus two columns typed by hand, which was true while one query built
 * its own select inline and the type was only for the two functions below. Both
 * halves of the split read now hand these rows around, so a type that named
 * fewer columns than the select brings back would lose the seat TOKENS — which
 * is how the queue decides which chair is this browser's, and which no compiler
 * would have flagged as missing until something read one.
 */
export type SeatRow = Prisma.GameGetPayload<{ select: typeof QUEUE_SELECT }>;

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
export function positionOf(row: SeatRow, replayed: Map<string, GameState>): SettledPosition {
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
 *
 * ONLY AN ACTIVE ROW IS EVER REPLAYED, which is why the paged half of the
 * queue's read costs nothing here: a finished row is answered by branch 1 of
 * `positionOf` above, so the filter below has never matched one and now does not
 * even see them.
 */
export async function replaysFor(rows: readonly SeatRow[]): Promise<Map<string, GameState>> {
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
     * screen, is the one in `myGames.ts`.
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
