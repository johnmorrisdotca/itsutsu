import "server-only";

import { prisma } from "@/lib/prisma";

/** A member's rated games, by how they went: both ladders, people and the computer, together. */
export type RatedRecord = { won: number; lost: number; drawn: number };

/**
 * A member's rated record, from the ladder rows their games already keep.
 *
 * Every rated game counts on exactly one ladder, the people's or the
 * computer's, so the two added together are every rated game the member has
 * finished, and `/history?member=…&rated=yes&outcome=…` lists exactly the
 * games each number counts. A sum rather than one row, because a member's
 * rows are keyed by the names they played under and there can be more than
 * one. One read on an indexed column; null for nobody signed in.
 */
export async function ratedRecordOf(memberId: string | null): Promise<RatedRecord | null> {
  if (memberId === null) return null;
  const { _sum: sum } = await prisma.player.aggregate({
    where: { memberId },
    _sum: { wins: true, losses: true, draws: true, computerWins: true, computerLosses: true, computerDraws: true },
  });
  return {
    won: (sum.wins ?? 0) + (sum.computerWins ?? 0),
    lost: (sum.losses ?? 0) + (sum.computerLosses ?? 0),
    drawn: (sum.draws ?? 0) + (sum.computerDraws ?? 0),
  };
}
