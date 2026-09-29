import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { KUMIMOJI_SHOTS } from "../src/lib/puzzles/kumimoji/shots.constants";
import { JAPANESE_TILE_MIX, TILE_MIX, TILE_MIX_TOTAL } from "../src/lib/puzzles/kumimoji/tiles.constants";
import { ready } from "./support";

/**
 * KUMIMOJI'S FRONT DOOR AND RULES, AS A STRANGER READS THEM. Both pages are
 * open without an invite, so every case here has no session: the pictures
 * load, the try-it is played by taps as a reader plays it and never asks the
 * server anything, the tiles are counted and a kana tile shows what it plays
 * as, and nothing on either page names a member.
 */
const AT = `/games/${PUZZLE_SLUGS.kumimoji}`;

test.use({ storageState: { cookies: [], origins: [] } });

/** Every request the page makes to the site's own API while `run` runs. */
async function apiCallsDuring(page: Page, run: () => Promise<void>): Promise<string[]> {
  const calls: string[] = [];
  const seen = (request: { url: () => string }) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) calls.push(url.pathname);
  };
  page.on("request", seen);
  await run();
  page.off("request", seen);
  return calls;
}

test.describe("Kumimoji's front door, with no session", () => {
  test("shows the pictures of real play, each loaded and described", async ({ page }) => {
    await page.goto(AT);
    const shots = page.getByTestId("kumimoji-shot");
    await expect(shots).toHaveCount(Object.keys(KUMIMOJI_SHOTS).length);
    for (const [key, shot] of Object.entries(KUMIMOJI_SHOTS)) {
      const image = page.locator(`[data-testid="kumimoji-shot"][data-shot="${key}"] img`);
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveAttribute("alt", shot.alt);
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth), `${shot.src} did not load`).toBe(shot.width);
    }
  });

  test("names no member: the leaderboards are shut, and nothing links to a player", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("kumimoji-try")).toBeVisible();
    await expect(page.getByText(/needs an invite/).first()).toBeVisible();
    await expect(page.locator('main a[href^="/players/"]')).toHaveCount(0);
    await page.goto(`${AT}/rules`);
    await expect(page.getByTestId("kumimoji-tiles")).toBeVisible();
    await expect(page.locator('main a[href^="/players/"]')).toHaveCount(0);
  });

  test("the try-it is a whole game of ten tiles, played by taps, with nothing asked of the server", async ({ page }) => {
    await page.goto(AT);
    const tryIt = page.getByTestId("kumimoji-try");
    await ready(page, "kumimoji-try");
    await tryIt.scrollIntoViewIfNeeded();
    // Nothing is fetched until the reader touches a tile, and the page says what the first tap will fetch.
    await expect(tryIt).toHaveAttribute("data-list", "idle");
    await expect(page.getByTestId("kumimoji-try-said")).toContainText("KB");

    const hand = tryIt.getByTestId("kumimoji-try-tile");
    const square = (at: string) => tryIt.locator(`[data-testid="kumimoji-square"][data-square="${at}"]`);
    const tile = (at: string) => tryIt.locator(`[data-testid="kumimoji-tile"][data-square="${at}"]`);
    const lay = async (letter: string, at: string) => {
      await hand.and(page.locator(`[data-letter="${letter}"]`)).first().click();
      await square(at).click();
      await expect(tile(at)).toHaveAttribute("data-letter", letter);
    };

    const calls = await apiCallsDuring(page, async () => {
      await expect(hand).toHaveCount(7);
      // Two tiles that are no word: both marked, and the line names it.
      await lay("t", "0,0");
      await expect(tryIt).toHaveAttribute("data-list", "ready");
      await lay("r", "0,1");
      await expect(tile("0,0")).toHaveAttribute("data-mark", "misspelt");
      await expect(page.getByTestId("kumimoji-try-said")).toContainText("Not a word: TR");
      // A tile tapped twice goes back to the hand, as in the game.
      await tile("0,1").dblclick();
      await expect(hand).toHaveCount(6);
      await tryIt.getByTestId("kumimoji-try-all-back").click();
      await expect(hand).toHaveCount(7);

      // SENATOR across: a word, the grid sound, and Draw offered.
      for (const [col, letter] of [..."senator"].entries()) await lay(letter, `0,${col}`);
      await expect(tryIt.getByTestId("kumimoji-try-word")).toHaveText(["senator"]);
      const draw = tryIt.getByTestId("kumimoji-try-draw");
      await expect(draw).toBeEnabled();
      await draw.click();
      await lay("d", "1,3");
      await draw.click();
      await lay("i", "-1,4");
      await draw.click();
      await expect(draw).toBeDisabled();
      // The last is the wild: laid, then given its letter.
      await lay("*", "1,5");
      await tile("1,5").click();
      await tryIt.getByTestId("kumimoji-try-reading").selectOption({ label: "X" });
      await expect(tryIt).toHaveAttribute("data-finished", "true");
      await expect(page.getByTestId("kumimoji-try-said")).toContainText("Every tile is down in one crossword");
      // Across first, then down, as the game reads its runs.
      await expect(tryIt.getByTestId("kumimoji-try-word")).toHaveText(["senator", "ad", "ox", "it"]);
    });
    expect(calls, "the try-it asked the server something").toEqual([]);

    // And back to the start.
    await tryIt.getByTestId("kumimoji-try-again").click();
    await expect(hand).toHaveCount(7);
    await expect(tryIt).toHaveAttribute("data-finished", "false");
  });
});

