import { expect, test } from "@playwright/test";

/**
 * The rule John set: if a page lists a game, it links to that game. A legacy
 * record names games from another site, so this is where the rule is easiest
 * to break by accident — it checks the actual rendered page, not just that
 * the alias table has an entry.
 */
test.describe("a legacy record's games link to what they are", () => {
  test("an aliased game name is a link; an unmapped one is plain text", async ({ page }) => {
    await page.goto("/players/incognito");
    const detail = page.getByTestId("legacy-detail").first();

    // Go-Moku maps to our Gomoku (internally still the "freestyle" variant) —
    // exact, since "Pro Go-Moku" is also a link a few rows down and would
    // otherwise match too.
    const goMoku = detail.getByRole("link", { name: "Go-Moku", exact: true });
    await expect(goMoku).toBeVisible();
    await expect(goMoku).toHaveAttribute("href", "/rules/gomoku");

    // Backgammon has no Itsutsu equivalent — it must render, but not as a link.
    await expect(detail.getByText("Backgammon", { exact: true })).toBeVisible();
    await expect(detail.getByRole("link", { name: "Backgammon", exact: true })).toHaveCount(0);
  });

  test("a head-to-head record links each game the same way", async ({ page }) => {
    await page.goto("/players/jmorris");
    const log = page.getByTestId("legacy-head-to-head-log");
    await expect(log.getByRole("link", { name: "Long Gammon" })).toHaveCount(0);
    await expect(log.getByText("Long Gammon").first()).toBeVisible();
  });
});
