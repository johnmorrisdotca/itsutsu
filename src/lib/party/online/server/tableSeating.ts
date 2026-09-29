import "server-only";

import { prisma } from "@/lib/prisma";
import { mayReachMember } from "@/lib/social/childReach";
import { isIgnoring } from "@/lib/social/ignores";

import { ONLINE_STATUS, PARTY_TABLES_MOST } from "../online.constants";

/** Why somebody may not be seated, as a key: the words are `SEATING_REFUSALS`, so an address can carry the reason and never the words. */
export type SeatingRefusal = "ignored" | "child" | "cap";

/** What each refusal says to the person refused. */
export const SEATING_REFUSALS: Record<SeatingRefusal, string> = {
  ignored: "Somebody at that table is not taking games with you.",
  child: "A player at that table is under 13, so only the people on their own buddy list can sit with them.",
  cap: `You are at ${PARTY_TABLES_MOST} tables already. Finish or end one first.`,
};

/**
 * WHO MAY BE SEATED WITH WHOM, read from the database: the rules the
 * two-player games keep for an offer, asked of every pair at a table.
 *
 * A table is several people at once, so a newcomer is checked against each
 * member already seated, both ways round:
 *
 *  - neither is ignoring the other (`isIgnoring`);
 *  - each may reach the other (`mayReachMember`) — so a member under 13 sits
 *    only with people on their own buddy list, whichever of them arrives
 *    first. The stricter reading of `childRules.ts`, John 2026-09-24.
 *
 * At most six seats, so at most twenty small reads, and only when somebody is
 * seated — at Start, and when a link is opened — never on a poll.
 */
export async function seatingRefusal(newcomer: string, seated: readonly string[]): Promise<SeatingRefusal | null> {
  for (const other of seated) {
    if (other === newcomer) continue;
    const [ignoresNew, ignoredByNew, reachesNew, reachedByNew] = await Promise.all([
      isIgnoring(other, newcomer),
      isIgnoring(newcomer, other),
      mayReachMember(newcomer, other),
      mayReachMember(other, newcomer),
    ]);
    if (ignoresNew || ignoredByNew) return "ignored";
    if (!reachesNew || !reachedByNew) return "child";
  }
  return null;
}

/** How many tables this member sits at that are still being played. */
export async function tablesGoing(memberId: string): Promise<number> {
  return prisma.partyTable.count({ where: { status: ONLINE_STATUS.playing, seats: { some: { memberId } } } });
}

/** Whether this member is already at `PARTY_TABLES_MOST` tables, and the sentence that says so. */
export async function tablesCapRefusal(memberId: string, who: "you" | "them"): Promise<string | null> {
  if ((await tablesGoing(memberId)) < PARTY_TABLES_MOST) return null;
  return who === "you"
    ? `You are at ${PARTY_TABLES_MOST} tables already. Finish or end one first.`
    : `Somebody you asked is at ${PARTY_TABLES_MOST} tables already.`;
}
