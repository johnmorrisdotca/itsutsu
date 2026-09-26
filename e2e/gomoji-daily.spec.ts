import { expect, test } from "@playwright/test";

import { lastPastDay } from "../src/lib/puzzles/dailyWords/dailyArchive";
import { dailyWordSeed, dayAfter, dayKeyOf } from "../src/lib/puzzles/dailyWords/dailyDay";
import { dailyLengths, dailyWordOf, loadDailyPools } from "../src/lib/puzzles/dailyWords/dailyPools";
import { ready } from "./support";

/**
 * THE DAILY WORDS: a word a day at every length of every Gomoji, a button
 * each on the front door and the set-up ("Today's 4", "Today's 5"), and an
 * archive of the days gone by that never shows today's.
 *
 * Every assertion about a word reads it from the same pure code the site draws
 * it with (`dailyWords/`), so nothing here depends on what a database holds.
 * The one row this writes is the suite operator's own solve of today's
 * four-letter English word; a retry finds it already found, which the status
 * test accepts by name.
 */
const today = () => dayKeyOf(new Date());

test.beforeAll(() => loadDailyPools("gomojiKana"));

test.describe("today's words", () => {
  test("the front door has a button a length, and playing one marks it found with its time", async ({ page }) => {
    await page.goto("/games/gomoji");
    const rows = page.getByTestId("daily-row");
    await expect(rows).toHaveCount(dailyLengths("gomoji").length);
    const four = page.locator('[data-testid="daily-row"][data-size="4"]');
    // Not yet, or already found by this operator on an earlier try of this test: those two.
    await expect(four.getByTestId("daily-status")).toHaveAttribute("data-state", /^(notYet|found)$/);

    await four.getByTestId("daily-play").click();
    await ready(page, "puzzle-play");
    await expect(page).toHaveURL(new RegExp(`size=4&level=medium&seed=${dailyWordSeed(today())}`));
    const word = dailyWordOf("gomoji", 4, today())!.word;
    await page.keyboard.type(word);
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    // Kept: paid now, or already paid for on an earlier try — those two, never a refusal.
    await expect(page.getByTestId("puzzle-paid")).toHaveText(/XP|Already paid/);

    await page.goto("/games/gomoji");
    const status = page.locator('[data-testid="daily-row"][data-size="4"]').getByTestId("daily-status");
    await expect(status).toHaveAttribute("data-state", "found");
    await expect(status).toContainText(/✓ \d+:\d\d/);

    // Today's page races the times and keeps the words back until tomorrow.
    await page.getByTestId("daily-today-fastest").click();
    await expect(page).toHaveURL(new RegExp(`/games/gomoji/daily/${today()}$`));
    await expect(page.getByTestId("daily-day-length")).toHaveCount(dailyLengths("gomoji").length);
    await expect(page.getByTestId("daily-day-word")).toHaveCount(0);
    await expect(page.locator('[data-testid="daily-day-length"][data-size="4"]').getByTestId("daily-day-fastest-row").first()).toBeVisible();
    await expect(page.locator("main")).not.toContainText(word.toUpperCase());
  });

  test("the kana Gomoji has a button for each of its three lengths, each playing that length today", async ({ page }) => {
    await page.goto("/games/gomoji-kana");
    await expect(page.getByTestId("daily-row")).toHaveCount(3);
    for (const size of [3, 4, 5]) {
      const link = page.locator(`[data-testid="daily-row"][data-size="${size}"]`).getByTestId("daily-play");
      await expect(link).toContainText(`Today's ${size}`);
      await expect(link).toHaveAttribute("href", new RegExp(`size=${size}&level=easy&seed=${dailyWordSeed(today())}`));
    }
  });

  test("the set-up page offers the same buttons under the chooser", async ({ page }) => {
    await page.goto("/games/gomoji-mot/new");
    await ready(page, "puzzle-set-up");
    const panel = page.getByTestId("daily-words");
    await expect(panel.getByTestId("daily-play")).toHaveCount(dailyLengths("gomojiMot").length);
    await expect(panel.getByTestId("daily-play").first()).toHaveAttribute("href", new RegExp(`seed=${dailyWordSeed(today())}`));
  });

  test("the buttons fit a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/gomoji-kana");
    await expect(page.getByTestId("daily-row")).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test.describe("the archive of past words", () => {
  test("lists the days gone by, a word leading to its puzzle, and a search that narrows them", async ({ page }) => {
    await page.goto("/games/gomoji/daily");
    await ready(page, "daily-archive");
    const last = lastPastDay(today());
    if (last === null) {
      // The first day of the daily words: an empty table that says why.
      await expect(page.getByTestId("daily-empty")).toBeVisible();
      return;
    }
    const newest = page.getByTestId("daily-day").first();
    await expect(newest).toHaveAttribute("data-day", last);
    const yesterdays = dailyWordOf("gomoji", 5, last)!.word.toUpperCase();
    await expect(newest.locator('[data-testid="daily-word"][data-size="5"]')).toHaveText(yesterdays);

    await page.getByTestId("daily-search").fill(yesterdays.toLowerCase());
    await expect(page.getByTestId("daily-day")).toHaveCount(1);
    await page.getByTestId("daily-search").fill("");

    await newest.locator('[data-testid="daily-word"][data-size="5"]').click();
    await ready(page, "puzzle-play");
    await expect(page).toHaveURL(new RegExp(`size=5&level=medium&seed=${dailyWordSeed(last)}`));
  });

  test("answers 404 for a day to come", async ({ page }) => {
    const response = await page.goto(`/games/gomoji/daily/${dayAfter(today())}`);
    expect(response?.status()).toBe(404);
  });

  test.describe("for a reader with no invite", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("the archive is open and never shows today's words, even in its source", async ({ page }) => {
      const response = await page.goto("/games/gomoji-wort/daily");
      expect(response?.status()).toBe(200);
      await ready(page, "daily-archive");
      const source = (await page.content()).toLowerCase();
      for (const size of dailyLengths("gomojiWort")) {
        const word = dailyWordOf("gomojiWort", size, today())!.word;
        // A word comes round again only after every other has had its day, so today's is nowhere on a page of past days.
        expect(source.includes(`>${word}<`) || source.includes(`"${word}"`), `today's ${size}-letter word`).toBe(false);
      }
    });

    test("the front door's buttons show no standing, and a day's fastest asks for an invite", async ({ page }) => {
      await page.goto("/games/gomoji");
      await expect(page.getByTestId("daily-play")).toHaveCount(dailyLengths("gomoji").length);
      await expect(page.getByTestId("daily-status")).toHaveCount(0);
      await expect(page.getByTestId("daily-today-fastest")).toHaveCount(0);
      await page.goto(`/games/gomoji/daily/${today()}`);
      await expect(page).toHaveURL(/\/join/);
    });
  });
});
