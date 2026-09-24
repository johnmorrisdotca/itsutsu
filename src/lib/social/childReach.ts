import "server-only";

import { prisma } from "@/lib/prisma";

import { AGE_BANDS } from "./ageBand.constants";
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

/**
 * Of these members, the ones the reader may not reach: members under 13 whose
 * own buddy list does not hold the reader. For a page of rows — the directory,
 * a ladder, a record's opponents — in two queries for the whole page, never
 * one per row. Empty for a reader with no account, who is offered nothing
 * anyway.
 */
export async function closedToReader(readerId: string | null, memberIds: readonly string[]): Promise<Set<string>> {
  if (readerId === null || memberIds.length === 0) return new Set();
  const children = await prisma.member.findMany({
    where: { id: { in: [...memberIds] }, ageBand: AGE_BANDS.under13 },
    select: { id: true },
  });
  if (children.length === 0) return new Set();
  const opened = await prisma.buddy.findMany({
    where: { ownerId: { in: children.map((child) => child.id) }, buddyId: readerId },
    select: { ownerId: true },
  });
  const open = new Set(opened.map((row) => row.ownerId));
  return new Set(children.map((child) => child.id).filter((id) => !open.has(id)));
}
