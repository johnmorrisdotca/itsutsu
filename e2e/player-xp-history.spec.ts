import { expect, test, type Browser, type BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { makeMemberId } from "../src/lib/auth/memberId";
import { PLAYER_SESSION_DAYS, SESSION_COOKIE, expiryInDays, signSession } from "../src/lib/auth/session";
import { ready } from "./support";
import { standingData } from "./xpStanding";

/**
 * HOW A PLAYER'S XP WAS EARNED, READ ON THEIR PAGE.
 *
 * John, 2026-09-14: "I am on my profile page and there is NO indication how I
 * got my XP. where is the XP history!!!!!"
 *
 * The spec brings its own world: a member who has earned things, a finished
 * game for the match-keyed awards, and a reader who is somebody else. Nothing
 * here reads a row it did not make, and everything it made goes in `finally`.
 * The tab is CLICKED, and "older" and the way back are clicked, because that is
 * how a reader arrives and a client-side navigation is where a stale page lives.
 */

// Before the client is built: Prisma reads DATABASE_URL at construction.
process.loadEnvFile(".env");

const prisma = new PrismaClient();
const STAMP = `xph${Date.now().toString(36)}`;

type World = { memberId: string; email: string; gameId: string };

/**
 * Seventeen awards over two days. Newest first they read: 3,000 from another
 * site (total 3,120), then a game's end at one timestamp — a win, a finish and a
 * first at renju (120, 100, 90) — then thirteen visits of 5 on the day before
 * (65 down to 5). Fifteen to a page, so page one ends at 15 and page two opens
 * at 10.
 */
async function seedWorld(): Promise<World> {
  const memberId = makeMemberId();
  const email = `${STAMP}-earner@example.test`;
  const gameId = `${STAMP}-game`;
  await prisma.member.create({
    data: {
      id: memberId,
      email,
      name: `Earner${STAMP.slice(-5)}`,
      picture: "",
      invitedWith: "playwright",
      ...standingData({ here: 120, imported: 3000 }),
    },
  });
  await prisma.game.create({
    data: {
      id: gameId,
      variant: "renju",
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
    },
  });
  const gameEnd = new Date("2026-09-02T09:00:00Z");
  const rows = [
    { id: `${STAMP}-e01`, type: "importedGames", points: 3000, subject: "ItsYourTurn.com@120=3000", dayKey: "2026-09-02", createdAt: new Date("2026-09-02T10:00:00Z") },
    { id: `${STAMP}-e02`, type: "gameWon", points: 20, subject: gameId, dayKey: "2026-09-02", createdAt: gameEnd },
    { id: `${STAMP}-e03`, type: "gameFinished", points: 10, subject: gameId, dayKey: "2026-09-02", createdAt: gameEnd },
    { id: `${STAMP}-e04`, type: "firstOfVariant", points: 25, subject: "renju", dayKey: "2026-09-02", createdAt: gameEnd },
    ...Array.from({ length: 13 }, (_, i) => ({
      id: `${STAMP}-v${String(i).padStart(2, "0")}`,
      type: "dailyVisit",
      points: 5,
      subject: `${STAMP}-${i}`,
      dayKey: "2026-09-01",
      createdAt: new Date(Date.UTC(2026, 8, 1, 0, i)),
    })),
  ];
  await prisma.xpEvent.createMany({ data: rows.map((row) => ({ ...row, memberId })) });
  return { memberId, email, gameId };
}

async function clearWorld(world: World): Promise<void> {
  // XpEvent carries no relation to Member, so nothing cascades: the ledger first.
  await prisma.xpEvent.deleteMany({ where: { memberId: world.memberId } });
  await prisma.game.deleteMany({ where: { id: world.gameId } });
  await prisma.member.deleteMany({ where: { email: world.email } });
}

/**
 * A browser holding an invite and no account — somebody else, signed in, who
 * may read any player's page.
 *
 * Not a member, and on purpose: the history reads the same for every signed-in
 * reader, and a reader with an address also brings their buddies and ignores
 * into the page's world, which this spec is not about. The storage state is
 * empty and said so, so the project's operator session is not underneath it.
 */
async function inviteReader(browser: Browser, baseURL: string): Promise<BrowserContext> {
  const token = await signSession({ kind: "player", code: "playwright", exp: expiryInDays(PLAYER_SESSION_DAYS) });
  if (token === null) throw new Error("No AUTH_SECRET: cannot sign a test session.");
  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  await context.addCookies([{ name: SESSION_COOKIE, value: token, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
  return context;
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("a signed-in reader finds how a player's XP was earned, day by day, on their page", async ({ browser, baseURL }) => {
  const world = await seedWorld();
  const reader = await inviteReader(browser, baseURL ?? "");
  try {
    const page = await reader.newPage();
    await page.goto(`/players/${world.memberId}`);
    await ready(page, "tabs");
    // The way to it sits under the standing it explains.
    await expect(page.getByTestId("xp-history-link")).toBeVisible();

    await page.locator('[data-testid="tab"][data-tab="xp"]').click();
    const history = page.getByTestId("xp-history");
    await expect(history).toBeVisible();

    // Two days, newest first, each with its whole total.
    const days = history.getByTestId("xp-history-day");
    await expect(days).toHaveCount(2);
    await expect(days.nth(0).getByTestId("xp-history-day-key")).toHaveText("2026-09-02");
    await expect(days.nth(0).getByTestId("xp-history-day-total")).toHaveText("+3,055");
    await expect(days.nth(1).getByTestId("xp-history-day-key")).toHaveText("2026-09-01");
    await expect(days.nth(1).getByTestId("xp-history-day-total")).toHaveText("+65");

    // Fifteen awards, each with its points and the total it left.
    const awards = history.getByTestId("xp-history-award");
    await expect(awards).toHaveCount(15);
    await expect(awards.nth(0).getByTestId("xp-history-running")).toHaveText("3,120");
    await expect(awards.nth(1).getByTestId("xp-history-points")).toHaveText("+20");
    await expect(awards.nth(1).getByTestId("xp-history-running")).toHaveText("120");
    await expect(awards.nth(14).getByTestId("xp-history-running")).toHaveText("15");
    await expect(awards.nth(1)).toContainText("Game won");

    // Credit from another site says so, names the site, and links nowhere.
    const imported = awards.nth(0);
    await expect(imported.getByTestId("xp-history-elsewhere")).toBeVisible();
    await expect(imported).toContainText("ItsYourTurn.com");
    await expect(imported.locator("a")).toHaveCount(0);
    // An award earned here carries no such mark — asked after the row above was seen.
    await expect(awards.nth(1).getByTestId("xp-history-elsewhere")).toHaveCount(0);

    // The game's name leads to the game, and the match to the match.
    const linkTo = (href: string) => history.locator(`a[href="${href}"]:visible`).first();
    await expect(linkTo("/games/renju")).toBeVisible();
    await expect(linkTo(`/games/renju/match/${world.gameId}`)).toBeVisible();

    // Older awards, by a link — and the page it opens is the one that starts at 10.
    await history.getByTestId("xp-history-older").click();
    await expect(awards.first().getByTestId("xp-history-running")).toHaveText("10");
    await expect(awards).toHaveCount(2);
    await expect(days).toHaveCount(1);
    await expect(days.first().getByTestId("xp-history-day-total")).toHaveText("+65");
    await expect(history.getByTestId("xp-history-older")).toHaveCount(0);

    // And the way back.
    await history.getByTestId("xp-history-newest").click();
    await expect(awards.first().getByTestId("xp-history-running")).toHaveText("3,120");
    await expect(awards).toHaveCount(15);
  } finally {
    await reader.close();
    await clearWorld(world);
  }
});

test("a signed-out reader is sent to the door and shown none of it", async ({ playwright, baseURL }) => {
  /*
   * The history is visible exactly where the record is: `/players/*` is shut to
   * a stranger by the gate (gate.spec.ts), so no player's awards, names or
   * games reach a reader with no session by this address either.
   */
  const world = await seedWorld();
  const stranger = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  try {
    const response = await stranger.get(`/players/${world.memberId}?view=xp`, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers()["location"] ?? "").toContain("/join");
    expect(await response.text()).not.toContain("xp-history");
  } finally {
    await stranger.dispose();
    await clearWorld(world);
  }
});
