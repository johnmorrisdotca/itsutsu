import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateKumimoji } from "../src/lib/puzzles/kumimoji/generate";
import { lettersOf, sameLetters } from "../src/lib/puzzles/kumimoji/grid";
import { KUMIMOJI_BAG, KUMIMOJI_HANDS } from "../src/lib/puzzles/kumimoji/tiles.constants";
import { loadTileWords, tileWords } from "../src/lib/puzzles/kumimoji/tileWords";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, ready } from "./support";

/**
 * KUMIMOJI 組文字: a crossword of your own, from a hand of tiles, on a table
 * that grows. Every case drives the controls a player does — tap a tile and a
 * square, drag one, type — on bags this spec reads from the same generator the
 * page uses, from a seed of its own, so it knows which words its hand can make
 * without trusting anything a previous run left behind.
 */
const KIND = "kumimoji";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const TINY = KUMIMOJI_HANDS.tiny;
const CLASSIC = KUMIMOJI_HANDS.classic;

test.beforeAll(async () => {
  await loadTileWords();
});

const isWord = (word: string) => tileWords().allowed.has(word);

/** A word of this length the letters can make, each used once, or null. */
function wordFrom(letters: string, length: number): string | null {
  const have = lettersOf(letters);
  return (
    tileWords().byLength.get(length)?.find((word) => {
      const need = lettersOf(word);
      return [...need].every(([letter, count]) => (have.get(letter) ?? 0) >= count);
    }) ?? null
  );
}

/** The longest word from four to six letters a Classic hand can make, from the first seed at or after `from` whose hand makes one. */
function classicGame(from: number): { seed: number; hand: string; word: string } {
  for (let seed = from; ; seed += 1) {
    const hand = generateKumimoji(CLASSIC, "medium", seed).givens.slice(0, CLASSIC);
    for (const length of [6, 5, 4]) {
      const word = wordFrom(hand, length);
      if (word !== null) return { seed, hand, word };
    }
  }
}

/**
 * A Tiny game (a hand of three, five tiles in all) that can be finished by
 * hand: the hand is a three-letter word laid across, and the two tiles drawn
 * after it each make a two-letter word down from its first and last letters.
 */
function tinyGame(from: number): { seed: number; across: string; drawn: { letter: string; square: string }[] } {
  const hangs = (on: string, letter: string, col: number) => (isWord(on + letter) ? `1,${col}` : isWord(letter + on) ? `-1,${col}` : null);
  for (let seed = from; ; seed += 1) {
    const bag = generateKumimoji(TINY, "medium", seed).givens;
    const across = tileWords().byLength.get(3)!.find((word) => sameLetters(lettersOf(word), lettersOf(bag.slice(0, TINY))));
    if (across === undefined) continue;
    for (const [a, b] of [
      [0, 2],
      [2, 0],
    ] as const) {
      const first = hangs(across[a]!, bag[3]!, a);
      const second = hangs(across[b]!, bag[4]!, b);
      if (first !== null && second !== null) return { seed, across, drawn: [{ letter: bag[3]!, square: first }, { letter: bag[4]!, square: second }] };
    }
  }
}

/** The dev server's own badge sits in a phone's bottom corner, over the tray; it is not the site's, and a production build has none. */
async function hideDevBadge(page: Page) {
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
}

/** Tap a tile of this letter in the hand, then a square on the table. */
async function lay(page: Page, letter: string, square: string) {
  await page.locator(`[data-testid="kumimoji-hand-tile"][data-letter="${letter}"]`).first().click();
  await page.locator(`[data-testid="kumimoji-square"][data-square="${square}"]`).click();  await expect(page.locator(`[data-testid="kumimoji-tile"][data-square="${square}"]`)).toHaveAttribute("data-letter", letter);
}

