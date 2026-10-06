import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { freshPuzzleSeed, ready } from "./support";

/**
 * A PUZZLE'S SET-UP NAMES THE RUN IT WOULD RESUME, AND START NEVER RESUMES IT.
 *
 * John, 2026-10-06, on a phone, at the Cube's set-up: "I set up the game as a
 * 2 x 2, go down and then say continue. And it starts with a 3x3 game. It's
 * confusing to offer a continue when I think I was setting up a new game." A
 * kept 3×3 Easy was the first of three equal black presses, called Continue and
 * saying nothing about which. It is a note above the set-up now, in a quiet
 * button that names the run; the Start presses begin what is chosen.
 *
 * Each width keeps a 3×3 Easy by playing two turns and leaving by the site's
 * own link, as a reader does, then sets up a 2×2 and presses Start alone.
 */
const AT = `/games/${PUZZLE_SLUGS.cube}`;

const settled = (page: Page) => expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-turning", "false");

/** Where the note sits and how big it is on the PAGE, so a scroll to the tile just pressed is not read as the note moving. */
const placed = (page: Page) =>
  page.getByTestId("set-up-kept").evaluate((el) => {
    const at = el.getBoundingClientRect();
    return { top: Math.round(at.top + window.scrollY), height: Math.round(at.height), width: Math.round(at.width) };
  });

/** A cube of this size played two turns and left by a link in the header, so it is kept; returns its seed. */
async function keepOne(page: Page, size: number): Promise<string> {
  await page.goto(`${AT}/play?size=${size}&level=easy&seed=${freshPuzzleSeed()}`);
  await ready(page, "puzzle-play");
  const seed = (await page.getByTestId("puzzle-play").getAttribute("data-seed"))!;
  await page.keyboard.press("r");
  await settled(page);
  await page.keyboard.press("u");
  await settled(page);
  await expect(page.getByTestId("cube-move-count")).toHaveText("2 moves");
  await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
  await expect(page).toHaveURL(/\/play$/);
  await ready(page, "tabs");
  await page.locator('[data-testid="tab"][data-tab="going"]').click();
  await expect(page.locator(`[data-testid="puzzle-going"][data-kind="cube"][data-seed="${seed}"]`)).toBeVisible();
  return seed;
}

for (const width of [390, 1280]) {
  test(`the Cube's set-up names the kept 3×3 and Start alone begins the 2×2 chosen, ${width}px wide`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const kept = await keepOne(page, 3);

    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    const note = page.getByTestId("set-up-kept");
    const resume = page.getByTestId("set-up-resume");
    await expect(note).toBeVisible();
    // It says exactly what it resumes, and leads to that very grid.
    await expect(resume).toContainText("Continue your 3×3 · Easy");
    await expect(resume).toContainText("so far");
    await expect(resume).toHaveAttribute("href", new RegExp(`seed=${kept}`));
    // It is apart from the Start presses, never the first of them, and the presses are the two that start.
    const presses = page.getByTestId("puzzle-play-buttons");
    await expect(presses.getByTestId("set-up-resume")).toHaveCount(0);
    await expect(presses.locator("a, button").first()).toHaveAttribute("data-testid", "puzzle-solve");
    const above = (await note.boundingBox())!;
    const column = (await presses.boundingBox())!;
    expect(above.y + above.height, "the note is above the Start presses").toBeLessThanOrEqual(column.y);
    // No sideways page scroll at a phone's width.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    // Choosing another board moves nothing about the note, and the note never says it begins that board.
    const before = await placed(page);
    await page.locator('[data-testid="set-up-size"][data-size="2"]').click();
    await expect(page.locator('[data-testid="set-up-size"][data-size="2"]')).toHaveAttribute("data-chosen", "true");
    expect(await placed(page)).toEqual(before);
    await expect(resume).toContainText("3×3");

    // Start alone begins the 2×2 on the screen: a fresh grid, none of the kept run's turns.
    await page.getByTestId("puzzle-solve").click();
    await ready(page, "puzzle-play");
    await expect(page).toHaveURL(/size=2/);
    expect(await page.getByTestId("puzzle-play").getAttribute("data-seed")).not.toBe(kept);
    await expect(page.getByTestId("cube-move-count")).toHaveText("0 moves");

    // And the note's own button still carries on the 3×3, where it was left.
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.getByTestId("set-up-resume").click();
    await ready(page, "puzzle-play");
    await expect(page).toHaveURL(new RegExp(`size=3.*seed=${kept}|seed=${kept}.*size=3`));
    await expect(page.getByTestId("cube-move-count")).toHaveText("2 moves");
  });
}

test("with more than one kept, the note says so and leads to My games", async ({ page }) => {
  await keepOne(page, 3);
  await keepOne(page, 2);
  await page.goto(`${AT}/new`);
  await ready(page, "puzzle-set-up");
  // The latest, the 2×2, is the one named; the count is at least the two just kept.
  await expect(page.getByTestId("set-up-resume")).toContainText("Continue your 2×2");
  await expect(page.getByTestId("set-up-kept")).toHaveAttribute("data-count", /^([2-9]|\d\d+)$/);
  await expect(page.getByTestId("set-up-kept-title")).toContainText("in progress");
  await page.getByTestId("set-up-kept-all").click();
  await expect(page).toHaveURL(/\/play$/);
});
