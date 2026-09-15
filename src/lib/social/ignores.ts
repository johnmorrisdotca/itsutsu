import "server-only";

import { prisma } from "@/lib/prisma";

import { listable } from "./listable";

/** Somebody on a member's ignore list, as the list shows them. */
export type IgnoredEntry = { id: string; name: string; since: string };

/**
 * The member ids a member has chosen not to hear from.
 *
 * BY ID, AND ONE READ. The list was kept by address — "because that is what
 * somebody types when they ignore a person" — and a page asking by id paid a
 * second read to translate. Nobody types an address to ignore anybody here; they
 * press a button beside a name, and the name has an id. Kept by id, a member who
 * came in with an invite code can ignore and be ignored like anybody else.
 */
export async function ignoredMemberIds(ownerId: string): Promise<Set<string>> {
  const rows = await prisma.ignore.findMany({ where: { ownerId }, select: { ignoredId: true } });
  return new Set(rows.map((row) => row.ignoredId));
}

/** True when `targetId` has chosen not to hear from `fromId`. */
export async function isIgnoring(targetId: string, fromId: string): Promise<boolean> {
  const row = await prisma.ignore.findUnique({
    where: { ownerId_ignoredId: { ownerId: targetId, ignoredId: fromId } },
    select: { ownerId: true },
  });
  return row !== null;
}

export async function fetchIgnored(ownerId: string): Promise<IgnoredEntry[]> {
  const rows = await prisma.ignore.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, ignored: { select: { id: true, name: true } } },
  });
  return rows.map((row) => ({ id: row.ignored.id, name: row.ignored.name, since: row.createdAt.toISOString() }));
}

/** Ignores somebody. Nothing if they are you, or are not a person here — see `listable`. */
export async function ignore(ownerId: string, targetId: string): Promise<boolean> {
  if (ownerId === targetId) return false;
  const them = await prisma.member.findUnique({
    where: { id: targetId },
    select: { botTier: true, unclaimableBecause: true },
  });
  if (!listable(them)) return false;
  await prisma.ignore.upsert({
    where: { ownerId_ignoredId: { ownerId, ignoredId: targetId } },
    create: { ownerId, ignoredId: targetId },
    update: {},
  });
  return true;
}

export async function unignore(ownerId: string, targetId: string): Promise<void> {
  await prisma.ignore.deleteMany({ where: { ownerId, ignoredId: targetId } });
}
