import { mkdirSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle, prepareEveryPuzzle } from "../src/lib/puzzles/generate";
import { markKanaGuess } from "../src/lib/puzzles/gomojiKana/kanaMarks";
import { kanaWordsOf } from "../src/lib/puzzles/gomojiKana/kanaWords";
import { decodeStones } from "../src/lib/puzzles/hiddenStones/code";
import { decodeJigsaw } from "../src/lib/puzzles/jigsaw/code";
import { decodeKiller } from "../src/lib/puzzles/killer/code";
import { decodePlay } from "../src/lib/puzzles/koushi/lattice";
import { decodeMoreOrLess } from "../src/lib/puzzles/moreOrLess/code";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { decodeTowers } from "../src/lib/puzzles/towers/code";
import { BLACK, decodeBlackAndWhite, EMPTY } from "../src/lib/puzzles/blackAndWhite/code";
import { WORD_STONE_LOOK } from "../src/components/puzzles/puzzles.constants";
import { answersFor } from "../src/lib/puzzles/gomoji/code";
import { lettersOf } from "../src/lib/puzzles/kumimoji/grid";
import { tileWords } from "../src/lib/puzzles/kumimoji/tileWords";
import type { PuzzleKind, PuzzleLevel } from "../src/lib/puzzles/puzzles.types";
import { tapKana } from "./kanaTyping";
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
  // Gomoji's own picture says its name on every row, G O M O J I, going green a row at a time until the last is all
  // green. John, 2026-09-26: "Update the GOMOJI image to say GOMOJI a bunch of times." Played first, then relettered.
  { kind: "gomoji", size: 6, level: "medium", seed: 20260924, fill: 0 },
  { kind: "gomojiKana", size: 4, level: "easy", seed: 20260925, fill: 2 },
  // Gomoji Mot and Gomoji Wort: the same shape of picture, French's and German's own words.
  { kind: "gomojiMot", size: 5, level: "easy", seed: 20260925, fill: 2 },
  { kind: "gomojiWort", size: 5, level: "easy", seed: 20260925, fill: 2 },
  // A 6×6 Tsunagi, level 8 (in the first row, open to anybody), all but two of its lines drawn and one of those begun: marbles, lines and washed cells.
  { kind: "tsunagi", size: 6, level: "easy", seed: 8, fill: 2 },
  // A Classic Kumimoji's first hand, most of it laid: a word across and words down from it, on the table's own colour.
  { kind: "kumimoji", size: 11, level: "medium", seed: 20260926, fill: 2 },
  // A Koushi four swaps into its fewest: greens, golds and plain letters still to place, and the four holes of the lattice.
  { kind: "koushi", size: 5, level: "medium", seed: 20260926, fill: 4 },
];

/**
 * A small crossword out of a Kumimoji hand, as a player would lay it: the
 * longest everyday word the hand makes, across, and then up to `downs` words
 * hanging down from its letters, two columns apart so they never touch. The
 * everyday words are Gomoji's easy answers, so the picture does not spell a
 * word nobody knows.
 */
function crosswordFrom(hand: string, downs: number): { letter: string; square: string }[] {
  const fits = (word: string, letters: string) => [...lettersOf(word)].every(([letter, count]) => (lettersOf(letters).get(letter) ?? 0) >= count);
  const everyday = (length: number) => (length === 4 || length === 5 ? answersFor(length, true) : tileWords().byLength.get(length)!);
  const across = [5, 4].map((length) => everyday(length).find((word) => fits(word, hand))).find((word) => word !== undefined)!;
  const laid = [...across].map((letter, col) => ({ letter, square: `0,${col}` }));
  let left = hand;
  for (const letter of across) left = left.replace(letter, "");
  let from = -2;
  for (let col = 0; col < across.length && laid.length < hand.length; col += 1) {
    if (col - from < 2 || downs === 0) continue;
    const down = [5, 4]
      .map((length) => everyday(length).find((word) => word[0] === across[col] && fits(word.slice(1), left)))
      .find((word) => word !== undefined);
    if (down === undefined) continue;
    for (const [row, letter] of [...down.slice(1)].entries()) {
      laid.push({ letter, square: `${row + 1},${col}` });
      left = left.replace(letter, "");
    }
    from = col;
    downs -= 1;
  }
  return laid;
}

