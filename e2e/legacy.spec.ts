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

    // Go-Moku maps to Freestyle — the rule says it must be a real link.
    const goMoku = detail.getByRole("link", { name: "Go-Moku" });
    await expect(goMoku).toBeVisible();
    await expect(goMoku).toHaveAttribute("href", "/rules/freestyle");

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
