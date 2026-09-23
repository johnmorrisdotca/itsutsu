import "server-only";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";

/**
 * The games of a match, for the panel beside each of them (`MatchPanel`).
 *
 * One query, over the index on `matchId`, and only for a game that is in a
 * match: an ordinary game's page asks nothing more than it did.
 */

/** Where one game of a match stands, in the words the panel prints. */
export type MatchGameState = "offered" | "playing" | "black" | "white" | "drawn" | "declined" | "withdrawn";

export type MatchGame = {
  id: string;
  index: number;
  variant: string;
  state: MatchGameState;
  /** The colour this reader holds in it, or null for somebody watching. */
  mine: Stone | null;
};

/** How one row reads: the offer first, then play, then how it finished. */
export function matchGameState(row: {
  status: string;
  winner: string | null;
  offeredAt: Date | null;
  declinedAt: Date | null;
  withdrawnAt: Date | null;
}): MatchGameState {
  if (row.declinedAt !== null) return "declined";
  if (row.withdrawnAt !== null) return "withdrawn";
  if (row.status === "active") return row.offeredAt !== null ? "offered" : "playing";
  if (row.winner === STONES.black) return "black";
  if (row.winner === STONES.white) return "white";
  return "drawn";
}

export async function matchGames(matchId: string, memberId: string | null): Promise<MatchGame[]> {
  const rows = await prisma.game.findMany({
    where: { matchId },
    orderBy: { matchIndex: "asc" },
    select: {
      id: true,
      matchIndex: true,
      variant: true,
      status: true,
      winner: true,
      offeredAt: true,
      declinedAt: true,
      withdrawnAt: true,
      blackMemberId: true,
      whiteMemberId: true,
      offeredToMemberId: true,
    },
  });
  return rows.map((row) => {
    // An offered seat carries no member id yet; the member it was offered to holds it all the same.
    const black = row.blackMemberId ?? (row.whiteMemberId !== null ? row.offeredToMemberId : null);
    const white = row.whiteMemberId ?? (row.blackMemberId !== null ? row.offeredToMemberId : null);
    return {
      id: row.id,
      index: row.matchIndex ?? 1,
      variant: row.variant,
      state: matchGameState(row),
      mine: memberId === null ? null : black === memberId ? STONES.black : white === memberId ? STONES.white : null,
    };
  });
}
