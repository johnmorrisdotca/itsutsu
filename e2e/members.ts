import type { Browser, BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { makeMemberId } from "../src/lib/auth/memberId";
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
