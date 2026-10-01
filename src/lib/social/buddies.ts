import "server-only";

import { listable } from "./listable";
import { prisma } from "@/lib/prisma";
import { awardBuddyKept } from "@/lib/xp/xpSocial";
import { localTimeIn, recencyOf, type Recency } from "./presence";
import { showsLocalTime, showsPresence } from "./childRules";

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
  /**
   * A person with an account (`listable`). The list keeps anybody — John,
   * 2026-10-01: "ALL members should be addable" — but only a person can be
   * offered a seat at a table or a race, or be written to.
   */
  person: boolean;
  /** A computer player: offered a game, as on its own page, and nothing a person is offered beside it. */
  computer: boolean;
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

/**
 * The buddies who are PEOPLE WITH AN ACCOUNT (`listable`): the ones a seat or a
 * race can be offered to. The list keeps programs and kept records as well, and
 * neither can sit down or answer.
 */
export async function peopleBuddyIds(ownerId: string): Promise<Set<string>> {
  const rows = await prisma.buddy.findMany({
    where: { ownerId, buddy: { botTier: null, unclaimableBecause: null } },
    select: { buddyId: true },
  });
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
    person: listable(member),
    computer: member.botTier !== null,
    email: member.email,
    name: member.name,
    picture: member.picture,
    lastSeenAt: member.lastSeenAt.toISOString(),
    // Their switch, and never for a member under 13; nor a child's local time (childRules.ts).
    // Nor for a program or a kept record: nobody is there to have been seen.
    recency: listable(member) && showsPresence(member) ? recencyOf(member.lastSeenAt, now) : null,
    localTime: listable(member) && showsLocalTime(member.ageBand) ? localTimeIn(member.timeZone, now) : null,
    city: member.city,
    country: member.country,
  }));
}

/**
 * Adds a buddy. Silently nothing if they are already there, are nobody here, or
 * are you.
 *
 * ANY MEMBER, a computer player and a kept record too. It took only a person
 * (`listable`), so Chibi's page and every program's offered no star at all;
 * John, 2026-10-01: "have no way to add some members... ALL members should be
 * addable." A buddy is somebody you want to find again, which is as true of a
 * program you play every day and of a parent's kept record. What only a person
 * can be offered — a seat, a race, a letter — still asks `listable` of the
 * row, wherever it is offered (`BuddyEntry.person`, `peopleBuddyIds`).
 */
export async function addBuddy(ownerId: string, buddyId: string): Promise<boolean> {
  if (ownerId === buddyId) return false;
  const them = await prisma.member.findUnique({ where: { id: buddyId }, select: { id: true } });
  if (them === null) return false;
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
