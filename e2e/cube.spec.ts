import { expect, test, type Page } from "@playwright/test";

import { countsAsMove, decodeCubeMoves, moveNotation } from "@johnmorrisdotca/kyuubu";
import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, ready } from "./support";

/**
 * THE CUBE 立方体: Kyuubu on the site's wood, a game of the Tiles
 * family (the first of Cubes, until 2026-10-01). It is solved here as a reader at a keyboard solves it, typing the
 * notation the spec reads off the same seed the page scrambled, and turned by
 * hand with a drag and the wheel over a sticker.
 */
const KIND = "cube";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const NAME = PUZZLE_DISPLAY[KIND].label;

/** A turn's keys as a reader types it: a digit for an inner layer, the letter, Shift for a prime, twice for a half turn. */
async function typeMove(page: Page, written: string) {
  const [, depth, letter, amount] = /^(\d?)([A-Za-z])(['2]?)$/.exec(written)!;
  if (depth !== "") await page.keyboard.press(depth);
  const key = amount === "'" ? `Shift+${letter.toUpperCase()}` : letter.toLowerCase();
  await page.keyboard.press(key);
  if (amount === "2") {
    if (depth !== "") await page.keyboard.press(depth);
    await page.keyboard.press(key);
  }
}

async function settledCube(page: Page) {
  await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-turning", "false");
}

function movesOnPage(page: Page) {
  return page.getByTestId("puzzle-play").getAttribute("data-moves");
}

test.describe("the Cube, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, after Rubik's, in Logic puzzles", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("Rubik");
    await expect(page.getByTestId("game-family")).toContainText("Logic puzzles");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(NAME);
  });
});

