import { expect, test } from "@playwright/test";
import { openAdvanced, playAt, playSequence } from "./support";

test.describe("clocks", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/");
  });

  test("there is no clock unless a game asks for one", async ({ page }) => {
    await expect(page.getByTestId("clock-one")).toHaveCount(0);
  });

  test("a time control starts both clocks and runs the one on move", async ({
    page,
  }) => {
    await openAdvanced(page);
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
    await page.getByTestId("time-control").selectOption("blitz");

    await playAt(page, 15, 7, 7);

    await expect(page.getByTestId("clock-two")).toHaveAttribute("data-active", "true");
    await expect(page.getByTestId("clock-one")).toHaveAttribute("data-active", "false");
  });
});

test.describe("game statistics", () => {
  test("count moves for each player", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/");

    await playSequence(page, 15, [[7, 7], [7, 8], [8, 8]]);

    const stats = page.getByTestId("game-stats");
    await expect(stats).toContainText("Moves");
    // Two stones for black, one for white.
    await expect(stats.getByRole("row", { name: /^Moves / })).toContainText("2");
  });

  test("count a threat that was ignored", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/");

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
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/");

    await playSequence(page, 15, [[7, 3], [0, 0], [7, 4]]);
    await expect(page.getByTestId("building-warning")).toHaveCount(0);
  });

  test("warns before an open three exists once it is turned on", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/");

    await openAdvanced(page);
    await page.getByLabel("Warn before a three forms").check();

    // Two black stones with room. Nothing is forced yet.
    await playSequence(page, 15, [[7, 3], [0, 0], [7, 4]]);

    await expect(page.getByTestId("building-warning")).toBeVisible();
  });
});

test.describe("chance of winning", () => {
  test("is hidden until asked for, then splits a hundred points", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/");

    await expect(page.getByTestId("win-chance")).toHaveCount(0);

    await openAdvanced(page);
    await page.getByLabel("Show chance of winning").check();

    const bar = page.getByTestId("win-chance").getByRole("img");
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("aria-label", /Black \d+ percent, White \d+ percent/);
  });

  test("swings towards the side building a threat", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/");

    await openAdvanced(page);
    await page.getByLabel("Show chance of winning").check();

    await playSequence(page, 15, [[7, 3], [0, 0], [7, 4], [0, 1], [7, 5]]);

    const label = await page
      .getByTestId("win-chance")
      .getByRole("img")
      .getAttribute("aria-label");
    const black = Number(/Black (\d+)/.exec(label ?? "")?.[1]);
    expect(black).toBeGreaterThan(60);
  });
});
