import type { Browser, BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { makeMemberId } from "../src/lib/auth/memberId";
import { playerKey } from "../src/lib/rating/playerKey";
import {
  PLAYER_SESSION_DAYS,
  SESSION_COOKIE,
  expiryInDays,
  signSession,
} from "../src/lib/auth/session";

/**
 * A real signed-in member, for the specs that need one.
 *
 * Membership comes from Google in the running site, which a browser test
 * cannot do: redeeming an invite alone lets a browser in without making it
 * anybody. So the member is written straight to the database and handed the
 * same signed cookie the sign-in route would have given them. Nothing here
 * weakens the door — the cookie is signed with the site's own secret, and a
 * test that could not read that secret could not make one.
 */
let loaded = false;

function loadEnv() {
  if (loaded) return;
  // The dev server reads .env itself; this process has to be told.
  process.loadEnvFile(".env");
  loaded = true;
}

export type TestMember = {
  email: string;
  name: string;
  country?: string;
  city?: string;
  timeZone?: string;
  bio?: string;
};

/** Makes the member, or renames them if the address is already known. */
export async function seedMember({
  email,
  name,
  country = "",
  city = "",
  timeZone = "",
  bio = "",
}: TestMember): Promise<void> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    await prisma.member.upsert({
      where: { email },
      create: { email, id: makeMemberId(), name, picture: "", invitedWith: "playwright", country, city, timeZone, bio },
      update: { name, country, city, timeZone, bio, lastSeenAt: new Date() },
    });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Winds a seeded member's clock back, for the specs about who is still about.
 *
 * The directory's "seen lately" filter reads `lastSeenAt`, and `seedMember`
 * stamps it with now — so without this every seeded member is always here and
 * the filter has nothing to leave out. Written straight to the row because
 * there is no request a browser could make that would make it older.
 */
export async function seenDaysAgo(email: string, days: number): Promise<void> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    await prisma.member.update({
      where: { email },
      data: { lastSeenAt: new Date(Date.now() - days * 86_400_000) },
    });
  } finally {
    await prisma.$disconnect();
  }
}

/** A browser context signed in as that member, made if they do not exist yet. */
export async function memberContext(
  browser: Browser,
  baseURL: string,
  member: TestMember,
): Promise<BrowserContext> {
  await seedMember(member);
  const token = await signSession({
    kind: "player",
    email: member.email,
    name: member.name,
    exp: expiryInDays(PLAYER_SESSION_DAYS),
  });
  if (token === null) throw new Error("No AUTH_SECRET: cannot sign a test session.");

  const context = await browser.newContext({ baseURL });
  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: token,
      url: baseURL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  return context;
}

/** One player's standing at one game, in the pool for games against a program. */
export type ComputerStanding = {
  key: string;
  name: string;
  rating: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
};

/**
 * Writes standings into the pool for games against the computer players.
 *
 * Seeded rather than played, because playing enough games of Reversi against
 * a program to move a rating is minutes of wall clock per case. What is under
 * test is the READING — which pool a table shows, and where its counts lead —
 * and that needs rows in the right columns rather than the games behind them.
 *
 * A local database has none of these at all: bot-against-bot play happens on
 * production, so without this a case here would pass by finding nothing.
 */
export async function seedComputerStandings(
  variant: string,
  standings: readonly ComputerStanding[],
): Promise<void> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    for (const one of standings) {
      const figures = {
        name: one.name,
        computerRating: one.rating,
        computerRatedGames: one.games,
        computerWins: one.wins,
        computerLosses: one.losses,
        computerDraws: one.draws,
      };
      await prisma.playerVariantRating.upsert({
        where: { key_variant: { key: one.key, variant } },
        create: { key: one.key, variant, ...figures },
        update: figures,
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Gives one member a record in the computer pool on the GLOBAL ladder.
 *
 * Keyed off the account rather than off a name written into the test: a
 * rating belongs to the name somebody plays under, that name comes from their
 * member row, and a test that guessed it would pass or fail on whatever the
 * last run happened to leave in that column.
 *
 * Returns the key it used, so the caller can clear exactly what it made.
 */
export async function seedComputerPlayerFor(
  email: string,
  figures: { rating: number; games: number; wins: number; losses: number },
): Promise<string> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    const member = await prisma.member.findUnique({ where: { email }, select: { name: true } });
    if (member === null) throw new Error(`No member ${email} to give a record to.`);
    const key = playerKey(member.name);
    const wrote = {
      name: member.name,
      computerRating: figures.rating,
      computerRatedGames: figures.games,
      computerWins: figures.wins,
      computerLosses: figures.losses,
      computerDraws: 0,
    };
    await prisma.player.upsert({ where: { key }, create: { key, ...wrote }, update: wrote });
    return key;
  } finally {
    await prisma.$disconnect();
  }
}

/** Puts that row's computer columns back to nothing. */
export async function clearComputerPlayer(key: string): Promise<void> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    await prisma.player.updateMany({
      where: { key },
      data: { computerRating: 1600, computerRatedGames: 0, computerWins: 0, computerLosses: 0, computerDraws: 0 },
    });
  } finally {
    await prisma.$disconnect();
  }
}

/** Takes those standings away again, so one run does not decide the next one's. */
export async function clearComputerStandings(variant: string, keys: readonly string[]): Promise<void> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    await prisma.playerVariantRating.deleteMany({ where: { variant, key: { in: [...keys] } } });
  } finally {
    await prisma.$disconnect();
  }
}
