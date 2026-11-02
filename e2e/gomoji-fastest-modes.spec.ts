import { expect, test } from "@playwright/test";

import { mySolvePath, PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { hiddenWordsOf } from "../src/lib/puzzles/gomoji/futago";
import { freshYotsugoSeed } from "../src/lib/puzzles/gomoji/yotsugoSeed";
import { prepareEveryPuzzle } from "../src/lib/puzzles/prepareEvery";
import { newestSolveOf } from "./members";
import { suiteOperator } from "./operator";
import { freshPuzzleSeed } from "./support";
import { loadEveryWordList } from "./wordLists";

test.beforeAll(loadEveryWordList);
test.beforeAll(prepareEveryPuzzle);

/**
 * A GOMOJI'S FASTEST TIMES ARE A TABLE FOR EACH COUNT OF WORDS. A Yotsugo (four
 * words, nine guesses at hard) was ranked against one-word times, because the
 * board was cut by size, level and clock alone. A solve of four words must be
 * on the four-word table at its size and level, never on the one-word table
 * beside it however fast it was, and its heading leads to exactly its solves.
 */
test("a Yotsugo solve is on the four-word table and not the one-word table, and the table's link leads to its own solves", async ({ page }) => {
  const AT = `/games/${PUZZLE_SLUGS.gomoji}`;
  const seed = freshYotsugoSeed();
  const puzzle = generatePuzzle("gomoji", 5, "hard", seed);
  const words = [...hiddenWordsOf("gomoji", 5, puzzle.givens)!.words];
  // A one-word solve at the same size and level, first and slower, so that only the table can tell the two apart.
  const singleSeed = freshPuzzleSeed();
  const single = generatePuzzle("gomoji", 5, "hard", singleSeed);
  const alone = await page.request.post("/api/puzzles/solved", {
    data: { kind: "gomoji", size: 5, level: "hard", seed: singleSeed, givens: single.givens, answer: single.solution, elapsedMs: 120_000 },
  });
  expect(alone.ok(), await alone.text()).toBe(true);
  const handed = await page.request.post("/api/puzzles/solved", {
    data: { kind: "gomoji", size: 5, level: "hard", seed, givens: puzzle.givens, answer: words.join(""), elapsedMs: 400 },
  });
  expect(handed.ok(), await handed.text()).toBe(true);
  const solveId = await newestSolveOf(suiteOperator().email, "gomoji");

  await page.goto(`${AT}/standings`);
  const four = page.locator('[data-testid="puzzle-fastest-row"][data-size="5"][data-level="hard"][data-clock="none"][data-word-count="4"]');
  await expect(four).toBeVisible();
  await expect(four.getByTestId("puzzle-fastest-mode")).toContainText("Yotsugo");
  await expect(four.locator("[data-solve]").first()).toBeVisible();
  const one = page.locator('[data-testid="puzzle-fastest-row"][data-size="5"][data-level="hard"][data-clock="none"][data-word-count="1"]');
  await expect(one).toBeVisible();
  await expect(one.getByTestId("puzzle-fastest-mode")).toHaveCount(0);

  // Each table holds only solves of its own count: none of the four-word table's rows is on the one-word table.
  const fourIds = await four.locator("[data-solve]").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-solve")));
  const oneIds = await one.locator("[data-solve]").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-solve")));
  expect(fourIds.length).toBeGreaterThan(0);
  for (const id of fourIds) expect(oneIds).not.toContain(id);

  // Its heading leads to the solves it ranks: this size, level, clock and count of words.
  await expect(four.getByTestId("puzzle-fastest-every")).toHaveAttribute("href", /size=5&level=hard&clock=none&words=4/);
  await four.getByTestId("puzzle-fastest-every").click();
  await expect(page.locator('[data-narrowing="words"]')).toContainText("Yotsugo");
  await expect(page.locator(`[data-testid="record-solve"][data-solve="${solveId}"]`).first()).toBeVisible();
  const kept = await page.getByTestId("record-solve").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-solve")));
  for (const id of oneIds) expect(kept).not.toContain(id);

  // The solve's own page names the mode on the link to its fastest times.
  await page.goto(mySolvePath("gomoji", solveId));
  await expect(page.getByTestId("solve-fastest-here")).toContainText("Yotsugo");
  await expect(page.getByTestId("solve-fastest-here")).toHaveAttribute("href", /words=4/);
});
