import { expect, test } from "@playwright/test";

import { openGamesPage } from "./support";

/**
 * Settling a game before there is a game.
 *
 * Every rule used to be chosen on a board that already existed: asking for a
 * game created one, and you landed on something that looked like a live match
 * with its settings still open. This walks the other way round — settle first,
 * then start — and checks the thing that makes it worth doing: nothing is
 * written until the button is pressed.
 */
test.describe("setting a game up before it exists", () => {
  test("writes nothing until the game is started", async ({ page, request }) => {
    const before = await (await request.get("/api/games/mine")).json();
    const count = (before.games ?? before).length ?? 0;

    await page.goto("/games/gomoku/new");
    await expect(page.getByTestId("set-up-game")).toBeVisible();
    // Move every control there is. Nothing has been created by any of it.
    await page.getByTestId("shared-rules-size").selectOption("19");
    await page.getByTestId("shared-rules-rated").selectOption("friendly");
    await page.getByTestId("shared-rules-move-time").selectOption({ index: 1 });

    const after = await (await request.get("/api/games/mine")).json();
    expect(((after.games ?? after).length ?? 0)).toBe(count);
  });

  test("says what it is about to make, and then makes exactly that", async ({ page, request }) => {
    await page.goto("/games/gomoku/new");
    await page.getByTestId("shared-rules-size").selectOption("19");
    await page.getByTestId("shared-rules-rated").selectOption("friendly");
    await expect(page.getByTestId("set-up-summary")).toContainText("19×19");

    await page.getByTestId("set-up-start").click();
    await page.waitForURL(/\/games\/gomoku\/match\/[a-z0-9]{4}-[a-z0-9]{4}/, { timeout: 30_000 });
    const id = page.url().split("/games/gomoku/match/")[1].split("/")[0];
    const made = await (await request.get(`/api/games/${id}`)).json();
    expect(made.size).toBe(19);
    expect(made.rated).toBe(false);
    expect(made.variant).toBe("freestyle");
  });

  test("is the game its address names, and cannot become another", async ({ page }) => {
    await page.goto("/games/reversi/new");

    /*
     * No game picker here: the address names the game. That is the crash this
     * screen exists to make impossible — a form that could change the game
     * under its own address leaves the two disagreeing, which is exactly what
     * happened when the rules could be changed on a board already posted.
     */
    await expect(page.getByTestId("shared-rules-variant")).toHaveCount(0);
    // Reversi is 8×8 and has no board to choose either, so nothing is asked.
    await expect(page.getByTestId("shared-rules-size")).toHaveCount(0);
    await expect(page.getByTestId("set-up-summary")).toContainText("Reversi");
    await expect(page.getByTestId("set-up-summary")).toContainText("8×8");
  });

  test("is reachable from the sentence, for the game the sentence is on", async ({ page }) => {
    await openGamesPage(page);
    await page.getByTestId("start-game-variant").selectOption("reversi");
    await page.getByTestId("start-game-set-up").click();
    await page.waitForURL(/\/games\/reversi\/new$/);
    await expect(page.getByTestId("set-up-summary")).toContainText("Reversi");
  });
});
