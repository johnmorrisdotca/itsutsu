import { expect, test } from "@playwright/test";

import { playAt } from "./support";

/**
 * A game refreshed a second after a move is still there.
 *
 * The address bar ran ahead of the record. GameView wrote
 * /games/<slug>/match/<id>/<move> from the local move index as soon as the match
 * had an id, while the moves were still being posted — and MatchPage refuses
 * a move number the game does not hold yet, correctly. So for the length of
 * that window the browser was showing an address naming a position the server
 * did not have, and a player who refreshed was told their game did not exist.
 *
 * Reproduced by refreshing at once rather than after a wait: the wait is what
 * has been hiding it, and three other tests in persistence.spec.ts pass for
 * exactly that reason.
 */
test.describe("refreshing straight after a move", () => {
  test("finds the game, rather than saying there is none", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await playAt(page, 15, 7, 7);
    await playAt(page, 15, 7, 8);

    /*
     * No wait. The address must never name a position the server has not been
     * told about, so reloading the moment it changes has to work — that is
     * the whole of the bug.
     */
    await page.waitForURL(/\/games\/gomoku\/match\/[a-z0-9-]+\/\d+$/, { timeout: 15_000 });
    const address = page.url();
    const answer = await page.reload();

    expect(answer?.status(), `reloading ${address} said the game does not exist`).toBe(200);
    await expect(page.locator("body")).not.toContainText("nothing here");
    // And it is the game: the stone that was played is still on the board.
    await expect(page.getByRole("button", { name: /^H8, Black stone$/ })).toBeVisible();
  });

  test("holds the address back while the record catches up, then follows it", async ({ page }) => {
    /*
     * The window is one request wide on a quick machine, so this widens it:
     * hold the per-move writes and the board runs ahead of the record on
     * purpose. Without the fix the bar says /games/gomoku/match/<id>/2 while the
     * server has no second move and answers 404 for that very address —
     * which is what a player met by refreshing.
     */
    await page.route("**/api/games/*/moves", async (route) => {
      if (route.request().method() === "POST") await new Promise((r) => setTimeout(r, 2500));
      await route.continue();
    });

    await page.goto("/games/gomoku/play");
    await playAt(page, 15, 7, 7);
    await playAt(page, 15, 7, 8);
    await page.waitForTimeout(600);

    // Whatever it says, the server must answer it.
    const held = page.url();
    const answer = await page.request.get(held);
    expect(answer.status(), `the bar named ${held}, which the server refused`).toBe(200);

    /*
     * And it must not name a stale position either. Holding the previous move
     * number was the first thing I tried and it is worse than the 404 it
     * replaced: a player who refreshed then saw one stone where they had
     * played two, with nothing to tell them so. Naming the BOARD rather than
     * a position in it is honest, and a refresh restores what they had.
     *
     * The board, specifically. /games/gomoku is the game's front door now and
     * has no board on it, so falling back to THAT would answer 200 and still
     * lose the player their stones — the very failure this test refuses,
     * wearing a passing status code.
     */
    expect(held, "the bar named a position rather than the board").toMatch(/\/games\/gomoku\/play$/);

    // And once the record catches up, the bar follows rather than sticking.
    await page.unroute("**/api/games/*/moves");
    await page.waitForURL(/\/games\/gomoku\/match\/[a-z0-9-]+\/2$/, { timeout: 20_000 });
    const caught = await page.request.get(page.url());
    expect(caught.status(), "the bar caught up to an address the server refused").toBe(200);
  });

  test("keeps naming a position the record actually holds", async ({ page }) => {
    /*
     * The same rule stated as a property rather than as a reload: whatever
     * the address says, asking the server for it answers. Checked at every
     * step of a short game, because the window is one request wide and a
     * single sample can walk straight past it.
     */
    await page.goto("/games/gomoku/play");
    for (const [row, col] of [[7, 7], [7, 8], [8, 7], [8, 8], [9, 7], [9, 8]] as const) {
      await playAt(page, 15, row, col);
      // At once: the window this is about is one request wide.
      const url = page.url();
      if (!/\/games\/gomoku\/match\/[a-z0-9-]+\/\d+$/.test(url)) continue;
      const answer = await page.request.get(url);
      expect(answer.status(), `the bar named ${url}, which the server refused`).toBe(200);
    }
  });
});
