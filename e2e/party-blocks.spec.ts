import { expect, test, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * BLOCK FIVE FOR FOUR, PASSED ROUND ONE DEVICE.
 *
 * Block Five's rated game is a line game for two; its own page also offers
 * the four-player shape game at a table round one phone or tablet — a corner
 * each of a twenty-square board, twenty-one pieces each, every new piece
 * touching the player's own only corner to corner — and the Party games shelf
 * lists it.
 *
 * Driven as a table round a phone drives it: from the game's own page, by
 * pressing the way in, naming the players, then choosing a piece from the
 * tray, turning and flipping it, tapping where it goes and tapping it again to
 * lay it. The game lives in this browser only, so the case starts by clearing
 * this browser's kept game; nothing here writes to the database.
 *
 * Squares are (row, column) on the twenty-square board, from the top left.
 */

const KEY = "itsutsu.partyBlocks";

// A finger, not a mouse: a tap shows the piece where it would lie, and a second tap lays it.
test.use({ hasTouch: true });

const square = (page: Page, row: number, col: number) =>
  page.locator(`[data-testid="party-hole"][data-row="${row}"][data-col="${col}"]`);

/** Choose a piece from the tray of the player to move. */
async function hold(page: Page, piece: string) {
  await page.locator(`[data-testid="blocks-piece"][data-piece="${piece}"]`).tap();
  await expect(page.getByTestId("blocks-in-hand")).toHaveAttribute("data-piece", piece);
}

/** Tap a square to see the piece in hand there, then tap it again to lay it, and wait for it to land. */
async function lay(page: Page, at: [number, number], covers: [number, number][]) {
  const moves = Number(await page.getByTestId("party-blocks").getAttribute("data-moves"));
  await square(page, ...at).tap();
  for (const cell of covers) await expect(square(page, ...cell)).toHaveAttribute("data-ghost", "allowed");
  await square(page, ...at).tap();
  await expect(page.getByTestId("party-blocks")).toHaveAttribute("data-moves", String(moves + 1));
}

test.describe("Block Five for four, pass and play", () => {
  test("four players lay shapes from their corners by name, corner to corner and never side to side, kept through a reload and on My games", async ({ page }) => {
    await page.goto("/games/block-five");
    await page.evaluate((key) => window.localStorage.removeItem(key), KEY);

    // The way in, on the game's own page.
    await page.goto("/games/block-five");
    await ready(page, "blocks-offer");
    await expect(page.getByTestId("blocks-play")).toContainText("4 players");
    await expect(page.getByTestId("blocks-resume")).toHaveCount(0);
    await page.getByTestId("blocks-play").tap();
    await expect(page).toHaveURL(/\/games\/block-five\/pass-and-play$/);

    // Four names; the fourth left blank is called by their place at the table.
    await ready(page, "blocks-set-up");
    await expect(page.getByTestId("blocks-name")).toHaveCount(4);
    for (const [index, name] of ["Aiko", "Ben", "Chloe", ""].entries()) await page.getByTestId("blocks-name").nth(index).fill(name);
    await page.getByTestId("blocks-start").tap();
    await ready(page, "party-blocks");
    await expect(page.getByTestId("blocks-turn-name")).toHaveText("Aiko");
    await expect(page.getByTestId("blocks-piece")).toHaveCount(21);
    // Before her first piece, the one square she may start from is her own corner.
    await expect(page.locator('[data-testid="party-hole"][data-target="true"]')).toHaveCount(1);
    await expect(square(page, 0, 0)).toHaveAttribute("data-target", "true");

    // Aiko: the five-square L, turned a quarter and then flipped, over her corner.
    await hold(page, "fiveL");
    await page.getByTestId("blocks-rotate").tap();
    await expect(page.getByTestId("blocks-in-hand")).toHaveAttribute("data-turns", "1");
    await page.getByTestId("blocks-flip").tap();
    await expect(page.getByTestId("blocks-in-hand")).toHaveAttribute("data-flipped", "true");
    await lay(page, [0, 0], [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]]);
    for (const [row, col] of [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]] as const) await expect(square(page, row, col)).toHaveAttribute("data-owner", "0");
    await expect(square(page, 1, 0)).toHaveAttribute("data-owner", "");

    // The turn passes clockwise, by name, and Ben's tray is his own twenty-one.
    await expect(page.getByTestId("blocks-turn-name")).toHaveText("Ben");
    await expect(page.getByTestId("blocks-piece")).toHaveCount(21);
    // Tapped on his corner, the square slides until it covers it.
    await hold(page, "fourSquare");
    await lay(page, [0, 19], [[0, 18], [0, 19], [1, 18], [1, 19]]);
    await expect(page.getByTestId("blocks-turn-name")).toHaveText("Chloe");

    await hold(page, "fiveI");
    await page.getByTestId("blocks-rotate").tap();
    await lay(page, [19, 19], [[15, 19], [16, 19], [17, 19], [18, 19], [19, 19]]);
    await expect(page.getByTestId("blocks-turn-name")).toHaveText("Player 4");

    await hold(page, "threeBend");
    await lay(page, [19, 0], [[18, 0], [19, 0], [19, 1]]);
    await expect(page.getByTestId("blocks-turn-name")).toHaveText("Aiko");
    await expect(page.getByTestId("blocks-piece")).toHaveCount(20);

    // Aiko's second piece: along a side of her own it is refused, and says why.
    await hold(page, "one");
    await square(page, 1, 0).tap();
    await expect(square(page, 1, 0)).toHaveAttribute("data-ghost", "refused");
    await expect(page.getByTestId("blocks-hint")).toContainText("along a side");
    await square(page, 1, 0).tap();
    await expect(page.getByTestId("party-blocks")).toHaveAttribute("data-moves", "4");
    // Out in the open, touching nothing of hers, it is refused too.
    await square(page, 8, 8).tap();
    await expect(page.getByTestId("blocks-hint")).toContainText("corner to corner");
    // Corner to corner with her L, it lies.
    await lay(page, [2, 4], [[2, 4]]);
    await expect(square(page, 2, 4)).toHaveAttribute("data-owner", "0");
    await expect(page.getByTestId("blocks-turn-name")).toHaveText("Ben");
    await expect(page.locator('[data-testid="blocks-player"][data-player="0"]')).toHaveAttribute("data-squares", "6");

    // Kept in this browser: a reload brings back the same table, the same board, and the same turn.
    await page.reload();
    await ready(page, "party-blocks");
    await expect(page.getByTestId("party-blocks")).toHaveAttribute("data-moves", "5");
    await expect(page.getByTestId("blocks-turn-name")).toHaveText("Ben");
    await expect(square(page, 2, 4)).toHaveAttribute("data-owner", "0");
    await expect(square(page, 15, 19)).toHaveAttribute("data-owner", "2");

    // Leave for the game's page, and come back the way it offers.
    await page.goto("/games/block-five");
    await ready(page, "blocks-offer");
    await page.getByTestId("blocks-resume").tap();
    await ready(page, "party-blocks");
    await expect(page.getByTestId("blocks-turn-name")).toHaveText("Ben");

    // And it waits on My games' Pass and play tab too.
    await page.goto("/play/pass-and-play");
    const card = page.getByTestId("blocks-game");
    await expect(card).toContainText("Block Five");
    await expect(card).toContainText("5 pieces laid");
    await expect(card).toContainText("Ben to play");
    await card.getByTestId("blocks-game-continue").tap();
    await ready(page, "party-blocks");
    await expect(page.getByTestId("party-blocks")).toHaveAttribute("data-moves", "5");

    // On a phone the whole table — the twenty-square board and the tray of twenty-one — fits the glass, nothing to scroll sideways.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("blocks-turn")).toBeVisible();
    await expect(page.getByTestId("blocks-tray")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const tray = await page.getByTestId("blocks-tray").boundingBox();
    expect(tray === null ? Infinity : tray.x + tray.width).toBeLessThanOrEqual(390);
  });
});

test.describe("Block Five for four on the Party games shelf", () => {
  // Open to anybody: it names games and nobody who plays them.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("is listed with why it is there, says where it lives, and leads to its page where the table is offered", async ({ page }) => {
    await page.goto("/games/party");
    const card = page.getByTestId("family-game-blockFive");
    await expect(card).toHaveAttribute("data-listed", "shelf");
    await expect(card.getByTestId("family-game-why")).toContainText("Pass and play for four");
    await expect(card.getByTestId("family-game-home")).toContainText("Strange boards");

    await card.getByRole("link", { name: /Block Five/ }).first().click();
    await expect(page).toHaveURL(/\/games\/block-five$/);
    await expect(page.getByTestId("blocks-play")).toContainText("4 players");
    await expect(page.getByTestId("game-family-shelves")).toContainText("Party games");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/party");
    await expect(page.getByTestId("family-game-blockFive")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
