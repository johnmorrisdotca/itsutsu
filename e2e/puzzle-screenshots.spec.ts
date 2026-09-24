import { mkdirSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeStones } from "../src/lib/puzzles/hiddenStones/code";
import { decodeJigsaw } from "../src/lib/puzzles/jigsaw/code";
import { decodeMoreOrLess } from "../src/lib/puzzles/moreOrLess/code";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import type { PuzzleKind, PuzzleLevel } from "../src/lib/puzzles/puzzles.types";
import { ready } from "./support";

/**
 * One screenshot per puzzle, part way through, into public/art/games/ — the
 * picture on the puzzle's front door, its rules page, its family's card and
 * every list that names it. Run on purpose with `pnpm screenshots:puzzles`,
 * which cuts the thumbnail and writes the stamp after it; not part of the
 * ordinary suite, because it writes files into the repo.
 *
 * A fixed seed, so the same picture comes out of the same grid every time
 * the grid's drawing changes and the stamp says it must be re-taken.
 */
const OUT = "public/art/games";

const SCENES: { kind: PuzzleKind; size: number; level: PuzzleLevel; seed: number; fill: number }[] = [
  // A 9×9 with a third of its blanks filled: enough to read as a puzzle in progress.
  { kind: "numberPlace", size: 9, level: "medium", seed: 20260924, fill: 3 },
  // A 7×7 with every other row's stone placed and a cross or two: the regions, a stone, a ruled-out cell.
  { kind: "hiddenStones", size: 7, level: "easy", seed: 20260924, fill: 2 },
  // A 5×5 with a third of its blanks filled, its marks showing between the cells.
  { kind: "moreOrLess", size: 5, level: "medium", seed: 20260924, fill: 3 },
  // A 7×7 Jigsaw a third filled: the irregular regions are the picture.
  { kind: "jigsaw", size: 7, level: "medium", seed: 20260924, fill: 3 },
  // A 9×9 Diagonal a third filled, its two diagonals shaded.
  { kind: "diagonal", size: 9, level: "medium", seed: 20260924, fill: 3 },
];

test.describe("puzzle screenshots", () => {
  test.skip(process.env.GAME_SCREENSHOTS !== "1", "Set GAME_SCREENSHOTS=1 to write them.");

  for (const scene of SCENES) {
    test(scene.kind, async ({ page }) => {
      mkdirSync(OUT, { recursive: true });
      await page.goto(`/games/${PUZZLE_SLUGS[scene.kind]}/play?size=${scene.size}&level=${scene.level}&seed=${scene.seed}`);
      await ready(page, "puzzle-play");
      const puzzle = generatePuzzle(scene.kind, scene.size, scene.level, scene.seed);
      const cells = page.getByTestId("puzzle-cell");
      let filled = 0;
      if (scene.kind === "hiddenStones") {
        const stones = decodeStones(puzzle.solution, scene.size)!;
        for (const [row, col] of stones.entries()) {
          if (row % scene.fill !== 0) continue;
          await cells.nth(row * scene.size + col).click();
          filled += 1;
        }
        // Two crosses, in the first row without a stone, on cells that are not its stone.
        const row = stones.findIndex((_, index) => index % scene.fill !== 0);
        for (const col of [0, scene.size - 1].filter((each) => each !== stones[row])) {
          await cells.nth(row * scene.size + col).click();
          await cells.nth(row * scene.size + col).click();
        }
      } else {
        const givens =
          scene.kind === "moreOrLess"
            ? decodeMoreOrLess(puzzle.givens, scene.size)!.cells
            : scene.kind === "jigsaw"
              ? decodeJigsaw(puzzle.givens, scene.size)!.cells
              : decodeCells(puzzle.givens, scene.size)!;
        const solution = decodeCells(puzzle.solution, scene.size)!;
        for (const [index, given] of givens.entries()) {
          if (given !== 0 || index % scene.fill !== 0) continue;
          await cells.nth(index).click();
          await page.getByTestId(`puzzle-key-${solution[index]}`).click();
          filled += 1;
        }
      }
      expect(filled).toBeGreaterThan(0);
      // Nothing selected in the picture: the grid as it stands, not a cursor.
      await page.getByTestId("puzzle-clock").click();
      const grid = page.getByTestId("puzzle-grid");
      await expect(grid).toBeVisible();
      await grid.screenshot({ path: `${OUT}/${scene.kind}.jpg`, type: "jpeg", quality: 82 });
    });
  }
});
