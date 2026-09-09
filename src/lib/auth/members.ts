import "server-only";
import { KEEP_FINISHED_DEFAULT } from "@/lib/history/retention";
import { appearanceFrom } from "@/components/board/appearance";
import type { Appearance } from "@/components/board/board.types";

import { prisma } from "@/lib/prisma";
import { revokeInviteCode } from "@/lib/invite/inviteStore";
import { playerKey } from "@/lib/rating/playerKey";
import { isReservedKey } from "@/lib/rating/reservedKeys";

export type Member = { email: string; name: string; picture: string };

/** Emails are compared folded; Google gives them in whatever case the user typed once. */
export function foldEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** The member for an address, or null when the address has not been let in. */
export async function findMember(email: string): Promise<Member | null> {
  const row = await prisma.member.findUnique({
    where: { email: foldEmail(email) },
    select: { email: true, name: true, picture: true },
  });
  return row;
}

/**
 * Lets an address in. The first sign-in is the registration: there is no
 * form, no password, no confirmation mail — Google has already proved the
 * address, and the invite code (or the operator) says it is welcome. Signing
 * in again refreshes the name and picture, which people change.
 */
export async function admitMember(
  input: Member & { invitedWith?: string },
): Promise<Member & { created: boolean }> {
  const email = foldEmail(input.email);
  const existing = await prisma.member.findUnique({ where: { email }, select: { email: true } });
  if (existing === null) {
    const row = await prisma.member.create({
      data: { email, name: input.name, picture: input.picture, invitedWith: input.invitedWith ?? "" },
      select: { email: true, name: true, picture: true },
    });
    return { ...row, created: true };
  }
  // The name is the member's to choose; Google's is only the first suggestion.
  const row = await prisma.member.update({
    where: { email },
    data: { picture: input.picture, lastSeenAt: new Date() },
    select: { email: true, name: true, picture: true },
  });
  return { ...row, created: false };
}

/**
 * Changes a member's display name. Null when the name is not theirs to take.
 *
 * Three ways it is not. Another member is called that. It is a reserved name —
 * a remembered or honorary player, who cannot answer for themselves and whose
 * name nobody else may wear. Or a record already stands under it, earned by
 * whoever played as that name before: a rating is not something a rename may
 * inherit, and a name that has been vacated is not therefore free.
 */
export async function renameMember(email: string, name: string): Promise<Member | null> {
  const key = playerKey(name);
  if (isReservedKey(key)) return null;

  const clash = await prisma.member.findFirst({
    where: { email: { not: foldEmail(email) }, name: { equals: name, mode: "insensitive" } },
    select: { email: true },
  });
  if (clash !== null) return null;

  /*
   * A record under this name belongs to whoever earned it. It is theirs to
   * keep using only if they are the one being renamed — which today means
   * their current name folds to the same key, a change of capitalisation.
   */
  if (key !== "") {
    const current = await prisma.member.findUnique({ where: { email: foldEmail(email) }, select: { name: true } });
    if (playerKey(current?.name ?? "") !== key) {
      const record = await prisma.player.findUnique({ where: { key }, select: { key: true } });
      if (record !== null) return null;
    }
  }
  return prisma.member.update({
    where: { email: foldEmail(email) },
    data: { name },
    select: { email: true, name: true, picture: true },
  });
}

/** The profile a member keeps: what others may see, and how they want to be reached. */
export type MemberProfile = Member & {
  city: string;
  country: string;
  timeZone: string;
  bio: string;
  showOnline: boolean;
  emailNotify: boolean;
  awayFrom: Date | null;
  awayUntil: Date | null;
  awayDaysUsed: number;
  awayYear: number;
  /** Days a finished game stays in their own list; 0 keeps them all. */
  keepFinishedDays: number;
  /** Days of the week they do not play, 0 for Sunday. */
  daysOff: number[];
  /** How they like a board dressed. Stored JSON; read it through cleanAppearance. */
  appearance: unknown;
  createdAt: Date;
  lastSeenAt: Date;
};

export async function fetchProfile(email: string): Promise<MemberProfile | null> {
  return prisma.member.findUnique({ where: { email: foldEmail(email) } });
}

/**
 * How long this member keeps finished games in their own list, in days.
 *
 * One column rather than the whole profile: this is read on the route the
 * header's badge polls, so it is worth being narrow about. Nobody signed in
 * — a browser holding only seat cookies — keeps everything, which is the
 * default anybody gets until they change it.
 */
/**
 * The board this member keeps on their account, or null when there is none.
 *
 * Null and "the ordinary board" are not the same answer, and the difference
 * matters: a member who has never chosen must not have their browser's own
 * choice overruled by a default they never asked for, and the operator — who
 * signs in without a member row at all — must not be overruled by one either.
 * Only a board somebody actually chose is allowed to win.
 */
