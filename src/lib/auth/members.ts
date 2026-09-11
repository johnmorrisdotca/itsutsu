import "server-only";
import { KEEP_FINISHED_DEFAULT } from "@/lib/history/retention";
import { isMemberId, makeMemberId } from "./memberId";
import { appearanceFrom } from "@/components/board/appearance";
import type { Appearance } from "@/components/board/board.types";
import { DEFAULT_GAME_DEFAULTS, gameDefaultsFrom, type GameDefaults } from "@/components/game/gameDefaults";

import { prisma } from "@/lib/prisma";
import { playerKey } from "@/lib/rating/playerKey";
import { isReservedKey } from "@/lib/rating/reservedKeys";

/**
 * Somebody who signs in. The address is what they sign in with, so every
 * member reached through these functions has one — the column is nullable
 * only because a kept record belongs to somebody who never held an account
 * and never had an address to give.
 */
export type Member = { email: string; name: string; picture: string };

/**
 * Somebody the site knows about, who may never have signed in.
 *
 * The same shape as a Member with the address allowed to be missing, because
 * a kept record is a person with a name and a history and no account. Every
 * lookup that can turn one up says so in its type rather than pretending
 * everybody has an address.
 */
export type NamedMember = {
  email: string | null;
  /** Their opaque id, for the things addressed by id rather than by address. */
  id?: string;
  /** The engine that plays their seats, when a program does. */
  botTier?: string | null;
  /**
   * Why this row can never be claimed by a real login, or null.
   *
   * Read so that a player's page can badge what sort of member somebody is
   * with the same badge the members list uses, instead of a second one worded
   * differently for the same fact.
   */
  unclaimableBecause?: string | null;
  name: string;
  picture: string;
  country?: string;
  city?: string;
  timeZone?: string;
  bio?: string;
};

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
  // Found by address, so it has one.
  return row === null ? null : { ...row, email: row.email ?? foldEmail(email) };
}

/**
 * An id no member holds.
 *
 * A collision at sixteen characters is not something to worry about, but
 * "not worth worrying about" is not "impossible", and an id is what a rating
 * will hang off — so it is checked rather than assumed, exactly as a game id
 * is. The same function takes a curated id and refuses it if it is taken,
 * which is what makes the import file's chosen ids safe to accept.
 */
export async function freeMemberId(chosen?: string): Promise<string> {
  if (chosen !== undefined) {
    if (!isMemberId(chosen)) throw new Error(`Not a member id: ${chosen}`);
    const taken = await prisma.member.findUnique({ where: { id: chosen }, select: { id: true } });
    if (taken !== null) throw new Error(`That id is already somebody's: ${chosen}`);
    return chosen;
  }
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const id = makeMemberId();
    const taken = await prisma.member.findUnique({ where: { id }, select: { id: true } });
    if (taken === null) return id;
  }
  throw new Error("Could not find a free member id.");
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
      data: {
        email,
        id: await freeMemberId(),
        name: input.name,
        picture: input.picture,
        invitedWith: input.invitedWith ?? "",
      },
      select: { email: true, name: true, picture: true },
    });
    return { ...row, email: row.email ?? email, created: true };
  }
  // The name is the member's to choose; Google's is only the first suggestion.
  const row = await prisma.member.update({
    where: { email },
    data: { picture: input.picture, lastSeenAt: new Date() },
    select: { email: true, name: true, picture: true },
  });
  return { ...row, email: row.email ?? email, created: false };
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
  const renamed = await prisma.member.update({
    where: { email: foldEmail(email) },
    data: { name },
    select: { id: true, email: true, name: true, picture: true },
  });

  /*
   * THE NEW NAME REACHES THE RATING ROWS, and this is the half that was
   * missing rather than a tidy-up.
   *
   * `Player` and `PlayerVariantRating` each keep a `name` for display, so a
   * ladder can be drawn without reading the member table. Renaming updated
   * neither. John's twelve-year-old was told that changing her display name
   * was the remedy for her full name being public; she changed it, and every
   * ladder on the site went on printing the old one. The advice was right and
   * the code did not keep it.
   *
   * BY MEMBER ID, never by key. The key is the folded name she was earning
   * under and it stays put — it is how the historic rows are found, and moving
   * a primary key would orphan the very record this is protecting. What moves
   * is what a reader sees.
   *
   * Not awaited as part of the rename's answer being correct: the member row
   * is the fact, and these two are copies of a word off it.
   */
  await Promise.all([
    prisma.player.updateMany({ where: { memberId: renamed.id }, data: { name } }),
    prisma.playerVariantRating.updateMany({ where: { memberId: renamed.id }, data: { name } }),
  ]);

  return { email: renamed.email ?? foldEmail(email), name: renamed.name, picture: renamed.picture };
}

