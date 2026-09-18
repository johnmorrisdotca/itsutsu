import type { BotTurn } from "@/lib/gomoku/opponent.types";

/**
 * One turn the computer chose, in the shapes the moves route takes.
 *
 * Written out rather than derived, because the route's body is an interface and
 * an interface is worth stating. A twist is the one turn that is two requests:
 * it rides on the stone that owes it, and the route updates the stone's row
 * rather than adding one, so the stone has to land first.
 *
 * ITS OWN MODULE BECAUSE TWO BROWSERS' WORTH OF CODE POST THESE. The board
 * answers for the computer sitting opposite (`useBotSeat`), and the games page
 * makes the move nobody stayed for (`BotCatchUp`) — one mapping, so a turn kind
 * that grows a new shape cannot be handled in one of them and forgotten in the
 * other. `send` is whatever poster the caller has: the board's own, or a fetch.
 */
export async function postTurn(
  turn: BotTurn,
  send: (body: Record<string, unknown>) => Promise<void>,
): Promise<void> {
  if (turn.kind === "pass") {
    await send({ pass: true });
    return;
  }
  if (turn.kind === "piece") {
    await send({ cells: turn.cells });
    return;
  }
  if (turn.kind === "move") {
    await send({ row: turn.row, col: turn.col, from: turn.from });
    return;
  }
  await send(
    turn.stone === undefined
      ? { row: turn.row, col: turn.col }
      : { row: turn.row, col: turn.col, stone: turn.stone },
  );
  if (turn.twist !== undefined) await send({ twist: turn.twist });
}
