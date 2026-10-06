import { expect, test, type Page } from "@playwright/test";
import * as stones from "@johnmorrisdotca/houseki/stone-collapse";

import { HOUSEKI_KIND_LIST, HOUSEKI_SPECS } from "../src/lib/houseki/houseki.constants";
import { housekiQuery } from "../src/lib/houseki/housekiAddress";
import { HOUSEKI_STORAGE_KEY } from "../src/lib/houseki/housekiProgress";
import { gamePath, housekiPlayPath, setUpPath } from "../src/lib/gomoku/slugs";
import { ready } from "./support";

/**
 * HOUSEKI, USED THE WAY A READER USES IT: from a game's own page to its set-up,
 * a level, a lesson, the Daily and a free game chosen and started, a game put
 * down half way and found again on the set-up and in My games, and begun again.
 * (`houseki-wins.spec.ts` wins a level of every game; this is the way there and
 * the way back.) It signs in as the suite's operator and starts each case with
 * nothing kept in the browser.
 */
const VIEWPORTS = [
  { name: "a phone", width: 390, height: 844, touch: true },
  { name: "a desk", width: 1280, height: 900, touch: false },
] as const;

/** What the page complains of, collected from before it loads. */
function listen(page: Page): string[] {
  const complaints: string[] = [];
  page.on("pageerror", (error) => complaints.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) complaints.push(message.text());
  });
  return complaints;
}

/** Starts the pages of this test with nothing kept (once, so that what a game leaves survives the next page). */
async function arrive(page: Page) {
  await page.addInitScript((key) => {
    if (!sessionStorage.getItem("houseki-test-started")) {
      sessionStorage.setItem("houseki-test-started", "1");
      localStorage.removeItem(key);
    }
  }, HOUSEKI_STORAGE_KEY);
}

/** One group taken in Stone Collapse's first level, by the page's own two presses. */
async function takeOneGroup(page: Page) {
  const level = stones.levelManifest[0]!;
  const state = stones.createLevel(level.id);
  const cell = state.board.findIndex((stone) => stone?.id === level.witness[0]![0]);
  await page.locator(`[data-testid="houseki-well"] [data-cell="${cell}"]`).click();
  await page.locator('[data-testid="houseki-take"]').click();
  await expect(page.locator('[data-testid="houseki-full"]')).not.toHaveAttribute("data-progress", "0");
}

for (const viewport of VIEWPORTS) {
  test.describe(`on ${viewport.name}, ${viewport.width} px wide`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: viewport.touch, isMobile: viewport.touch });

    test("a game's page leads to its set-up, which starts the level chosen and says which it is", async ({ page }) => {
      const complaints = listen(page);
      await arrive(page);
      await page.goto(gamePath("stoneCollapse"));
      await page.getByTestId("houseki-offer").click();
      await ready(page, "houseki-set-up");
      await page.locator('[data-testid="houseki-level"][data-level="7"]').click();
      await page.getByTestId("houseki-start").click();
      await expect(page).toHaveURL(/\/games\/stone-collapse\/play\?level=7/);
      await ready(page, "houseki-game");
      await expect(page.getByTestId("houseki-line")).toContainText("7");
      await expect(page.locator('[data-testid="houseki-well"]')).toBeVisible();
      expect(complaints).toEqual([]);
    });

    test("a game put down half way is found again on its set-up and in My games, and goes on from there", async ({ page }) => {
      const complaints = listen(page);
      await arrive(page);
      await page.goto(housekiPlayPath("stoneCollapse", housekiQuery({ kind: "level", campaign: "classic", number: 1 })));
      await ready(page, "houseki-game");
      await takeOneGroup(page);
      await page.goto(setUpPath("stoneCollapse"));
      await ready(page, "houseki-set-up");
      await expect(page.getByTestId("houseki-continue")).toBeVisible();
      await page.goto("/play/pass-and-play");
      const card = page.locator('[data-testid="houseki-card"]').first();
      await expect(card).toBeVisible();
      await card.getByTestId("houseki-card-continue").click();
      await ready(page, "houseki-game");
      await expect(page.locator('[data-testid="houseki-full"]')).not.toHaveAttribute("data-progress", "0");
      // And begun again from the start.
      await page.getByTestId("houseki-restart").click();
      await expect(page.locator('[data-testid="houseki-full"]')).toHaveAttribute("data-progress", "0");
      expect(complaints).toEqual([]);
    });

    test("a lesson, the Daily and a free game each start from the set-up, at the address it names", async ({ page }) => {
      const complaints = listen(page);
      await arrive(page);
      await page.goto(setUpPath("gemSwap"));
      await ready(page, "houseki-set-up");
      await page.getByTestId("houseki-way-lessons").click();
      await page.locator('[data-testid="houseki-lesson-tile"][data-lesson="2"]').click();
      await page.getByTestId("houseki-start").click();
      await expect(page).toHaveURL(/lesson=2/);
      await ready(page, "houseki-game");
      await expect(page.locator('[data-testid="houseki-well"]')).toBeVisible();

      await page.goto(setUpPath("gemSwap"));
      await ready(page, "houseki-set-up");
      await page.getByTestId("houseki-way-daily").click();
      await expect(page.getByTestId("houseki-daily-state")).toBeVisible();
      await page.getByTestId("houseki-start").click();
      await expect(page).toHaveURL(/daily/);
      await ready(page, "houseki-game");
      await expect(page.locator('[data-testid="houseki-well"]')).toBeVisible();

      await page.goto(setUpPath("gemSwap"));
      await ready(page, "houseki-set-up");
      await page.getByTestId("houseki-way-free").click();
      const sizes = page.locator('[data-testid="houseki-size"]');
      expect(await sizes.count(), "at most four boards on a set-up").toBeLessThanOrEqual(4);
      await sizes.last().click();
      await page.getByTestId("houseki-start").click();
      await expect(page).toHaveURL(/free/);
      await ready(page, "houseki-game");
      await expect(page.locator('[data-testid="houseki-well"]')).toBeVisible();
      expect(complaints).toEqual([]);
    });
  });
}

test("every game opens at a level, a lesson and a free game, and the games with a Daily offer it", async ({ page }) => {
  const complaints = listen(page);
  await arrive(page);
  for (const kind of HOUSEKI_KIND_LIST) {
    const spec = HOUSEKI_SPECS[kind];
    await page.goto(setUpPath(kind));
    await ready(page, "houseki-set-up");
    await expect(page.getByTestId("houseki-way-levels")).toBeVisible();
    await expect(page.getByTestId("houseki-way-lessons")).toBeVisible();
    await expect(page.getByTestId("houseki-way-free")).toBeVisible();
    await expect(page.getByTestId("houseki-way-daily"), `${kind}'s Daily`).toHaveCount(spec.daily ? 1 : 0);
    await page.goto(housekiPlayPath(kind, housekiQuery({ kind: "lesson", number: 1 })));
    await ready(page, "houseki-game");
    await expect(page.locator('[data-testid="houseki-well"]'), `${kind}'s first lesson`).toBeVisible();
  }
  expect(complaints).toEqual([]);
});
