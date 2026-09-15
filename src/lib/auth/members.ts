import "server-only";

import { isMemberId, makeMemberId } from "./memberId";

import { prisma } from "@/lib/prisma";
import { playerKey } from "@/lib/rating/playerKey";
import { isReservedKey } from "@/lib/rating/reservedKeys";
import { awardAdmission } from "@/lib/xp/admission";
import { foldEmail } from "./foldEmail";
import { zoneAssignment } from "./zoneGuess";
import { operatorActionWrite } from "./operatorLog";
import { OPERATOR_ACTIONS } from "./operatorLog.constants";
import type { OperatorActor } from "./operatorLog.types";

/*
 * Re-exported so every caller imports them from where it always did. The row
 * reader and the account store live beside this module now — see
 * `memberRow.ts` and `memberAccount.ts` — because this file had reached the
 * size gate doing three jobs: who somebody is, the row every page reads, and
 * what they keep on their account.
 */
export { foldEmail } from "./foldEmail";
export { isBanned, memberRowFor, touchMember } from "./memberRow";
export { appearanceFor, fetchProfile, gameDefaultsFor, keepFinishedDaysFor, updateProfile } from "./memberAccount";

/**
 * Somebody who signs in with an address. Every member reached through the
 * address-keyed functions here has one — the column is nullable because a kept
 * record belongs to somebody who never held an account, and because a member
 * who came in with an invite code has none.
 *
 * `id` is optional here for the same reason it is on `NamedMember`: most
 * callers only ever needed the address, the name and the picture, and giving
 * it to all of them regardless would be a change wider than anyone asked for.
 * `findMember` fills it in, so anything reading its own signed-in member has
 * one to pass on — see `playerPath`, which is what an id is for.
 */
export type Member = { email: string; name: string; picture: string; id?: string };

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
  /** Their XP total. Absent means the lookup did not read it — see `MemberLevel`. */
  xp?: number;
  /** That, plus credit for another site's record — see `xpForBadge`. Absent means not read. */
  xpEverywhere?: number;
  /** What of `xpEverywhere` came from another site. Absent means not read. */
  xpImported?: number;
};

