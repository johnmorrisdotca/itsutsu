import "server-only";

import { replayGame } from "@/lib/gomoku/replay";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import { gameResultFacts } from "@/lib/history/gameResult";
import { prisma } from "@/lib/prisma";
import { expectedScore, gamePoints, type RatingsBefore } from "./gamePoints";

/** Midnight UTC at the start of `at`'s day: where "the same day" begins for two players meeting again. */
function dayOf(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

/**
 * PAYS A FINISHED GAME ITS IP, once, onto its own row (`Game.blackPoints`,
 * `Game.whitePoints`). Called where a game is decided, after the rating write,
 * so `before` is the pair of ratings that game was played at. What it pays is
 * `gamePoints`'s: the result as a share of the game's most, the opponent's
 * strength, the same pair again the same day, and nothing at one screen.
 *
 * ONE READ OF THE GAME AND ONE REPLAY, at the moment it ends and never again:
 * the price is stored, so every board is a sum over rows rather than a replay
 * per view. A game already priced is left as it is, so a second call — a retry,
 * the backfill after the deploy — pays nothing twice.
 */
export async function payGameIp(id: string, before: RatingsBefore | null): Promise<void> {
  const row = await prisma.game.findUnique({
    where: { id },
    select: { blackPoints: true, blackToken: true, whiteToken: true, blackMemberId: true, whiteMemberId: true, lastMoveAt: true, playedAt: true },
  });
  if (row === null || row.blackPoints !== null) return;
  const game = await fetchGameDetail(id, { whole: true });
  if (game === null || game.status === "active") return;

  const oneScreen = row.blackToken === row.whiteToken;
  const facts = gameResultFacts({ result: game.result, final: replayGame(game), forfeits: game.forfeits, seat: null, hotSeat: oneScreen });

  // The same two members earlier the same day, by id: a name typed at a board has no one to meet twice.
  const at = row.lastMoveAt ?? row.playedAt;
  const pair = row.blackMemberId !== null && row.whiteMemberId !== null ? [row.blackMemberId, row.whiteMemberId] : null;
  const earlierToday =
    pair === null
      ? 0
      : await prisma.game.count({
          where: {
            id: { not: id },
            status: "finished",
            result: { not: "abandoned" },
            lastMoveAt: { gte: dayOf(at), lt: at },
            OR: [
              { blackMemberId: pair[0], whiteMemberId: pair[1] },
              { blackMemberId: pair[1], whiteMemberId: pair[0] },
            ],
          },
        });

  const winner = facts?.winner ?? null;
  const winnerExpected =
    before === null || winner === null
      ? null
      : winner === "black"
        ? expectedScore(before.black, before.white)
        : expectedScore(before.white, before.black);

  const paid = gamePoints({
    variant: game.variant as RuleVariant,
    size: game.size,
    winner,
    drawn: facts?.outcome === "draw",
    reason: facts?.reason ?? null,
    score: facts?.score ?? null,
    moveCount: game.moveCount,
    headStartFor: game.headStart.stone,
    handicapOn: game.handicap.stone,
    winnerExpected,
    earlierToday,
    oneScreen,
  });
  // Only where still unpriced: two endings racing each other pay once.
  await prisma.game.updateMany({ where: { id, blackPoints: null }, data: { blackPoints: paid.black, whitePoints: paid.white } });
}
