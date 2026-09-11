import { expect, test } from "@playwright/test";

/**
 * Two pages where there was one.
 *
 * /games did four jobs — start a game, the open seats, who is here, and the
 * whole catalogue of forty games — and grew a section every time somebody
 * played, so everything under the queue sank a little further every week.
 *
 * Now: /my-games is the games you are playing, /games is starting another.
 */
test.describe("my games and new game are separate places", () => {
  test("the queue is on My games, and not on New game", async ({ page }) => {
    await page.goto("/my-games");
    await expect(page.getByRole("heading", { name: /My games/ })).toBeVisible();

    await page.goto("/games");
    // The lobby keeps the sentence that starts a game; the queue has left it.
    await expect(page.getByTestId("lobby-start")).toBeVisible();
    await expect(
      page.getByTestId("my-games"),
      "the queue is still on the page it was split out of",
    ).toHaveCount(0);
  });

  test("both are in the navigation, and the waiting count is beside the queue", async ({ page }) => {
    await page.goto("/games");
    const nav = page.locator("nav").first();
    // Play is the dashboard and Games is the catalogue: Play already meant
    // going to play your games, so it keeps the word.
    // Anchored, because "Players" is a link too and contains the word.
    await expect(nav.getByRole("link", { name: /^Play(\s|$)/ })).toBeVisible();
    await expect(nav.getByRole("link", { name: /^Games$/ })).toBeVisible();

    /*
     * The badge counts games waiting on you, so it belongs beside the page
     * that holds them rather than beside the one that starts new ones.
     */
    const badge = page.getByTestId("your-turn-badge");
    if ((await badge.count()) > 0) {
      const href = await badge.evaluate((node) => node.closest("a")?.getAttribute("href") ?? null);
      expect(href, "the waiting count hangs off the wrong page").toBe("/my-games");
    }
  });

  test("each page offers the other, so neither is a dead end", async ({ page }) => {
    await page.goto("/my-games");
    await expect(page.getByTestId("to-new-game")).toHaveAttribute("href", "/games");
  });
});
