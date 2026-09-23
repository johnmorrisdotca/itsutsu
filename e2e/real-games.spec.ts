import { expect, test } from "@playwright/test";

/**
 * A GAME MADE OF ITS OWN GAMES (John, 2026-09-10): the final positions of the
 * last games played out, on the game's page, each leading to its game — for
 * members; a visitor is shown what the panel is and the way to ask in.
 *
 * It asserts the SHAPE rather than a count: the tiles are kept for an hour
 * (`realGames.ts`), so what a run sees depends on which games existed when the
 * hour began, and a spec must not assert anything about rows it did not make.
 */
test.describe("the real games on a game's page", () => {
  test("shows a member the boards, each leading to its game, or says none are finished", async ({ page }) => {
    await page.goto("/games/gomoku");
    const panel = page.getByTestId("real-games");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("From real games");
    const tiles = panel.getByTestId("real-game");
    if ((await tiles.count()) > 0) {
      await expect(tiles.first()).toHaveAttribute("href", /\/games\/gomoku\/match\/[^/]+$/);
      await expect(tiles.first().locator("svg circle").first()).toBeAttached();
    } else {
      await expect(panel.getByTestId("real-games-empty")).toBeVisible();
    }
  });

  test("shows a visitor the way in, and no boards", async ({ browser, baseURL }) => {
    // A context with no session at all: the project's own storage state is a signed-in member.
    const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/games/gomoku");
    const panel = page.getByTestId("real-games");
    await expect(panel.getByTestId("real-games-shut")).toBeVisible();
    await expect(panel.getByTestId("real-games-ask")).toHaveAttribute("href", "/join?ask=1");
    await expect(panel.getByTestId("real-game")).toHaveCount(0);
    await context.close();
  });

  test("is not drawn for a game on a hexagon, which a square picture would get wrong", async ({ page }) => {
    await page.goto("/games/hex");
    await expect(page.getByTestId("game-front-door")).toBeVisible();
    await expect(page.getByTestId("real-games")).toHaveCount(0);
  });
});
