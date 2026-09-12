import { PrismaClient } from "@prisma/client";

import { makeMemberId } from "../src/lib/auth/memberId";
import { xpForLevel } from "../src/lib/xp/xpCurve";

/**
 * MEMBERS WITH EXPERIENCE, MADE BY THE SPEC THAT ASSERTS ABOUT THEM.
 *
 * `seedMember` in `members.ts` cannot set `xp`, and it should not: it is the
 * fixture every spec on the site uses and a column for one feature does not
 * belong in it. So the XP pages bring their own, and the rule AGENTS.md keeps
 * repeating is the reason this file exists at all — **a spec must not assert
 * anything about a name, a count or a row it did not itself create.**
 *
 * The development database is starved of exactly the rows these pages are
 * about: nobody's experience is backfilled, so every member on it stands on
 * level 1 with nothing. A spec that asserted "somebody is on level 60" against
 * that database would either skip — which reports green and says nothing — or
 * assert about whichever row happened to be there. It makes its own instead.
 *
 * **Every address it makes carries `+xp-` and a stamp**, which is what
 * `removeXpMembers` matches on: a sweep keyed to anything broader would reach
 * rows belonging to other specs or, on a developer's machine, to real people.
 */

let loaded = false;

function loadEnv() {
  if (loaded) return;
  // The dev server reads .env itself; this process has to be told.
  process.loadEnvFile(".env");
  loaded = true;
}

/** The mark every row this file makes carries, and the only thing it sweeps. */
const MARK = "+xp-";

/** An address nothing else will have, for one run of one spec. */
export function xpEmail(what: string): string {
  return `itsutsu${MARK}${what}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
}

export type SeededXpMember = { email: string; id: string; name: string; xp: number };

/**
 * A member standing exactly on `level`, with a name nothing else holds.
 *
 * The total is the level's own floor, so the member is on the first rung of it
 * rather than somewhere inside — which is what makes the level page's range
 * arithmetic worth testing: an off-by-one at a boundary is the bug, and a member
 * sitting comfortably in the middle of a band would never find it.
 */
export async function seedXpMember(
  level: number,
  label: string,
  /**
   * A name to sort by, where the spec cares about the order names come in.
   *
   * The leaderboard's Member heading sorts on `Member.name`, so a spec that
   * presses it has to control what the names are — three random ones would land
   * in an order the spec cannot predict, and an assertion written against the
   * order they happened to come out in would be a test about this run.
   */
  name?: string,
): Promise<SeededXpMember> {
  loadEnv();
  const prisma = new PrismaClient();
  const email = xpEmail(label);
  const id = makeMemberId();
  /*
   * ONE TOKEN, NO SPACES, AND THAT IS NOT COSMETIC. `PlayerName` prints
   * `shownName`, which shortens "Xp levels 4821" to "Xp 4." — the site protects
   * a twelve-year-old's surname and does it to test rows too. A spec looking for
   * the name it seeded would find nothing and report the page broken when the
   * page was right. A hyphenated name is ONE name to `shownName`, which splits on
   * spaces only, so this is shown whole.
   */
  const whole = name ?? `Xp-${label}-${Math.floor(Math.random() * 1e6)}`;
  const xp = xpForLevel(level);
  try {
    await prisma.member.create({
      data: {
        email,
        id,
        name: whole,
        picture: "",
        invitedWith: "playwright",
        xp,
        xpLastAt: new Date(),
      },
    });
  } finally {
    await prisma.$disconnect();
  }
  return { email, id, name: whole, xp };
}

/** Takes back exactly the rows a spec made, by the addresses it was given. */
export async function removeXpMembers(emails: readonly string[]): Promise<void> {
  if (emails.length === 0) return;
  loadEnv();
  const prisma = new PrismaClient();
  try {
    /*
     * By address and not by the mark alone, so a run cannot sweep a row another
     * spec is still using — two specs in one file would otherwise clear each
     * other's members the moment one of them finished.
     */
    await prisma.member.deleteMany({ where: { email: { in: [...emails] } } });
  } finally {
    await prisma.$disconnect();
  }
}
