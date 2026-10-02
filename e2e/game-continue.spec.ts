import { expect, test, type Browser } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";
import { RULE_VARIANTS } from "../src/lib/gomoku/gomoku.constants";
import { matchPath, setUpPath } from "../src/lib/gomoku/slugs";
import { memberContext } from "./members";
import { gamesMade } from "./tidy";

/**
 * A GAME'S FRONT DOOR OFFERS CONTINUE WHERE THE MEMBER HAS A GAME GOING
 * (`docs/plans/game-controls/README.md`): Continue → to the one moved in most
 * recently, a quiet line naming how many others wait in My games, and New game
 * beneath it, a plain link to the set-up screen that leaves the game going
 * where it is. A stranger, and a member with nothing going at this game, see
 * Play exactly as before.
 *
 * Each case brings its own member and its own games, written straight to the
 * table (local database only): the suite's operator always has games going, so
 * it could never stand for "a member with none".
 */
const GAME = RULE_VARIANTS.freestyle;
const DOOR = "/games/gomoku";
const mine = gamesMade();

type Going = { id: string; moved: Date; status?: "active" | "finished"; variant?: string };

async function memberWith(browser: Browser, baseURL: string, tag: string, games: readonly Going[]) {
  process.loadEnvFile(".env");
  expect(isLocalDatabase(process.env.DATABASE_URL), "this spec writes games directly; local database only").toBe(true);
  const stamp = `${Date.now().toString(36)}${tag}`;
  const member = { email: `continue-${stamp}@example.test`, name: `Continue ${stamp}` };
  const context = await memberContext(browser, baseURL, member);
  const prisma = new PrismaClient();
  try {
    const row = await prisma.member.findUniqueOrThrow({ where: { email: member.email }, select: { id: true, name: true } });
    await prisma.game.createMany({
      data: games.map((game) => ({
        id: mine(game.id),
        status: game.status ?? ("active" as const),
        result: "abandoned" as const,
        moveCount: 0,
        rated: false,
        size: 9,
        winLength: 5,
        variant: game.variant ?? GAME,
        obstacles: "none",
        opener: "black",
        blackName: row.name,
        blackMemberId: row.id,
        whiteName: "",
        playedAt: game.moved,
        lastMoveAt: game.moved,
      })),
    });
  } finally {
    await prisma.$disconnect();
  }
  return context;
}

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);

test.describe("a game's front door, with a game going", () => {
  test("a stranger and a member with none see Play", async ({ browser, baseURL }) => {
    // No stored sign-in: a context made by the browser inherits the operator's, so it is emptied outright.
    const stranger = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    const visitor = await stranger.newPage();
    await visitor.goto(DOOR);
    await expect(visitor.getByTestId("game-set-up")).toHaveText("Play →");
    await expect(visitor.getByTestId("game-set-up")).toHaveAttribute("href", setUpPath(GAME));
    await expect(visitor.getByTestId("game-offer")).toHaveCount(0);
    await stranger.close();

    // A member whose only game is another game's, or is over, has nothing going here.
    const stamp = Date.now().toString(36);
    const context = await memberWith(browser, baseURL!, "none", [
      { id: `${stamp.slice(-6)}-elsewhere`, moved: ago(5), variant: RULE_VARIANTS.reversi },
      { id: `${stamp.slice(-6)}-over`, moved: ago(6), status: "finished" },
    ]);
    const page = await context.newPage();
    // goto resolves at the load event, after the whole streamed page: Continue, where there were one, has replaced Play by now.
    await page.goto(DOOR);
    await expect(page.getByTestId("game-front-door")).toBeVisible();
    await expect(page.getByTestId("game-set-up")).toHaveText("Play →");
    await expect(page.getByTestId("game-set-up")).toHaveAttribute("href", setUpPath(GAME));
    await expect(page.getByTestId("game-offer")).toHaveCount(0);
    await context.close();
  });

  test("one game going: Continue to it, New game beneath, and no line about others", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36).slice(-6);
    const context = await memberWith(browser, baseURL!, "one", [{ id: `${stamp}-only`, moved: ago(3) }]);
    const page = await context.newPage();
    await page.goto(DOOR);
    const resume = page.getByTestId("game-resume");
    await expect(resume).toHaveText("Continue →");
    await expect(resume).toHaveAttribute("href", matchPath(GAME, `${stamp}-only`));
    await expect(page.getByTestId("game-set-up")).toHaveCount(0);
    const fresh = page.getByTestId("game-new");
    await expect(fresh).toHaveText("New game");
    await expect(fresh).toHaveAttribute("href", setUpPath(GAME));
    await expect(page.getByTestId("game-new-note")).toContainText("leaves the one in progress where it is");
    await expect(page.getByTestId("game-others")).toHaveCount(0);

    // Driven as a person drives it: New game goes to the set-up screen, and the game going is still there.
    await fresh.click();
    await expect(page).toHaveURL(new RegExp(`${setUpPath(GAME)}$`));
    await page.goto(DOOR);
    await expect(page.getByTestId("game-resume")).toHaveAttribute("href", matchPath(GAME, `${stamp}-only`));
    await context.close();
  });

  test("several going: Continue to the one moved in last, and the others are counted", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36).slice(-6);
    const context = await memberWith(browser, baseURL!, "many", [
      { id: `${stamp}-older`, moved: ago(90) },
      { id: `${stamp}-latest`, moved: ago(2) },
      { id: `${stamp}-middle`, moved: ago(30) },
    ]);
    const page = await context.newPage();
    await page.goto(DOOR);
    await expect(page.getByTestId("game-resume")).toHaveAttribute("href", matchPath(GAME, `${stamp}-latest`));
    const others = page.getByTestId("game-others");
    await expect(others).toContainText("2 other");
    await expect(others).toHaveAttribute("data-count", "2");
    await expect(others.getByRole("link")).toHaveAttribute("href", "/play");
    await context.close();
  });
});
