import { expect, test, type BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext, memberIdFor, removeMember } from "./members";
import { aComputerOpponent, chooseOpponent, openSetUpPage, ready, readyHere, startAndBegin } from "./support";
import { gamesMade } from "./tidy";

/**
 * A MATCH: several games at once against the same player, the colours
 * alternating, so the advantage of moving first cancels over it — GoldToken's
 * and ItsYourTurn's Two-, Four- and Six-game options.
 *
 * Made by pressing, on the set-up screen, and read off the pages a player
 * lands on: the panel beside each game names its place in the match and which
 * colour the reader holds, which is the fact the match exists to guarantee.
 * The offer half answers one game by clicking, as a person would, and reads
 * the other game's row to prove the match was answered whole.
 */
const tidyAway = gamesMade();

const RUN = `pair${Date.now().toString(36)}`;
const ASKER = { email: `${RUN}-asker@example.test`, name: `Asker ${RUN}` };
const ASKED = { email: `${RUN}-asked@example.test`, name: `Asked ${RUN}` };

let asker: BrowserContext;
let asked: BrowserContext;
let askedId = "";
const made: string[] = [];

function db(): PrismaClient {
  process.loadEnvFile(".env");
  return new PrismaClient();
}

test.beforeAll(async ({ browser, baseURL }) => {
  asker = await memberContext(browser, baseURL!, ASKER);
  asked = await memberContext(browser, baseURL!, ASKED);
  askedId = await memberIdFor(ASKED.email);
});

test.afterAll(async () => {
  await asker?.close();
  await asked?.close();
  const prisma = db();
  try {
    if (made.length > 0) {
      await prisma.move.deleteMany({ where: { gameId: { in: made } } });
      await prisma.game.deleteMany({ where: { id: { in: made } } });
    }
    await prisma.player.deleteMany({ where: { name: { in: [ASKER.name, ASKED.name] } } });
  } finally {
    await prisma.$disconnect();
  }
  await removeMember(ASKER.email);
  await removeMember(ASKED.email);
});

/** Offers a two-game match to the asked member, and returns both games' ids in order. */
async function offerAMatch(): Promise<string[]> {
  const page = await asker.newPage();
  const response = await page.request.post("/api/games/live", {
    data: { variant: "freestyle", size: 9, winLength: 5, challengeId: askedId, moveTimeMs: null, games: 2 },
  });
  expect(response.status(), await response.text()).toBe(201);
  const { id } = (await response.json()) as { id: string };
  await page.close();
  const prisma = db();
  try {
    const games = await prisma.game.findMany({ where: { matchId: id }, orderBy: { matchIndex: "asc" } });
    made.push(...games.map((game) => game.id));
    return games.map((game) => game.id);
  } finally {
    await prisma.$disconnect();
  }
}

test.describe("a match against the computer", () => {
  test("is chosen on the set-up screen, and makes two games with the colours swapped", async ({ page }) => {
    await openSetUpPage(page, "gomoku");
    const computer = await aComputerOpponent(page, 0);
    await chooseOpponent(page, computer);
    await ready(page, "set-up-game");

    await expect(page.getByTestId("set-up-games-1")).toHaveAttribute("aria-checked", "true");
    await page.getByTestId("set-up-games-2").click();
    await expect(page.getByTestId("set-up-seating")).toContainText("A match of 2 games");
    // Kept in the address, so a reload keeps the choice.
    await expect(page).toHaveURL(/games=2/);

    await startAndBegin(page);
    await page.waitForURL(/\/games\/gomoku\/match\//, { timeout: 30_000 });
    const first = /match\/([^/?#]+)/.exec(page.url())?.[1] ?? "";
    tidyAway(first);

    const panel = page.getByTestId("match-panel");
    await expect(panel).toBeVisible();
    const games = panel.getByTestId("match-game");
    await expect(games).toHaveCount(2);
    // You were black in the first, so white in the second.
    await expect(games.nth(0)).toHaveAttribute("data-mine", "black");
    await expect(games.nth(1)).toHaveAttribute("data-mine", "white");

    // The other game is one press away, and its own page says which it is.
    await games.nth(1).getByRole("link").click();
    await page.waitForURL((url) => !url.pathname.includes(first), { timeout: 30_000 });
    const second = /match\/([^/?#]+)/.exec(page.url())?.[1] ?? "";
    tidyAway(second);
    await expect(page.getByTestId("match-panel").getByTestId("match-game").nth(1)).toContainText("this game");
  });

  test("is not offered for a seat posted for anyone", async ({ page }) => {
    await openSetUpPage(page, "gomoku");
    await ready(page, "set-up-game");
    // The bar it would sit in has answered, so the absence below is about a rendered page.
    await expect(page.getByTestId("set-up-seating")).toBeVisible();
    await expect(page.getByTestId("set-up-games")).toHaveCount(0);
  });
});

test.describe("a match offered to a person", () => {
  test("is taken whole when one of its games is accepted", async () => {
    const [first, second] = await offerAMatch();

    const page = await asked.newPage();
    await page.goto("/play");
    const offered = page.getByTestId("my-games-offered");
    await expect(offered).toBeVisible();
    const row = offered.locator(`[data-id="${first}"]`);
    await readyHere(row.getByTestId("offer-buttons"));
    await row.getByTestId("offer-accept").click();
    await expect(row).toHaveCount(0);

    const prisma = db();
    try {
      const games = await prisma.game.findMany({ where: { id: { in: [first, second] } }, orderBy: { matchIndex: "asc" } });
      // Both bound to them, both offers cleared — and on opposite colours.
      expect(games.map((game) => game.offeredToMemberId)).toEqual([null, null]);
      expect(games[0].whiteMemberId).toBe(askedId);
      expect(games[1].blackMemberId).toBe(askedId);
    } finally {
      await prisma.$disconnect();
    }
    // The second game's row went with the first, without being pressed.
    await expect(offered.locator(`[data-id="${second}"]`)).toHaveCount(0);
    await page.close();
  });

  test("is declined whole when one of its games is declined", async () => {
    const [first, second] = await offerAMatch();

    const page = await asked.newPage();
    await page.goto("/play");
    const offered = page.getByTestId("my-games-offered");
    await expect(offered).toBeVisible();
    const row = offered.locator(`[data-id="${first}"]`);
    await readyHere(row.getByTestId("offer-buttons"));
    await row.getByTestId("offer-decline").click();
    await expect(row).toHaveCount(0);

    const prisma = db();
    try {
      const games = await prisma.game.findMany({ where: { id: { in: [first, second] } } });
      expect(games.every((game) => game.declinedAt !== null && game.status === "finished")).toBe(true);
    } finally {
      await prisma.$disconnect();
    }
    await page.close();
  });
});
