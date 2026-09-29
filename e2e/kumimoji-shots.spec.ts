import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { lettersOf } from "../src/lib/puzzles/kumimoji/grid";
import { generateKumimoji } from "../src/lib/puzzles/kumimoji/generate";
import { wordsInHand } from "../src/lib/puzzles/kumimoji/help";
import { KUMIMOJI_SHOTS, type KumimojiShot } from "../src/lib/puzzles/kumimoji/shots.constants";
import { KUMIMOJI_HANDS } from "../src/lib/puzzles/kumimoji/tiles.constants";
import { tileWords } from "../src/lib/puzzles/kumimoji/tileWords";
// This process has no browser: the lists are read from their modules (`tileWordsModule.ts`).
import { loadTileWordsFromModule as loadTileWords } from "../src/lib/puzzles/kumimoji/tileWordsModule";
import { dayOf, kumimojiWallpaperSvg, wallpaperCrosswords, wallpaperTitle } from "../src/lib/puzzles/kumimoji/wallpaper";
import { KUMIMOJI_WALLPAPER_COPY } from "../src/lib/puzzles/kumimoji/wallpaper.constants";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { MOSAIC_SHAPES } from "../src/lib/record/mosaic.constants";
import { crosswordFrom } from "./kumimojiCrossword";
import { ready } from "./support";
import { loadEveryWordList } from "./wordLists";

/**
 * THE PICTURES ON KUMIMOJI'S FRONT DOOR, taken from real play: a crossword
 * built tap by tap, a Japanese hand, Help at work, the table turned, and a
 * wallpaper of finished crosswords. Written into public/art/kumimoji/ by
 * `pnpm screenshots:kumimoji`, never by hand, and not part of the ordinary
 * suite because it writes files into the repository.
 *
 * Each game scene is a phone's screen (390×844 at twice the pixels), cut from
 * the top of the table to the bottom of the tray and made smaller by sharp —
 * Next's own copy, as `make-game-thumbs.mjs` reaches it — to a few tens of
 * kilobytes. Fixed seeds, so the same pictures come out every time until the
 * game's drawing changes. The file names and the words under each picture are
 * `KUMIMOJI_SHOTS`, which the pages read; `kumimojiShots.coverage.test.ts`
 * fails when a file there is missing, too big, or not made here.
 */
const OUT = "public/art/kumimoji";
const AT = `/games/${PUZZLE_SLUGS.kumimoji}`;
const CLASSIC = KUMIMOJI_HANDS.classic;
const QUICK = KUMIMOJI_HANDS.quick;
/** The seed the catalogue's own Kumimoji picture is built from (`puzzle-screenshots.spec.ts`), so the two show one game. */
const SEED = 20260926;

const require = createRequire(join(process.cwd(), "package.json"));
/** The little of sharp this uses; it is Next's dependency, not this project's, so it brings no types here. */
type Sharp = (input: Buffer) => {
  resize: (options: { width: number }) => { jpeg: (options: { quality: number; mozjpeg: boolean }) => { toFile: (path: string) => Promise<{ width: number; height: number; size: number }> } };
};
const sharp = createRequire(require.resolve("next/package.json"))("sharp") as Sharp;

test.beforeAll(loadEveryWordList);
test.beforeAll(async () => {
  await loadTileWords();
  await loadTileWords("japanese");
});

/** A picture made smaller and saved as the page names it. */
async function save(shot: KumimojiShot, png: Buffer) {
  mkdirSync(OUT, { recursive: true });
  const info = await sharp(png).resize({ width: shot.width }).jpeg({ quality: 72, mozjpeg: true }).toFile(join("public", shot.src));
  console.log(`${shot.src} ${info.width}×${info.height} ${info.size} bytes`);
}

/**
 * A phone's screen as a player holds it mid-game: the table at the top, the
 * line under it, the board colours, and the hand's tray fixed to the foot.
 * Scrolled here rather than left where the last tap put it, since Playwright
 * scrolls whatever it presses into view.
 */
async function playArea(page: Page): Promise<Buffer> {
  await page.evaluate(() => {
    const table = document.querySelector('[data-testid="kumimoji-table"]')!;
    window.scrollTo({ top: window.scrollY + table.getBoundingClientRect().top - 8, behavior: "instant" });
  });
  return page.screenshot();
}

/** Tap a hand tile of this code, then a square. */
async function lay(page: Page, code: string, square: string) {
  await page.locator(`[data-testid="kumimoji-hand-tile"][data-letter="${code}"]`).first().click();
  await page.locator(`[data-testid="kumimoji-square"][data-square="${square}"]`).click();
  await expect(page.locator(`[data-testid="kumimoji-tile"][data-square="${square}"]`)).toHaveAttribute("data-letter", code);
}

