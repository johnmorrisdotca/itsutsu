import { expect, test, type Locator } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { freshPuzzleSeed, ready } from "./support";

/**
 * A PUZZLE'S SCRUBBER, UNDER ITS BOARD.
 *
 * John, 2026-09-25: "the scrubber can probably go directly below the board…
 * full board width. controls below it. Hidden move list that can reveal when
 * opened." And the clock and Pause change places, so the button stays put.
 */
const SIZE = 4;
const LEVEL = "easy";
const AT = `/games/${PUZZLE_SLUGS.numberPlace}`;

/** Where the element sits on the page, not in the window. */
async function top(locator: Locator): Promise<number> {
  return Math.round(await locator.evaluate((element) => element.getBoundingClientRect().top + window.scrollY));
}

test("each entry is a step to go back to, looked at but not written on, and nothing moves", async ({ page }) => {
  const seed = freshPuzzleSeed();
  const puzzle = generateNumberPlace(SIZE, LEVEL, seed);
  const givens = decodeCells(puzzle.givens, SIZE)!;
  const solution = decodeCells(puzzle.solution, SIZE)!;
  const open = givens.flatMap((given, index) => (given === 0 ? [index] : [])).slice(0, 2);

  await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${seed}`);
  await ready(page, "puzzle-play");
  const steps = page.getByTestId("puzzle-steps");
  // There from the start, at nothing, so the first entry pushes nothing down.
  await expect(steps).toHaveAttribute("data-last", "0");
  // The clock is left of Pause, and Pause is there before the clock starts, switched off.
  const pause = page.getByTestId("puzzle-pause");
  await expect(pause).toBeDisabled();
  const clockBox = (await page.getByTestId("puzzle-clock").boundingBox())!;
  const pauseBox = (await pause.boundingBox())!;
  expect(clockBox.x).toBeLessThan(pauseBox.x);
  const stepsAt = await top(steps);

  for (const cell of open) {
    await page.getByTestId("puzzle-cell").nth(cell).click();
    await page.getByTestId(`puzzle-key-${solution[cell]}`).click();
  }
  await expect(steps).toHaveAttribute("data-last", "2");
  await expect(pause).toBeEnabled();
  expect(await top(steps), "the scrubber moved when the first entries were made").toBe(stepsAt);

  // Back one step: the second entry is gone from the board, and the board is read only there.
  await page.getByTestId("puzzle-steps-back").click();
  await expect(steps).toHaveAttribute("data-viewing", "1");
  await expect(page.getByTestId("puzzle-cell").nth(open[1]!)).toHaveAttribute("data-value", "");
  await page.getByTestId("puzzle-cell").nth(open[1]!).click();
  await page.getByTestId(`puzzle-key-${solution[open[1]!]}`).click();
  await expect(steps).toHaveAttribute("data-last", "2");

  // The list, folded until opened, names the steps; and End comes back to now.
  await page.getByTestId("puzzle-steps-list").locator("summary").click();
  await expect(page.getByTestId("puzzle-steps-list")).toContainText("row");
  await page.getByTestId("puzzle-steps-end").click();
  await expect(page.getByTestId("puzzle-cell").nth(open[1]!)).toHaveAttribute("data-value", String(solution[open[1]!]));
});