/** The member for an address, or null when the address has not been let in. */
export async function findMember(email: string): Promise<Member | null> {
  const row = await prisma.member.findUnique({
    where: { email: foldEmail(email) },
    select: { id: true, email: true, name: true, picture: true },
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
 *
 * The id comes back with the rest, because the session carries it now: a
 * cookie that names its member by id is read the same way as one a code made.
 */
export async function admitMember(
  input: Member & { invitedWith?: string },
): Promise<Member & { id: string; created: boolean }> {
  const email = foldEmail(input.email);
  const existing = await prisma.member.findUnique({
    where: { email },
    /* The day's XP rides this lookup, which was happening anyway. It is the
       member AS THEY WERE — the only moment `lastSeenAt` still says when they
       were last here, since the update below is about to overwrite it. */
    select: { id: true, email: true, lastSeenAt: true, timeZone: true, awayUntil: true, country: true, preferences: true, createdAt: true, played: true },
  });
  if (existing === null) {
    const row = await prisma.member.create({
      data: {
        email,
        id: await freeMemberId(),
        name: input.name,
        picture: input.picture,
        invitedWith: input.invitedWith ?? "",
      },
      select: { id: true, email: true, name: true, picture: true },
    });
    /* The first lines in a member's XP history, written where the row is made:
       joining, and the day they did it on. `lastSeenAt: null` is what says this
       is the first visit there has ever been — the column itself already reads
       today, which would refuse it. See `awardAdmission`. Quiet by construction
       — `awardXp` swallows and logs — because a ledger write must never be able
       to fail a sign-in. */
    await awardAdmission({ id: row.id, lastSeenAt: null, timeZone: null, awayUntil: null, createdAt: null, played: null });
    return { id: row.id, email: row.email ?? email, name: row.name, picture: row.picture, created: true };
  }
  // The name is the member's to choose; Google's is only the first suggestion.
  const now = new Date();
  /* Rung 3 of the time-zone order, on a write that was happening anyway: a
     member with a country and no zone is guessed rather than reckoned in UTC,
     and the row records that it is a guess. Null leaves both untouched, so this
     can never overwrite a zone somebody chose or their browser measured — see
     `zoneAssignment`. */
  const assigned = zoneAssignment({ stored: existing.timeZone, country: existing.country, preferences: existing.preferences });
  const row = await prisma.member.update({
    where: { email },
    data: { picture: input.picture, lastSeenAt: now, ...assigned },
    select: { email: true, name: true, picture: true },
  });
  /* SIGNING IN IS A VISIT, and the stamp above has just spent the day it
     happened on. Paid from `existing`, which is the row before that write —
     carrying the zone just assigned, so the very first day is already counted
     in their own zone rather than one last time in UTC. */
  await awardAdmission({ ...existing, timeZone: assigned?.timeZone ?? existing.timeZone }, now);
  return { ...row, id: existing.id, email: row.email ?? email, created: false };
}

/**
 * Changes a member's display name. Null when the name is not theirs to take.
 *
 * Three ways it is not. Another member is called that. It is a reserved name —
 * a remembered or honorary player, who cannot answer for themselves and whose
 * name nobody else may wear. Or a record already stands under it, earned by
 * whoever played as that name before: a rating is not something a rename may
 * inherit, and a name that has been vacated is not therefore free.
 *
 * BY MEMBER ID. It was by address, so a member who came in with an invite code
 * could not choose a name at all — and the name is the first thing they are
 * asked for.
 */
export async function renameMember(
  memberId: string,
  name: string,
  /**
   * The operator, when an operator is the one taking a name off or setting one:
   * the rename and its `OperatorAction` row are then one transaction. A member
   * renaming themselves passes nothing, and nothing about their path changes.
   * The row says whether a name was taken off or set, never either name.
   */
  by?: OperatorActor,
): Promise<{ id: string; name: string; picture: string } | null> {
  const key = playerKey(name);
  if (isReservedKey(key)) return null;

  const clash = await prisma.member.findFirst({
    where: { id: { not: memberId }, name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (clash !== null) return null;

  /*
   * A record under this name belongs to whoever earned it. It is theirs to
   * keep using only if they are the one being renamed — which today means
   * their current name folds to the same key, a change of capitalisation.
   */
  if (key !== "") {
    const current = await prisma.member.findUnique({ where: { id: memberId }, select: { name: true } });
    if (playerKey(current?.name ?? "") !== key) {
      const record = await prisma.player.findUnique({ where: { key }, select: { key: true } });
      if (record !== null) return null;
    }
  }
  const update = prisma.member.update({
    where: { id: memberId },
    data: { name },
    select: { id: true, name: true, picture: true },
  });
  const renamed =
    by === undefined
      ? await update
      : (
          await prisma.$transaction([
            update,
            operatorActionWrite({
              actor: by,
              action: OPERATOR_ACTIONS.rename,
              subjectId: memberId,
              detail: name.trim() === "" ? "name taken off" : "name set",
            }),
          ])
        )[0];

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

  return renamed;
}

/* The stored profile's own shapes live beside this module; see members.types.ts.
   Re-exported so every caller imports them from where it always did. */
import type { MemberProfile, ProfileUpdate } from "./members.types";
export type { MemberProfile, ProfileUpdate };

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
 * A member by their opaque id, for an address that carries one.
 *
 * `/players/<id>` is what every link to a person builds now, so this is the
 * first question that address asks. It answers null for anything that is not
 * an id — a name-slug, a stray string — and the page falls back to reading
 * the address as a name, which is what a kept record's address still is.
 */
export async function findMemberById(id: string): Promise<NamedMember | null> {
  const wanted = id.trim();
  if (wanted === "") return null;
  const row = await prisma.member.findUnique({
    where: { id: wanted },
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
      xp: true,
      xpEverywhere: true,
      xpImported: true,
    },
  });
  return row;
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
      xp: true,
      xpEverywhere: true,
      xpImported: true,
    },
  });
  return row;
}
