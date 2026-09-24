import { expect, test, type Browser, type BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { makeMemberId } from "../src/lib/auth/memberId";
import { PLAYER_SESSION_DAYS, SESSION_COOKIE, expiryInDays, signSession } from "../src/lib/auth/session";
import { matchPath } from "../src/lib/gomoku/slugs";
import { ready } from "./support";

/**
 * REMOVE THIS ACCOUNT, from the member's own Profile tab (PRIV-04).
 *
 * The spec brings its own world: a member who came in with an invite code (so
 * no Google to sign in again with), one finished game of theirs against a name
 * with no account, and one XP line. The member reads what is held about them,
 * then removes the account by pressing through it as a reader does — the
 * choice about their name, their name typed — and lands on the front page as
 * a stranger. The game is still there for the other player, with the seat
 * detached and, as chosen, the name taken off. Everything it made goes in
 * `finally`, and the member row is expected already gone.
 */

// Before the client is built: Prisma reads DATABASE_URL at construction.
process.loadEnvFile(".env");

const prisma = new PrismaClient();

type World = { memberId: string; name: string; gameId: string };

async function seedWorld(stamp: string): Promise<World> {
  const memberId = makeMemberId();
  const name = `Leaver${stamp.slice(-5)}`;
  const gameId = `${stamp}-game`;
  await prisma.member.create({ data: { id: memberId, name, picture: "", invitedWith: "playwright" } });
  await prisma.game.create({
    data: {
      id: gameId,
      variant: "freestyle",
      size: 15,
      winLength: 5,
      obstacles: "none",
      opener: "black",
      result: "black",
      winner: "black",
      moveCount: 9,
      status: "finished",
      rated: false,
      blackMemberId: memberId,
      blackName: name,
      whiteName: `Stays${stamp.slice(-5)}`,
    },
  });
  await prisma.xpEvent.create({
    data: { id: `${stamp}-xp`, memberId, type: "gameFinished", points: 10, subject: gameId, dayKey: "2026-09-24" },
  });
  return { memberId, name, gameId };
}

async function asMember(browser: Browser, baseURL: string, memberId: string): Promise<BrowserContext> {
  const token = await signSession({ kind: "player", memberId, code: "playwright", exp: expiryInDays(PLAYER_SESSION_DAYS) });
  if (token === null) throw new Error("No AUTH_SECRET: cannot sign a test session.");
  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  await context.addCookies([{ name: SESSION_COOKIE, value: token, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
  return context;
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("a member reads what is held, removes their account, and the game stays for the other player", async ({ browser, baseURL, page }) => {
  const stamp = `rma${Date.now().toString(36)}`;
  const world = await seedWorld(stamp);
  const member = await asMember(browser, baseURL!, world.memberId);
  try {
    const mine = await member.newPage();
    await mine.goto("/me?view=profile");

    // What we hold: their name, and the one game counted and linked.
    const held = mine.getByTestId("what-we-hold");
    await expect(held).toContainText(world.name);
    await expect(held).toContainText("Games you have a seat in");

    // Removing: shut until asked, then nothing goes until the choice is made and the name is typed.
    await ready(mine, "remove-account");
    await mine.getByTestId("remove-account-open").click();
    const press = mine.getByTestId("remove-account-press");
    await mine.getByTestId("remove-account-confirm").fill(world.name);
    await expect(press).toBeDisabled();
    await mine.getByTestId("remove-account-blank").check();
    await mine.getByTestId("remove-account-confirm").fill("somebody else");
    await expect(press).toBeDisabled();
    await mine.getByTestId("remove-account-confirm").fill(world.name.toLowerCase());
    await expect(press).toBeEnabled();
    await press.click();
    await expect(mine).toHaveURL(/\/$/);

    // Gone: the row, the ledger, and the session with them.
    await expect.poll(() => prisma.member.count({ where: { id: world.memberId } })).toBe(0);
    expect(await prisma.xpEvent.count({ where: { memberId: world.memberId } })).toBe(0);
    const again = await mine.goto("/me");
    expect(again?.url()).toContain("/join");

    // The game stays, detached, with the name taken off as chosen; the other seat is as it was.
    const game = await prisma.game.findUnique({ where: { id: world.gameId }, select: { blackMemberId: true, blackName: true, whiteName: true } });
    expect(game).toEqual({ blackMemberId: null, blackName: "", whiteName: `Stays${stamp.slice(-5)}` });
    const opened = await page.goto(matchPath("freestyle", world.gameId));
    expect(opened?.status()).toBe(200);
    await expect(page.getByText(`Stays${stamp.slice(-5)}`).first()).toBeVisible();
    await expect(page.getByText(world.name)).toHaveCount(0);
  } finally {
    await member.close();
    await prisma.xpEvent.deleteMany({ where: { memberId: world.memberId } });
    await prisma.game.deleteMany({ where: { id: world.gameId } });
    await prisma.member.deleteMany({ where: { id: world.memberId } });
  }
});
