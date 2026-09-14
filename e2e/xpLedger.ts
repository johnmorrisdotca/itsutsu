import type { Browser, BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { makeMemberId } from "../src/lib/auth/memberId";
import {
  PLAYER_SESSION_DAYS,
  SESSION_COOKIE,
  expiryInDays,
  signSession,
} from "../src/lib/auth/session";
import { standingData } from "./xpStanding";

/**
 * READING THE LEDGER FROM A BROWSER TEST, AND MAKING THE MEMBER IT READS ABOUT.
 *
 * This exists because of the assertion nobody was making. Every XP spec on the
 * site drives a PAGE that shows XP — the leaderboard, the levels, the history —
 * and every one of them seeds the number it then reads back. So all of them were
 * green on a deploy where the site had never paid anybody anything: they proved
 * the pages can draw a total, not that a total ever arrives.
 *
 * What was missing is a spec that does what a member does — arrives, on a day it
 * has not seen them — and then asks the DATABASE whether the ledger moved. That
 * is the one shape that cannot be satisfied by a page rendering correctly over
 * nothing.
 *
 * Its own file rather than a hand in `xpMembers.ts`, which is about members who
 * already HOLD experience. These are members who have not earned any yet, which
 * is the whole point of them.
 *
 * Every address carries `+visit-` and a stamp, and nothing here sweeps by
 * anything broader: a run must never reach a row another spec is using or, on a
 * developer's machine, a real person's.
 */

let loaded = false;

function loadEnv() {
  if (loaded) return;
  // The dev server reads .env itself; this process has to be told.
  process.loadEnvFile(".env");
  loaded = true;
}

const MARK = "+visit-";

export type Visitor = { email: string; id: string; name: string };

/**
 * A member who was last here `daysAgo` days ago, with no zone of their own.
 *
 * `timeZone: ""` on purpose, and it is not laziness: it is what every member who
 * has never opened their profile actually carries, and the state the whole zone
 * fix is about. A spec that seeded a zone would be testing the comfortable case.
 *
 * `lastSeenAt` is wound back with the row rather than by a request, because there
 * is no request a browser could make that would make it older — and a member
 * seeded with "now" is a member the site has already seen today, who correctly
 * earns nothing. That is the fixture mistake that would make this spec pass for
 * the wrong reason in either direction.
 */
export async function seedVisitor(label: string, daysAgo = 1): Promise<Visitor> {
  loadEnv();
  const prisma = new PrismaClient();
  const email = `itsutsu${MARK}${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const id = makeMemberId();
  /* One token, no spaces: `shownName` shortens a surname away, and a spec
     looking for a name it seeded would find nothing. See `seedXpMember`. */
  const name = `Visit-${label}-${Math.floor(Math.random() * 1e6)}`;
  try {
    await prisma.member.create({
      data: {
        email,
        id,
        name,
        picture: "",
        invitedWith: "playwright",
        timeZone: "",
        lastSeenAt: new Date(Date.now() - daysAgo * 86_400_000),
      },
    });
  } finally {
    await prisma.$disconnect();
  }
  return { email, id, name };
}

/**
 * The same, but holding a zone — and a country, where the case is about a guess.
 *
 * `source` is where the zone came from, kept beside it in the preferences
 * registry (`timeZoneFrom`): `country` is what a sign-in writes with its guess.
 * Left out, the row has no source — every row written before sources existed —
 * and then a zone holding exactly what its country would guess reads as a
 * guess, and any other zone as the member's own (`zoneGuess.ts`). So a spec
 * about a guess sets the pair, and a spec about a recorded guess sets all three.
 */
export async function seedVisitorWithZone(
  label: string,
  timeZone: string,
  daysAgo = 1,
  country = "",
  source?: "chosen" | "device" | "country",
): Promise<Visitor> {
  const visitor = await seedVisitor(label, daysAgo);
  loadEnv();
  const prisma = new PrismaClient();
  try {
    await prisma.member.update({
      where: { id: visitor.id },
      data: { timeZone, country, ...(source === undefined ? {} : { preferences: { timeZoneFrom: source } }) },
    });
  } finally {
    await prisma.$disconnect();
  }
  return visitor;
}

/**
 * Sets a seeded visitor's standing so the next arrival lands where a spec
 * wants it: `daysAgo` winds their clock back so the visit is paid, and `xp`
 * places the total so that payment crosses a level, or falls one short of
 * one. The row is the spec's own, made by `seedVisitor`; nothing here touches
 * anybody else's.
 */
export async function setVisitorStanding(visitor: Visitor, standing: { daysAgo: number; xp: number }): Promise<void> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    await prisma.member.update({
      where: { id: visitor.id },
      // All three totals: a toast names the level the badge shows, which is read from xpEverywhere.
      data: { ...standingData({ here: standing.xp }), lastSeenAt: new Date(Date.now() - standing.daysAgo * 86_400_000) },
    });
  } finally {
    await prisma.$disconnect();
  }
}

/** Every award this member holds, newest first. The ledger itself, not a page's view of it. */
export async function ledgerFor(memberId: string): Promise<{ type: string; subject: string; points: number }[]> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    return await prisma.xpEvent.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
      select: { type: true, subject: true, points: true },
    });
  } finally {
    await prisma.$disconnect();
  }
}

/** What the row says about this member now: their total and the zone their days are counted in. */
export async function standingFor(memberId: string): Promise<{ xp: number; timeZone: string } | null> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    return await prisma.member.findUnique({ where: { id: memberId }, select: { xp: true, timeZone: true } });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Takes back exactly what a spec made.
 *
 * The ledger rows FIRST and explicitly, because `XpEvent.memberId` carries no
 * relation and therefore no cascade — deleting the member alone would leave its
 * awards behind for ever, keyed to an id nothing answers to.
 */
/**
 * A browser signed in as this visitor, WITHOUT touching their row.
 *
 * `memberContext` in `members.ts` is the usual way and cannot be used here: it
 * calls `seedMember`, whose `update` writes `lastSeenAt: new Date()` — so it
 * would stamp today over the day this spec has just wound back, the member would
 * correctly earn nothing, and the spec would fail on working code. The fixture
 * would have destroyed the very state under test.
 *
 * Nothing here weakens the door: the cookie is signed with the site's own secret
 * exactly as the sign-in route signs it, and a process that could not read that
 * secret could not make one.
 */
export async function visitorContext(
  browser: Browser,
  baseURL: string,
  visitor: Visitor,
  /**
   * The zone this browser reports, where a case is about what a device says.
   * Set rather than inherited, so a spec about a guess being replaced is not a
   * test about which city the machine running it happens to be in.
   */
  device: { timezoneId?: string } = {},
): Promise<BrowserContext> {
  const token = await signSession({
    kind: "player",
    email: visitor.email,
    name: visitor.name,
    exp: expiryInDays(PLAYER_SESSION_DAYS),
  });
  if (token === null) throw new Error("No AUTH_SECRET: cannot sign a test session.");
  /*
   * AN EMPTY STORAGE STATE, SAID OUT LOUD. `browser.newContext` inherits the
   * project's `use` options, and the project signs every context in as the
   * operator through `.auth/admin.json`. Left implicit, this visitor's browser
   * would carry the operator's state underneath its own cookie — and on the
   * `--no-deps` route, where that file is never minted, it failed all four
   * cases at this line before reaching the site. The only identity here is the
   * one this function signs.
   */
  const context = await browser.newContext({
    baseURL,
    storageState: { cookies: [], origins: [] },
    ...device,
  });
  await context.addCookies([
    { name: SESSION_COOKIE, value: token, url: baseURL, httpOnly: true, sameSite: "Lax" },
  ]);
  return context;
}

export async function removeVisitors(visitors: readonly Visitor[]): Promise<void> {
  if (visitors.length === 0) return;
  loadEnv();
  const prisma = new PrismaClient();
  try {
    await prisma.xpEvent.deleteMany({ where: { memberId: { in: visitors.map((one) => one.id) } } });
    await prisma.member.deleteMany({ where: { id: { in: visitors.map((one) => one.id) } } });
  } finally {
    await prisma.$disconnect();
  }
}
