import "server-only";

import { listable } from "./listable";
import { prisma } from "@/lib/prisma";
import { awardBuddyKept } from "@/lib/xp/xpSocial";
import { localTimeIn, recencyOf, type Recency } from "./presence";

export type BuddyEntry = {
  /**
   * Their member id, which is how anything that offers a game names them — and,
   * now, how the list itself holds them.
   */
  id: string;
  /** Null for a member who came in with an invite code: they have no address. */
  email: string | null;
  name: string;
  picture: string;
  lastSeenAt: string;
  recency: Recency;
  localTime: string | null;
  city: string;
  country: string;
};

/**
 * The member ids on a member's buddy list.
 *
 * BY ID, AND ONE READ. The list was kept by address and this was two reads —
 * the addresses, then whose they were — because the pages ask by id. It is kept
 * by id now, so the page's question is the table's own.
 */
export async function buddyMemberIds(ownerId: string): Promise<Set<string>> {
  const rows = await prisma.buddy.findMany({ where: { ownerId }, select: { buddyId: true } });
  return new Set(rows.map((row) => row.buddyId));
}

/** A member's buddies, most recently seen first, as a list of people. */
export async function fetchBuddies(ownerId: string, now = new Date()): Promise<BuddyEntry[]> {
  const rows = await prisma.buddy.findMany({
    where: { ownerId },
    select: { buddy: true },
    orderBy: { buddy: { lastSeenAt: "desc" } },
  });
  return rows.map(({ buddy: member }) => ({
    id: member.id,
    email: member.email,
    name: member.name,
    picture: member.picture,
    lastSeenAt: member.lastSeenAt.toISOString(),
    recency: member.showOnline ? recencyOf(member.lastSeenAt, now) : null,
    localTime: localTimeIn(member.timeZone, now),
    city: member.city,
    country: member.country,
  }));
}

/** Adds a buddy. Silently nothing if they are already there, are not a person here, or are you. */
export async function addBuddy(ownerId: string, buddyId: string): Promise<boolean> {
  if (ownerId === buddyId) return false;
  const them = await prisma.member.findUnique({
    where: { id: buddyId },
    select: { botTier: true, unclaimableBecause: true },
  });
  if (!listable(them)) return false;
  await prisma.buddy.upsert({
    where: { ownerId_buddyId: { ownerId, buddyId } },
    create: { ownerId, buddyId },
    update: {},
  });
  /*
   * The first buddy, and this buddy. Quiet by construction, and after the row is
   * written: a ledger write must never be able to fail the thing that earned it.
   * `buddyAdded` is keyed on the buddy, so adding somebody already on the list —
   * which the upsert above makes a no-op — pays nothing the second time.
   */
  await awardBuddyKept({ memberId: ownerId, buddyId });
  return true;
}

export async function removeBuddy(ownerId: string, buddyId: string): Promise<void> {
  await prisma.buddy.deleteMany({ where: { ownerId, buddyId } });
}
