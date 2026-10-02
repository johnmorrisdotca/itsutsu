import { expect, test, type Locator } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { isWord } from "../src/lib/puzzles/gomoji/code";
import { freshPuzzleSeed, ready } from "./support";
import { loadEveryWordList } from "./wordLists";

test.beforeAll(loadEveryWordList);

/**
 * A FINISHED WORD'S REPLAY LETS EACH STEP'S LETTERS ARRIVE. John, 2026-10-02:
 * when a step reveals a word, "quickly animate each of the N letters… quite
 * fast", and "going forwards vs backwards would reverse the animations too".
 *
 * The case solves its own word (a miss, then the answer) and drives the
 * replay's buttons and scrubber as a reader does; it reloads nowhere. A
 * recorder watches the letters' `data-reveal` from before each press, because
 * the animation is shorter than a poll and an assertion made after it would
 * say nothing about whether it ran.
 */
const KIND = "gomoji";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

type Seen = { at: number; value: string | null; row: number; end: boolean };

/** Starts recording every change of a letter's `data-reveal` inside the replay, with when it happened. */
async function record(replay: Locator) {
  await replay.evaluate((root) => {
    const seen: Seen[] = [];
    (window as unknown as { __seen: Seen[] }).__seen = seen;
    new MutationObserver((changes) => {
      for (const change of changes) {
        const el = change.target as HTMLElement;
        seen.push({ at: performance.now(), value: el.getAttribute("data-reveal"), row: Number(el.getAttribute("data-row")), end: el.getAttribute("data-reveal-end") === "true" });
      }
    }).observe(root, { subtree: true, attributes: true, attributeFilter: ["data-reveal"] });
  });
}
const seen = (replay: Locator) => replay.evaluate(() => (window as unknown as { __seen: Seen[] }).__seen);

async function solvedReplay(page: import("@playwright/test").Page) {
  const seed = freshPuzzleSeed();
  const puzzle = generatePuzzle(KIND, 5, "easy", seed);
  const [miss] = ["slate", "irony", "chump", "gawky"].filter((word) => word !== puzzle.solution && isWord(word, 5));
  await page.goto(`${AT}/play?size=5&level=easy&seed=${seed}`);
  await ready(page, "puzzle-play");
  await page.keyboard.type(miss!);
  await page.keyboard.press("Enter");
  await page.keyboard.type(puzzle.solution);
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  // The win card covers the board until it is put aside, as a reader does.
  await page.getByTestId("win-cover-see-board").click();
  const replay = page.getByTestId("word-replay");
  await expect(replay).toHaveAttribute("data-last", "2");
  return { replay, solution: puzzle.solution, miss: miss! };
}

test("a step on brings its letters in left to right, quickly, and a step back takes them out the other way", async ({ page }) => {
  const { replay, miss } = await solvedReplay(page);
  await page.getByTestId("word-replay-start").click();
  await expect(replay).toHaveAttribute("data-at", "0");
  await expect(replay.locator("[data-reveal]")).toHaveCount(0);

  await record(replay);
  await page.getByTestId("word-replay-forward").click();
  await expect(replay).toHaveAttribute("data-at", "1");
  // The five letters of row 0 came in, the last of them flagged as the one that ends it, and then nothing is left animating.
  await expect(replay.locator("[data-reveal]")).toHaveCount(0);
  let events = await seen(replay);
  const arrived = events.filter((event) => event.value === "in");
  expect(arrived).toHaveLength(5);
  expect(arrived.every((event) => event.row === 0)).toBe(true);
  expect(arrived.filter((event) => event.end)).toHaveLength(1);
  const cleared = events.find((event) => event.value === null)!;
  expect(cleared.at - arrived[0]!.at).toBeLessThan(500);
  await expect(replay.locator('[data-testid="word-tile"][data-row="0"]').first()).toHaveAttribute("aria-label", new RegExp(`^${miss[0]!.toUpperCase()}`));

  // Back: the row is still drawn, leaving, and is empty once it has gone.
  await record(replay);
  await page.getByTestId("word-replay-back").click();
  await expect(replay).toHaveAttribute("data-at", "0");
  await expect(replay.locator("[data-reveal]")).toHaveCount(0);
  events = await seen(replay);
  const left = events.filter((event) => event.value === "out");
  expect(left).toHaveLength(5);
  expect(left.every((event) => event.row === 0)).toBe(true);
  await expect(replay.locator('[data-testid="word-tile"][data-row="0"]').first()).toHaveAttribute("data-mark", "empty");
});

test("the scrubber animates the word it lands on, and only that one", async ({ page }) => {
  const { replay } = await solvedReplay(page);
  await page.getByTestId("word-replay-start").click();
  await expect(replay).toHaveAttribute("data-at", "0");

  await record(replay);
  await page.getByTestId("word-replay-scrubber").fill("2");
  await expect(replay).toHaveAttribute("data-at", "2");
  await expect(replay.locator("[data-reveal]")).toHaveCount(0);
  const events = await seen(replay);
  const arrived = events.filter((event) => event.value === "in");
  // Two words were passed over; the one landed on is the only one animated.
  expect(arrived).toHaveLength(5);
  expect(arrived.every((event) => event.row === 1)).toBe(true);
  await expect(replay.locator('[data-testid="word-tile"][data-row="0"]').first()).not.toHaveAttribute("data-mark", "empty");

  // And back to the start by the scrubber: the word it leaves goes out.
  await record(replay);
  await page.getByTestId("word-replay-scrubber").fill("0");
  await expect(replay).toHaveAttribute("data-at", "0");
  await expect(replay.locator("[data-reveal]")).toHaveCount(0);
  const out = (await seen(replay)).filter((event) => event.value === "out");
  expect(out).toHaveLength(5);
  expect(out.every((event) => event.row === 1)).toBe(true);
});

test("a device that asks for less motion sees the steps without any", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { replay } = await solvedReplay(page);
  await page.getByTestId("word-replay-start").click();
  await expect(replay).toHaveAttribute("data-at", "0");
  await record(replay);
  await page.getByTestId("word-replay-forward").click();
  await expect(replay).toHaveAttribute("data-at", "1");
  await page.getByTestId("word-replay-back").click();
  await expect(replay).toHaveAttribute("data-at", "0");
  expect(await seen(replay)).toHaveLength(0);
  await expect(replay.locator('[data-testid="word-tile"][data-row="0"]').first()).toHaveAttribute("data-mark", "empty");
});