test.describe("Kumimoji", () => {
  test("its front door names it, its family, and what it is our take on, and no trademark", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(PUZZLE_DISPLAY[KIND].label);
    await expect(page.getByTestId("inspired-by")).toContainText("anagram-grid race games");
    await expect(page.getByTestId("game-family")).toContainText("Other");
    await page.goto(`${AT}/rules`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Kumimoji");
    const words = await page.locator("main").innerText();
    expect(words).not.toMatch(/banana|scrabble/i);
  });

  test("its set-up offers Quick and Classic hands and starts a game at the one chosen", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await expect(page.getByTestId("set-up-puzzle-preview").getByTestId("kumimoji-tile")).toHaveCount(CLASSIC);
    await expect(page.locator('[data-testid="set-up-size"][data-size="7"]')).toContainText("Quick");
    await page.locator('[data-testid="set-up-size"][data-size="7"]').click();
    await expect(page.getByTestId("set-up-puzzle-preview").getByTestId("kumimoji-tile")).toHaveCount(KUMIMOJI_HANDS.quick);
    await page.getByTestId("puzzle-solve").click();
    await ready(page, "puzzle-play");
    await expect(page).toHaveURL(/size=7/);
    await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(KUMIMOJI_HANDS.quick);
    await expect(page.getByTestId("kumimoji-bag")).toHaveAttribute("data-left", String(KUMIMOJI_BAG[KUMIMOJI_HANDS.quick]! - KUMIMOJI_HANDS.quick));
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("tiles tapped onto the table make words, a line that is not one is marked, and the view refits as the grid grows", async ({ page }) => {
      const { seed, hand, word } = classicGame(freshPuzzleSeed());
      await page.goto(`${AT}/play?size=${CLASSIC}&level=medium&seed=${seed}`);
      await ready(page, "puzzle-play");
      await hideDevBadge(page);
      await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(CLASSIC);
      await expect(page.getByTestId("kumimoji-tray")).toBeVisible();

      // Two tiles side by side that are not a word: both marked, and the line says which.
      const [p, q] = [...hand].flatMap((a, i) => [...hand].slice(i + 1).map((b) => [a, b] as const)).find(([a, b]) => !isWord(a + b))!;
      await lay(page, p, "0,0");
      const oneTile = Number(await page.getByTestId("kumimoji-table").getAttribute("data-tile-px"));
      await lay(page, q, "0,1");
      await expect(page.locator('[data-testid="kumimoji-tile"][data-mark="misspelt"]')).toHaveCount(2);
      await expect(page.getByTestId("kumimoji-said")).toContainText(`Not a word: ${(p + q).toUpperCase()}`);
      await page.getByTestId("kumimoji-all-back").click();
      await expect(page.getByTestId("kumimoji-tile")).toHaveCount(0);
      await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(CLASSIC);

      // A real word, across: sound, unmarked, and the table has grown and zoomed out to hold it.
      for (const [at, letter] of [...word].entries()) await lay(page, letter, `0,${at}`);
      await expect(page.locator('[data-testid="kumimoji-tile"][data-mark="ok"]')).toHaveCount(word.length);
      await expect(page.getByTestId("kumimoji-said")).toContainText(`${CLASSIC - word.length} tiles to lay`);
      const table = page.getByTestId("kumimoji-table");
      await expect(table).toHaveAttribute("data-cols", String(word.length + 4));
      const grown = Number(await table.getAttribute("data-tile-px"));
      expect(grown).toBeLessThan(oneTile);
      expect(grown).toBeGreaterThanOrEqual(32);
      await expect(table).toHaveAttribute("data-fitted", "true");

      // Nothing on the page is wider than the phone, the tray included.
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    });

    test("a Tiny game is finished by laying the hand, drawing twice, and fitting each tile in", async ({ page }) => {
      const game = tinyGame(freshPuzzleSeed());
      await page.goto(`${AT}/play?size=${TINY}&level=medium&seed=${game.seed}`);
      await ready(page, "puzzle-play");
      await hideDevBadge(page);
      await expect(page.getByTestId("kumimoji-draw")).toBeDisabled();
      for (const [at, letter] of [...game.across].entries()) {
        await lay(page, letter, `0,${at}`);
        // Draw waits for the whole hand on a sound grid.
        if (at < game.across.length - 1) await expect(page.getByTestId("kumimoji-draw")).toBeDisabled();
      }
      for (const [at, tile] of game.drawn.entries()) {
        await expect(page.getByTestId("kumimoji-said")).toContainText("Draw the next tile");
        await page.getByTestId("kumimoji-draw").click();
        await expect(page.getByTestId("kumimoji-bag")).toHaveAttribute("data-left", String(game.drawn.length - at - 1));
        await lay(page, tile.letter, tile.square);
      }
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("kumimoji-score")).toContainText("All 5 tiles");
      // The finished table is read-only and still has every tile where it was laid, the last one included.
      await expect(page.locator('[data-testid="kumimoji-table"] [data-testid="kumimoji-tile"]')).toHaveCount(5);
      for (const tile of game.drawn) await expect(page.locator(`[data-testid="kumimoji-tile"][data-square="${tile.square}"]`)).toHaveAttribute("data-letter", tile.letter);
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    });
  });

  test("a tile is dragged onto the table and back, typed letters lay a word, and a trade takes three for one", async ({ page }) => {
    const { seed, word } = classicGame(freshPuzzleSeed());
    await page.goto(`${AT}/play?size=${CLASSIC}&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");

    // Dragged from the hand to a square, with the table and the tray both on the screen.
    await page.getByTestId("kumimoji-hand").scrollIntoViewIfNeeded();
    await expect(page.locator('[data-testid="kumimoji-square"][data-square="-1,-1"]')).toBeInViewport();
    const from = await page.locator(`[data-testid="kumimoji-hand-tile"][data-letter="${word[0]}"]`).first().boundingBox();
    const to = await page.locator('[data-testid="kumimoji-square"][data-square="-1,-1"]').boundingBox();
    await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
    await page.mouse.down();
    await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 12 });
    await page.mouse.up();
    await expect(page.locator('[data-testid="kumimoji-tile"][data-square="-1,-1"]')).toHaveAttribute("data-letter", word[0]!);
    await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(CLASSIC - 1);

    // And dragged back into the tray.
    const placed = await page.locator('[data-testid="kumimoji-tile"][data-square="-1,-1"]').boundingBox();
    const tray = await page.getByTestId("kumimoji-hand").boundingBox();
    await page.mouse.move(placed!.x + placed!.width / 2, placed!.y + placed!.height / 2);
    await page.mouse.down();
    await page.mouse.move(tray!.x + tray!.width - 20, tray!.y + tray!.height / 2, { steps: 12 });
    await page.mouse.up();
    await expect(page.getByTestId("kumimoji-tile")).toHaveCount(0);
    await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(CLASSIC);

    // Chosen on the table and typed: the word goes down across from there.
    await page.locator('[data-testid="kumimoji-square"][data-square="0,0"]').click();
    await page.keyboard.type(word);
    for (const [at, letter] of [...word].entries()) await expect(page.locator(`[data-testid="kumimoji-tile"][data-square="0,${at}"]`)).toHaveAttribute("data-letter", letter);

    // The wheel zooms the table and Fit puts it back.
    const table = page.getByTestId("kumimoji-table");
    const box = await table.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, -400);
    await expect(table).toHaveAttribute("data-fitted", "false");
    await page.getByTestId("kumimoji-fit").click();
    await expect(table).toHaveAttribute("data-fitted", "true");

    // A trade: one tile back for three.
    const left = Number(await page.getByTestId("kumimoji-bag").getAttribute("data-left"));
    const inHand = await page.getByTestId("kumimoji-hand-tile").count();
    await page.getByTestId("kumimoji-hand-tile").first().click();
    await page.getByTestId("kumimoji-trade").click();
    await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(inHand + 2);
    await expect(page.getByTestId("kumimoji-bag")).toHaveAttribute("data-left", String(left - 2));
  });

  test("a game left half built is kept, waits in My games, and opens where it was left", async ({ page }) => {
    const { seed, word } = classicGame(freshPuzzleSeed());
    await page.goto(`${AT}/play?size=${CLASSIC}&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    for (const [at, letter] of [...word].entries()) await lay(page, letter, `0,${at}`);

    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-seed="${seed}"]`);
    await expect(row, "the game left half built is not in My games").toBeVisible();

    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("kumimoji-tile")).toHaveCount(word.length);
    const letters = await page.getByTestId("kumimoji-tile").evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute("data-letter")).join(""));
    expect(letters).toBe(word);
    await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(CLASSIC - word.length);
  });
});
