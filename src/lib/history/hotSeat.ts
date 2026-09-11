import "server-only";

import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import { prisma } from "@/lib/prisma";
import { fetchGameDetail } from "./gameHistory";
import { GAME_ROW, isHotSeat, replay } from "./liveGame";
import { settledTurn } from "./settledTurn";
import type { MoveOutcome } from "./liveGame.types";

/**
 * Takes moves back in a hot-seat game.
 *
 * A game played at one screen may be rewound, as a board between two people
 * can, and its record follows: everything after `keep` moves is struck out and
 * the position is replayed from what is left. A game with two seat keys is
 * never rewound this way — a shared game's record is final because neither
 * side may edit the other's stones.
 */
export async function truncateMoves(id: string, token: string, keep: number): Promise<MoveOutcome> {
  const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
  if (row === null) return { ok: false, reason: "not-found" };
  if (!isHotSeat(row) || token !== row.blackToken) return { ok: false, reason: "wrong-token" };
  if (keep < 0 || keep > row.moves.length) return { ok: false, reason: "illegal" };

  const kept = { ...row, moves: row.moves.slice(0, keep) };
  const state = replay(kept);
  const finished = state.status !== GAME_STATUS.playing;

  await prisma.$transaction([
    prisma.move.deleteMany({ where: { gameId: id, number: { gt: keep } } }),
    prisma.game.update({
      where: { id },
      data: {
        moveCount: keep,
        status: finished ? "finished" : "active",
        result: state.winner ?? (finished ? "draw" : "abandoned"),
        winner: state.winner,
        /*
         * A takeback moves whose turn it is BACKWARDS, which is the way a
         * stored answer most easily goes stale — and it is the reason this is
         * written from the replayed position above rather than from anything
         * the row already held. In the same transaction as the deletions, so
         * no reader ever sees the struck-out moves gone and the old turn left.
         */
        ...settledTurn(state),
        lastMoveAt: new Date(),
      },
    }),
  ]);

  const game = await fetchGameDetail(id);
  if (game === null) return { ok: false, reason: "not-found" };
  return { ok: true, game };
}
