import type { Browser, BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";

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
 * The operator's own Member row, made only if it is not already there.
 *
 * CREATE ONLY, AND THAT IS THE WHOLE POINT — `seedMember` above upserts, and
 * its `update` would write a name, a country and a bio over whatever it found.
 * The operator's address on a developer's machine is a REAL account with a
 * real name on it, so an upsert here would quietly rewrite John's own profile
 * every time the suite ran.
 *
 * Why it is needed at all: signing in as the operator does NOT make anybody a
 * member. `/api/session` with `kind: "admin"` mints a session and nothing
 * else, and `touchMember` returns early when there is no row rather than
 * creating one — correctly, since a member is something Google makes. So on a
 * database where the operator's address has never signed in with Google,
 * every route that asks `currentMemberId()` answers 401 to the operator.
 *
 * That never showed locally, because the shared development database has held
 * a real Member row for the operator's address since long before this suite
 * existed. The whole suite was leaning on a row no fixture had ever made —
 * which is exactly what AGENTS.md means by a spec asserting something about a
 * row it did not create. On a fresh database it cost twenty-odd failures in
 * files testing something else entirely.
 */
export async function ensureMember({ email, name }: TestMember): Promise<void> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    await prisma.member.upsert({
      where: { email },
      create: { email, id: makeMemberId(), name, picture: "", invitedWith: "playwright" },
      // Deliberately empty: an existing row is somebody's, and not ours to edit.
      update: {},
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
 * Every computer standing at one game, whoever holds it.
 *
 * For a case that asserts a game has NO such ladder. Naming keys cannot do
 * that: the assertion is about what the database does not contain, so it has
 * to be true of rows this run never made — and a bot batch run against this
 * database months ago left exactly such a row, which turned a test about the
 * code into a test about local history.
 *
 * Guarded on a database on this machine, like everything else that deletes
 * here: this takes rows it did not create, which is only ever acceptable
 * locally.
 */
export async function clearAllComputerStandings(variant: string): Promise<void> {
  loadEnv();
  if (!isLocalDatabase(process.env.DATABASE_URL)) return;
  const prisma = new PrismaClient();
  try {
    await prisma.playerVariantRating.deleteMany({ where: { variant } });
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

/**
 * A standing among PEOPLE at one game, for the cases that need a ladder to
 * exist at all. The computer-pool helpers above deliberately leave that table
 * empty, which is right for what they test and useless for what this tests.
 */
export async function seedPeopleStanding(
  variant: string,
  standing: { key: string; name: string; rating: number; games: number; wins: number; losses: number },
): Promise<string> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    const figures = {
      name: standing.name,
      rating: standing.rating,
      ratedGames: standing.games,
      wins: standing.wins,
      losses: standing.losses,
      draws: 0,
    };
    await prisma.playerVariantRating.upsert({
      where: { key_variant: { key: standing.key, variant } },
      create: { key: standing.key, variant, ...figures },
      update: figures,
    });
    return standing.key;
  } finally {
    await prisma.$disconnect();
  }
}

/** And takes it away again. */
export async function clearPeopleStanding(variant: string, key: string): Promise<void> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    await prisma.playerVariantRating.deleteMany({ where: { variant, key } });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * One member's standing at one game, in the computer pool, keyed off their
 * account for the reason `seedComputerPlayerFor` is: the key is the name they
 * play under, and a test that wrote its own would be testing a row nobody's
 * page reads.
 */
export async function seedComputerStandingFor(
  email: string,
  variant: string,
  figures: { rating: number; games: number; wins: number; losses: number },
): Promise<string> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    const member = await prisma.member.findUnique({ where: { email }, select: { name: true } });
    if (member === null) throw new Error(`No member ${email} to give a standing to.`);
    const key = playerKey(member.name);
    const wrote = {
      name: member.name,
      computerRating: figures.rating,
      computerRatedGames: figures.games,
      computerWins: figures.wins,
      computerLosses: figures.losses,
      computerDraws: 0,
    };
    await prisma.playerVariantRating.upsert({
      where: { key_variant: { key, variant } },
      create: { key, variant, ...wrote },
      update: wrote,
    });
    return key;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Winds a member's "last seen" back to before this site existed.
 *
 * For the cases about people the directory orders LAST: a kept record never
 * signs in, so its stamp never moves, and the honest way to test what happens
 * past the limit is to make one genuinely oldest rather than to seed two
 * hundred rows.
 */
export async function seenLongAgo(name: string): Promise<Date | null> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    const before = await prisma.member.findFirst({ where: { name }, select: { lastSeenAt: true } });
    await prisma.member.updateMany({
      where: { name },
      data: { lastSeenAt: new Date("2001-07-27T00:00:00.000Z") },
    });
    return before?.lastSeenAt ?? null;
  } finally {
    await prisma.$disconnect();
  }
}

/** Puts a stamp back where `seenLongAgo` found it. */
export async function seenAt(name: string, when: Date | null): Promise<void> {
  if (when === null) return;
  loadEnv();
  const prisma = new PrismaClient();
  try {
    await prisma.member.updateMany({ where: { name }, data: { lastSeenAt: when } });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Both seat tokens for a game, read straight from the database.
 *
 * A FIXTURE, NOT A CAPABILITY, and the distinction is the point. Since 0.133.1
 * the API returns only the caller's own seat token: a challenge binds the
 * other seat to another member, and handing the challenger that token let them
 * resign on their opponent's behalf and write a rated loss onto a permanent
 * public record.
 *
 * A test that needs to play BOTH sides of a challenge therefore cannot get the
 * second token the way it used to, and should not — a spec that obtains it
 * through the API would be asserting the bug. It reads the row instead, which
 * is something the test owns and the site cannot do.
 *
 * If you find yourself reaching for this in a spec that is about what a PLAYER
 * can do, stop: the answer there is to claim the seat through its link, which
 * is how a real second player gets one.
 */
export async function seatTokensFor(id: string): Promise<{ blackToken: string; whiteToken: string }> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    const row = await prisma.game.findUnique({
      where: { id },
      select: { blackToken: true, whiteToken: true },
    });
    if (row === null) throw new Error(`no game ${id} to read seat tokens from`);
    return { blackToken: row.blackToken ?? "", whiteToken: row.whiteToken ?? "" };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * The member id behind an address a spec seeded.
 *
 * Needed because everything that offers a game now names a member by id rather
 * than by address — a computer player has no address, and a challenge button
 * that took one wrote members' emails into the markup of every list it appeared
 * in. So a spec that wants to say "this link points at THIS person" has to know
 * the id, and `seedMember` mints one rather than being told one.
 *
 * A row the spec itself created, read by the spec: the same bargain as
 * `seatTokensFor`, and not a thing the site ever does.
 */
export async function memberIdFor(email: string): Promise<string> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    const row = await prisma.member.findUnique({ where: { email }, select: { id: true } });
    if (row === null) throw new Error(`no member ${email}: seed them first`);
    return row.id;
  } finally {
    await prisma.$disconnect();
  }
}
