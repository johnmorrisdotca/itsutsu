import "server-only";

import { prisma } from "@/lib/prisma";

import { ONLINE_MOVE_LONGEST, ONLINE_STATUS } from "../online.constants";
import type { OnlineGameKey, OnlineTableView } from "../online.types";
import { onlineRulesOf } from "../onlineGames";
import { moveRefusal, standingOf } from "../onlineSeats";
import { noticeTableOver } from "./tableNotices";
import { readTableRow, readTableView, tableOf } from "./tableRead";

/** What a move comes to: the new table, or why not, with the table as it stands where the page was behind. */
export type MoveAnswer =
  | { ok: OnlineTableView }
  | { refused: string; status: 400 | 403 | 404 | 409 | 422; table?: OnlineTableView | null };

/**
 * A MOVE SENT FROM A BROWSER, CHECKED AND KEPT. The server trusts the browser
 * with the choice and nothing else:
 *
 *  1. the table and its seats, one read;
 *  2. the seat must be the one to play, and the reader's own — or a
 *     computer's, sent by a member at the table (`moveRefusal`);
 *  3. the game must be the one the page was drawn from — as many moves made
 *     as the page had seen — or the answer is 409 with the table as it now
 *     stands. Moves, not the version: somebody taking an open seat or leaving
 *     one moves the version, and must not refuse the move of a player whose
 *     page had not yet seen them arrive;
 *  4. the stored game is decoded by its own rules, the move read for its shape
 *     and played by those same rules — refused (422) where they refuse it;
 *  5. the new game, the next seat and how it stands are written only if the
 *     table is still at the version read (`updateMany … where version`), with
 *     the move's record, in one transaction: two sends for one turn cannot
 *     both land, and nor can a move and a seat changing under it.
 */
export async function moveAtTable(
  id: string,
  readerId: string,
  { moves, seat, move }: { moves: number; seat: number; move: unknown },
  now: Date = new Date(),
): Promise<MoveAnswer> {
  const row = await readTableRow(id);
  if (row === null) return { refused: "No such table.", status: 404 };
  const table = tableOf(row);
  const refusal = moveRefusal(table, readerId, seat);
  if (refusal === "notSeated") return { refused: "No such table.", status: 404 };
  if (refusal === "over") return { refused: "That table is over.", status: 409, table: await readTableView(id, readerId, now) };
  if (refusal === "notYourTurn") return { refused: "It is not your turn.", status: 403, table: await readTableView(id, readerId, now) };
  if (moves !== row.moveCount) return { refused: "The table moved on.", status: 409, table: await readTableView(id, readerId, now) };

  const rules = onlineRulesOf(row.game as OnlineGameKey);
  const game = rules.decode(row.state);
  if (game === null) throw new Error(`Table ${id} holds a game its rules cannot read.`);
  const read = rules.readMove(move);
  const kept = read === null ? "" : JSON.stringify(read);
  if (read === null || kept.length > (rules.moveLongest ?? ONLINE_MOVE_LONGEST)) return { refused: "That is not a move in this game.", status: 400 };
  const next = rules.play(game, read);
  if (next === null) return { refused: "That move is not allowed.", status: 422 };
  const standing = standingOf(rules, next);
  const over = standing.status !== ONLINE_STATUS.playing;

  const landed = await prisma.$transaction(async (tx) => {
    const written = await tx.partyTable.updateMany({
      where: { id, version: row.version },
      data: { state: rules.encode(next), version: { increment: 1 }, ...standing, movedAt: now, ...(over ? { finishedAt: now } : {}) },
    });
    if (written.count === 0) return false;
    await tx.partyAction.create({ data: { tableId: id, index: row.moveCount, seat, move: kept, byMemberId: readerId } });
    return true;
  });
  if (!landed) return { refused: "The table moved on.", status: 409, table: await readTableView(id, readerId, now) };
  if (over) await noticeTableOver(row, standing.winners, false);

  const after = await readTableView(id, readerId, now);
  if (after === null) return { refused: "No such table.", status: 404 };
  return { ok: after };
}
