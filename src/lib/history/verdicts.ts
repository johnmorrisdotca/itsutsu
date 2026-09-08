import "server-only";

import { foldEmail } from "@/lib/auth/members";
import { prisma } from "@/lib/prisma";

export type VerdictTally = { answered: number; up: number; down: number; upWins: number; downWins: number };

/** How a member has judged their own play, across the games they answered for. Theirs alone. */
export async function fetchVerdictTally(email: string): Promise<VerdictTally> {
  const me = foldEmail(email);
  const rows = await prisma.game.findMany({
    where: {
      status: "finished",
      OR: [
        { blackMember: me, blackVerdict: { not: null } },
        { whiteMember: me, whiteVerdict: { not: null } },
      ],
    },
    select: { blackMember: true, blackVerdict: true, whiteVerdict: true, winner: true },
  });
  const tally: VerdictTally = { answered: 0, up: 0, down: 0, upWins: 0, downWins: 0 };
  for (const row of rows) {
    const black = row.blackMember === me;
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
