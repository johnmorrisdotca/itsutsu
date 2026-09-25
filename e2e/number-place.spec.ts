import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells, symbolOf } from "../src/lib/puzzles/puzzleCode";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, ready } from "./support";

/**
 * Number Place, the first puzzle: found, set up, solved and paid.
 *
 * The puzzle is made in the browser from the seed in the address, and the
 * same generator run here makes the same grid, so the spec knows the answer
 * without reading it off the page — it fills the cells the way a person
 * would, by tapping a cell and then a number key. A 4×4 easy puzzle, because
 * the rule this shows (fill it right, the clock stops, the site pays) is the
 * same at every size and a 9×9 is eighty-one taps for nothing more.
 *
 * `ready()` before anything: the grid is drawn in the browser only
 * (`ssr: false`), so nothing here can be a race with hydration, and a wait on
 * the mark is what says the browser has made the puzzle.
 */
const SIZE = 4;
const LEVEL = "easy";
const SEED = 5;
const KIND = "numberPlace";
// The name and the address come from the tables, so a rename there renames this spec.
const NAME = PUZZLE_DISPLAY[KIND].label;
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

test.describe("the first puzzle", () => {
  test("the front door says what it is, and leads to the set-up and the rules", async ({ page }) => {
    await page.goto(AT);
    const door = page.getByTestId("game-front-door");
    await expect(door).toHaveAttribute("data-kind", "puzzle");
    await expect(door.getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("Sudoku");
    await expect(page.getByTestId("game-set-up")).toHaveAttribute("href", `${AT}/new`);
    await expect(page.getByTestId("game-rules-link")).toHaveAttribute("href", `${AT}/rules`);
    // Its family, and the family's picture, as on every game's page.
    await expect(page.getByTestId("game-family")).toContainText("Numbers");
    await expect(page.getByTestId("game-family").getByTestId("family-mark")).toHaveAttribute("data-family", "Numbers");
  });

  test("the rules page is the game template, with a Solve link and no record", async ({ page }) => {
    await page.goto(`${AT}/rules`);
    await expect(page.getByTestId("rules-page")).toContainText("Sizes: 4×4, 6×6, 9×9");
    await expect(page.getByTestId("rules-page").getByRole("link", { name: `Solve ${NAME}` })).toHaveAttribute("href", `${AT}/new`);
    await expect(page.getByTestId("rules-record-link")).toHaveCount(0);
  });

  test("the set-up chooses a size and a level, and the address carries both", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    // The board games' own size tiles: the big number in the board's lattice (BoardSizeMark), pressed like any board.
    const tile = page.locator(`[data-testid="set-up-size"][data-size="${SIZE}"]`);
    await expect(tile.getByTestId("board-size-mark")).toBeVisible();
    await tile.click();
    await expect(tile).toHaveAttribute("data-chosen", "true");
    await page.getByTestId(`puzzle-level-${LEVEL}`).click();
    await expect(page.getByTestId("puzzle-level-blurb")).toContainText("nothing has to be tried");
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", `${AT}/play?size=${SIZE}&level=${LEVEL}`);
    await page.getByTestId("puzzle-solve").click();
    // A seed nobody chose is drawn and written into the address.
    await expect(page).toHaveURL(new RegExp(`${AT}/play\\?size=${SIZE}&level=${LEVEL}&seed=\\d+$`));
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-size", String(SIZE));
  });

  test("filling it right stops the clock and pays the operator", async ({ page }) => {
    const puzzle = generateNumberPlace(SIZE, LEVEL, SEED);
    const givens = decodeCells(puzzle.givens, SIZE)!;
    const solution = decodeCells(puzzle.solution, SIZE)!;

    await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${SEED}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-seed", String(SEED));
    const cells = page.getByTestId("puzzle-cell");
    await expect(cells).toHaveCount(SIZE * SIZE);
    // The givens are printed as the generator made them.
    for (const [index, given] of givens.entries()) {
      if (given !== 0) await expect(cells.nth(index)).toHaveAttribute("data-value", String(given));
    }

    // Check before anything is entered is not offered: the clock has not started.
    await expect(page.getByTestId("puzzle-check")).toBeDisabled();

    // One wrong entry first, so Check has something to say, and the clock is running.
    const firstEmpty = givens.findIndex((given) => given === 0);
    const wrong = (solution[firstEmpty] % SIZE) + 1;
    await cells.nth(firstEmpty).click();
    await page.getByTestId(`puzzle-key-${wrong}`).click();
    await expect(page.getByTestId("puzzle-check")).toBeEnabled();
    await page.getByTestId("puzzle-check").click();
    await expect(page.getByTestId("puzzle-checked")).toContainText("1 cell is wrong");

    for (const [index, given] of givens.entries()) {
      if (given !== 0) continue;
      await cells.nth(index).click();
      await page.getByTestId(`puzzle-key-${solution[index]}`).click();
    }

    const done = page.getByTestId("puzzle-done");
    await expect(done).toContainText("Solved");
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-done", "true");
    // The operator has an account (auth.setup makes its row), so the site pays, or says it already has.
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid/);
    await expect(page.getByTestId("puzzle-another")).toBeVisible();
    await expect(page.getByTestId("puzzle-set-up")).toHaveAttribute("href", `${AT}/new`);
  });

  /*
   * John, 2026-09-24: "allow the user to click through the 1, 2, 3, 4, 5, X, 1,
   * 2, 3.... so they can just keep tapping". The first tap chooses the cell and
   * writes nothing; every tap after it steps the cell on, and past the largest
   * number it empties. A given does not step.
   */
  test("the 16×16 Giant is written 1 to 9 then A to G, and typing the letters finishes it", async ({ page }) => {
    // A fresh seed: a finished puzzle is not kept, but a run that stops half way would be, and would meet the next.
    const seed = freshPuzzleSeed();
    const puzzle = generateNumberPlace(16, LEVEL, seed);
    const givens = decodeCells(puzzle.givens, 16)!;
    const solution = decodeCells(puzzle.solution, 16)!;

    await page.goto(`${AT}/play?size=16&level=${LEVEL}&seed=${seed}`);
    await ready(page, "puzzle-play");
    const cells = page.getByTestId("puzzle-cell");
    await expect(cells).toHaveCount(256);
    // Sixteen symbol keys and a clear, the letters printed on them.
    await expect(page.getByTestId("puzzle-key-10")).toHaveText("A");
    await expect(page.getByTestId("puzzle-key-16")).toHaveText("G");
    const printedLetter = givens.findIndex((given) => given >= 10);
    await expect(cells.nth(printedLetter)).toHaveText(symbolOf(givens[printedLetter]!));

    // Typed, as a person at a keyboard would: lower case letters are read too.
    for (const [index, given] of givens.entries()) {
      if (given !== 0) continue;
      await cells.nth(index).click();
      await page.keyboard.press(symbolOf(solution[index]!).toLowerCase());
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("tapping the chosen cell again steps it through the numbers and back to empty", async ({ page }) => {
    // A grid of its own: this leaves its puzzle unfinished, and an unfinished puzzle is kept.
    const seed = freshPuzzleSeed();
    const givens = decodeCells(generateNumberPlace(SIZE, LEVEL, seed).givens, SIZE)!;
    await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${seed}`);
    await ready(page, "puzzle-play");
    const cells = page.getByTestId("puzzle-cell");
    const empty = cells.nth(givens.findIndex((given) => given === 0));

    await empty.click();
    await expect(empty).toHaveAttribute("data-value", "");
    for (const value of ["1", "2", "3", "4", "", "1"]) {
      await empty.click();
      await expect(empty).toHaveAttribute("data-value", value);
    }

    const given = givens.findIndex((cell) => cell !== 0);
    await cells.nth(given).click();
    await cells.nth(given).click();
    await expect(cells.nth(given)).toHaveAttribute("data-value", String(givens[given]));
  });

  /*
   * John, 2026-09-24: "Also a Game Pause, since I notice there is a clock." A
   * pause stops the clock and covers the grid, so it cannot be spent looking;
   * Resume uncovers it and the clock goes on from where it stopped.
   */
  test("Pause stops the clock and covers the grid, and Resume brings both back", async ({ page }) => {
    await page.clock.install();
    // A grid of its own: this leaves its puzzle unfinished, and an unfinished puzzle is kept.
    const seed = freshPuzzleSeed();
    const givens = decodeCells(generateNumberPlace(SIZE, LEVEL, seed).givens, SIZE)!;
    await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${seed}`);
    await ready(page, "puzzle-play");
    const clock = page.getByTestId("puzzle-clock");
    const pause = page.getByTestId("puzzle-pause");
    // Nothing to pause before the clock has started.
    await expect(page.getByTestId("puzzle-check")).toBeDisabled();
    await expect(pause).toHaveCount(0);

    await page.getByTestId("puzzle-cell").nth(givens.findIndex((given) => given === 0)).click();
    await page.getByTestId("puzzle-key-1").click();
    await page.clock.fastForward(5_000);
    await expect(clock).toHaveText("0:05");

    await pause.click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await expect(page.getByTestId("puzzle-grid")).toBeHidden();
    await page.clock.fastForward(60_000);
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await expect(clock).toHaveText("0:05");

    await page.getByTestId("puzzle-resume").click();
    await expect(page.getByTestId("puzzle-grid")).toBeVisible();
    await page.clock.fastForward(3_000);
    await expect(clock).toHaveText("0:08");

    // P does the same from the keyboard.
    await page.keyboard.press("p");
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.keyboard.press("p");
    await expect(page.getByTestId("puzzle-paused")).toHaveCount(0);
  });

  test("the route refuses a grid that is not a solution, and pays nothing for it", async ({ request }) => {
    const puzzle = generateNumberPlace(SIZE, LEVEL, SEED);
    const wrong = puzzle.solution.slice(1) + puzzle.solution[0];
    const refused = await request.post("/api/puzzles/solved", {
      data: { kind: KIND, size: SIZE, level: LEVEL, givens: puzzle.givens, answer: wrong },
    });
    expect(refused.status()).toBe(422);
    const nonsense = await request.post("/api/puzzles/solved", { data: { kind: "chess", size: 8 } });
    expect(nonsense.status()).toBe(400);
  });

  test("the catalogue lists the Numbers family with the puzzle in it, and the set-up screen offers it too", async ({ page }) => {
    await page.goto("/games");
    const family = page.getByTestId("lobby-family").filter({ hasText: "Numbers" });
    await expect(family).toHaveCount(1);
    await expect(family.locator('[data-testid="family-game"][data-variant="numberPlace"]')).toHaveCount(1);
    // Folded shut like every family but the first: open it, then its line is there to read.
    await family.locator("summary").click();
    const card = family.locator(`[data-testid="family-game"][data-variant="${KIND}"]`);
    await expect(card.getByTestId("puzzle-line")).toBeVisible();
    await expect(card.getByTestId("puzzle-line-solve")).toHaveAttribute("href", `${AT}/new`);

    // Since 0.285.2 the set-up screen has the family too, and turns to a puzzle chosen there: see set-up-puzzles.spec.ts.
    await page.goto("/games/new");
    await ready(page, "set-up-game");
    await expect(page.getByTestId("set-up-family").filter({ hasText: /Numbers|数/ })).toHaveCount(1);
  });
});
