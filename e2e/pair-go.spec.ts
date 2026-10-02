import { expect, test, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * PAIR GO: TWO TEAMS OF TWO, ON ONE DEVICE, AND ITS PLACE ON THE PARTY SHELF.
 *
 * Driven as a table would drive it: from Go's own page, by pressing the way in,
 * writing four names, then clicking points on the board and pressing Pass. The
 * turn line must name the player whose move it is, in the order the format
 * plays — Black's first, White's first, Black's second, White's second. The
 * game lives in this browser only, so each case starts by forgetting this
 * browser's kept game; nothing here writes to the database.
 */

const KEY = "itsutsu.pairGo";

/** The turn line: the name of whoever is to move, and their colour. */
async function expectTurn(page: Page, name: string, colour: "Black" | "White") {
  await expect(page.getByTestId("pairgo-turn-name")).toHaveText(name);
  await expect(page.getByTestId("pairgo-turn-colour")).toHaveText(`(${colour})`);
}

/** Click an empty point and wait for the move to land. */
async function playAt(page: Page, point: string) {
  const moves = Number(await page.getByTestId("pairgo").getAttribute("data-moves"));
  await page.getByRole("button", { name: `${point}, empty` }).click();
  await expect(page.getByTestId("pairgo")).toHaveAttribute("data-moves", String(moves + 1));
}

async function pass(page: Page) {
  const moves = Number(await page.getByTestId("pairgo").getAttribute("data-moves"));
  await page.getByTestId("pairgo-pass").click();
  await expect(page.getByTestId("pairgo")).toHaveAttribute("data-moves", String(moves + 1));
}

/** Go's own page, this browser's kept Pair Go forgotten, then the way in pressed and the teams named. */
async function startFromGoPage(page: Page, names: { black: [string, string]; white: [string, string] }) {
  await page.goto("/games/go");
  await page.evaluate((key) => window.localStorage.removeItem(key), KEY);
  await page.goto("/games/go");
  await ready(page, "pairgo-offer");
  await expect(page.getByTestId("pairgo-play")).toHaveText("Pair Go: two teams of two on this device");
  // Nothing kept, so only the way in is offered, not a way back.
  await expect(page.getByTestId("pairgo-resume")).toHaveCount(0);
  await page.getByTestId("pairgo-play").click();
  await expect(page).toHaveURL(/\/games\/go\/pass-and-play$/);
  await ready(page, "pairgo-set-up");
  // The live board beside the names, at the nine the table starts on.
  await expect(page.getByTestId("pairgo-preview").getByTestId("board-preview")).toBeVisible();
  for (const stone of ["black", "white"] as const) {
    for (const place of [0, 1] as const) {
      await page.locator(`[data-testid="pairgo-name"][data-stone="${stone}"][data-place="${place}"]`).fill(names[stone][place]);
    }
  }
  await page.getByTestId("pairgo-start").click();
  await ready(page, "pairgo");
  await expect(page.getByTestId("pairgo")).toHaveAttribute("data-state", "playing");
  await expect(page.getByTestId("pairgo")).toHaveAttribute("data-size", "9");
}

test.describe("Pair Go, two teams of two on one device", () => {
  test("the turns go round the table by name, a pass is the passer's, and the game is kept", async ({ page }) => {
    await startFromGoPage(page, { black: ["Aiko", "Ben"], white: ["Chloe", "Dev"] });

    // The four, listed in the order they play.
    await expect(page.getByTestId("pairgo-player")).toHaveText([/Aiko\s*Black/, /Chloe\s*White/, /Ben\s*Black/, /Dev\s*White/]);

    await expectTurn(page, "Aiko", "Black");
    await playAt(page, "C3");
    await expect(page.getByRole("button", { name: "C3, Black stone" })).toBeVisible();
    await expectTurn(page, "Chloe", "White");
    await playAt(page, "G7");
    await expect(page.getByRole("button", { name: "G7, White stone" })).toBeVisible();
    await expectTurn(page, "Ben", "Black");
    await playAt(page, "C7");
    await expectTurn(page, "Dev", "White");
    await playAt(page, "G3");
    await expectTurn(page, "Aiko", "Black");

    // A pass is Aiko's turn: the order moves on to Chloe, and the line says whose pass it was.
    await pass(page);
    await expectTurn(page, "Chloe", "White");
    await expect(page.getByTestId("pairgo-passed")).toContainText("Aiko (Black) passed");
    // Chloe plays instead, so the game goes on and the next is Ben.
    await playAt(page, "E5");
    await expectTurn(page, "Ben", "Black");
    await expect(page.getByTestId("pairgo-passed")).toHaveCount(0);

    // Kept in this browser: a reload brings back the same board and the same player to move.
    await page.reload();
    await ready(page, "pairgo");
    await expect(page.getByTestId("pairgo")).toHaveAttribute("data-moves", "6");
    await expect(page.getByRole("button", { name: "E5, White stone" })).toBeVisible();
    await expectTurn(page, "Ben", "Black");

    // Go's page now offers the way back first.
    await page.goto("/games/go");
    await ready(page, "pairgo-offer");
    await expect(page.getByTestId("pairgo-resume")).toBeVisible();

    // And it waits on My games' Pass and play tab.
    await page.goto("/play/pass-and-play");
    const card = page.getByTestId("pairgo-game");
    await expect(card).toContainText("two teams of two");
    await expect(card).toContainText("6 moves");
    await expect(card).toContainText("Ben (Black) to play");
    await card.getByTestId("pairgo-game-continue").click();
    await expect(page).toHaveURL(/\/games\/go\/pass-and-play$/);
    await ready(page, "pairgo");
    await expectTurn(page, "Ben", "Black");

    // Ben passes, Dev passes: two in a row, and the board is counted.
    await pass(page);
    await expectTurn(page, "Dev", "White");
    await pass(page);
    await expect(page.getByTestId("pairgo")).toHaveAttribute("data-state", "won");
    await expect(page.getByTestId("pairgo-result")).toHaveAttribute("data-by", "territory");
    await expect(page.getByTestId("pairgo-count")).toContainText("komi");
    await expect(page.getByTestId("pairgo-turn")).toHaveCount(0);

    // Over, so nothing is left to pass or resign, and the same four can go again on the same board.
    await expect(page.getByTestId("pairgo-pass")).toHaveCount(0);
    await page.getByTestId("pairgo-again").click();
    await expect(page.getByTestId("pairgo")).toHaveAttribute("data-moves", "0");
    await expectTurn(page, "Aiko", "Black");
  });

  test("a player with no name is called by their place, and a phone has nothing to scroll sideways", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await startFromGoPage(page, { black: ["Aiko", ""], white: ["", "Dev"] });
    await expectTurn(page, "Aiko", "Black");
    await playAt(page, "E5");
    await expectTurn(page, "Player 2", "White");
    await playAt(page, "D4");
    await expectTurn(page, "Player 3", "Black");
    // The turn line sits over the board, and the two together fit one phone screen.
    const turn = await page.getByTestId("pairgo-turn").boundingBox();
    const pass = await page.getByTestId("pairgo-pass").boundingBox();
    expect(turn !== null && pass !== null && pass.y + pass.height - turn.y).toBeLessThanOrEqual(844);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test.describe("Pair Go, offered from Go's own page", () => {
  // Open to anybody: it names games and nobody who plays them.
  test.use({ storageState: { cookies: [], origins: [] } });

  // Pair Go left the Party games shelf on 2026-10-01, when Dice joined it and the shelf reached its eight.
  test("is not on the Party games shelf, and Go's page offers it; a stranger pressing it is asked for an invite", async ({ page }) => {
    await page.goto("/games/party");
    await expect(page.getByRole("heading", { name: /Party games/ })).toBeVisible();
    await expect(page.getByTestId("family-game-go")).toHaveCount(0);

    await page.goto("/games/go");
    await ready(page, "pairgo-offer");
    await page.getByTestId("pairgo-play").click();
    await expect(page).toHaveURL(/\/join/);
  });
});
