import "server-only";

import { writePreferences } from "@/lib/preferences/memberPreferences";
import { preferencesFrom } from "@/lib/preferences/preferences";
import { prisma } from "@/lib/prisma";

import { MAIL_KINDS, type StopKind } from "./mailStop";

/** What a member hears now: this kind of email, and email from the site at all. Null where there is no such member. */
export type StopState = { kindOn: boolean; allOn: boolean };

export async function stopStateOf(memberId: string, kind: StopKind): Promise<StopState | null> {
  const row = await prisma.member.findUnique({ where: { id: memberId }, select: { emailNotify: true, preferences: true } });
  if (row === null) return null;
  return { kindOn: preferencesFrom(row.preferences)[MAIL_KINDS[kind].preference] !== "off", allOn: row.emailNotify };
}

/**
 * Says which of a member's emails they want: one kind on or off, or all of
 * them (`emailNotify`). One statement, and none where nothing would change,
 * so a link pressed twice — or a mail program's one-click and then the page —
 * writes once. False where there is no such member.
 */
export async function setMailWanted(memberId: string, what: StopKind | "all", on: boolean): Promise<boolean> {
  const row = await prisma.member.findUnique({ where: { id: memberId }, select: { emailNotify: true, preferences: true } });
  if (row === null) return false;
  if (what === "all") {
    if (row.emailNotify !== on) await prisma.member.update({ where: { id: memberId }, data: { emailNotify: on } });
    return true;
  }
  await writePreferences(memberId, row.preferences, { [MAIL_KINDS[what].preference]: on ? "on" : "off" });
  return true;
}
