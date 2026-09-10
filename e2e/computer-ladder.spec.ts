import { expect, test } from "@playwright/test";

import { clearComputerStandings, seedComputerStandings } from "./members";

/**
 * The ladder for games against the computer players, per game.
 *
 * Per game because that is the only honest grain: a program that reads Reversi
 * well is not thereby good at Halma, and John's ruling was to do what the elder
 * sites do and keep one ladder per game.
 *
 * The figures below are shaped like what production actually measured, and
 * that shape is the point of the test. Over thirty games of Reversi the gentle
 * grades were BEATING the strong ones — so a page that drew the ladder in the
 * order the grade names suggest would be reporting a plan rather than a result.
 */
const VARIANT = "reversi";
const INVERTED = [
  { key: "kyu", name: "Kyu", rating: 1662, games: 12, wins: 9, losses: 3 },
  { key: "dan", name: "Dan", rating: 1641, games: 11, wins: 8, losses: 3 },
  { key: "meijin", name: "Meijin", rating: 1558, games: 14, wins: 5, losses: 9 },
  { key: "guoshou", name: "Guoshou", rating: 1539, games: 13, wins: 4, losses: 9 },
];
const KEYS = INVERTED.map((one) => one.key);

test.describe("the ladder against the computer players", () => {
  test.beforeEach(async () => {
    await seedComputerStandings(VARIANT, INVERTED);
  });
  test.afterEach(async () => {
    await clearComputerStandings(VARIANT, KEYS);
  });

  test("stands on its own, beside the ladder of people rather than mixed into it", async ({ page }) => {
    await page.goto("/champions/reversi");
    const section = page.getByTestId("computer-standings");
    await expect(section).toBeVisible();
    // Said in words, because two ratings on one page invite being compared.
    await expect(section).toContainText("never added together");
  });

  test("shows the order the games made, not the order the names suggest", async ({ page }) => {
    /*
     * THE CASE THIS PAGE EXISTS TO GET RIGHT. Kyu and Dan are the gentle two
     * and Meijin and Guoshou the strong two, and on the measured results the
     * gentle two are ahead. The page has to say so.
     */
    await page.goto("/champions/reversi");
    const names = page.getByTestId("computer-standings-table").locator("tbody tr td:nth-child(2)");
    await expect(names.nth(0)).toContainText("Kyu");
    await expect(names.nth(1)).toContainText("Dan");
    await expect(names.nth(2)).toContainText("Meijin");
    await expect(names.nth(3)).toContainText("Guoshou");
  });

  test("says how settled each standing is, rather than presenting a dozen games as a verdict", async ({ page }) => {
    // Eleven to fourteen games is provisional, and the row says so. A ladder
    // that looked identical at twelve games and at two hundred would be
    // claiming more than it knows.
    await page.goto("/champions/reversi");
    const rows = page.getByTestId("computer-standings-table").locator("tbody tr");
    await expect(rows.first()).toContainText("Provisional");
  });

  test("every count leads to exactly the games behind it", async ({ page }) => {
    /*
     * A rating's record is the RATED games of ONE pool. A link that dropped
     * either would answer a wider question than the number it sits under —
     * the same fault as a figure that reads the wrong half of a row, one level
     * further down.
     */
    await page.goto("/champions/reversi");
    const link = page
      .getByTestId("computer-standings-table")
      .locator("tbody tr a[href*='pool=']")
      .first();
    const href = (await link.getAttribute("href")) ?? "";
    expect(href).toContain("pool=computer");
    expect(href).toContain("rated=yes");
    expect(href).toContain("/history/reversi");
  });

  test("is not drawn at all for a game nobody has played a program at", async ({ page }) => {
    // A heading over an empty table reads as a broken page rather than as an
    // answer, and most games have no such standings at all.
    await page.goto("/champions/halma");
    await expect(page.getByTestId("computer-standings")).toHaveCount(0);
  });
});