export async function appearanceFor(email: string | null): Promise<Appearance | null> {
  if (email === null) return null;
  const row = await prisma.member.findUnique({
    where: { email: foldEmail(email) },
    select: { appearance: true },
  });
  if (row?.appearance === null || row?.appearance === undefined) return null;
  return appearanceFrom(row.appearance);
}

export async function keepFinishedDaysFor(email: string | null): Promise<number> {
  if (email === null) return KEEP_FINISHED_DEFAULT;
  const row = await prisma.member.findUnique({
    where: { email: foldEmail(email) },
    select: { keepFinishedDays: true },
  });
  return row?.keepFinishedDays ?? KEEP_FINISHED_DEFAULT;
}

/** How often "last seen" is written: once a minute is plenty for a who's-here list. */
const TOUCH_EVERY_MS = 60_000;

/** Marks a member as here now. Cheap: one read, and a write at most once a minute. */
/**
 * Marks a member as seen, and says whether they are still allowed in.
 *
 * Every server-rendered page asks who is here, and this is the read that
 * answers it, so the ban is checked in the same breath rather than costing a
 * query of its own. A banned member is "gone" from that moment: the next
 * request they make is the one that stops working.
 */
export async function touchMember(email: string): Promise<{ banned: boolean }> {
  const key = foldEmail(email);
  const row = await prisma.member.findUnique({
    where: { email: key },
    select: { lastSeenAt: true, bannedAt: true },
  });
  if (row === null) return { banned: false };
  if (row.bannedAt !== null) return { banned: true };
  if (Date.now() - row.lastSeenAt.getTime() >= TOUCH_EVERY_MS) {
    await prisma.member.update({ where: { email: key }, data: { lastSeenAt: new Date() } });
  }
  return { banned: false };
}

/** Whether this address is shut out, for the places that have not read the row already. */
export async function isBanned(email: string): Promise<boolean> {
  const row = await prisma.member.findUnique({
    where: { email: foldEmail(email) },
    select: { bannedAt: true },
  });
  return row?.bannedAt != null;
}

/** One line of the operator's list of members. */
export type MemberSummary = Member & {
  createdAt: string;
  lastSeenAt: string;
  bannedAt: string | null;
  bannedNote: string;
  invitedWith: string;
};

/** Every member, most recently seen first. The operator's own view; nobody else sees it. */
export async function listMembers(limit = 200): Promise<MemberSummary[]> {
  const rows = await prisma.member.findMany({
    orderBy: { lastSeenAt: "desc" },
    take: limit,
    select: {
      email: true,
      name: true,
      picture: true,
      createdAt: true,
      lastSeenAt: true,
      bannedAt: true,
      bannedNote: true,
      invitedWith: true,
    },
  });
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    bannedAt: row.bannedAt === null ? null : row.bannedAt.toISOString(),
  }));
}

/**
 * Shuts an account, or opens it again.
 *
 * Shutting it also revokes the invite that let them in, so the same person
 * cannot walk back through the door they came by; opening it again does not
 * put that invite back, because a code is a thing the operator hands out and
 * this one has been spent on a decision.
 */
export async function setBanned(email: string, banned: boolean, note = ""): Promise<MemberSummary | null> {
  const key = foldEmail(email);
  const row = await prisma.member.findUnique({ where: { email: key }, select: { invitedWith: true } });
  if (row === null) return null;
  await prisma.member.update({
    where: { email: key },
    data: banned ? { bannedAt: new Date(), bannedNote: note.trim().slice(0, 280) } : { bannedAt: null, bannedNote: "" },
  });
  if (banned && row.invitedWith !== "") await revokeInviteCode(row.invitedWith).catch(() => undefined);
  return (await listMembers(1_000)).find((member) => member.email === key) ?? null;
}

export type ProfileUpdate = Partial<
  Pick<
    MemberProfile,
    | "city"
    | "country"
    | "timeZone"
    | "bio"
    | "showOnline"
    | "emailNotify"
    | "keepFinishedDays"
    | "daysOff"
  >
> & {
  /*
   * Read back as unknown JSON but only ever written as a cleaned Appearance.
   * The asymmetry is the point: what comes out of the column is whatever was
   * in it, and what goes in has already been checked against the themes and
   * stone sets that exist.
   */
  appearance?: Partial<Appearance>;
};

export async function updateProfile(email: string, update: ProfileUpdate): Promise<void> {
  await prisma.member.update({ where: { email: foldEmail(email) }, data: update });
}

/**
 * The member who plays under a name, however it was capitalised. A name is
 * how the site addresses somebody, so a name typed into an address bar or
 * printed beside a game has to find them; the address is the key underneath.
 */
export async function findMemberByName(name: string): Promise<Member | null> {
  const wanted = name.trim();
  if (wanted === "") return null;
  const row = await prisma.member.findFirst({
    where: { name: { equals: wanted, mode: "insensitive" } },
    select: { email: true, name: true, picture: true },
  });
  return row;
}
