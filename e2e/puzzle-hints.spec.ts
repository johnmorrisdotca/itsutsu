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
 * CHECK, SHOW AND HINT, ON EVERY KIND OF PUZZLE. John, 2026-09-25: "Keeping
 * simple, should be CHECK and SHOW… so LHS Check, Show, RHS Hint." Show marks
 * which cells are wrong (what Hint did until then) and is paid for from the
 * checks; Hint, chosen at set-up, puts one right cell in.
 *
 * Each case makes one wrong entry the way a reader does. Show finds that cell
 * marked, and the mark goes when the cell is changed; Hint leaves one more cell
 * right than there was. Every grid is its own (an unfinished puzzle is kept,
 * and a kept one opens where it was left).
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

/** How many cells on the page hold what the answer has there: the measure a hint moves by one. */
async function rightCells(page: Page, kind: PuzzleKind, size: number, seed: number): Promise<number> {
  const puzzle = generatePuzzle(kind, size, "easy", seed);
  const cells = page.getByTestId("puzzle-cell");
  if (kind === "hiddenStones") {
    const stones = decodeStones(puzzle.solution, size)!;
    const marks = await cells.evaluateAll((all) => all.map((cell) => cell.getAttribute("data-mark") ?? ""));
    return stones.filter((col, row) => marks[row * size + col] === "stone").length;
  }
  if (kind === "blackAndWhite") {
    const answer = decodeBlackAndWhite(puzzle.solution, size)!;
    const shown = await cells.evaluateAll((all) => all.map((cell) => cell.getAttribute("data-stone") ?? ""));
    return answer.filter((stone, cell) => shown[cell] === (stone === BLACK ? "black" : "white")).length;
  }
  const solution = decodeCells(puzzle.solution, size)!;
  const values = await cells.evaluateAll((all) => all.map((cell) => cell.getAttribute("data-value") ?? ""));
  return solution.filter((value, cell) => values[cell] === String(value)).length;
}

// Every puzzle that offers help (`PuzzleSpec.helps`): a WordDrop's colours are its hints.
for (const kind of PUZZLE_KIND_LIST.filter((each) => PUZZLE_SPECS[each].helps !== false)) {
  test(`${kind}: Show marks the wrong entry until it is changed, and costs a check`, async ({ page }) => {
    const size = PUZZLE_SPECS[kind].defaultSize;
    const seed = freshPuzzleSeed();
    await page.goto(`/games/${PUZZLE_SLUGS[kind]}/play?size=${size}&level=easy&seed=${seed}&checks=3`);
    await ready(page, "puzzle-play");
    const show = page.getByTestId("puzzle-show");

    const index = await oneWrong(page, kind, size, seed);
    const cell = page.getByTestId("puzzle-cell").nth(index);
    await expect(show).toBeEnabled();
    await show.click();
    await expect(cell).toHaveAttribute("data-wrong", "true");
    // Paid for from the checks, as a Check is.
    await expect(page.getByTestId("puzzle-check")).toHaveAttribute("data-left", "2");

    // Changed, and the mark goes with the change.
    if (kind === "hiddenStones" || kind === "blackAndWhite") await cell.click();
    else await page.getByTestId("puzzle-key-clear").click();
    await expect(cell).not.toHaveAttribute("data-wrong", "true");
  });

  test(`${kind}: with hints chosen, Hint puts one right cell in`, async ({ page }) => {
    const size = PUZZLE_SPECS[kind].defaultSize;
    const seed = freshPuzzleSeed();
    await page.goto(`/games/${PUZZLE_SLUGS[kind]}/play?size=${size}&level=easy&seed=${seed}&hints=1`);
    await ready(page, "puzzle-play");
    const hint = page.getByTestId("puzzle-hint");
    await expect(hint).toHaveAttribute("data-allowed", "true");
    // The clock starts on the first entry, and Hint waits for it as Check does.
    await oneWrong(page, kind, size, seed);
    const before = await rightCells(page, kind, size, seed);
    await hint.click();
    await expect(hint).toContainText("1 used");
    await expect.poll(() => rightCells(page, kind, size, seed)).toBe(before + 1);
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
