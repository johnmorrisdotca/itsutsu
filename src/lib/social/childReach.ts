import "server-only";

import { prisma } from "@/lib/prisma";

import { mayReach } from "./childRules";

/**
 * Whether `fromId` may message or offer a game to `toId`, read from the
 * database: the band of the member being reached, and whether the sender is on
 * THEIR buddy list (a row the child owns). One query for an adult, two for a
 * child. See `childRules.ts`.
 */
export async function mayReachMember(toId: string, fromId: string): Promise<boolean> {
  const to = await prisma.member.findUnique({ where: { id: toId }, select: { ageBand: true } });
  if (to === null) return true;
  if (mayReach(to.ageBand, false)) return true;
  const buddy = await prisma.buddy.findUnique({
    where: { ownerId_buddyId: { ownerId: toId, buddyId: fromId } },
    select: { ownerId: true },
  });
  return mayReach(to.ageBand, buddy !== null);
}