test.describe("puzzle screenshots", () => {
  test.skip(process.env.GAME_SCREENSHOTS !== "1", "Set GAME_SCREENSHOTS=1 to write them.");
  // The kana Gomoji is made from a list loaded a length at a time, here as in the browser.
  test.beforeAll(prepareEveryPuzzle);

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
      // The board colour a Kumimoji scene found, to put back after its picture.
      let feltBefore: string | null = null;
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
      } else if (scene.kind === "gomoji") {
        /*
         * Every row played as a person plays it, so every place holds a real stone
         * drawn by the grid itself — then each stone is relettered GOMOJI and
         * given the look of the mark its row's story needs. Only the letters and
         * the colours change: the board, the stones and their sizes are the game's.
         */
        const rows = await page.locator('[data-testid="word-tile"][data-row]').evaluateAll((tiles) => new Set(tiles.map((tile) => tile.getAttribute("data-row"))).size);
        const fillers = answersFor(scene.size, false).filter((word) => word !== puzzle.solution);
        for (const guess of fillers.slice(0, rows - 1)) {
          await page.keyboard.type(guess);
          await page.keyboard.press("Enter");
          filled += 1;
        }
        await page.keyboard.type(fillers[rows - 1]!);
        await expect(page.locator('[data-testid="word-tile"] span')).toHaveCount(rows * scene.size);
        await page.evaluate(
          ({ looks, rows }) => {
            const name = "GOMOJI";
            // The order places turn green in, so the greens gather from both ends rather than in a line.
            const greenOrder = [0, 5, 2, 3, 1, 4];
            for (const tile of document.querySelectorAll<HTMLElement>('[data-testid="word-tile"]')) {
              const row = Number(tile.dataset.row);
              const at = [...tile.parentElement!.children].filter((each) => (each as HTMLElement).dataset.row === tile.dataset.row).indexOf(tile);
              const greens = Math.round((name.length * row) / (rows - 1));
              const mark = greenOrder.indexOf(at) < greens ? "hit" : (row + at) % 2 === 0 ? "near" : "miss";
              const stone = tile.querySelector("span")!;
              stone.textContent = name[at]!.toLowerCase();
              Object.assign(stone.style, looks[mark]);
            }
          },
          { looks: WORD_STONE_LOOK, rows },
        );
      } else if (scene.kind === "gomojiMot") {
        // Two words that are not the answer, then the answer's first letters, typed as a person types them.
        const fillers = ["porte", "table"];
        for (const guess of fillers.filter((word) => word !== puzzle.solution).slice(0, scene.fill)) {
          await page.keyboard.type(guess);
          await page.keyboard.press("Enter");
          filled += 1;
        }
        await page.keyboard.type(puzzle.solution.slice(0, 2));
      } else if (scene.kind === "gomojiWort") {
        // German's answer may carry an umlaut, which `keyboard.type` cannot send: the on-screen keys instead,
        // shown first — hidden by default on a desktop's pointer, as a phone's own screen would show them.
        await page.getByTestId("word-keys-toggle").click();
        for (const guess of ["haben", "leben"].filter((word) => word !== puzzle.solution).slice(0, scene.fill)) {
          for (const letter of guess) await page.getByTestId(`word-key-${letter}`).click();
          await page.getByTestId("word-key-enter").click();
          filled += 1;
        }
        for (const letter of puzzle.solution.slice(0, 2)) await page.getByTestId(`word-key-${letter}`).click();
      } else if (scene.kind === "gomojiKana") {
        // Two common words that light something up, then the word's first two kana: the colours, the arrows if any, and the free grey row above.
        const target = [...puzzle.solution];
        const lit = kanaWordsOf(scene.size).easy.filter(
          (word) => word !== puzzle.solution && markKanaGuess([...word], target).some((each) => each.mark !== "miss"),
        );
        for (const guess of lit.slice(0, scene.fill)) {
          await tapKana(page, guess);
          await page.getByTestId("kana-key-enter").click();
          filled += 1;
        }
        await tapKana(page, target.slice(0, 2).join(""));
        // The picture is the grid alone, with its keys put away again.
        await page.getByTestId("word-keys-toggle").click();
      } else if (scene.kind === "tsunagi") {
        // Drawn by dragging, as a player draws: the whole board on screen, then each line through its cells' centres.
        await page.setViewportSize({ width: 1280, height: 1100 });
        const box = (await page.getByTestId("tsunagi-board").boundingBox())!;
        const centre = (cell: number) => ({
          x: box.x + (((cell % scene.size) + 0.5) * box.width) / scene.size,
          y: box.y + ((Math.floor(cell / scene.size) + 0.5) * box.height) / scene.size,
        });
        const letters = [...new Set([...puzzle.givens].filter((char) => char !== "."))];
        for (const [at, letter] of letters.entries()) {
          if (at >= letters.length - scene.fill + 1) break;
          const line = tsunagiLine(puzzle.givens, puzzle.solution, scene.size, letter);
          const cells = at === letters.length - scene.fill ? line.slice(0, Math.ceil(line.length / 2)) : line;
          await page.mouse.move(centre(cells[0]!).x, centre(cells[0]!).y);
          await page.mouse.down();
          for (const cell of cells.slice(1)) await page.mouse.move(centre(cell).x, centre(cell).y, { steps: 3 });
          await page.mouse.up();
          filled += 1;
        }
      } else if (scene.kind === "kumimoji") {
        // Tapped from the hand onto the table, as a player lays them; Fit and the pad are controls, not part of the picture.
        await page.addStyleTag({ content: '[data-testid="kumimoji-fit"], [data-testid="kumimoji-pad"] { display: none !important; }' });
        // On the default board, ruled as the default Reversi board is: John, 2026-09-26, "grid lines, and the default light brown board".
        // The operator's colour is put back after the picture, since it is kept on the account every other scene reads.
        feltBefore = await page.locator('[data-testid="felt-patches"] [aria-checked="true"]').first().getAttribute("data-testid");
        await page.getByTestId("felt-wood").click();
        await page.getByTestId("word-style-reversi").click();
        await expect(page.getByTestId("kumimoji-table")).toHaveAttribute("data-board", "reversi");
        for (const tile of crosswordFrom(puzzle.givens.slice(0, scene.size), scene.fill)) {
          await page.locator(`[data-testid="kumimoji-hand-tile"][data-letter="${tile.letter}"]`).first().click();
          await page.locator(`[data-testid="kumimoji-square"][data-square="${tile.square}"]`).click();
          filled += 1;
        }
      } else if (scene.kind === "koushi") {
        // The first few of the fewest swaps, each tapped as a person taps them: one tile, then its partner.
        for (const [a, b] of decodePlay(puzzle.solution)!.swaps.slice(0, scene.fill)) {
          await page.locator(`[data-testid="koushi-tile"][data-koushi-cell="${a}"]`).click();
          await page.locator(`[data-testid="koushi-tile"][data-koushi-cell="${b}"]`).click();
          filled += 1;
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
      // A Kumimoji has no board: its picture is the table under its tiles, fitted to them.
      if (scene.kind === "kumimoji") {
        await page.getByTestId("kumimoji-area").screenshot({ path: `${OUT}/${scene.kind}.jpg`, type: "jpeg", quality: 82 });
        if (feltBefore !== null && feltBefore !== "felt-wood") await page.getByTestId(feltBefore).click();
        return;
      }
      const grid = page.getByTestId("puzzle-grid");
      await expect(grid).toBeVisible();
      // The board in its wood and nothing round it, as a game's picture is taken (game-screenshots.spec.ts):
      // the letters and numbers along a played board's edges are for playing it, not for its picture.
      // John, 2026-09-26: "they do not have a numbered border."
      const board = grid.locator(".aspect-square").first();
      await expect(board).toBeVisible();
      await board.screenshot({ path: `${OUT}/${scene.kind}.jpg`, type: "jpeg", quality: 82 });
    });
  }
});

/** A Tsunagi pair's line in a level's answer, from its first stone to its second. */
function tsunagiLine(layout: string, answer: string, size: number, letter: string): number[] {
  const line = [layout.indexOf(letter)];
  for (;;) {
    const at = line[line.length - 1]!;
    const next = [at - size, at + 1, at + size, at - 1].find(
      (cell) => cell >= 0 && cell < size * size && answer[cell] === letter && !line.includes(cell) && (Math.abs(cell - at) === size || Math.floor(cell / size) === Math.floor(at / size)),
    );
    if (next === undefined) return line;
    line.push(next);
  }
}
