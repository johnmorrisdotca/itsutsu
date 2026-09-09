import "server-only";

import { foldEmail } from "@/lib/auth/members";
import { prisma } from "@/lib/prisma";
import { localTimeIn, recencyOf, type Recency } from "./presence";

export type BuddyEntry = {
  /** Null for a kept record: somebody who never signed in. */
  email: string | null;
  name: string;
  picture: string;
  lastSeenAt: string;
  recency: Recency;
  localTime: string | null;
  city: string;
  country: string;
};

/** The addresses on a member's buddy list. */
export async function buddyEmails(owner: string): Promise<Set<string>> {
  const rows = await prisma.buddy.findMany({ where: { owner: foldEmail(owner) }, select: { buddy: true } });
  return new Set(rows.map((row) => row.buddy));
}

/** A member's buddies, most recently seen first, as a list of people rather than addresses. */
export async function fetchBuddies(owner: string, now = new Date()): Promise<BuddyEntry[]> {
  const emails = [...(await buddyEmails(owner))];
  if (emails.length === 0) return [];
  const members = await prisma.member.findMany({
    where: { email: { in: emails } },
    orderBy: { lastSeenAt: "desc" },
  });
  return members.map((member) => ({
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

/** Adds a buddy. Silently nothing if they are already there, or are not a member, or are you. */
export async function addBuddy(owner: string, buddy: string): Promise<boolean> {
  const me = foldEmail(owner);
  const them = foldEmail(buddy);
  if (me === them) return false;
  const exists = await prisma.member.findUnique({ where: { email: them }, select: { email: true } });
  if (exists === null) return false;
  await prisma.buddy.upsert({
    where: { owner_buddy: { owner: me, buddy: them } },
    create: { owner: me, buddy: them },
    update: {},
  });
  return true;
}

export async function removeBuddy(owner: string, buddy: string): Promise<void> {
  await prisma.buddy.deleteMany({ where: { owner: foldEmail(owner), buddy: foldEmail(buddy) } });
}
