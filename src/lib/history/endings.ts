import "server-only";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

import { NO_CURRENT_NAMES } from "./currentNames";
import { MOVE_SELECT, SUMMARY_SELECT, toGameMove, toSummary } from "./gameHistory";
import type { GameDetail } from "./gameHistory.types";
import { NOT_A_REFUSED_OFFER } from "./offers";
import { ENDINGS_MOST, ENDINGS_OUTCOMES, type EndingsOutcome } from "./endings.constants";

/**
 * A PLAYER'S END POSITIONS, as the moves that reach them. John, 2026-09-23: a
 * Reversi champion "would love to have a mosaic of all their end games where
 * they win (or lose)… download all from the client side."
 *
 * The server's whole part is this one read, and only when somebody presses the
 * button: the player's finished games of one game, newest first, with their
 * moves. No picture is made here and none is kept — the browser replays each
 * game to its last position and draws the mosaic itself, with the same
 * renderer as a single game's (`lib/record/mosaic.ts`). John asked whether the
 * images would have to be stored; they do not, because the moves already are.
 */
export async function fetchEndings(memberId: string, variant: string, outcome: EndingsOutcome): Promise<GameDetail[]> {
  const seated: Prisma.GameWhereInput[] = [{ blackMemberId: memberId }, { whiteMemberId: memberId }];
  const won: Prisma.GameWhereInput[] = [
    { blackMemberId: memberId, winner: STONES.black },
    { whiteMemberId: memberId, winner: STONES.white },
  ];
  const lost: Prisma.GameWhereInput[] = [
    { blackMemberId: memberId, winner: STONES.white },
    { whiteMemberId: memberId, winner: STONES.black },
  ];
  const which = outcome === ENDINGS_OUTCOMES.won ? won : outcome === ENDINGS_OUTCOMES.lost ? lost : seated;
  const rows = await prisma.game.findMany({
    where: {
      variant,
      status: "finished",
      moveCount: { gt: 0 },
      ...NOT_A_REFUSED_OFFER,
      OR: which,
    },
    orderBy: { playedAt: "desc" },
    take: ENDINGS_MOST,
    select: { ...SUMMARY_SELECT, moves: { orderBy: { number: "asc" }, select: MOVE_SELECT } },
  });
  // The names are not drawn on the tiles, so the current ones are not looked up.
  return rows.map(({ moves, ...summary }) => ({
    ...toSummary(summary, NO_CURRENT_NAMES),
    moves: moves.map(toGameMove),
    reactions: [],
  }));
}
