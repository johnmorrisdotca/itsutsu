import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateKumimoji } from "../src/lib/puzzles/kumimoji/generate";
import { TABLE } from "../src/lib/puzzles/kumimoji/tableView";
import { lettersOf, sameLetters } from "../src/lib/puzzles/kumimoji/grid";
import { KUMIMOJI_BAG, KUMIMOJI_HANDS } from "../src/lib/puzzles/kumimoji/tiles.constants";
import { loadTileWords, tileWords } from "../src/lib/puzzles/kumimoji/tileWords";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, ready } from "./support";
import { suiteOperator } from "./operator";

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

async function japaneseGame(from: number): Promise<{ seed: number; wildAt: number; formsAt: number; forms: string }> {
  const words = await loadTileWords("japanese");
  for (let seed = from; seed < from + 1_000; seed += 1) {
    try {
      const puzzle = generateKumimoji(KUMIMOJI_HANDS.quick, "medium", seed, { language: "japanese" });
      const hand = [...puzzle.givens.slice(0, KUMIMOJI_HANDS.quick)];
      const wildAt = hand.findIndex(words.isWild);
      const formsAt = hand.findIndex((tile) => words.formsOf(tile) !== "");
      if (wildAt >= 0 && formsAt >= 0) return { seed, wildAt, formsAt, forms: words.formsOf(hand[formsAt]!) };
    } catch {
      continue;
    }
  }
  throw new Error("Could not find a Japanese hand with a wild and a tile of several forms.");
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

  test("the / key and Sort put the hand in order, and a table tile tapped twice goes back to it", async ({ page }) => {
    const { seed, word } = classicGame(freshPuzzleSeed());
    await page.goto(`${AT}/play?size=${CLASSIC}&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    const hand = page.getByTestId("kumimoji-hand-tile");
    const inOrder = async () => {
      const letters = await hand.evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute("data-letter")!));
      const plain = letters.filter((letter) => letter !== "*");
      expect(plain).toEqual([...plain].sort());
      expect(letters.slice(plain.length).every((letter) => letter === "*")).toBe(true);
    };
    await page.keyboard.press("/");
    await inOrder();

    // Laid, then tapped twice: back in the hand, at its end, and Sort puts it in its place.
    await lay(page, word[0]!, "0,0");
    await expect(hand).toHaveCount(CLASSIC - 1);
    await page.locator('[data-testid="kumimoji-tile"][data-square="0,0"]').dblclick();
    await expect(page.getByTestId("kumimoji-tile")).toHaveCount(0);
    await expect(hand).toHaveCount(CLASSIC);
    await page.getByTestId("kumimoji-sort").click();
    await inOrder();
  });

  test.describe("Japanese play", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("keeps the language in the address, shows the forms a tile also plays as, and gives a wild its reading", async ({ page }) => {
      const operator = suiteOperator();
      const signIn = await page.request.post("/api/session", {
        data: { kind: "admin", email: operator.email, token: process.env.ADMIN_TOKEN ?? "local-operator-token" },
      });
      expect(signIn.ok(), `operator sign-in answered ${signIn.status()}`).toBe(true);
      const cookie = signIn.headers()["set-cookie"]?.match(/itsutsu_session=([^;]+)/)?.[1];
      expect(cookie, "operator sign-in did not return a session cookie").toBeTruthy();
      await page.context().addCookies([{ name: "itsutsu_session", value: cookie!, url: new URL(signIn.url()).origin }]);
      const game = await japaneseGame(freshPuzzleSeed());
      await page.route("**/api/puzzles/runs", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      await page.getByTestId("kumimoji-language-japanese").click();
      await expect(page.getByTestId("kumimoji-length-short")).toContainText(String(KUMIMOJI_BAG[CLASSIC]));
      await expect(page.getByTestId("kumimoji-double-on")).toBeDisabled();
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /language=japanese/);
      await page.goto(`${AT}/play?size=${KUMIMOJI_HANDS.quick}&level=medium&seed=${game.seed}&language=japanese`);
      await ready(page, "puzzle-play");
      await expect(page).toHaveURL(/language=japanese/);

      const hand = page.getByTestId("kumimoji-hand-tile");
      await expect(hand).toHaveCount(KUMIMOJI_HANDS.quick);
      // ゆ says ゅ, は says ば and ぱ: the tile plays them all, with nothing to choose.
      await expect(hand.nth(game.formsAt).getByTestId("kumimoji-tile-forms")).toHaveText(game.forms);
      await expect(page.getByTestId("kumimoji-tile-reading")).toHaveCount(0);

      // The wild is the 五 until it is given a kana.
      await expect(hand.nth(game.wildAt)).toHaveAccessibleName("Wild, unassigned in your hand");
      await hand.nth(game.wildAt).click();
      await page.getByTestId("kumimoji-tile-reading").selectOption({ label: "か" });
      await expect(hand.nth(game.wildAt)).toHaveAccessibleName("Wild, か in your hand");
    });
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

  /*
   * THE TABLE IS A BOARD TO ITS EDGES, AND THE PAD MOVES IT. John, 2026-09-26:
   * the table was "a Gomoku board of dots" on a pale ground that showed when
   * it was panned or zoomed out; he wants the Reversi board by default, Gomoku
   * as a choice, the board filling the view at any pan or zoom, and buttons to
   * move and zoom it beside Fit.
   */
  test("the table is a Reversi board to its edges, Gomoku by choice, and the pad beside Fit moves and zooms it", async ({ page }) => {
    const { seed, word } = classicGame(freshPuzzleSeed());
    await page.goto(`${AT}/play?size=${CLASSIC}&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    for (const [at, letter] of [...word].entries()) await lay(page, letter, `0,${at}`);
    const table = page.getByTestId("kumimoji-table");
    const ruling = page.getByTestId("kumimoji-ruling");
    await expect(table).toHaveAttribute("data-board", "reversi");
    await expect(page.getByTestId("word-style-reversi")).toHaveAttribute("aria-pressed", "true");
    // Gomoji's third style is not a Kumimoji board.
    await expect(page.getByTestId("word-style-tiles")).toHaveCount(0);

    /** Whether the board covers the whole box: the ruling's box is the table's, and the table itself is painted. */
    const fills = async () => {
      const [outer, lines] = [await table.boundingBox(), await ruling.boundingBox()];
      expect(lines, "the board's lines are not drawn").not.toBeNull();
      for (const side of ["x", "y", "width", "height"] as const) expect(Math.abs(lines![side] - outer![side]), `the board stops short of the table's ${side}`).toBeLessThan(1);
      const painted = await table.evaluate((element) => {
        const style = getComputedStyle(element);
        return style.backgroundImage !== "none" || style.backgroundColor !== "rgba(0, 0, 0, 0)";
      });
      expect(painted, "the table's own ground shows").toBe(true);
    };
    const place = () => ruling.evaluate((element) => getComputedStyle(element).backgroundPosition);
    const tilePx = async () => Number(await table.getAttribute("data-tile-px"));
    await fills();

    // The arrows are out of sight until asked for; then each moves the view, and the board goes with it.
    await expect(page.getByTestId("kumimoji-pad")).toHaveCount(0);
    await page.getByTestId("kumimoji-arrows").click();
    for (const key of ["right", "down", "left", "up"] as const) {
      const before = await place();
      await page.getByTestId(`kumimoji-pad-${key}`).click();
      await expect.poll(place, `${key} did not move the board`).not.toBe(before);
      await fills();
    }
    await expect(table).toHaveAttribute("data-fitted", "false");

    // Zoomed out as far as it goes, past the size Fit stops at, then panned: still a board to the edges.
    for (let press = 0; press < 12; press += 1) await page.getByTestId("kumimoji-pad-out").click();
    await expect.poll(tilePx).toBe(TABLE.zoomLeast);
    await page.getByTestId("kumimoji-pad-left").click();
    await page.getByTestId("kumimoji-pad-left").click();
    await fills();

    // And in again, from the keyboard.
    const small = await tilePx();
    await page.getByTestId("kumimoji-pad-in").focus();
    await page.keyboard.press("Enter");
    await expect.poll(tilePx).toBeGreaterThan(small);
    await page.getByTestId("kumimoji-fit").click();
    await expect(table).toHaveAttribute("data-fitted", "true");

    // Gomoku: the lines through the squares' middles, half a tile from Reversi's; and back again.
    const reversiAt = await place();
    await page.getByTestId("word-style-gomoku").click();
    await expect(table).toHaveAttribute("data-board", "gomoku");
    await expect.poll(place).not.toBe(reversiAt);
    await fills();
    await page.getByTestId("word-style-reversi").click();
    await expect(table).toHaveAttribute("data-board", "reversi");
    await expect.poll(place).toBe(reversiAt);
  });

  /*
   * TURN THE TABLE, EVERY TILE UPRIGHT. John, 2026-09-28: "if you rotate the
   * board like flip it 180° for example then all the tiles will flip 180° to
   * right themselves directly just so that they're not backwards for you or
   * upside down." Driven by the press and the finger, measured on the screen.
   */
  test("Turn turns the table a quarter a press with every tile upright, and a tap or an arrow key goes where the screen says", async ({ page }) => {
    const { seed, word } = classicGame(freshPuzzleSeed());
    await page.goto(`${AT}/play?size=${CLASSIC}&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    for (const [at, letter] of [...word].entries()) await lay(page, letter, `0,${at}`);
    const table = page.getByTestId("kumimoji-table");
    const tileAt = (square: string) => page.locator(`[data-testid="kumimoji-tile"][data-square="${square}"]`);
    const middles = async () => {
      const out: { x: number; y: number }[] = [];
      for (let at = 0; at < word.length; at += 1) {
        const box = (await tileAt(`0,${at}`).boundingBox())!;
        out.push({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
      }
      return out;
    };
    await expect(table).toHaveAttribute("data-turn", "0");
    const unturned = await middles();
    for (let at = 1; at < word.length; at += 1) expect(unturned[at]!.x).toBeGreaterThan(unturned[at - 1]!.x);

    // A quarter: the word runs down the screen.
    await page.getByTestId("kumimoji-turn").click();
    await expect(table).toHaveAttribute("data-turn", "1");
    const quarter = await middles();
    for (let at = 1; at < word.length; at += 1) {
      expect(quarter[at]!.y).toBeGreaterThan(quarter[at - 1]!.y);
      expect(Math.abs(quarter[at]!.x - quarter[0]!.x)).toBeLessThan(1);
    }

    // Half: the word stands right to left, on one line.
    await page.getByTestId("kumimoji-turn").click();
    await expect(table).toHaveAttribute("data-turn", "2");
    const half = await middles();
    for (let at = 1; at < word.length; at += 1) {
      expect(half[at]!.x, "the word is not right to left after half a turn").toBeLessThan(half[at - 1]!.x);
      expect(Math.abs(half[at]!.y - half[0]!.y)).toBeLessThan(1);
    }
    // Every tile is drawn upright: nothing on it, in it or over it is turned.
    const turned = await page.locator('[data-testid="kumimoji-tile"]').evaluateAll((tiles) =>
      tiles.flatMap((tile) => {
        const all: Element[] = [tile, ...tile.querySelectorAll("*")];
        for (let up = tile.parentElement; up !== null && up !== document.body; up = up.parentElement) all.push(up);
        return all.map((element) => getComputedStyle(element)).filter((style) => style.transform !== "none" || style.rotate !== "none").map((style) => `${style.transform} ${style.rotate}`);
      }),
    );
    expect(turned, "a tile or what holds it is rotated").toEqual([]);

    // A tile tapped onto the square under the finger: below the first letter on the screen, which is above it in the grid.
    const spare = (await page.getByTestId("kumimoji-hand-tile").first().getAttribute("data-letter"))!;
    await page.getByTestId("kumimoji-hand-tile").first().click();
    const first = (await tileAt("0,0").boundingBox())!;
    await page.mouse.click(first.x + first.width / 2, first.y + first.height * 1.5);
    await expect(tileAt("-1,0")).toHaveAttribute("data-letter", spare);
    const laid = (await tileAt("-1,0").boundingBox())!;
    const firstNow = (await tileAt("0,0").boundingBox())!;
    expect(laid.y).toBeGreaterThan(firstNow.y);
    expect(Math.abs(laid.x - firstNow.x)).toBeLessThan(1);

    // Typing runs across the grid, which is leftward on this screen, and its arrow says so; the arrow keys go the way they point.
    const lastNow = (await tileAt(`0,${word.length - 1}`).boundingBox())!;
    await page.mouse.click(lastNow.x + lastNow.width / 2, lastNow.y - lastNow.height / 2);
    const typing = page.locator("[data-typing]");
    await expect(typing).toHaveAttribute("data-typing", "left");
    await expect(typing).toHaveText("←");
    await expect(typing).toHaveAttribute("data-square", `1,${word.length - 1}`);
    const before = (await typing.boundingBox())!;
    await page.keyboard.press("ArrowRight");
    await expect(typing).toHaveAttribute("data-square", `1,${word.length - 2}`);
    expect((await typing.boundingBox())!.x).toBeGreaterThan(before.x);

    // Four presses in all: back as it was.
    await page.keyboard.press("Escape");
    await page.getByTestId("kumimoji-turn").click();
    await page.getByTestId("kumimoji-turn").click();
    await expect(table).toHaveAttribute("data-turn", "0");
    const back = await middles();
    for (let at = 1; at < word.length; at += 1) expect(back[at]!.x).toBeGreaterThan(back[at - 1]!.x);
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("the pad sits inside the table beside Fit, and the page does not scroll sideways", async ({ page }) => {
      const { seed } = classicGame(freshPuzzleSeed());
      await page.goto(`${AT}/play?size=${CLASSIC}&level=medium&seed=${seed}`);
      await ready(page, "puzzle-play");
      await page.getByTestId("kumimoji-arrows").click();
      const outer = (await page.getByTestId("kumimoji-table").boundingBox())!;
      for (const id of ["kumimoji-turn", "kumimoji-fit", "kumimoji-arrows", "kumimoji-pad"]) {
        const inner = (await page.getByTestId(id).boundingBox())!;
        expect(inner.x).toBeGreaterThanOrEqual(outer.x);
        expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width + 0.5);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      const before = await page.getByTestId("kumimoji-ruling").evaluate((element) => getComputedStyle(element).backgroundPosition);
      await page.getByTestId("kumimoji-pad-down").click();
      await expect.poll(() => page.getByTestId("kumimoji-ruling").evaluate((element) => getComputedStyle(element).backgroundPosition)).not.toBe(before);
    });

    test("Turn sits in the table's corner beside Arrows and Fit, and turning moves nothing on the page", async ({ page }) => {
      const { seed, word } = classicGame(freshPuzzleSeed());
      await page.goto(`${AT}/play?size=${CLASSIC}&level=medium&seed=${seed}`);
      await ready(page, "puzzle-play");
      for (const [at, letter] of [...word].entries()) await lay(page, letter, `0,${at}`);
      const table = page.getByTestId("kumimoji-table");
      const outer = (await table.boundingBox())!;
      const corner = await Promise.all(["kumimoji-turn", "kumimoji-arrows", "kumimoji-fit"].map(async (id) => (await page.getByTestId(id).boundingBox())!));
      // One row, inside the table, none over another.
      for (const [at, box] of corner.entries()) {
        expect(box.x).toBeGreaterThanOrEqual(outer.x);
        expect(box.x + box.width).toBeLessThanOrEqual(outer.x + outer.width + 0.5);
        expect(Math.abs(box.y - corner[0]!.y)).toBeLessThan(1);
        if (at > 0) expect(box.x).toBeGreaterThanOrEqual(corner[at - 1]!.x + corner[at - 1]!.width);
      }
      await expect(page.getByTestId("kumimoji-turn")).toHaveAccessibleName(/turn the table a quarter turn clockwise/i);
      const tray = (await page.getByTestId("kumimoji-tray").boundingBox())!;
      await page.getByTestId("kumimoji-turn").click();
      await expect(table).toHaveAttribute("data-turn", "1");
      const after = (await table.boundingBox())!;
      expect(after.height).toBe(outer.height);
      expect(after.y).toBe(outer.y);
      expect((await page.getByTestId("kumimoji-tray").boundingBox())!.y).toBe(tray.y);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });
  });
});
