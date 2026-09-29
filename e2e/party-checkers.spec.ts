import { expect, test, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * CHINESE CHECKERS FOR A TABLE, PASSED ROUND ONE DEVICE, AND THE PARTY SHELF.
 *
 * John, 2026-09-28: "the Chinese checkers is a game for six people I believe
 * and we should also allow people to play that in a pass and play sort of
 * way", and "That's probably a new category, party games".
 *
 * Driven as a table would drive it: from the game's own page, by pressing the
 * way in, choosing how many are playing, then tapping a piece and where it
 * goes. The game lives in this browser only, so each case starts by clearing
 * this browser's kept game; nothing here writes to the database.
 *
 * The holes named below are the star's own (row, column in its 17×17 array):
 * the top point's front row is (3,9)–(3,12), and (4,9) is the centre hexagon
 * straight in front of (3,9). A piece at (3,10) can then jump the one at (4,9)
 * into (5,8), the empty hole beyond it.
 */

const hole = (page: Page, row: number, col: number) =>
  page.locator(`[data-testid="party-hole"][data-row="${row}"][data-col="${col}"]`);

/** Tap a piece, then the hole it goes to, and wait for the move to land. */
async function play(page: Page, from: [number, number], to: [number, number]) {
  const moves = Number(await page.getByTestId("party-checkers").getAttribute("data-moves"));
  await hole(page, ...from).click();
  await expect(hole(page, ...from)).toHaveAttribute("data-picked", "true");
  await expect(hole(page, ...to)).toHaveAttribute("data-target", "true");
  await hole(page, ...to).click();
  await expect(page.getByTestId("party-checkers")).toHaveAttribute("data-moves", String(moves + 1));
}

/** The game's own page, this browser's kept game forgotten, then the way in pressed. */
async function openTable(page: Page) {
  await page.goto("/games/chinese-checkers");
  await page.evaluate(() => window.localStorage.removeItem("itsutsu.partyCheckers"));
  await page.goto("/games/chinese-checkers");
  await ready(page, "party-offer");
  // Nothing kept, so only the way in is offered, not a way back.
  await expect(page.getByTestId("party-play")).toBeVisible();
  await expect(page.getByTestId("party-resume")).toHaveCount(0);
  await page.getByTestId("party-play").click();
  await expect(page).toHaveURL(/\/games\/chinese-checkers\/pass-and-play$/);
  await ready(page, "party-set-up");
}

/** Choose how many, name them, and start. */
async function seat(page: Page, names: string[]) {
  await page.locator(`[data-testid="party-count"][data-count="${names.length}"]`).click();
  await expect(page.getByTestId("party-name")).toHaveCount(names.length);
  for (const [index, name] of names.entries()) await page.getByTestId("party-name").nth(index).fill(name);
  await page.getByTestId("party-start").click();
  await ready(page, "party-checkers");
  await expect(page.getByTestId("party-checkers")).toHaveAttribute("data-players", String(names.length));
}

test.describe("Chinese Checkers, pass and play", () => {
  test("three players take turns by name, a step and a jump, and the game is there after a reload", async ({ page }) => {
    await openTable(page);
    // The third leaves their name blank and is called by their place at the table.
    await seat(page, ["Aiko", "Ben", ""]);

    // Three pieces a player, ten each, and the first player to move.
    await expect(page.locator('[data-testid="party-hole"][data-owner="0"]')).toHaveCount(10);
    await expect(page.locator('[data-testid="party-hole"][data-owner="2"]')).toHaveCount(10);
    await expect(page.getByTestId("party-turn-name")).toHaveText("Aiko");

    // A step into the centre, and the turn passes to the next player round the star.
    await play(page, [3, 9], [4, 9]);
    await expect(hole(page, 4, 9)).toHaveAttribute("data-owner", "0");
    await expect(hole(page, 3, 9)).toHaveAttribute("data-owner", "");
    await expect(page.getByTestId("party-turn-name")).toHaveText("Ben");

    // Ben can no more move Aiko's pieces than she can move his.
    await expect(hole(page, 3, 10)).toBeDisabled();
    await play(page, [10, 11], [9, 11]);
    await expect(page.getByTestId("party-turn-name")).toHaveText("Player 3");
    await play(page, [10, 3], [10, 4]);
    await expect(page.getByTestId("party-turn-name")).toHaveText("Aiko");

    // A jump: over her own piece at (4,9) into the hole beyond, leaving the piece jumped where it was.
    await play(page, [3, 10], [5, 8]);
    await expect(hole(page, 5, 8)).toHaveAttribute("data-owner", "0");
    await expect(hole(page, 4, 9)).toHaveAttribute("data-owner", "0");
    await expect(hole(page, 3, 10)).toHaveAttribute("data-owner", "");
    await expect(page.getByTestId("party-turn-name")).toHaveText("Ben");

    // Kept in this browser: a reload brings back the same table, the same board, and the same turn.
    await page.reload();
    await ready(page, "party-checkers");
    await expect(page.getByTestId("party-checkers")).toHaveAttribute("data-moves", "4");
    await expect(page.getByTestId("party-turn-name")).toHaveText("Ben");
    await expect(hole(page, 5, 8)).toHaveAttribute("data-owner", "0");
  });

  test("six players go round the star, a jump chains, and leaving and coming back finds the game", async ({ page }) => {
    await openTable(page);
    await seat(page, ["Aiko", "Ben", "Chloe", "Dev", "Emi", "Finn"]);
    for (let player = 0; player < 6; player += 1) {
      await expect(page.locator(`[data-testid="party-hole"][data-owner="${player}"]`)).toHaveCount(10);
    }

    // One step each, clockwise round the star from the top.
    const steps: [[number, number], [number, number], string][] = [
      [[3, 9], [4, 9], "Ben"],
      [[5, 13], [5, 12], "Chloe"],
      [[10, 11], [9, 11], "Dev"],
      [[13, 5], [12, 5], "Emi"],
      [[10, 3], [10, 4], "Finn"],
      [[5, 6], [5, 7], "Aiko"],
    ];
    for (const [from, to, next] of steps) {
      await play(page, from, to);
      await expect(page.getByTestId("party-turn-name")).toHaveText(next);
    }

    // A chain of two jumps in one move: over her own piece to (5,8), then over Finn's to (5,6).
    await hole(page, 3, 10).click();
    // Both landings are offered: the first jump's, and the end of the chain.
    await expect(hole(page, 5, 8)).toHaveAttribute("data-target", "true");
    await expect(hole(page, 5, 6)).toHaveAttribute("data-target", "true");
    await hole(page, 5, 6).click();
    await expect(page.getByTestId("party-checkers")).toHaveAttribute("data-moves", "7");
    await expect(hole(page, 5, 6)).toHaveAttribute("data-owner", "0");
    // Nothing is taken: both pieces jumped are where they were.
    await expect(hole(page, 4, 9)).toHaveAttribute("data-owner", "0");
    await expect(hole(page, 5, 7)).toHaveAttribute("data-owner", "5");
    await expect(page.getByTestId("party-turn-name")).toHaveText("Ben");

    // Leave for the game's page, and come back the way it offers.
    await page.goto("/games/chinese-checkers");
    await ready(page, "party-offer");
    await page.getByTestId("party-resume").click();
    await ready(page, "party-checkers");
    await expect(page.getByTestId("party-checkers")).toHaveAttribute("data-moves", "7");
    await expect(page.getByTestId("party-turn-name")).toHaveText("Ben");

    // And it waits on My games' Pass and play tab too.
    await page.goto("/play/pass-and-play");
    await expect(page.getByTestId("party-game")).toContainText("6 players");
    await expect(page.getByTestId("party-game")).toContainText("Ben to play");
    await page.getByTestId("party-game-continue").click();
    await ready(page, "party-checkers");

    // On a phone the whole table fits the width of the glass, with nothing to scroll sideways.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("party-turn")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test.describe("the Party games shelf", () => {
  // Open to anybody: it names games and nobody who plays them.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("lists Chinese Checkers with why it is there, and says where it lives", async ({ page }) => {
    await page.goto("/games/party");
    await expect(page.getByRole("heading", { name: /Party games/ })).toBeVisible();
    const card = page.getByTestId("family-game-chineseCheckers");
    await expect(card).toHaveAttribute("data-listed", "shelf");
    await expect(card.getByTestId("family-game-why")).toContainText("Pass and play for up to six");
    await expect(card.getByTestId("family-game-home")).toContainText("Territory and races");
    await expect(page.getByTestId("family-guest-count")).toContainText("1 game from other families");

    // The name leads to the game's own page, where the table is offered.
    await card.getByRole("link", { name: /Chinese Checkers/ }).first().click();
    await expect(page).toHaveURL(/\/games\/chinese-checkers$/);
    await expect(page.getByTestId("party-play")).toBeVisible();
    await expect(page.getByTestId("game-family-shelves")).toContainText("Party games");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/party");
    await expect(page.getByTestId("family-games")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
