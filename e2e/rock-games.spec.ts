import { expect, test, type Page } from "@playwright/test";
import { openSetup, playSequence } from "./support";

/**
 * The two rock games the obstacle playtest named, each played on the real
 * board: Scattered Rocks, whose rocks are there from the first move, and
 * Rockfall, whose rocks fall once the eighth stone is down. The rocks are laid
 * from each game's own seed, so the specs count them rather than look for
 * them in a place.
 */

const blocked = (page: Page) => page.getByRole("button", { name: /, blocked$/ });
const hotspots = (page: Page) => page.getByRole("button", { name: /, hotspot$/ });
const stones = (page: Page) => page.getByRole("button", { name: /, (Black|White) stone$/ });

async function openGame(page: Page, variant: string) {
  await page.goto("/games/gomoku/play");
  await page.evaluate(() => window.localStorage.clear());
  await page.goto("/games/gomoku/play");
  await openSetup(page);
  await page.getByTestId("rules").selectOption(variant);
}

test.describe("Scattered Rocks", () => {
  test("starts with twelve rocks and two hotspots, and no rock can be played on", async ({ page }) => {
    await openGame(page, "scatteredRocks");
    await expect(blocked(page)).toHaveCount(12);
    await expect(hotspots(page)).toHaveCount(2);
    await expect(blocked(page).first()).toBeDisabled();
  });

  test("its rules page says the rocks are there from the start", async ({ page }) => {
    await page.goto("/games/scattered-rocks/rules");
    await expect(page.getByRole("heading", { name: /Scattered Rocks/ }).first()).toBeVisible();
    await expect(page.getByText(/12 points, laid from the game's seed/).first()).toBeVisible();
  });
});

test.describe("Rockfall", () => {
  test("starts open, and the rocks fall after the eighth stone", async ({ page }) => {
    await openGame(page, "rockfall");
    // Spread apart, so none of the eight makes a line.
    const eight: [number, number][] = [[1, 1], [1, 5], [1, 9], [1, 13], [5, 1], [5, 5], [5, 9], [5, 13]];
    await playSequence(page, 15, eight.slice(0, 7));
    // The seventh stone is on the board, so the board has answered: still no rocks.
    await expect(stones(page)).toHaveCount(7);
    await expect(blocked(page)).toHaveCount(0);
    await expect(hotspots(page)).toHaveCount(0);

    await playSequence(page, 15, eight.slice(7));
    await expect(stones(page)).toHaveCount(8);
    // Twenty rocks, less any that fell on one of the eight stones; at most two hotspots.
    await expect.poll(() => blocked(page).count()).toBeGreaterThanOrEqual(12);
    expect(await blocked(page).count()).toBeLessThanOrEqual(20);
    expect(await hotspots(page).count()).toBeLessThanOrEqual(2);
    await expect(blocked(page).first()).toBeDisabled();
  });

  test("its rules page says when the rocks fall", async ({ page }) => {
    await page.goto("/games/rockfall/rules");
    await expect(page.getByRole("heading", { name: /Rockfall/ }).first()).toBeVisible();
    await expect(page.getByText(/Once 8 stones have been played, 20 rocks and 2 hotspots fall/).first()).toBeVisible();
  });
});
