import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { jiraiVariantOfSeed } from "../src/lib/puzzles/jirai/variants";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, ready } from "./support";

/**
 * JIRAI 地雷, Minesweeper that never needs a guess: Jirai's (`@johnmorrisdotca/jirai`), in Pencil puzzles.
 *
 * Every press here is a reader's: a tap on a square, a tap with Flag on, a finger held down, a right click. The
 * mines come from the same seed the page uses.
 */
const AT = `/games/${PUZZLE_SLUGS.jirai}`;
const NAME = PUZZLE_DISPLAY.jirai.label;

const square = (page: Page, cell: number) => page.locator(`[data-testid="jirai-cell"][data-cell="${cell}"]`);
const codeOf = async (page: Page) => (await page.getByTestId("puzzle-play").getAttribute("data-code")) ?? "";

async function openPlay(page: Page, size: number, extra = "") {
  await page.goto(`${AT}/play?size=${size}&level=medium&seed=${freshPuzzleSeed()}${extra}`);
  await ready(page, "puzzle-play");
  const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
  return generatePuzzle("jirai", size, "medium", seed);
}

/** The first covered square that holds no mine, and the first that does. */
function pick(code: string, solution: string): { safe: number; mine: number } {
  return {
    safe: [...code].findIndex((character, cell) => character === "." && solution[cell] !== "f"),
    mine: [...solution].findIndex((character) => character === "f"),
  };
}

test.describe("Jirai, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, with Jirai named as what it runs on", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("game-family")).toContainText("Pencil puzzles");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.locator("main")).toContainText("never have to guess");
    await expect(page.getByTestId("open-source")).toContainText("Jirai");
  });
});

