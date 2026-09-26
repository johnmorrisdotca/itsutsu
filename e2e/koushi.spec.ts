import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateKoushi } from "../src/lib/puzzles/koushi/generate";
import { LETTER_CELLS, decodeGivens, decodePlay, swapsAllowed, type Swap } from "../src/lib/puzzles/koushi/lattice";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import type { PuzzleLevel } from "../src/lib/puzzles/puzzles.types";
import { freshPuzzleSeed, ready } from "./support";

/**
 * Koushi: six words in a lattice, put right by swapping letters. Each case
 * makes its own seed, so the puzzle, and the run kept of it, are its own; the
 * shortest run of swaps comes from the generator (`puzzle.solution`), and the
 * spec plays it as a person would — a tap on each tile, or a drag of one onto
 * the other.
 */
const KIND = "koushi";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

function made(level: PuzzleLevel, seed: number) {
  const puzzle = generateKoushi(level, seed);
  return { puzzle, asked: decodeGivens(puzzle.givens)!, best: decodePlay(puzzle.solution)!.swaps };
}

const tile = (page: Page, cell: number) => page.locator(`[data-testid="koushi-tile"][data-koushi-cell="${cell}"]`);

async function tapSwap(page: Page, [a, b]: Swap) {
  await tile(page, a).click();
  await expect(tile(page, a)).toHaveAttribute("data-chosen", "true");
  await tile(page, b).click();
}

test.describe("Koushi", () => {
  test("its front door names it, its family, and says it is our own take", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(PUZZLE_DISPLAY[KIND].label);
    await expect(page.getByTestId("inspired-by")).toContainText("swap-the-letters word grid");
    await expect(page.getByTestId("game-family")).toContainText("Other");
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("solved by tapping tiles in the fewest swaps: every mark kept, and nothing wider than the phone", async ({ page }) => {
      const seed = freshPuzzleSeed();
      const { asked, best } = made("medium", seed);
      await page.goto(`${AT}/play?size=5&level=medium&seed=${seed}`);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("koushi-tile")).toHaveCount(21);
      await expect(page.getByTestId("koushi-hole")).toHaveCount(4);
      await expect(page.getByTestId("koushi-swaps-left")).toHaveAttribute("data-left", String(swapsAllowed("medium")));
      const sideways = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(sideways, "the lattice is wider than a phone").toBeLessThanOrEqual(0);
      // A green tile is right, and cannot be picked up.
      const green = LETTER_CELLS.find((cell) => asked.scramble[cell] === asked.solution[cell]);
      if (green !== undefined) await expect(tile(page, green)).toBeDisabled();

      for (const [done, swap] of best.entries()) {
        await tapSwap(page, swap);
        if (done + 1 < best.length) await expect(page.getByTestId("koushi-swaps-left")).toHaveAttribute("data-left", String(swapsAllowed("medium") - done - 1));
      }
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("koushi-marks")).toHaveAttribute("data-spare", "5");
      await expect(page.locator('[data-testid="koushi-tile"][data-mark="hit"]')).toHaveCount(21);
    });
  });

  test("a tile dragged onto another changes places with it", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const { asked, best } = made("easy", seed);
    await page.goto(`${AT}/play?size=5&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    const [a, b] = best[0]!;
    await tile(page, a).dragTo(tile(page, b));
    await expect(tile(page, a)).toHaveAttribute("data-letter", asked.scramble[b]!);
    await expect(tile(page, b)).toHaveAttribute("data-letter", asked.scramble[a]!);
    await expect(page.getByTestId("koushi-swaps-left")).toHaveAttribute("data-left", String(swapsAllowed("easy") - 1));
  });

  test("left half way by a link, it waits in My games and opens where it was left", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const { best } = made("easy", seed);
    await page.goto(`${AT}/play?size=5&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    await tapSwap(page, best[0]!);
    await tapSwap(page, best[1]!);
    await expect(page.getByTestId("koushi-swaps-left")).toHaveAttribute("data-left", String(swapsAllowed("easy") - 2));

    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-seed="${seed}"]`);
    await expect(row, "the lattice left unfinished is not in My games").toBeVisible();

    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("koushi-swaps-left")).toHaveAttribute("data-left", String(swapsAllowed("easy") - 2));
    for (const swap of best.slice(2)) await tapSwap(page, swap);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
  });

  test("every swap spent without solving it ends it, and shows the six words", async ({ page }) => {
    // Two tiles that stay out of place whichever way round they are: swapped back and forth, nothing is learned.
    // Looked for in this spec's own seed, and the next along if a scramble has no such pair, so it never skips.
    const loosePair = (asked: ReturnType<typeof made>["asked"]): Swap | undefined => {
      const loose = LETTER_CELLS.filter((cell) => asked.scramble[cell] !== asked.solution[cell]);
      return loose
        .flatMap((a) => loose.map((b) => [a, b] as const))
        .find(([a, b]) => a < b && asked.scramble[a] !== asked.scramble[b] && asked.scramble[a] !== asked.solution[b] && asked.scramble[b] !== asked.solution[a]);
    };
    let seed = freshPuzzleSeed();
    while (loosePair(made("easy", seed).asked) === undefined) seed += 1;
    const { asked } = made("easy", seed);
    const pair = loosePair(asked)!;
    await page.goto(`${AT}/play?size=5&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    for (let spent = 0; spent < swapsAllowed("easy"); spent += 1) await tapSwap(page, pair);
    await expect(page.getByTestId("koushi-out")).toBeVisible();
    // Read as a reader sees it: the words are set in capitals by the page's type, not typed in them.
    await expect(page.getByTestId("koushi-words")).toContainText(asked.solution.slice(0, 5).join("").toUpperCase(), { useInnerText: true });
  });
});
