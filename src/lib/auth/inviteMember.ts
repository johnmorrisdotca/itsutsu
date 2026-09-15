import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { playerKey } from "@/lib/rating/playerKey";
import { isReservedKey } from "@/lib/rating/reservedKeys";
import { awardAdmission } from "@/lib/xp/admission";

import { foldEmail } from "./foldEmail";
import { makeMemberId, memberIdFromBytes } from "./memberId";
import { freeMemberId } from "./members";

/** How many names are tried before giving up; a collision on the first is already rare. */
const NAME_ATTEMPTS = 12;

/**
 * A name nobody here goes by and no record stands under, for a member who has
 * not chosen one yet.
 *
 * "Guest" and four characters from the id alphabet — no 0, 1, i, l or o, so it
 * reads back aloud — which passes the same rule a chosen name does. It is a
 * placeholder, and the first thing the member is asked is to replace it: the
 * welcome on /me that a member who came in by Google has always been shown.
 */
export async function freeGuestName(): Promise<string> {
  for (let attempt = 0; attempt < NAME_ATTEMPTS; attempt += 1) {
    const name = `Guest ${makeMemberId().slice(0, 4).toUpperCase()}`;
    const key = playerKey(name);
    if (isReservedKey(key)) continue;
    const [taken, record] = await Promise.all([
      prisma.member.findFirst({ where: { name: { equals: name, mode: "insensitive" } }, select: { id: true } }),
      prisma.player.findUnique({ where: { key }, select: { key: true } }),
    ]);
    if (taken === null && record === null) return name;
  }
  throw new Error("Could not find a free guest name.");
}

/**
 * The id an invite cookie from before redeeming made a member will be given
 * when it is turned into one: derived from the signed cookie itself.
 *
 * DERIVED, NOT DRAWN, because the upgrade happens in a GET that more than one
 * part of a page sends at once — the account menu and the operator's link both
 * ask `/api/session` who is here. Two requests drawing two random ids would make
 * two members for one browser. Two requests deriving the same id make one, and
 * the second finds it. The cookie is signed and unguessable, so the id is too.
 */
export async function legacyInviteMemberId(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return memberIdFromBytes(new Uint8Array(digest));
}

/**
 * The member a redeemed invite code makes: an account with no address.
 *
 * WHAT JOHN CHOSE — "give them a full account". Redeeming a code used to let a
 * browser in and nothing more, so everybody he invited could post a seat and sit
 * at one, and could not challenge anybody, play a computer player, keep a buddy,
 * ignore anybody, leave a mark or keep a board. Now the code makes a member, and
 * the session carries that member's id; everything a member does is keyed by id,
 * so there is nothing an address was doing that this account cannot.
 *
 * PROVENANCE IS THE CODE: `invitedWith` holds it, exactly as it does for a Google
 * member who came in with one, and the address being empty is what says Google
 * was not involved. Nothing else about the row is special — a member who came in
 * by code is a `member` kind like anybody else.
 *
 * `id` is given only for an invite cookie from before this, whose id is derived
 * (see `legacyInviteMemberId`); asking twice with the same id answers the same
 * member rather than failing or making a second.
 *
 * ITS ONE WEAKNESS, WHICH IS SAID RATHER THAN HIDDEN: the signed cookie is the
 * only way back in. A member with neither an address nor four words cannot sign
 * in on another device, or after the cookie's month. Adding four words, or
 * signing in with Google on this browser (see `attachAddress`), is how they keep
 * it — and both keep the same id, games, standing and XP.
 */
export async function admitInviteMember(code: string, id?: string): Promise<{ id: string; name: string }> {
  const select = { id: true, name: true } as const;
  if (id !== undefined) {
    const found = await prisma.member.findUnique({ where: { id }, select });
    if (found !== null) return found;
  }
  try {
    const row = await prisma.member.create({
      data: { id: id ?? (await freeMemberId()), name: await freeGuestName(), invitedWith: code },
      select,
    });
    /* The first lines in their XP history, as for any member made at the door:
       joining, and the day they did it on. See `admitMember`. */
    await awardAdmission({ id: row.id, lastSeenAt: null, timeZone: null, awayUntil: null, createdAt: null, played: null });
    return row;
  } catch (error) {
    // The other request of a pair got there first: the member it made is this one.
    if (id !== undefined && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const found = await prisma.member.findUnique({ where: { id }, select });
      if (found !== null) return found;
    }
    throw error;
  }
}

/**
 * Gives a member who has no address the one Google has just proved, when nobody
 * else holds it.
 *
 * THE SAME MEMBER, NOT A SECOND ONE. A member who came in with a code and later
 * signs in with Google on the same browser keeps their id, and so their games,
 * their standing, their buddies and their XP; the address becomes a second way
 * in, beside the cookie and any four words. That is `credentials.ts`'s rule —
 * two independent credentials on one account — applied to the account a code made.
 *
 * False when it cannot: the member already has an address, or another member
 * does (the caller asks first, and the unique index is the last word on a race).
 * Two accounts are never merged here: somebody who played as a guest AND already
 * has a Google account keeps both, and joining them is the operator's decision.
 */
export async function attachAddress(memberId: string, email: string): Promise<boolean> {
  try {
    const updated = await prisma.member.updateMany({
      where: { id: memberId, email: null },
      data: { email: foldEmail(email) },
    });
    return updated.count === 1;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
    throw error;
  }
}