/** The profile a member keeps: what others may see, and how they want to be reached. */
export type MemberProfile = Omit<Member, "email"> & {
  /** Null for a kept record: somebody who never signed in and never had one. */
  email: string | null;
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
  /** Where a new game starts for them. Stored JSON; read it through cleanGameDefaults. */
  gameDefaults: unknown;
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

/**
 * Where a new game starts for this member.
 *
 * Unlike their board, this always answers: a game has to start somewhere,
 * and "the ordinary starting point" is a perfectly good answer for somebody
 * who has never said otherwise.
 */
export async function gameDefaultsFor(email: string | null): Promise<GameDefaults> {
  if (email === null) return DEFAULT_GAME_DEFAULTS;
  const row = await prisma.member.findUnique({
    where: { email: foldEmail(email) },
    select: { gameDefaults: true },
  });
  return gameDefaultsFrom(row?.gameDefaults);
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
  gameDefaults?: Partial<GameDefaults>;
};

export async function updateProfile(email: string, update: ProfileUpdate): Promise<void> {
  await prisma.member.update({ where: { email: foldEmail(email) }, data: update });
}

/**
 * The members behind a list of names, in one query.
 *
 * For a list that shows several opponents and wants to offer something about
 * each of them. One lookup per row is ten queries to draw ten lines, and a
 * page that costs a query per row is a page nobody adds a row to.
 *
 * Keyed by `playerKey`, so a caller looks up by the same rule the ratings use
 * rather than by whatever capitalisation the game was filed under.
 */
export async function findMembersByNames(
  names: readonly string[],
): Promise<Map<string, NamedMember>> {
  const wanted = [...new Set(names.map((one) => one.trim()).filter((one) => one !== ""))];
  if (wanted.length === 0) return new Map();
  const rows = await prisma.member.findMany({
    where: { OR: wanted.map((one) => ({ name: { equals: one, mode: "insensitive" as const } })) },
    select: {
      email: true,
      id: true,
      botTier: true,
      unclaimableBecause: true,
      name: true,
      picture: true,
      country: true,
      city: true,
      timeZone: true,
      bio: true,
    },
  });
  return new Map(rows.map((row) => [playerKey(row.name ?? ""), row]));
}

/**
 * The member who plays under a name, however it was capitalised. A name is
 * how the site addresses somebody, so a name typed into an address bar or
 * printed beside a game has to find them; the address is the key underneath.
 */
export async function findMemberByName(name: string): Promise<NamedMember | null> {
  const wanted = name.trim();
  if (wanted === "") return null;
  const row = await prisma.member.findFirst({
    where: { name: { equals: wanted, mode: "insensitive" } },
    select: {
      email: true,
      /*
       * A computer player has no address — it never signs in — so the one way
       * to offer a game against it is by id. And knowing it is a program at
       * all is what keeps "buddy" and "ignore" off a page where neither means
       * anything.
       */
      id: true,
      botTier: true,
      unclaimableBecause: true,
      name: true,
      picture: true,
      country: true,
      city: true,
      timeZone: true,
      bio: true,
    },
  });
  return row;
}
