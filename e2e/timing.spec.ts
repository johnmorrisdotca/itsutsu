import { expect, test } from "@playwright/test";
import { openAdvanced, openSetup, playAt, playSequence } from "./support";

test.describe("clocks", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");
  });

  test("there is no clock unless a game asks for one", async ({ page }) => {
    await expect(page.getByTestId("clock-one")).toHaveCount(0);
  });

  test("a time control starts both clocks and runs the one on move", async ({
    page,
  }) => {
    await openAdvanced(page);
    await openSetup(page);
    await page.getByTestId("time-control").selectOption("blitz");

    const black = page.getByTestId("clock-one");
    const white = page.getByTestId("clock-two");
    await expect(black).toBeVisible();

    // Black is on move, so black's clock is the live one.
    await expect(black).toHaveAttribute("data-active", "true");
    await expect(white).toHaveAttribute("data-active", "false");

    const before = await black.innerText();
    await page.waitForTimeout(1600);
    expect(await black.innerText()).not.toBe(before);

    // White's clock has not moved while it was not their turn.
    await expect(white).toContainText("3:00");
  });

  test("the clock passes to the other player after a move", async ({ page }) => {
    await openAdvanced(page);
    await openSetup(page);
    await page.getByTestId("time-control").selectOption("blitz");

    await playAt(page, 15, 7, 7);

    await expect(page.getByTestId("clock-two")).toHaveAttribute("data-active", "true");
    await expect(page.getByTestId("clock-one")).toHaveAttribute("data-active", "false");
  });
});

test.describe("game statistics", () => {
  test("count moves for each player", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");

    await playSequence(page, 15, [[7, 7], [7, 8], [8, 8]]);

    const stats = page.getByTestId("game-stats");
    await expect(stats).toContainText("Moves");
    // Two stones for black, one for white.
    await expect(stats.getByRole("row", { name: /^Moves / })).toContainText("2");
  });

  test("count a threat that was ignored", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");

    // Black builds an open three; white plays far away instead of answering.
    await playSequence(page, 15, [[7, 3], [0, 0], [7, 4], [0, 1], [7, 5], [14, 14]]);

    const row = page
      .getByTestId("game-stats")
      .getByRole("row", { name: /^Threats ignored / });
    await expect(row).toContainText("1");
  });
});

test.describe("early warning", () => {
  test("is off by default, so two stones raise nothing", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");

    await playSequence(page, 15, [[7, 3], [0, 0], [7, 4]]);
    await expect(page.getByTestId("building-warning")).toHaveCount(0);
  });

  test("warns before an open three exists once it is turned on", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");

    await openAdvanced(page);
    await page.getByLabel("Warn before a three forms").check();

    // Two black stones with room. Nothing is forced yet.
    await playSequence(page, 15, [[7, 3], [0, 0], [7, 4]]);

    await expect(page.getByTestId("building-warning")).toBeVisible();
  });
});

test.describe("who is ahead", () => {
  test("is hidden until asked for, and then reads the position in words", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");

    await expect(page.getByTestId("advantage")).toHaveCount(0);

    await openAdvanced(page);
    await page.getByLabel("Who is ahead").check();

    const panel = page.getByTestId("advantage");
    await expect(panel).toBeVisible();
    // Gomoku is read by threats, and a threat reading carries no number: a
    // percentage would be a claim about a search this site does not run.
    await expect(panel).toHaveAttribute("data-kind", "threats");
    await expect(panel).not.toContainText("%");
    await expect(panel).toContainText("Level");
  });

  test("gives the lead to the side building a threat", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");

    await openAdvanced(page);
    await page.getByLabel("Who is ahead").check();

    await playSequence(page, 15, [[7, 3], [0, 0], [7, 4], [0, 1], [7, 5]]);

    // Black has an open three and white has nothing, so the reading marks
    // black — by name, not by a figure anybody would have to trust.
    await expect(page.getByTestId("advantage-black")).toHaveAttribute("data-lead", "true");
    await expect(page.getByTestId("advantage-white")).not.toHaveAttribute("data-lead", "true");
  });

  test("says plainly when a game cannot be read that way", async ({ page }) => {
    /*
     * The half the old bar got wrong. Reversi has no lines to read, and used
     * to be told there was no reading in a game where stones move after they
     * are placed — in Reversi they do not move, they turn. It is counted now.
     */
    await page.goto("/games/reversi");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/reversi");

    await openAdvanced(page);
    await page.getByLabel("Who is ahead").check();

    const panel = page.getByTestId("advantage");
    await expect(panel).toHaveAttribute("data-kind", "count");
    await expect(panel).toContainText("Discs on the board");
  });
});