test.describe("Kumimoji's rules, with no session", () => {
  test("count both sets from the game's table, and a kana tile shows every form it plays as", async ({ page }) => {
    await page.goto(`${AT}/rules`);
    await ready(page, "kumimoji-tiles");
    const tiles = page.getByTestId("kumimoji-mix-tile");
    const counted = async () => (await tiles.evaluateAll((all) => all.map((each) => Number(each.getAttribute("data-count"))))).reduce((sum, count) => sum + count, 0);

    await expect(tiles).toHaveCount(Object.keys(TILE_MIX).length);
    expect(await counted()).toBe(TILE_MIX_TOTAL);
    await expect(page.locator('[data-testid="kumimoji-mix-tile"][data-glyph="q"]')).toHaveAttribute("data-count", String(TILE_MIX.q));

    await page.getByTestId("kumimoji-tiles-japanese").click();
    await expect(tiles).toHaveCount(Object.keys(JAPANESE_TILE_MIX).length);
    expect(await counted()).toBe(Object.values(JAPANESE_TILE_MIX).reduce((sum, count) => sum + count, 0));
    // は is chosen to start with; つ pressed shows its own three.
    await expect(page.getByTestId("kumimoji-kana-form")).toHaveText(["は", "ば", "ぱ"]);
    await page.locator('[data-testid="kumimoji-mix-tile"][data-glyph="つ"] button').click();
    await expect(page.getByTestId("kumimoji-kana-forms")).toHaveAttribute("data-kana", "つ");
    await expect(page.getByTestId("kumimoji-kana-form")).toHaveText(["つ", "っ", "づ"]);

    // And the way back.
    await page.getByTestId("kumimoji-tiles-english").click();
    await expect(tiles).toHaveCount(Object.keys(TILE_MIX).length);
    await expect(page.getByTestId("kumimoji-kana-forms")).toHaveCount(0);
    await expect(page.getByTestId("kumimoji-length")).toHaveCount(3);
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("neither page is wider than the screen", async ({ page }) => {
      for (const path of [AT, `${AT}/rules`]) {
        await page.goto(path);
        await expect(page.getByTestId(path === AT ? "kumimoji-try" : "kumimoji-tiles")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(390);
      }
    });
  });
});