test.describe("the Jirai puzzle", () => {
  test("set up on hexagons in the shape of a star, and solved by uncovering every safe square", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="9"]').click();
    await page.getByTestId("jirai-grid-hex").click();
    await expect(page.getByTestId("jirai-grid-hex")).toHaveAttribute("aria-checked", "true");
    await page.getByTestId("jirai-shape-star").click();
    await expect(page.getByTestId("set-up-puzzle-preview").locator('.jr-root[data-grid="hex"][data-shape="star"]')).toBeVisible();
    await page.getByTestId("puzzle-solve").click();
    await ready(page, "puzzle-play");
    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    // The way to play is the seed's from here on, so a reload, a kept run and a race name the same board.
    expect(jiraiVariantOfSeed(seed)).toEqual({ grid: "hex", shape: "star" });
    await expect(page).toHaveURL(new RegExp(`seed=${seed}`));
    await expect(page.locator('.jr-root[data-grid="hex"][data-shape="star"]')).toBeVisible();
    const puzzle = generatePuzzle("jirai", 9, "medium", seed);
    for (let step = 0; step < 200; step += 1) {
      if (await page.getByTestId("puzzle-done").isVisible()) break;
      const { safe } = pick(await codeOf(page), puzzle.solution);
      if (safe === -1) break;
      const before = await codeOf(page);
      await square(page, safe).click();
      await expect.poll(() => codeOf(page)).not.toBe(before);
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", /replay|finished/);
    await expect(page.getByTestId("solve-board").getByTestId("jirai-cell").first()).toBeVisible();
  });

  test("a mine uncovered is flagged where it lies and counted, and the puzzle goes on", async ({ page }) => {
    const puzzle = await openPlay(page, 9);
    const { mine } = pick(await codeOf(page), puzzle.solution);
    await square(page, mine).click();
    await expect.poll(async () => (await codeOf(page))[mine]).toBe("f");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-mistakes", "1");
    await expect(page.getByTestId("jirai-said")).toContainText("That was a mine");
    await expect(page.getByTestId("jirai-mines")).toContainText("1 mistake");
    // And it is still a puzzle: a safe square uncovers.
    const { safe } = pick(await codeOf(page), puzzle.solution);
    await square(page, safe).click();
    await expect.poll(async () => (await codeOf(page))[safe]).toMatch(/[0-8]/);
  });

  test("Flag turns a tap into a flag and back, and a finger held on a square flags it without uncovering it", async ({ page }) => {
    const puzzle = await openPlay(page, 9);
    const { safe, mine } = pick(await codeOf(page), puzzle.solution);
    await page.getByTestId("jirai-flag").click();
    await expect(page.getByTestId("jirai-flag")).toHaveAttribute("aria-pressed", "true");
    await square(page, mine).click();
    await expect.poll(async () => (await codeOf(page))[mine]).toBe("f");
    await expect(page.getByTestId("jirai-mines")).toContainText(/12 mines left/);
    await square(page, mine).click();
    await expect.poll(async () => (await codeOf(page))[mine]).toBe(".");
    await page.getByTestId("jirai-flag").click();
    await expect(page.getByTestId("jirai-flag")).toHaveAttribute("aria-pressed", "false");

    // A finger held for half a second: pressed, held, lifted, and the click that follows does nothing more.
    const target = square(page, safe);
    const box = (await target.boundingBox())!;
    const at = { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2, pointerType: "touch", pointerId: 7, isPrimary: true, bubbles: true };
    await target.dispatchEvent("pointerdown", at);
    await page.waitForTimeout(650);
    await target.dispatchEvent("pointerup", at);
    await target.dispatchEvent("click", { bubbles: true });
    await expect.poll(async () => (await codeOf(page))[safe]).toBe("f");
    // A quick tap, by the same finger, uncovers: the flag must come off first.
    await target.dispatchEvent("pointerdown", at);
    await target.dispatchEvent("pointerup", at);
    await target.dispatchEvent("click", { bubbles: true });
    expect((await codeOf(page))[safe]).toBe("f");
  });

  test("Check counts a wrong flag, Show marks it, and Hint uncovers a square the numbers prove safe", async ({ page }) => {
    const puzzle = await openPlay(page, 9, "&hints=1");
    const { safe } = pick(await codeOf(page), puzzle.solution);
    await page.getByTestId("jirai-flag").click();
    await square(page, safe).click();
    await page.getByTestId("jirai-flag").click();
    await expect.poll(async () => (await codeOf(page))[safe]).toBe("f");
    await page.getByTestId("puzzle-check").click();
    await expect(page.getByTestId("puzzle-checked")).toContainText("1 flag is wrong");
    await page.getByTestId("puzzle-show").click();
    await expect(square(page, safe)).toHaveAttribute("data-kind", "wrong");
    const before = await codeOf(page);
    await page.getByTestId("puzzle-hint").click();
    await expect.poll(() => codeOf(page)).not.toBe(before);
    await expect(page.getByTestId("puzzle-hint")).toContainText("1 used");
  });

  test("left half done it waits in My games and opens where it was left", async ({ page }) => {
    const puzzle = await openPlay(page, 9);
    const { safe } = pick(await codeOf(page), puzzle.solution);
    await square(page, safe).click();
    await expect.poll(async () => (await codeOf(page))[safe]).toMatch(/[0-8]/);
    const code = await codeOf(page);
    await page.getByTestId("puzzle-pause").click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-kind="jirai"][data-seed="${puzzle.seed}"]`);
    await expect(row).toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    expect(await codeOf(page)).toBe(code);
  });

  test("on a phone, Flag and the squares are all there to press, the squares big enough for a thumb", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPlay(page, 12);
    await expect(page.getByTestId("jirai-flag")).toBeVisible();
    const box = (await square(page, 6 * 12 + 6).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("the server refuses a board whose numbers do not add up", async ({ page }) => {
    const puzzle = await openPlay(page, 9);
    const bent = puzzle.solution.replace(/[1-7]/, (digit) => String(Number(digit) + 1));
    const answered = await page.request.post("/api/puzzles/solved", { data: { kind: "jirai", size: 9, level: "medium", givens: puzzle.givens, answer: bent, seed: puzzle.seed, elapsedMs: 1000 } });
    expect(answered.status()).toBe(422);
  });

  test("its family page lists it", async ({ page }) => {
    await page.goto(`${AT}/family`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pencil puzzles");
    await expect(page.getByTestId("family-games")).toContainText(NAME);
  });
});