/** Open a game on the wooden table, nothing of the dev server or of XP over it, and nothing kept of it. */
async function open(page: Page, query: string) {
  await page.route("**/api/puzzles/runs", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  await page.goto(`${AT}/play?${query}`);
  await ready(page, "puzzle-play");
  await page.addStyleTag({ content: 'nextjs-portal, [data-testid="xp-toast-host"], [data-testid="xp-toast"] { display: none !important; }' });
  const felt = await page.locator('[data-testid="felt-patches"] [aria-checked="true"]').first().getAttribute("data-testid");
  await page.getByTestId("felt-wood").click();
  await page.getByTestId("word-style-reversi").click();
  return felt;
}

/** The reader's board colour put back: it is kept on the account every other spec reads. */
async function restore(page: Page, felt: string | null) {
  if (felt !== null && felt !== "felt-wood") await page.getByTestId(felt).click();
}

/** The first Japanese Quick game at or after `from` whose hand holds a wild, a tile with forms in its corner, and a word of three. */
function japaneseScene(from: number) {
  const words = tileWords("japanese");
  for (let seed = from; seed < from + 2_000; seed += 1) {
    const hand = [...generateKumimoji(QUICK, "easy", seed, { language: "japanese" }).givens.slice(0, QUICK)];
    if (!hand.some(words.isWild) || !hand.some((tile) => words.formsOf(tile) !== "")) continue;
    const have = lettersOf(hand.filter((tile) => !words.isWild(tile)));
    const word = words.byLength.get(3)?.find((each) => [...lettersOf(each)].every(([tile, count]) => (have.get(tile) ?? 0) >= count));
    if (word !== undefined && [...word].some((tile) => words.formsOf(tile) !== "")) return { seed, word, wildAt: hand.findIndex(words.isWild) };
  }
  throw new Error("No Japanese hand with a wild, a tile of several forms and a word of three.");
}

/**
 * A Classic game at or after `from` whose hand lays a word across and one down
 * (`crosswordFrom`), and whose leftover tiles still spell a word of three or
 * more: the first Help offers, which is the longest the tiles make.
 */
function helpScene(from: number) {
  for (let seed = from; seed < from + 400; seed += 1) {
    const hand = generateKumimoji(CLASSIC, "medium", seed).givens.slice(0, CLASSIC);
    let laid: ReturnType<typeof crosswordFrom>;
    try {
      laid = crosswordFrom(hand, 1);
    } catch {
      // A hand with no everyday word of four or five to lay across.
      continue;
    }
    if (!laid.some((tile) => !tile.square.startsWith("0,"))) continue;
    const left = [...hand];
    for (const tile of laid) left.splice(left.indexOf(tile.letter), 1);
    const word = wordsInHand(left, tileWords())[0];
    if (word !== undefined && word.length >= 3) return { seed, laid, word };
  }
  throw new Error("No Classic hand that lays a crossword and leaves a word for Help.");
}

test.describe("Kumimoji's pictures", () => {
  test.skip(process.env.KUMIMOJI_SHOTS !== "1", "Set KUMIMOJI_SHOTS=1 to write them.");
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  test("a crossword being built, then the same table turned", async ({ page }) => {
    const felt = await open(page, `size=${CLASSIC}&level=medium&seed=${SEED}`);
    const hand = generateKumimoji(CLASSIC, "medium", SEED).givens.slice(0, CLASSIC);
    for (const tile of crosswordFrom(hand, 2)) await lay(page, tile.letter, tile.square);
    await expect(page.getByTestId("kumimoji-said")).toContainText("to lay");
    await save(KUMIMOJI_SHOTS.build, await playArea(page));

    await page.getByTestId("kumimoji-turn").click();
    await expect(page.getByTestId("kumimoji-table")).toHaveAttribute("data-turn", "1");
    await page.getByTestId("kumimoji-arrows").click();
    await expect(page.getByTestId("kumimoji-pad")).toBeVisible();
    await save(KUMIMOJI_SHOTS.turn, await playArea(page));
    await restore(page, felt);
  });

  test("a Japanese hand: forms in the corners, a word laid, and the wild being given its kana", async ({ page }) => {
    const scene = japaneseScene(SEED);
    const felt = await open(page, `size=${QUICK}&level=easy&seed=${scene.seed}&language=japanese`);
    for (const [col, tile] of [...scene.word].entries()) await lay(page, tile, `0,${col}`);
    await page.locator('[data-testid="kumimoji-hand-tile"]').filter({ has: page.locator("svg") }).first().click();
    await expect(page.getByTestId("kumimoji-tile-reading")).toBeVisible();
    await save(KUMIMOJI_SHOTS.japanese, await playArea(page));
    await restore(page, felt);
  });

  test("Help puts a word at the front of what is left of the hand", async ({ page }) => {
    const scene = helpScene(SEED);
    const felt = await open(page, `size=${CLASSIC}&level=medium&seed=${scene.seed}&hints=1`);
    for (const tile of scene.laid) await lay(page, tile.letter, tile.square);
    await page.getByTestId("kumimoji-help").click();
    await expect(page.getByTestId("kumimoji-said")).toContainText(`${scene.word.toUpperCase()} is at the front of your hand`);
    await save(KUMIMOJI_SHOTS.help, await playArea(page));
    await restore(page, felt);
  });

  test("a wallpaper of finished crosswords", async ({ page }) => {
    // Twelve finished crosswords, each the one the game laid out to prove its bag can be finished, a day apart.
    const rows = Array.from({ length: 12 }, (_, at) => {
      const language = at % 4 === 3 ? "japanese" : "english";
      const puzzle = generateKumimoji(at % 2 === 0 ? CLASSIC : QUICK, "medium", SEED + at, { language });
      return { answer: puzzle.solution, size: puzzle.size, finishedAt: new Date(Date.UTC(2026, 8, 17 + at, 12)).toISOString() };
    });
    const crosswords = wallpaperCrosswords(rows, (row, tiles) => [dayOf(row.finishedAt), KUMIMOJI_WALLPAPER_COPY.tiles(tiles)].join(" · "));
    const title = wallpaperTitle(PUZZLE_DISPLAY.kumimoji.label, crosswords, false);
    const svg = kumimojiWallpaperSvg({ crosswords, ...MOSAIC_SHAPES.landscape, title });
    await page.setViewportSize({ width: MOSAIC_SHAPES.landscape.width, height: MOSAIC_SHAPES.landscape.height });
    await page.goto("/about");
    await page.setContent(`<body style="margin:0">${svg}</body>`);
    await save(KUMIMOJI_SHOTS.wallpaper, await page.locator("svg").first().screenshot());
  });
});
