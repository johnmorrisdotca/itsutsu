import { expect, test, type Page } from "@playwright/test";
import { openSetup } from "./support";


/**
 * The two rock games the obstacle playtest named, each played on the real
 * board: Scattered Rocks, whose rocks are there from the first move, and
 * Rockfall, whose rocks fall once the eighth stone is down. The rocks are laid
 * from each game's own seed, so the specs count them rather than look for
 * them in a place.
 */

const blocked = (page: Page) => page.getByRole("button", { name: /, blocked$/ });
const hotspots = (page: Page) => page.getByRole("button", { name: /, hotspot$/ });

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

