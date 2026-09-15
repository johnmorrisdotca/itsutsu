import "server-only";

import { appearanceFrom } from "@/components/board/appearance";
import type { Appearance } from "@/components/board/board.types";
import { DEFAULT_GAME_DEFAULTS, gameDefaultsFrom, type GameDefaults } from "@/components/game/gameDefaults";
import { KEEP_FINISHED_DEFAULT } from "@/lib/history/retention";
import { prisma } from "@/lib/prisma";

import type { MemberProfile, ProfileUpdate } from "./members.types";

/**
 * What a member keeps on their account, read and written BY MEMBER ID.
 *
 * All of it was keyed by address — the board, where a new game starts, how long
 * finished games stay listed, the profile — so a member who came in with an
 * invite code, who has no address, had an account that could hold none of it.
 * Split from `members.ts`, which is about who somebody is; this is about what
 * they have chosen.
 */

export async function fetchProfile(memberId: string): Promise<MemberProfile | null> {
  return prisma.member.findUnique({ where: { id: memberId } });
}

export async function updateProfile(memberId: string, update: ProfileUpdate): Promise<void> {
  await prisma.member.update({ where: { id: memberId }, data: update });
}

/**
 * The board this member keeps on their account, or null when there is none.
 *
 * Null and "the ordinary board" are not the same answer, and the difference
 * matters: a member who has never chosen must not have their browser's own
 * choice overruled by a default they never asked for, and the operator — who
 * signs in without a member row at all — must not be overruled by one either.
 * Only a board somebody actually chose is allowed to win.
 */
export async function appearanceFor(memberId: string | null): Promise<Appearance | null> {
  if (memberId === null) return null;
  const row = await prisma.member.findUnique({ where: { id: memberId }, select: { appearance: true } });
  if (row?.appearance === null || row?.appearance === undefined) return null;
  return appearanceFrom(row.appearance);
}

/**
 * Where a new game starts for this member.
 *
 * Unlike their board, this always answers: a game has to start somewhere,
 * and "the ordinary starting point" is a perfectly good answer for somebody
 * who has never said otherwise.
 */
export async function gameDefaultsFor(memberId: string | null): Promise<GameDefaults> {
  if (memberId === null) return DEFAULT_GAME_DEFAULTS;
  const row = await prisma.member.findUnique({ where: { id: memberId }, select: { gameDefaults: true } });
  return gameDefaultsFrom(row?.gameDefaults);
}

/**
 * How long this member keeps finished games in their own list, in days.
 *
 * One column rather than the whole profile: this is read on the route the
 * header's badge polls, so it is worth being narrow about. Nobody signed in
 * — a browser holding only seat cookies — keeps everything, which is the
 * default anybody gets until they change it.
 */
export async function keepFinishedDaysFor(memberId: string | null): Promise<number> {
  if (memberId === null) return KEEP_FINISHED_DEFAULT;
  const row = await prisma.member.findUnique({ where: { id: memberId }, select: { keepFinishedDays: true } });
  return row?.keepFinishedDays ?? KEEP_FINISHED_DEFAULT;
}
