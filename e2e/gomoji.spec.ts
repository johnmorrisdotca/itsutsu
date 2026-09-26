import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { answersFor, breaksHardRule, isWord, markGuess } from "../src/lib/puzzles/gomoji/code";
import { guessesFor } from "../src/lib/puzzles/gomoji/layout";
import { knownCounts } from "../src/lib/puzzles/keyMarks";
import { wordScore } from "../src/lib/puzzles/gomoji/wordScore";
import { freshPuzzleSeed, ready } from "./support";

/**
 * Gomoji: a hidden word found in guesses, each coloured letter by letter.
 * Typed on the keyboard under the grid, as a phone is used, and on the desk's
 * keyboard; the colours on the page are the ones the rules give; a word the
 * list does not know is refused and costs nothing; and running out of guesses
 * ends the puzzle and shows the word.
 */
const KIND = "gomoji";
const LEVEL = "easy";
const NAME = PUZZLE_DISPLAY[KIND].label;
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

/** Two real words that are not the answer and share nothing with each other, for guesses that must miss. */
function misses(answer: string, count: number): string[] {
  return ["slate", "irony", "chump", "gawky", "fjord", "blitz", "crane", "mound"].filter((word) => word !== answer && isWord(word, 5)).slice(0, count);
}

test.describe("the word puzzle", () => {
  test("its front door names it, its family and what it is our version of", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("Wordle");
    await expect(page.getByTestId("game-family")).toContainText("Other");
  });

  test("the grid is drawn as Reversi, Gomoku or Tiles, the choice is kept for the next word, and taken back", async ({ page }) => {
    const seed = freshPuzzleSeed();
    await page.goto(`${AT}/play?size=5&level=${LEVEL}&seed=${seed}`);
    await ready(page, "puzzle-play");
    const grid = page.getByTestId("puzzle-grid");
    await page.getByTestId("word-style-reversi").click();
    await expect(grid).toHaveAttribute("data-style", "reversi");
    const [miss] = misses(generatePuzzle(KIND, 5, LEVEL, seed).solution, 1);
    await page.keyboard.type(miss!);
    await page.keyboard.press("Enter");
    // Stones on the wood, ruled: the letter on its stone, the mark unchanged.
    await expect(page.getByTestId("word-lines")).toHaveCount(1);
    await expect(page.locator('[data-testid="word-tile"][data-row="0"]').first()).toHaveAttribute("aria-label", new RegExp(`^${miss![0]!.toUpperCase()}, `));

    // Gomoku, chosen here, is what the next word opens in.
    const kept = page.waitForResponse((answer) => answer.url().endsWith("/api/me") && answer.request().method() === "PATCH");
    await page.getByTestId("word-style-gomoku").click();
    await expect(grid).toHaveAttribute("data-style", "gomoku");
    await expect(page.getByTestId("word-style-gomoku")).toHaveAttribute("aria-pressed", "true");
    expect((await kept).ok()).toBe(true);
    await page.goto(`${AT}/play?size=5&level=${LEVEL}&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    await expect(grid).toHaveAttribute("data-style", "gomoku");

    // Tiles draws no lines; and back to Reversi, where it started.
    await page.getByTestId("word-style-tiles").click();
    await expect(grid).toHaveAttribute("data-style", "tiles");
    await expect(page.getByTestId("word-lines")).toHaveCount(0);
    const back = page.waitForResponse((answer) => answer.url().endsWith("/api/me") && answer.request().method() === "PATCH");
    await page.getByTestId("word-style-reversi").click();
    expect((await back).ok()).toBe(true);
    await expect(grid).toHaveAttribute("data-style", "reversi");
  });

  test.describe("on a phone, where the letter keys show under the grid", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    test("the clock starts at the first letter tapped, not at the first guess sent", async ({ page }) => {
      // John, on an iPhone mid-word: "clock doesn't start on iPhone with keyboard use."
      await page.goto(`${AT}/play?size=5&level=${LEVEL}&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("puzzle-pause")).toBeDisabled();
      await page.getByTestId("word-key-a").click();
      await expect(page.getByTestId("puzzle-pause")).toBeEnabled();
      await expect(page.getByTestId("puzzle-clock")).not.toHaveText("0:00", { timeout: 5_000 });
    });

    test("a guess is coloured as the rules say, and the word found finishes it", async ({ page }) => {
      const seed = freshPuzzleSeed();
      const puzzle = generatePuzzle(KIND, 5, LEVEL, seed);
      await page.goto(`${AT}/play?size=5&level=${LEVEL}&seed=${seed}`);
      await ready(page, "puzzle-play");
      // Easy gives every row of the 9×9 board (`layout.ts`).
      await expect(page.getByTestId("word-tile")).toHaveCount(5 * guessesFor(KIND, 5, LEVEL, 0));

      // A word the list does not know is refused, and no row is spent on it.
      await page.keyboard.type("qqqqq");
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("word-said")).toContainText("not in the word list");
      for (let i = 0; i < 5; i += 1) await page.getByTestId("word-key-back").click();

      // A wrong word, typed on the keys under the grid, and its colours read off the tiles.
      const [miss] = misses(puzzle.solution, 1);
      for (const letter of miss!) await page.getByTestId(`word-key-${letter}`).click();
      await page.getByTestId("word-key-enter").click();
      const expected = markGuess(miss!, puzzle.solution);
      const row = page.locator('[data-testid="word-tile"][data-row="0"]');
      for (const [at, mark] of expected.entries()) await expect(row.nth(at)).toHaveAttribute("data-mark", mark);

      // The word, on the desk's keyboard.
      await page.keyboard.type(puzzle.solution);
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    // The game over, its board stays with its keyboard, and the scrubber replays it guess by guess (John: "the ability
    // to see the keyboard even after the game… replay the words chosen, with the keyboard visible").
    const replay = page.getByTestId("word-replay");
    await expect(replay).toHaveAttribute("data-last", "2");
    await expect(replay.getByTestId("word-keyboard")).toBeVisible();
    await expect(replay.getByTestId("word-keyboard")).toHaveAttribute("data-read-only", "true");
    await page.getByTestId("word-replay-start").click();
    await expect(replay).toHaveAttribute("data-at", "0");
    await expect(replay.locator('[data-testid="word-tile"][data-row="0"]').first()).toHaveAttribute("data-mark", "empty");
    await expect(replay.locator('[data-testid^="word-key-"][data-mark]:not([data-mark=""])')).toHaveCount(0);
    await page.getByTestId("word-replay-forward").click();
    await expect(replay).toHaveAttribute("data-at", "1");
    for (const [at, mark] of expected.entries()) {
      await expect(replay.locator('[data-testid="word-tile"][data-row="0"]').nth(at)).toHaveAttribute("data-mark", mark);
      if (mark !== "miss") await expect(replay.getByTestId(`word-key-${miss![at]}`)).toHaveAttribute("data-mark", /hit|near/);
    }
    await expect(replay.locator('[data-testid="word-tile"][data-row="1"]').first()).toHaveAttribute("data-mark", "empty");
    // Found: the word's own points on top of every letter placed, so never less than a word lost can make.
    expect(Number(await page.getByTestId("word-score").getAttribute("data-total"))).toBeGreaterThanOrEqual(300);
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid/);
    });
  });

  test.describe("on a phone, the keys of the row being typed", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("are ringed while their letter is in the row, and let go when it is cleared or sent", async ({ page }) => {
      const seed = freshPuzzleSeed();
      const [miss] = misses(generatePuzzle(KIND, 5, LEVEL, seed).solution, 1);
      await page.goto(`${AT}/play?size=5&level=${LEVEL}&seed=${seed}`);
      await ready(page, "puzzle-play");
      const key = (letter: string) => page.getByTestId(`word-key-${letter}`);
      for (const letter of miss!.slice(0, 2)) await key(letter).click();
      await expect(key(miss![0]!)).toHaveAttribute("data-typed", "true");
      await expect(key(miss![1]!)).toHaveAttribute("data-typed", "true");
      await expect(key(miss![2]!)).not.toHaveAttribute("data-typed", /./);
      // Cleared from the row, the key lets go.
      await page.locator('[data-testid="word-tile"][data-row="0"]').nth(0).click();
      await page.keyboard.press(" ");
      await expect(key(miss![0]!)).not.toHaveAttribute("data-typed", /./);
      // A letter twice in the row carries a count on its key; once, none.
      await page.locator('[data-testid="word-tile"][data-row="0"]').nth(0).click();
      await key(miss![1]!).click();
      await expect(key(miss![1]!).getByTestId("key-count")).toHaveText("2");
      await page.locator('[data-testid="word-tile"][data-row="0"]').nth(0).click();
      await page.keyboard.press(" ");
      await expect(key(miss![1]!).getByTestId("key-count")).toHaveCount(0);
      // Sent, no key is ringed.
      await key(miss![0]!).click();
      for (const letter of miss!.slice(2)) await key(letter).click();
      await page.getByTestId("word-key-enter").click();
      await expect(page.locator('[data-testid^="word-key-"][data-typed="true"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="word-tile"][data-row="0"]').first()).not.toHaveAttribute("data-mark", "typed");
    });
  });

  /*
   * John, 2026-09-26, on a solved PRIOR: "A Keyboard where a Letter was used
   * twice should show the (2) count superscript badge on the Letter R." Only
   * what the marks on the board prove: a guess whose two copies of a letter
   * are both green or yellow, and then the word itself.
   */
  test.describe("on a phone, a letter the guesses prove is in the word twice", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("carries the count on its key, live, in the replay and on the finished word's own page", async ({ page }) => {
      const answers = answersFor(5, false);
      const once = (word: string, letter: string) => word.split(letter).length === 2;
      // A seed whose word holds a letter twice and a letter once, and a real word, not the answer, proving both copies.
      const planFor = (seed: number) => {
        const hidden = generatePuzzle(KIND, 5, LEVEL, seed).solution;
        const letter = [...hidden].find((each, at) => hidden.indexOf(each) !== at);
        const single = [...hidden].find((each) => once(hidden, each));
        if (letter === undefined || single === undefined) return null;
        const proving = answers.find((word) => word !== hidden && isWord(word, 5) && (knownCounts([word], [markGuess(word, hidden)]).get(letter) ?? 0) >= 2);
        return proving === undefined ? null : { seed, hidden, letter, single, proving };
      };
      const plan = Array.from({ length: 300 }, () => freshPuzzleSeed())
        .map(planFor)
        .find((each) => each !== null);
      expect(plan, "a seed whose word has a letter twice").toBeDefined();
      const { seed, hidden, letter, single, proving } = plan!;
      const firstCounts = knownCounts([proving], [markGuess(proving, hidden)]);
      const proved = firstCounts.get(letter)!;
      const provedKeys = [...firstCounts.values()].filter((count) => count >= 2).length;
      const inWord = hidden.split(letter).length - 1;

      await page.goto(`${AT}/play?size=5&level=${LEVEL}&seed=${seed}`);
      await ready(page, "puzzle-play");
      const key = (each: string) => page.getByTestId(`word-key-${each}`);
      // Before any guess, nothing is known: no key carries a count.
      await expect(key(letter)).toBeVisible();
      await expect(page.getByTestId("key-known-count")).toHaveCount(0);

      await page.keyboard.type(proving);
      await page.keyboard.press("Enter");
      await expect(key(letter).getByTestId("key-known-count")).toHaveText(String(proved));
      await expect(key(letter)).toHaveAttribute("aria-label", new RegExp(`^${letter.toUpperCase()}, in the word (twice|${proved} times)$`));
      // Only the letters that guess proved twice carry a count; every other key carries none.
      await expect(page.getByTestId("key-known-count")).toHaveCount(provedKeys);

      // Found: every copy green, and the replay's keyboard says so, step by step.
      await page.keyboard.type(hidden);
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      const replay = page.getByTestId("word-replay");
      await expect(replay.getByTestId(`word-key-${letter}`).getByTestId("key-known-count")).toHaveText(String(inWord));
      await expect(replay.getByTestId(`word-key-${letter}`)).toHaveAttribute("data-known-count", String(inWord));
      await expect(replay.getByTestId(`word-key-${single}`)).toHaveAttribute("data-mark", "hit");
      await expect(replay.getByTestId(`word-key-${single}`).getByTestId("key-known-count")).toHaveCount(0);
      await page.getByTestId("word-replay-start").click();
      await expect(replay).toHaveAttribute("data-at", "0");
      await expect(replay.getByTestId("key-known-count")).toHaveCount(0);
      await page.getByTestId("word-replay-forward").click();
      await expect(replay).toHaveAttribute("data-at", "1");
      await expect(replay.getByTestId(`word-key-${letter}`).getByTestId("key-known-count")).toHaveText(String(proved));

      // And on the finished word's own page, from the history of words.
      await page.goto(AT);
      await page.getByTestId("facet-me").click();
      await page.getByTestId("word-history-row").filter({ hasText: hidden.toUpperCase() }).filter({ hasText: "Found in 2/" }).first().getByTestId("word-history-word").click();
      await expect(page.getByTestId("solve-outcome")).toHaveText("Found");
      await expect(page.getByTestId("word-replay").getByTestId(`word-key-${letter}`).getByTestId("key-known-count")).toHaveText(String(inWord));
    });
  });

  test("on a computer the letter keys are put away until asked for, and the desk's keyboard is said to work", async ({ page }) => {
    const seed = freshPuzzleSeed();
    await page.goto(`${AT}/play?size=5&level=${LEVEL}&seed=${seed}`);
    await ready(page, "puzzle-play");
    const box = page.getByTestId("word-keys-box");
    const toggle = page.getByTestId("word-keys-toggle");
    await expect(toggle).toContainText("Show keys");
    await expect(box).toBeHidden();
    await expect(page.getByTestId("word-keys-note")).toBeVisible();

    await toggle.click();
    await expect(box).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("word-keys-note")).toBeHidden();

    // Kept in this browser: the next word opens with the keys out.
    await page.goto(`${AT}/play?size=5&level=${LEVEL}&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("word-keys-box")).toBeVisible();

    // And put away again.
    await page.getByTestId("word-keys-toggle").click();
    await expect(page.getByTestId("word-keys-box")).toBeHidden();
    await expect(page.getByTestId("word-keys-toggle")).toHaveAttribute("aria-pressed", "false");
  });

  test("a letter already found green is green again as it is typed in that place, and nowhere else", async ({ page }) => {
    // John, 2026-09-26: "if a letter is known green, placing that letter in the same column should start off green".
    const seed = freshPuzzleSeed();
    await page.goto(`${AT}/play?size=5&level=${LEVEL}&seed=${seed}`);
    await ready(page, "puzzle-play");
    const hidden = generatePuzzle(KIND, 5, LEVEL, seed).solution;
    const first = answersFor(5, false).find((word) => word[0] === hidden[0] && word !== hidden)!;
    await page.keyboard.type(first);
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-testid="word-tile"][data-row="0"]').first()).toHaveAttribute("data-mark", "hit");
    const typing = page.locator('[data-testid="word-tile"][data-row="1"]');
    // The found letter, in its place: green before Enter.
    await page.keyboard.type(hidden[0]!);
    await expect(typing.first()).toHaveAttribute("data-known", "hit");
    // The same letter one place along was never found there, so it is only typed.
    await page.keyboard.type(hidden[0]!);
    await expect(typing.nth(1)).not.toHaveAttribute("data-known", "hit");
  });

  test("a typed letter is tapped to choose it, then typed over, or cleared with Space or Delete, before Enter", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const answer = generatePuzzle(KIND, 5, LEVEL, seed).solution;
    test.skip(answer === "skate" || answer === "slate", "this spec types those two words");
    await page.goto(`${AT}/play?size=5&level=${LEVEL}&seed=${seed}`);
    await ready(page, "puzzle-play");
    const place = (at: number) => page.locator('[data-testid="word-tile"][data-row="0"]').nth(at);
    // The first place waits, faintly marked.
    await expect(place(0)).toHaveAttribute("data-focus", "true");

    await page.keyboard.type("slate");
    await expect(place(4)).not.toHaveAttribute("data-focus", "true");
    // S-L-A-T-E: tap the L and type K over it, and the word reads SKATE.
    await place(1).click();
    await expect(place(1)).toHaveAttribute("data-focus", "true");
    await page.keyboard.type("k");
    await expect(place(1)).toHaveAttribute("aria-label", /^K, /);

    // Space clears the chosen letter and the place stays chosen; Enter asks for the whole word.
    await place(3).click();
    await page.keyboard.press(" ");
    await expect(place(3)).toHaveAttribute("data-mark", "empty");
    await expect(place(3)).toHaveAttribute("data-focus", "true");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("word-said")).toContainText("A guess is 5 letters");

    // Typed back in, and Delete on a chosen letter clears it the same way.
    await page.keyboard.type("t");
    await place(0).click();
    await page.keyboard.press("Delete");
    await expect(place(0)).toHaveAttribute("data-mark", "empty");
    await page.keyboard.type("s");
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-testid="word-tile"][data-row="0"]').first()).toHaveAttribute("aria-label", /^S, /);
    await expect(page.locator('[data-testid="word-tile"][data-row="0"]').nth(1)).toHaveAttribute("aria-label", /^K, (in its place|in the word|not in)/);
    // The next row's first place is the one waiting.
    await expect(page.locator('[data-testid="word-tile"][data-row="1"]').first()).toHaveAttribute("data-focus", "true");
  });

  test("easy has every row of the board, medium one more guess than hard, and play starts below the top", async ({ page }) => {
    for (const [level, guesses] of [["easy", 9], ["medium", 7], ["hard", 6]] as const) {
      expect(guessesFor(KIND, 5, level, 0)).toBe(guesses);
      await page.goto(`${AT}/play?size=5&level=${level}&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("word-said")).toContainText(`${guesses} guesses left`);
      await expect(page.getByTestId("word-tile")).toHaveCount(5 * guesses);
    }
  });

  /*
   * JOHN'S MUSTY, 2026-09-26: a five-letter word at medium, found on the
   * seventh guess — the one medium gives beyond hard — answered "Not a grid of
   * that size." and was never kept. The solved route capped an answer at six
   * guesses of five letters. Played the way he played it, by typing.
   */
  test("a word found on medium's last guess is kept and paid, not refused", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const puzzle = generatePuzzle(KIND, 5, "medium", seed);
    const allowed = guessesFor(KIND, 5, "medium", 0);
    expect(allowed, "medium gives a guess beyond hard's six").toBeGreaterThan(6);
    const wrong = ["slate", "irony", "chump", "gawky", "fjord", "crane", "blimp", "dwelt", "quack"]
      .filter((word) => word !== puzzle.solution && isWord(word, 5))
      .slice(0, allowed - 1);
    expect(wrong).toHaveLength(allowed - 1);
    await page.goto(`${AT}/play?size=5&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    for (const word of [...wrong, puzzle.solution]) {
      await page.keyboard.type(word);
      await page.keyboard.press("Enter");
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    // Paid, or already paid for: those two, and never a refusal.
    await expect(page.getByTestId("puzzle-paid")).toHaveText(/XP|Already paid/);
  });

  test("Strict, chosen at any level, refuses a guess that drops a letter already found", async ({ page }) => {
    const words = ["slate", "irony", "chump", "gawky", "fjord", "blitz", "crane", "mound", "house", "plant"].filter((word) => isWord(word, 5));
    // A seed whose word one of these finds a letter of and another then drops.
    const pairFor = (seed: number): [string, string] | null => {
      const answer = generatePuzzle(KIND, 5, "easy", seed).solution;
      const first = words.find((word) => word !== answer && markGuess(word, answer).some((mark) => mark !== "miss"));
      const second = first === undefined ? undefined : words.find((word) => word !== answer && breaksHardRule([first], answer, word) !== null);
      return first === undefined || second === undefined ? null : [first, second];
    };
    const seeds = Array.from({ length: 50 }, () => freshPuzzleSeed());
    const seed = seeds.find((each) => pairFor(each) !== null);
    expect(seed).toBeDefined();
    const [first, second] = pairFor(seed!)!;
    await page.goto(`${AT}/play?size=5&level=easy&seed=${seed}&strict=1`);
    await ready(page, "puzzle-play");
    await page.keyboard.type(first);
    await page.keyboard.press("Enter");
    await page.keyboard.type(second);
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("word-said")).toContainText("Strict:");
    await expect(page.locator('[data-testid="word-tile"][data-row="1"]').first()).toHaveAttribute("data-mark", "typed");

    // Without Strict, the same guess is played.
    await page.goto(`${AT}/play?size=5&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    await page.keyboard.type(first);
    await page.keyboard.press("Enter");
    await page.keyboard.type(second);
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-testid="word-tile"][data-row="1"]').first()).not.toHaveAttribute("data-mark", /^(typed|empty)$/);
  });

  test("Strict is chosen on the set-up screen, travels to the puzzle, and is kept with a run left half way", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    const solve = page.getByTestId("puzzle-solve");
    await expect(page.getByTestId("puzzle-strict-off")).toHaveAttribute("aria-checked", "true");
    await expect(solve).not.toHaveAttribute("href", /strict=/);
    await page.getByTestId("puzzle-strict-on").click();
    await expect(solve).toHaveAttribute("href", /strict=1/);
    await solve.click();
    await ready(page, "puzzle-play");
    await expect(page).toHaveURL(/strict=1/);
    const seed = new URL(page.url()).searchParams.get("seed");
    const answer = generatePuzzle(KIND, 5, "medium", Number(seed)).solution;
    const guess = misses(answer, 1)[0]!;
    await page.keyboard.type(guess);
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-testid="word-tile"][data-row="0"]').first()).not.toHaveAttribute("data-mark", /^(typed|empty)$/);

    // Left by the site's own navigation, and opened again from My games: still Strict.
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="puzzles"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-kind="${KIND}"][data-seed="${seed}"]`);
    await expect(row).toContainText("strict");
    await expect(row.getByTestId("puzzle-going-continue")).toHaveAttribute("href", /strict=1/);
  });

  test("running out of guesses ends it and shows the word", async ({ page }) => {
    // Hard, which keeps the published count: a guess more than the word has letters.
    const seed = freshPuzzleSeed();
    const puzzle = generatePuzzle(KIND, 4, "hard", seed);
    await page.goto(`${AT}/play?size=4&level=hard&seed=${seed}`);
    await ready(page, "puzzle-play");
    const wrong = ["tree", "cake", "moon", "fish", "bird", "lamp", "rope"].filter((word) => word !== puzzle.solution && isWord(word, 4)).slice(0, 5);
    expect(wrong).toHaveLength(5);
    for (const word of wrong) {
      await page.keyboard.type(word);
      await page.keyboard.press("Enter");
    }
    await expect(page.getByTestId("word-out")).toBeVisible();
    await expect(page.getByTestId("word-was")).toHaveText(puzzle.solution);
    // The line says how many guesses there were (John, 2026-09-26: "Text is missing numbers").
    await expect(page.getByTestId("word-was").locator("..")).toContainText(/Out of \d+ guesses\./);
    // A word not found still scores the letters it found, and says where it is kept.
    const scored = wordScore(puzzle.solution, wrong, guessesFor(KIND, 4, "hard", 0), 0).total;
    await expect(page.getByTestId("word-score")).toHaveAttribute("data-total", String(scored));
    await expect(page.getByTestId("word-kept")).toContainText("My games");
    // Paid for playing it out, or not paid because this member has already had today's six (the award's daily
    // cap): those two, and nothing else. The suite's member plays many words a day.
    await expect(page.getByTestId("word-kept")).toHaveText(/^(\+5 XP for playing it out\. )?Kept in My games with your guesses\.$/);
    // And the way on: another word, Gomoji's own page, and its family (nothing ends in a dead end).
    const wayOn = page.getByTestId("word-out").getByTestId("puzzle-way-on");
    await expect(wayOn.getByTestId("word-another")).toBeVisible();
    await expect(wayOn.getByTestId("puzzle-way-game")).toHaveAttribute("href", AT);
    await expect(wayOn.getByTestId("puzzle-way-family")).toHaveAttribute("href", `${AT}/family`);

    // Kept on the Puzzles tab, marked as not found.
    await page.getByTestId("word-kept").getByRole("link", { name: "My games" }).click();
    await expect(page.locator('[data-testid="puzzle-solved"][data-kind="gomoji"][data-solved="false"]').first()).toContainText("Not found");

    // And in the history of every word played, from Gomoji's own page, with its guesses and its score.
    await page.goto(AT);
    await page.getByTestId("facet-me").click();
    const newest = page.getByTestId("word-history-row").first();
    await expect(newest).toHaveAttribute("data-solved", "false");
    await expect(newest.getByTestId("word-history-word")).toHaveText(puzzle.solution);
    await expect(newest.getByTestId("word-history-points")).toContainText(String(scored));
    await expect(newest.getByLabel(/^Guesses: /)).toHaveAttribute("aria-label", `Guesses: ${wrong.map((word) => word.toUpperCase()).join(", ")}`);
  });

  test("the route refuses guesses that never found the word", async ({ request }) => {
    const puzzle = generatePuzzle(KIND, 5, LEVEL, 7);
    const refused = await request.post("/api/puzzles/solved", {
      data: { kind: KIND, size: 5, level: LEVEL, givens: puzzle.givens, answer: misses(puzzle.solution, 2).join("") },
    });
    expect(refused.status()).toBe(422);
  });
});

test("today's word is one address for the day, reached from Gomoji's own page", async ({ page }) => {
  const { dailySeed } = await import("../src/lib/puzzles/daily");
  await page.goto("/games/gomoji");
  await page.getByTestId("game-daily").click();
  // The same seed for everybody today, on an ordinary address that can be shared and kept.
  await expect(page).toHaveURL(new RegExp(`/games/gomoji/play\\?.*seed=${dailySeed(new Date())}`));
});
