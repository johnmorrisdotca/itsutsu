import { mkdirSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeStones } from "../src/lib/puzzles/hiddenStones/code";
import { decodeJigsaw } from "../src/lib/puzzles/jigsaw/code";
import { decodeKiller } from "../src/lib/puzzles/killer/code";
import { decodeMoreOrLess } from "../src/lib/puzzles/moreOrLess/code";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { decodeTowers } from "../src/lib/puzzles/towers/code";
import { BLACK, decodeBlackAndWhite, EMPTY } from "../src/lib/puzzles/blackAndWhite/code";
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
  // A 6×6 Sum Cages a third filled: the dashed cages and their sums are the picture, and a 6×6's read at a thumbnail's size.
  { kind: "sumCages", size: 6, level: "easy", seed: 20260924, fill: 3 },
  // A 5×5 Towers a third filled: the ring of clues on the wood around the square is the picture.
  { kind: "towers", size: 5, level: "medium", seed: 20260924, fill: 3 },
  // An 8×8 Black and White a third filled: printed stones on their shaded cells, and the solver's beside them.
  { kind: "blackAndWhite", size: 8, level: "medium", seed: 20260924, fill: 3 },
];

test.describe("puzzle screenshots", () => {
  test.skip(process.env.GAME_SCREENSHOTS !== "1", "Set GAME_SCREENSHOTS=1 to write them.");

  for (const scene of SCENES) {
    test(scene.kind, async ({ page }) => {
      mkdirSync(OUT, { recursive: true });
      await page.goto(`/games/${PUZZLE_SLUGS[scene.kind]}/play?size=${scene.size}&level=${scene.level}&seed=${scene.seed}`);
      await ready(page, "puzzle-play");
      /*
       * NO XP NOTICES IN A PICTURE OF A GAME. The operator this runs as earns XP
       * like anybody, and the first scene of a run caught three "+25 Puzzle
       * solved" notices over the Number Place grid, shipped in 0.305.0 and seen on
       * the puzzle's own page. The notices are hidden for the picture, whatever
       * the operator has waiting.
       */
      await page.addStyleTag({ content: '[data-testid="xp-toast-host"], [data-testid="xp-toast"] { display: none !important; }' });
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
      } else if (scene.kind === "blackAndWhite") {
        const givens = decodeBlackAndWhite(puzzle.givens, scene.size)!;
        const solution = decodeBlackAndWhite(puzzle.solution, scene.size)!;
        for (const [index, given] of givens.entries()) {
          if (given !== EMPTY || index % scene.fill !== 0) continue;
          // One tap for black, two for white.
          await cells.nth(index).click();
          if (solution[index] !== BLACK) await cells.nth(index).click();
          filled += 1;
        }
      } else {
        const givens =
          scene.kind === "moreOrLess"
            ? decodeMoreOrLess(puzzle.givens, scene.size)!.cells
            : scene.kind === "jigsaw"
              ? decodeJigsaw(puzzle.givens, scene.size)!.cells
              : scene.kind === "sumCages"
                ? decodeKiller(puzzle.givens, scene.size)!.cells
                : scene.kind === "towers"
                  ? decodeTowers(puzzle.givens, scene.size)!.cells
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
      // Nothing selected in the picture: the grid as it stands, not a cursor. Escape lets the chosen cell go;
      // clicking the clock, which this did before, chose nothing else and left the last cell lit in every picture.
      await page.keyboard.press("Escape");
      await expect(page.locator('[data-testid="puzzle-cell"][aria-pressed="true"]')).toHaveCount(0);
      // And no focus ring on the last cell pressed, which Hidden Stones' pictures carried round a cross.
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      const grid = page.getByTestId("puzzle-grid");
      await expect(grid).toBeVisible();
      await grid.screenshot({ path: `${OUT}/${scene.kind}.jpg`, type: "jpeg", quality: 82 });
    });
  }
});
