import "server-only";

import { foldEmail } from "@/lib/auth/members";
import { prisma } from "@/lib/prisma";
import { awardBuddyKept } from "@/lib/xp/xpSocial";
import { localTimeIn, recencyOf, type Recency } from "./presence";

export type BuddyEntry = {
  /**
   * Their member id, which is how anything that offers a game names them.
   *
   * Free: the row is already read whole. It is here because a computer player
   * has no address, and because the site stopped addressing a challenge to an
   * email — see `Opponent`.
   */
  id: string;
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

/** Adds a buddy. Silently nothing if they are already there, or are not a member, or are you. */
export async function addBuddy(owner: string, buddy: string): Promise<boolean> {
  const me = foldEmail(owner);
  const them = foldEmail(buddy);
  if (me === them) return false;
  /*
   * BOTH ROWS IN THE QUERY THAT WAS ALREADY BEING MADE. This read existed to
   * answer "is there such a member"; asking it for the pair answers that and
   * hands over the two ids the XP ledger is keyed on, for the same one query.
   * The ledger keys by id and the buddy list by address, so without this the
   * award would have needed a lookup of its own.
   */
  const rows = await prisma.member.findMany({
    where: { email: { in: [me, them] } },
    select: { id: true, email: true },
  });
  const theirs = rows.find((row) => row.email === them);
  if (theirs === undefined) return false;
  await prisma.buddy.upsert({
    where: { owner_buddy: { owner: me, buddy: them } },
    create: { owner: me, buddy: them },
    update: {},
  });
  /*
   * The first buddy, and this buddy. Quiet by construction, and after the row is
   * written: a ledger write must never be able to fail the thing that earned it.
   * `buddyAdded` is keyed on the buddy, so adding somebody already on the list —
   * which the upsert above makes a no-op — pays nothing the second time.
   */
  await awardBuddyKept({
    memberId: rows.find((row) => row.email === me)?.id ?? null,
    buddyId: theirs.id,
  });
  return true;
}

export async function removeBuddy(owner: string, buddy: string): Promise<void> {
  await prisma.buddy.deleteMany({ where: { owner: foldEmail(owner), buddy: foldEmail(buddy) } });
}
