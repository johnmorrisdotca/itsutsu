import { expect, test } from "@playwright/test";

import { forgetLanguage, ready } from "./support";

/**
 * WHAT A READER OF JAPANESE IS SHOWN WHERE A SCREEN BUILDS ITS WORDS FROM A CONSTANT (looked at on 2026-11-02).
 *
 * A puzzle's set-up screen drew its two Start presses from an English copy of the words, so a reader of Japanese was
 * told to "Start alone" and "Start with a friend" on a page that was Japanese everywhere else, and a Houseki game's
 * play page named the game in Latin letters in its trail while its set-up page had the Japanese name. The controls are
 * read, not the address: a reader whose browser asks for Japanese opens the pages as anybody would.
 */
test.use({ locale: "ja-JP", timezoneId: "Asia/Tokyo" });

// The operator is one account for the whole suite: a language another spec chose on it would outrank the browser.
test.beforeEach(async ({ page }) => forgetLanguage(page));

test("a puzzle's set-up presses say Start alone and Start with a friend in Japanese", async ({ page }) => {
  await page.goto("/games/hitofude/new");
  await expect(page.getByTestId("puzzle-solve")).toContainText("ひとりで始める");
  await expect(page.getByTestId("puzzle-race")).toContainText("友だちと始める");
  await expect(page.getByTestId("puzzle-solve")).not.toContainText("Start");
  await expect(page.getByTestId("puzzle-race")).not.toContainText("Start");
});

test("a Houseki game's play page names the game as its set-up page does", async ({ page }) => {
  await page.goto("/games/tsumiki/play?free=1&size=8x8&colours=6");
  await ready(page, "houseki-game");
  await expect(page.getByTestId("play-up")).toHaveText("積み木");
});
