import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { BLACK, WHITE, decodeBlackAndWhite } from "../src/lib/puzzles/blackAndWhite/code";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeStones } from "../src/lib/puzzles/hiddenStones/code";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { PUZZLE_KIND_LIST, PUZZLE_SPECS } from "../src/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "../src/lib/puzzles/puzzles.types";
import { freshPuzzleSeed, ready } from "./support";

/**
 * HINT MARKS WHICH CELLS ARE WRONG, ON EVERY KIND OF PUZZLE, AND ONLY WHEN IT
 * WAS CHOSEN. John, 2026-09-24: "when a user wants a HINT button they can add
 * as an option for these games... and when pressed, we highlight what's wrong.
 * Should be opposite side of CHECK button… perhaps it's always there and
 * disabled when not active or chosen in options."
 *
 * Each case makes one wrong entry the way a reader does, presses Hint, finds
 * that cell marked, changes it and finds the mark gone. Every grid is its own
 * (an unfinished puzzle is kept, and a kept one opens where it was left).
 */

/** Puts one wrong entry on the grid, and says which cell. */
async function oneWrong(page: Page, kind: PuzzleKind, size: number, seed: number): Promise<number> {
  const puzzle = generatePuzzle(kind, size, "easy", seed);
  if (kind === "hiddenStones") {
    // A stone in the first row, one along from where its answer is.
    const column = (decodeStones(puzzle.solution, size)![0]! + 1) % size;
    await page.getByTestId("puzzle-cell").nth(column).click();
    return column;
  }
  if (kind === "blackAndWhite") {
    // A cell nobody printed whose answer is white: one tap puts black on it.
    const answer = decodeBlackAndWhite(puzzle.solution, size)!;
    const printed = decodeBlackAndWhite(puzzle.givens.slice(0, size * size), size);
    const index = answer.findIndex((stone, cell) => stone === WHITE && (printed === null || printed[cell] !== BLACK && printed[cell] !== WHITE));
    await page.getByTestId("puzzle-cell").nth(index).click();
    return index;
  }
  const solution = decodeCells(puzzle.solution, size)!;
  const empty = page.locator('[data-testid="puzzle-cell"][data-given="false"]').first();
  const index = Number(await empty.getAttribute("data-index"));
  await empty.click();
  await page.getByTestId(`puzzle-key-${(solution[index]! % size) + 1}`).click();
  return index;
}

for (const kind of PUZZLE_KIND_LIST) {
  test(`${kind}: with hints chosen, Hint marks the wrong entry until it is changed`, async ({ page }) => {
    const size = PUZZLE_SPECS[kind].defaultSize;
    const seed = freshPuzzleSeed();
    await page.goto(`/games/${PUZZLE_SLUGS[kind]}/play?size=${size}&level=easy&seed=${seed}&hints=1`);
    await ready(page, "puzzle-play");
    const hint = page.getByTestId("puzzle-hint");
    await expect(hint).toHaveAttribute("data-allowed", "true");

    const index = await oneWrong(page, kind, size, seed);
    const cell = page.getByTestId("puzzle-cell").nth(index);
    await expect(hint).toBeEnabled();
    await hint.click();
    await expect(cell).toHaveAttribute("data-wrong", "true");
    await expect(hint).toContainText("1 used");

    // Changed, and the mark goes with the change.
    if (kind === "hiddenStones" || kind === "blackAndWhite") await cell.click();
    else await page.getByTestId("puzzle-key-clear").click();
    await expect(cell).not.toHaveAttribute("data-wrong", "true");
  });
}

test("without hints chosen, Hint is there and cannot be pressed, and says where it is chosen", async ({ page }) => {
  const size = PUZZLE_SPECS.numberPlace.defaultSize;
  const seed = freshPuzzleSeed();
  await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/play?size=${size}&level=easy&seed=${seed}`);
  await ready(page, "puzzle-play");
  await oneWrong(page, "numberPlace", size, seed);
  const hint = page.getByTestId("puzzle-hint");
  await expect(hint).toHaveAttribute("data-allowed", "false");
  await expect(hint).toBeDisabled();
  await expect(hint).toHaveAttribute("title", /set up/);
});

test("the set-up screen's Hints choice travels to the puzzle in its address", async ({ page }) => {
  await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/new`);
  await ready(page, "puzzle-set-up");
  const solve = page.getByTestId("puzzle-solve");
  await expect(solve).not.toHaveAttribute("href", /hints=/);
  await page.getByTestId("puzzle-hints-on").click();
  await expect(solve).toHaveAttribute("href", /hints=1/);
  await solve.click();
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("puzzle-hint")).toHaveAttribute("data-allowed", "true");
});
