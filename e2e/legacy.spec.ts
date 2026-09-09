import { expect, test } from "@playwright/test";

/**
 * The rule John set: if a page lists a game, it links to that game. A legacy
 * record names games from another site, so this is where the rule is easiest
 * to break by accident — it checks the actual rendered page, not just that
 * the alias table has an entry.
 */
test.describe("a legacy record's games link to what they are", () => {
  test("an aliased game name is a link; an unmapped one is plain text", async ({ page }) => {
    // One page per person: John's ItsYourTurn chapter, where he played as
    // Incognito, sits on his own record rather than at a second address.
    await page.goto("/players/jmorris");
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

  test("one person is one page, with every site they played on", async ({ page }) => {
    /*
     * Chibi played on ItsYourTurn from 2001 and on GoldToken from 2003. He is
     * one man, so he is one page: two records cross-referencing each other
     * would be two addresses a visitor could land on for him.
     */
    await page.goto("/players/chibi");
    await expect(page.getByTestId("legacy-player")).toContainText("ItsYourTurn.com");
    await expect(page.getByTestId("legacy-player")).toContainText("GoldToken.com");
    await expect(page.getByTestId("legacy-source")).toHaveCount(2);

    // The address his GoldToken record used to have is nobody's now.
    const gone = await page.goto("/players/chibi-goldtoken");
    expect(gone?.status()).toBe(404);
  });

  test("shows both of a person's handles when they differ", async ({ page }) => {
    // John was Incognito on one site and John Morris on the other.
    await page.goto("/players/jmorris");
    await expect(page.getByTestId("legacy-player")).toContainText("Incognito");
    await expect(page.getByTestId("legacy-player")).toContainText("John Morris");
    await expect(page.getByTestId("legacy-source")).toHaveCount(2);
  });
});