test.describe("the Cube", () => {
  test("set up, looked over, then solved by typing its notation, and played back on its own page", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="2"]').click();
    await page.getByTestId("puzzle-level-easy").click();
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/size=2/);
    await expect(page).toHaveURL(/seed=\d+/);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("cube")).toHaveAttribute("data-size", "2");

    // Fifteen seconds to look, and the clock waits for the first turn.
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-inspecting", "true");
    await expect(page.getByTestId("cube-said")).toContainText("Look it over");

    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    const puzzle = generatePuzzle(KIND, 2, "easy", seed);
    await expect(page.locator("[data-kyuubu]")).toHaveAttribute("data-state", puzzle.givens);
    const line = decodeCubeMoves(puzzle.solution)!;
    for (const move of line) {
      await typeMove(page, moveNotation(move, 2));
      await settledCube(page);
    }
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-solved", "true");
    // A half turn typed is two quarter turns, and each counts.
    const counted = line.filter(countsAsMove).reduce((sum, move) => sum + (move.turns === 2 ? 2 : 1), 0);
    await expect(page.getByTestId("puzzle-solved-line")).toContainText(`${counted} ${counted === 1 ? "move" : "moves"}`, { timeout: 15_000 });
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);

    // Kept: its own page steps from the scramble to solved.
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("cube-replay")).toBeVisible();
    await expect(page.getByTestId("cube-replay-at")).toContainText(`${counted}`);
  });

  test("a drag and the wheel turn a layer, the whole cube turned is no move, and Undo takes one back", async ({ page }) => {
    await page.goto(`${AT}/play?size=3&level=medium&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("cube-move-count")).toHaveText("0 moves");
    // Drawn inside the board, not merely present: the front's centre sits within the wood.
    const board = (await page.getByTestId("cube").boundingBox())!;
    const centre = (await page.locator('[data-kyuubu] [data-slot="22"]').boundingBox())!;
    expect(board.height).toBeGreaterThan(200);
    expect(centre.y).toBeGreaterThan(board.y);
    expect(centre.y + centre.height).toBeLessThan(board.y + board.height);
    // And seen from above and to one side, not face on: the top's centre is drawn, foreshortened.
    const top = (await page.locator('[data-kyuubu] [data-slot="4"]').boundingBox())!;
    expect(top.height).toBeLessThan(top.width * 0.9);

    // Turning the whole cube is looking: it counts nothing and starts no clock.
    await page.keyboard.press("y");
    await settledCube(page);
    await expect(page.getByTestId("cube-move-count")).toHaveText("0 moves");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-inspecting", "true");

    // A drag across the front's middle sticker turns a layer, and the look is over.
    // Slots run U R F D L B, nine to a face: 22 is the front's centre.
    const sticker = page.locator('[data-kyuubu] [data-slot="22"]');
    const box = (await sticker.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 2.5, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await settledCube(page);
    await expect(page.getByTestId("cube-move-count")).toHaveText("1 move");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-inspecting", "false");

    // The wheel over a sticker turns its row.
    const again = (await sticker.boundingBox())!;
    await page.mouse.move(again.x + again.width / 2, again.y + again.height / 2);
    await page.mouse.wheel(0, 120);
    await settledCube(page);
    await expect(page.getByTestId("cube-move-count")).toHaveText("2 moves");

    await page.keyboard.press("r");
    await settledCube(page);
    await expect(page.getByTestId("cube-move-count")).toHaveText("3 moves");
    const before = await movesOnPage(page);
    await page.getByTestId("cube-undo").click();
    await settledCube(page);
    await expect(page.getByTestId("cube-move-count")).toHaveText("2 moves");
    expect(await movesOnPage(page)).toBe(before!.slice(0, -3));
  });

  test("left half way, it waits in My games and opens where it was left", async ({ page }) => {
    await page.goto(`${AT}/play?size=3&level=easy&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    const seed = await page.getByTestId("puzzle-play").getAttribute("data-seed");
    await page.keyboard.press("r");
    await settledCube(page);
    await page.keyboard.press("u");
    await settledCube(page);
    await expect(page.getByTestId("cube-move-count")).toHaveText("2 moves");
    const moves = await movesOnPage(page);
    await page.getByTestId("puzzle-pause").click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-kind="${KIND}"][data-seed="${seed}"]`);
    await expect(row).toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("cube-move-count")).toHaveText("2 moves");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-moves", moves!);
  });

  test("given up, it is kept as it stood and paid for playing it out", async ({ page }) => {
    await page.goto(`${AT}/play?size=2&level=hard&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    await page.keyboard.press("r");
    await settledCube(page);
    await page.keyboard.press("Shift+U");
    await settledCube(page);
    await page.getByTestId("cube-give-up").click();
    await expect(page.getByTestId("puzzle-given-up")).toContainText("Given up");
    await expect(page.getByTestId("puzzle-given-up")).toContainText("2 moves");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|ends unsolved/);
  });

  test("its family has a page, a tile on the set-up screen, and a place on the list of every game", async ({ page }) => {
    await page.goto(`${AT}/family`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Logic puzzles");
    await expect(page.locator('[data-testid="family-mark"][data-family="Logic puzzles"]').first()).toBeVisible();
    await expect(page.getByTestId("family-games")).toContainText(NAME);

    await page.goto("/games/new");
    await ready(page, "set-up-game");
    const tiles = page.getByTestId("set-up-family").filter({ hasText: "Logic puzzles" });
    await tiles.click();
    await expect(tiles).toHaveAttribute("data-open", "true");
    // Logic puzzles opens on its first game; the cube is the card to choose among the shelf's puzzles.
    const cube = page.locator(`[data-testid="set-up-puzzle"][data-kind="${KIND}"]`);
    await cube.click();
    await expect(cube).toHaveAttribute("data-chosen", "true");
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-kind", KIND);

    await page.goto("/games");
    await expect(page.locator("main")).toContainText("Logic puzzles");
  });

  test("on a phone the cube fits the screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${AT}/play?size=3&level=easy&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    const wide = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(wide).toBeLessThanOrEqual(390);
    const cube = (await page.getByTestId("cube").boundingBox())!;
    expect(cube.width).toBeGreaterThan(250);
  });
});
