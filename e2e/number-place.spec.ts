import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { ready } from "./support";

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
    await page.getByTestId(`puzzle-size-${SIZE}`).click();
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

  test("the catalogue lists the Numbers family with the puzzle in it, and the two-player set-up does not", async ({ page }) => {
    await page.goto("/games");
    const family = page.getByTestId("lobby-family").filter({ hasText: "Numbers" });
    await expect(family).toHaveCount(1);
    await expect(family.locator('[data-testid="family-game"][data-variant="numberPlace"]')).toHaveCount(1);
    // Folded shut like every family but the first: open it, then its line is there to read.
    await family.locator("summary").click();
    await expect(family.getByTestId("puzzle-line")).toBeVisible();
    await expect(family.getByTestId("puzzle-line-solve")).toHaveAttribute("href", `${AT}/new`);

    await page.goto("/games/new");
    await expect(page.getByRole("tab", { name: /Numbers/ })).toHaveCount(0);
  });
});
