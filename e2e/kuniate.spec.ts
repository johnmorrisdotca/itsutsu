import { expect, test, type Page } from "@playwright/test";

import { country, countryName } from "@johnmorrisdotca/kuni";

import { dailySeed } from "../src/lib/puzzles/daily";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import type { Puzzle, PuzzleLevel } from "../src/lib/puzzles/puzzles.types";
import { freshPuzzleSeed, ready } from "./support";

/**
 * KUNIATE 国当て: a country named from its outline, flag or capital, in six guesses. Played by
 * typing in the box and pressing a name on the list, as a reader does; the country made from the same seed the page uses.
 * Its own: one card with three ways of asking, a wrong guess that says how far and which way, and a loss that shows the answer.
 */
const AT = "/games/kuniate";

const NAMES: Record<string, string> = { JP: "Japan", FR: "France", DE: "Germany", BR: "Brazil", CA: "Canada", AU: "Australia", EG: "Egypt" };
/** Six places to guess wrong with, none of them the answer. */
const wrongGuesses = (hidden: string) => Object.keys(NAMES).filter((code) => code !== hidden).slice(0, 6);

async function openPlay(page: Page, way: number, level: PuzzleLevel = "easy"): Promise<Puzzle> {
  const seed = freshPuzzleSeed();
  await page.goto(`${AT}/play?size=${way}&level=${level}&seed=${seed}`);
  await ready(page, "puzzle-play");
  return generatePuzzle("kuniate", way, level, seed);
}

/** Types as much of a place's name as a reader would, and presses it on the list. */
async function guess(page: Page, code: string, typed: string) {
  await page.getByTestId("kuniate-input").fill(typed);
  await page.locator(`[data-testid="kuniate-match"][data-code="${code}"]`).click();
  await expect(page.getByTestId("kuniate-input").or(page.getByTestId("puzzle-done")).or(page.getByTestId("word-out")).first()).toBeVisible();
}

test.describe("Kuniate, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, it is at home in Word games, with today's puzzle a link for each way of asking", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText("Kuniate");
    await expect(page.getByTestId("game-family")).toContainText("Word games");
    await expect(page.getByTestId("game-daily")).toHaveCount(3);
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.locator("main")).toContainText("how far that place is from the answer");
    await expect(page.locator("main")).not.toContainText(/worldle|globle|flagle/i);
  });
});

test.describe("Kuniate", () => {
  test("set up by its way of asking, found in two guesses, scored and kept", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="1"]').click();
    await expect(page.getByTestId("set-up-puzzle-preview").getByTestId("kuniate-outline")).toBeVisible();
    await page.locator('[data-testid="set-up-size"][data-size="2"]').click();
    await expect(page.getByTestId("set-up-puzzle-preview").getByTestId("kuniate-flag")).toBeVisible();
    await page.locator('[data-testid="set-up-size"][data-size="3"]').click();
    await expect(page.getByTestId("set-up-puzzle-preview").getByTestId("kuniate-capital")).not.toBeEmpty();
    await page.locator('[data-testid="set-up-size"][data-size="1"]').click();
    await page.getByTestId("puzzle-level-easy").click();
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/seed=\d+/);
    await ready(page, "puzzle-play");
    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    const puzzle = generatePuzzle("kuniate", 1, "easy", seed);
    await expect(page.getByTestId("kuniate-outline")).toBeVisible();
    await expect(page.getByTestId("puzzle-clock")).toHaveText("0:00");

    const wrong = wrongGuesses(puzzle.solution)[0]!;
    await guess(page, wrong, NAMES[wrong]!);
    const row = page.locator('[data-testid="kuniate-row"][data-used="true"]');
    await expect(row).toHaveCount(1);
    await expect(row.first()).toHaveAttribute("data-right", "false");
    // A wrong guess says how far and which way.
    await expect(row.first()).toHaveAttribute("data-km", /^\d+$/);
    await expect(row.first()).toHaveAttribute("data-way", /^(n|ne|e|se|s|sw|w|nw)$/);
    await expect(row.first()).toContainText("km");
    await expect(page.getByTestId("kuniate-said")).toContainText("5 guesses left");

    // The answer, typed as Kuni spells it.
    const hiddenName = countryName(puzzle.solution, "en", { short: true })!;
    await guess(page, puzzle.solution, hiddenName);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("kuniate-was")).toHaveText(hiddenName);
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("solve-board").locator('[data-testid="kuniate-row"][data-right="true"]')).toHaveCount(1);
  });

  test("the flag and the capital ask the same way, and Enter takes the first name on the list", async ({ page }) => {
    const flag = await openPlay(page, 2);
    await expect(page.getByTestId("kuniate-flag").locator("svg")).toBeVisible();
    const wrong = wrongGuesses(flag.solution)[0]!;
    await page.getByTestId("kuniate-input").fill(NAMES[wrong]!);
    await page.getByTestId("kuniate-input").press("Enter");
    await expect(page.locator(`[data-testid="kuniate-row"][data-code="${wrong}"]`)).toBeVisible();
    await expect(page.getByTestId("kuniate-input")).toHaveValue("");

    const capital = await openPlay(page, 3);
    await expect(page.getByTestId("kuniate-capital")).toHaveText(country(capital.solution)!.capital!.en);
  });

  test("six wrong guesses end it, kept, with the answer shown and the way on offered", async ({ page }) => {
    const puzzle = await openPlay(page, 1);
    for (const wrong of wrongGuesses(puzzle.solution)) await guess(page, wrong, NAMES[wrong]!);
    await expect(page.getByTestId("word-out")).toContainText("Out of 6 guesses");
    await expect(page.getByTestId("kuniate-was")).toHaveText(countryName(puzzle.solution, "en", { short: true })!);
    await expect(page.getByTestId("kuniate-input")).toHaveCount(0);
    await expect(page.getByTestId("word-kept")).toContainText("Kept");
    await page.getByTestId("word-another").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("kuniate-input")).toBeEnabled();
    await expect(page.locator('[data-testid="kuniate-row"][data-used="true"]')).toHaveCount(0);
  });

  test("left half done it waits in My games and opens with its guesses", async ({ page }) => {
    const puzzle = await openPlay(page, 1);
    const wrong = wrongGuesses(puzzle.solution).slice(0, 2);
    for (const each of wrong) await guess(page, each, NAMES[each]!);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", wrong.join(""));
    await page.getByTestId("puzzle-pause").click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-kind="kuniate"][data-seed="${puzzle.seed}"]`);
    await expect(row).toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", wrong.join(""));
    await expect(page.locator('[data-testid="kuniate-row"][data-used="true"]')).toHaveCount(2);
  });

  test("today's puzzle is one seed for everybody, whichever way is chosen", async ({ page }) => {
    await page.goto(AT);
    await page.locator('[data-testid="game-daily"][data-way="2"]').click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-seed", String(dailySeed(new Date())));
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-way", "flag");
  });

  test("is one card on Word games' shelf", async ({ page }) => {
    await page.goto("/games/kuniate/family");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Word games");
    await expect(page.getByTestId("family-games").getByText("Kuniate", { exact: false })).toHaveCount(1);
  });
});
