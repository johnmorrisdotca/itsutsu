import "server-only";

import { prisma } from "@/lib/prisma";

export type VerdictTally = { answered: number; up: number; down: number; upWins: number; downWins: number };

/** Nobody signed in has answered for nothing, which is not the same as a zero record. */
export const EMPTY_VERDICTS: VerdictTally = { answered: 0, up: 0, down: 0, upWins: 0, downWins: 0 };

/** How a member has judged their own play, across the games they answered for. Theirs alone. */
export async function fetchVerdictTally(memberId: string): Promise<VerdictTally> {
  const me = memberId;
  const rows = await prisma.game.findMany({
    where: {
      status: "finished",
      OR: [
        { blackMemberId: me, blackVerdict: { not: null } },
        { whiteMemberId: me, whiteVerdict: { not: null } },
      ],
    },
    select: { blackMemberId: true, blackVerdict: true, whiteVerdict: true, winner: true },
  });
  const tally: VerdictTally = { answered: 0, up: 0, down: 0, upWins: 0, downWins: 0 };
  for (const row of rows) {
    const black = row.blackMemberId === me;
    const verdict = black ? row.blackVerdict : row.whiteVerdict;
    if (verdict !== "up" && verdict !== "down") continue;
    const won = row.winner === (black ? "black" : "white");
    tally.answered += 1;
    if (verdict === "up") {
      tally.up += 1;
      if (won) tally.upWins += 1;
    } else {
      tally.down += 1;
      if (won) tally.downWins += 1;
    }
  }
  return tally;
}
