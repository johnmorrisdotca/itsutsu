import { expect, test, type Page } from "@playwright/test";

import { openSetUpPage } from "./support";

/**
 * THE SET-UP SCREEN DOES NOT MOVE WHEN SOMETHING ON IT IS CHOSEN.
 *
 * John, 2026-09-24, on /games/new: "We cannot have the heights change in Mobile
 * or Desktop. Note how the games in the family shift up and down based on the
 * content above and the Boards." Measured that day, a phone gave the chooser
 * twenty-one different heights across its families, games and boards, and a
 * desk seven — a family of four games, a game with one board, a caption that
 * wrapped and a puzzle's paragraph under its sizes each moved everything below.
 *
 * So this presses every family, and in each the first game and the last, and on
 * each game its first board and its last, at a phone's width, a tablet's and a
 * desk's — and asks two things after every press: the chooser ends where it
 * ended before, and every tile on the screen (family, game, board size) is the
 * one box. It does not ask for a height in pixels: a number here would be a
 * copy of the stylesheet, and what John asked for is that it does not CHANGE.
 */

/** Where the chooser ends, and the sizes of every tile on it. */
async function reading(page: Page) {
  return page.evaluate(() => {
    const chooser = document.querySelector('[data-testid="shared-rules-variant"]')!.getBoundingClientRect();
    // From the top of the set-up panel, so a notice above the panel (a day's XP, the masthead) is not read as this screen moving.
    const panel = document.querySelector('[data-testid="set-up-game"]')!.getBoundingClientRect();
    const box = (selector: string) =>
      [...new Set([...document.querySelectorAll(selector)].map((tile) => {
        const at = tile.getBoundingClientRect();
        return `${Math.round(at.width)}×${Math.round(at.height)}`;
      }))];
    return {
      bottom: Math.round(chooser.bottom - panel.top),
      families: box('[data-testid="set-up-family"]'),
      games: box('[data-testid="set-up-variant"],[data-testid="set-up-puzzle"]'),
      sizes: box('[data-testid="set-up-size"]'),
    };
  });
}

const GAMES = '[data-testid="set-up-variant"],[data-testid="set-up-puzzle"]';

for (const width of [390, 768, 1280]) {
  test(`every family, game and board leaves the set-up screen where it was, ${width}px wide`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openSetUpPage(page);
    const first = await reading(page);
    // One box for every tile of each kind; a family tile and a game tile are the same box too.
    expect(first.families).toHaveLength(1);
    expect(first.games).toEqual(first.families);

    const families = page.getByTestId("set-up-family");
    const count = await families.count();
    for (let at = 0; at < count; at += 1) {
      const family = families.nth(at);
      await family.click();
      await expect(family).toHaveAttribute("data-open", "true");
      const games = page.locator(GAMES);
      const last = (await games.count()) - 1;
      for (const which of [...new Set([0, last])]) {
        const game = games.nth(which);
        await game.click();
        await expect(game).toHaveAttribute("data-chosen", "true");
        const sizes = page.getByTestId("set-up-size");
        const lastSize = (await sizes.count()) - 1;
        for (const size of [...new Set([lastSize, 0])]) {
          await sizes.nth(size).click();
          await expect(sizes.nth(size)).toHaveAttribute("data-chosen", "true");
          const now = await reading(page);
          const where = `${await family.getAttribute("data-family")}, game ${which + 1}, board ${size + 1}`;
          expect(now.bottom, `the chooser moved at ${where}`).toBe(first.bottom);
          expect(now.games, `a game tile changed shape at ${where}`).toEqual(first.families);
          expect(now.sizes, `the board tiles are not one box at ${where}`).toHaveLength(1);
        }
      }
    }
  });
}
