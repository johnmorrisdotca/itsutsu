import "server-only";

import { foldEmail } from "@/lib/auth/members";
import { prisma } from "@/lib/prisma";

export type IgnoredEntry = { email: string; name: string; since: string };

/** The addresses a member has chosen not to hear from. */
export async function ignoredEmails(owner: string): Promise<Set<string>> {
  const rows = await prisma.ignore.findMany({ where: { owner: foldEmail(owner) }, select: { ignored: true } });
  return new Set(rows.map((row) => row.ignored));
}

/** True when `target` has chosen not to hear from `from`. */
export async function isIgnoring(target: string, from: string): Promise<boolean> {
  const row = await prisma.ignore.findUnique({
    where: { owner_ignored: { owner: foldEmail(target), ignored: foldEmail(from) } },
    select: { owner: true },
  });
  return row !== null;
}

export async function fetchIgnored(owner: string): Promise<IgnoredEntry[]> {
  const rows = await prisma.ignore.findMany({ where: { owner: foldEmail(owner) }, orderBy: { createdAt: "desc" } });
  if (rows.length === 0) return [];
  const members = await prisma.member.findMany({
    where: { email: { in: rows.map((row) => row.ignored) } },
    select: { email: true, name: true },
  });
  const names = new Map(members.map((member) => [member.email, member.name]));
  return rows.map((row) => ({ email: row.ignored, name: names.get(row.ignored) ?? row.ignored, since: row.createdAt.toISOString() }));
}

export async function ignore(owner: string, target: string): Promise<boolean> {
  const me = foldEmail(owner);
  const them = foldEmail(target);
  if (me === them) return false;
  const exists = await prisma.member.findUnique({ where: { email: them }, select: { email: true } });
  if (exists === null) return false;
  await prisma.ignore.upsert({
    where: { owner_ignored: { owner: me, ignored: them } },
    create: { owner: me, ignored: them },
    update: {},
  });
  return true;
}

export async function unignore(owner: string, target: string): Promise<void> {
  await prisma.ignore.deleteMany({ where: { owner: foldEmail(owner), ignored: foldEmail(target) } });
}
