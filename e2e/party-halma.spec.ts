import { expect, test, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * HALMA FOR FOUR, PASSED ROUND ONE DEVICE.
 *
 * Halma was made for two or four. The rated game here is for two; the game's
 * own page offers the four-player game at a table round one phone or tablet,
 * the way Chinese Checkers' is (`party-checkers.spec.ts`), and the Party games
 * shelf lists it.
 *
 * Driven as a table would drive it: from the game's own page, by pressing the
 * way in, naming the players, then tapping a piece and where it goes. The game
 * lives in this browser only, so each case starts by clearing this browser's
 * kept games; nothing here writes to the database.
 *
 * Squares are (row, column) on the sixteen-square board, from the top left.
 * The top-left camp for four is rows of 4, 4, 3 and 2: (0,0)–(0,3),
 * (1,0)–(1,3), (2,0)–(2,2), (3,0)–(3,1). Its first player steps (3,0) out to
 * (4,1); then (2,2) can jump her own piece at (3,1) into (4,0) and go on over
 * the one at (4,1) into (4,2) — a chain, ending where no single move reaches.
 */

const KEYS = ["itsutsu.partyHalma", "itsutsu.partyCheckers"];

const square = (page: Page, row: number, col: number) =>
  page.locator(`[data-testid="party-hole"][data-row="${row}"][data-col="${col}"]`);

/** Tap a piece, then the square it goes to, and wait for the move to land. */
async function play(page: Page, table: string, from: [number, number], to: [number, number]) {
  const moves = Number(await page.getByTestId(table).getAttribute("data-moves"));
  await square(page, ...from).click();
  await expect(square(page, ...from)).toHaveAttribute("data-picked", "true");
  await expect(square(page, ...to)).toHaveAttribute("data-target", "true");
  await square(page, ...to).click();
  await expect(page.getByTestId(table)).toHaveAttribute("data-moves", String(moves + 1));
}

/** This browser's kept tables forgotten, from a page of the site. */
async function forgetTables(page: Page) {
  await page.goto("/games/halma");
  await page.evaluate((keys) => keys.forEach((key) => window.localStorage.removeItem(key)), KEYS);
}

/** The game's own page, then the way in pressed, then the players named and seated. */
async function seatHalma(page: Page, names: string[]) {
  await page.goto("/games/halma");
  await ready(page, "party-offer");
  await expect(page.getByTestId("party-play")).toContainText("2 or 4 players");
  await expect(page.getByTestId("party-resume")).toHaveCount(0);
  await page.getByTestId("party-play").click();
  await expect(page).toHaveURL(/\/games\/halma\/pass-and-play$/);
  await ready(page, "party-set-up");
  await page.locator(`[data-testid="party-count"][data-count="${names.length}"]`).click();
  await expect(page.getByTestId("party-name")).toHaveCount(names.length);
  for (const [index, name] of names.entries()) await page.getByTestId("party-name").nth(index).fill(name);
  await page.getByTestId("party-start").click();
  await ready(page, "party-halma");
  await expect(page.getByTestId("party-halma")).toHaveAttribute("data-players", String(names.length));
}

test.describe("Halma, pass and play", () => {
  test("four players take turns by name round the corners, a step and a jump chain, kept through a reload and on My games", async ({ page }) => {
    await forgetTables(page);
    // The fourth leaves their name blank and is called by their place at the table.
    await seatHalma(page, ["Aiko", "Ben", "Chloe", ""]);

    // Thirteen pieces each, one camp in each corner, and the first player to move.
    for (let player = 0; player < 4; player += 1) {
      await expect(page.locator(`[data-testid="party-hole"][data-owner="${player}"]`)).toHaveCount(13);
    }
    await expect(square(page, 0, 0)).toHaveAttribute("data-owner", "0");
    await expect(square(page, 0, 15)).toHaveAttribute("data-owner", "1");
    await expect(square(page, 15, 15)).toHaveAttribute("data-owner", "2");
    await expect(square(page, 15, 0)).toHaveAttribute("data-owner", "3");
    await expect(page.getByTestId("party-turn-name")).toHaveText("Aiko");

    // A diagonal step out of the camp, and the turn passes clockwise round the board.
    await play(page, "party-halma", [3, 0], [4, 1]);
    await expect(square(page, 4, 1)).toHaveAttribute("data-owner", "0");
    await expect(square(page, 3, 0)).toHaveAttribute("data-owner", "");
    await expect(page.getByTestId("party-turn-name")).toHaveText("Ben");
    // Ben can no more move Aiko's pieces than she can move his.
    await expect(square(page, 4, 1)).toBeDisabled();
    await play(page, "party-halma", [3, 14], [4, 13]);
    await expect(page.getByTestId("party-turn-name")).toHaveText("Chloe");
    await play(page, "party-halma", [12, 14], [11, 13]);
    await expect(page.getByTestId("party-turn-name")).toHaveText("Player 4");
    await play(page, "party-halma", [12, 1], [11, 2]);
    await expect(page.getByTestId("party-turn-name")).toHaveText("Aiko");

    // A chain of two jumps in one move: over (3,1) into (4,0), then over (4,1) into (4,2).
    await square(page, 2, 2).click();
    await expect(square(page, 4, 0)).toHaveAttribute("data-target", "true");
    await expect(square(page, 4, 2)).toHaveAttribute("data-target", "true");
    await square(page, 4, 2).click();
    await expect(page.getByTestId("party-halma")).toHaveAttribute("data-moves", "5");
    await expect(square(page, 4, 2)).toHaveAttribute("data-owner", "0");
    await expect(square(page, 2, 2)).toHaveAttribute("data-owner", "");
    // Nothing is taken: both pieces jumped are where they were.
    await expect(square(page, 3, 1)).toHaveAttribute("data-owner", "0");
    await expect(square(page, 4, 1)).toHaveAttribute("data-owner", "0");
    await expect(page.getByTestId("party-turn-name")).toHaveText("Ben");

    // Kept in this browser: a reload brings back the same table, the same board, and the same turn.
    await page.reload();
    await ready(page, "party-halma");
    await expect(page.getByTestId("party-halma")).toHaveAttribute("data-moves", "5");
    await expect(page.getByTestId("party-turn-name")).toHaveText("Ben");
    await expect(square(page, 4, 2)).toHaveAttribute("data-owner", "0");

    // Leave for the game's page, and come back the way it offers.
    await page.goto("/games/halma");
    await ready(page, "party-offer");
    await page.getByTestId("party-resume").click();
    await ready(page, "party-halma");
    await expect(page.getByTestId("party-turn-name")).toHaveText("Ben");

    // And it waits on My games' Pass and play tab too.
    await page.goto("/play/pass-and-play");
    const card = page.locator('[data-testid="party-game"][data-variant="halma"]');
    await expect(card).toContainText("4 players");
    await expect(card).toContainText("5 moves");
    await expect(card).toContainText("Ben to play");
    await card.getByTestId("party-game-continue").click();
    await ready(page, "party-halma");
    await expect(page.getByTestId("party-halma")).toHaveAttribute("data-moves", "5");

    // On a phone the whole table fits the width of the glass, with nothing to scroll sideways.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("party-turn")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("a Halma table and a Chinese Checkers table are kept side by side, each waiting on My games", async ({ page }) => {
    await forgetTables(page);
    // Chinese Checkers for two first: one step from the top point into the middle.
    await page.goto("/games/chinese-checkers");
    await ready(page, "party-offer");
    await page.getByTestId("party-play").click();
    await ready(page, "party-set-up");
    await page.locator('[data-testid="party-count"][data-count="2"]').click();
    await page.getByTestId("party-start").click();
    await ready(page, "party-checkers");
    await play(page, "party-checkers", [3, 9], [4, 9]);

    // Then Halma for two: its own camps of nineteen, and starting it forgets nothing.
    await seatHalma(page, ["Aiko", "Ben"]);
    await expect(page.locator('[data-testid="party-hole"][data-owner="0"]')).toHaveCount(19);
    await expect(page.locator('[data-testid="party-hole"][data-owner="1"]')).toHaveCount(19);
    await play(page, "party-halma", [4, 1], [5, 2]);

    await page.goto("/play/pass-and-play");
    await expect(page.locator('[data-testid="party-game"][data-variant="halma"]')).toContainText("Ben to play");
    await expect(page.locator('[data-testid="party-game"][data-variant="chineseCheckers"]')).toContainText("Player 2 to play");
  });
});

test.describe("Halma on the Party games shelf", () => {
  // Open to anybody: it names games and nobody who plays them.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("is listed with why it is there, says where it lives, and leads to its page where the table is offered", async ({ page }) => {
    await page.goto("/games/party");
    const card = page.getByTestId("family-game-halma");
    await expect(card).toHaveAttribute("data-listed", "shelf");
    await expect(card.getByTestId("family-game-why")).toContainText("Pass and play for four");
    await expect(card.getByTestId("family-game-home")).toContainText("Territory and races");

    await card.getByRole("link", { name: /Halma/ }).first().click();
    await expect(page).toHaveURL(/\/games\/halma$/);
    await expect(page.getByTestId("party-play")).toContainText("2 or 4 players");
    await expect(page.getByTestId("game-family-shelves")).toContainText("Party games");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/party");
    await expect(page.getByTestId("family-game-halma")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
