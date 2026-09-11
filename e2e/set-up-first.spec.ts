import { expect, test } from "@playwright/test";

import { openSetUpPage } from "./support";

/**
 * Nothing is settled at a board.
 *
 * John's objection, twice: he wants the game, the board, the pace and the
 * opponent locked in before he ever lands on something that looks like a
 * board. The screen that does that already existed at /games/<game>/new — what
 * did not was a way to reach it that meant what it said.
 *
 * The word "Play" was attached to the control that does NOT start a game. It
 * led to a scratch board, and a scratch board becomes a real game the moment a
 * stone goes down. So somebody wanting a game against a person pressed the
 * button that said Play and arrived somewhere that had already begun, with
 * nothing agreed. Quietening that button would have left the lie in place; the
 * word had to move.
 */
test.describe("play leads to settling a game, not to a board", () => {
  test("from a game's own page", async ({ page }) => {
    await page.goto("/games/gomoku");

    // The loud control says Play and leads where the word means.
    const play = page.getByTestId("game-set-up");
    await expect(play).toContainText("Play");
    await play.click();
    await expect(page).toHaveURL(/\/games\/gomoku\/new$/);

    // And what it leads to is the whole decision, not a board.
    await expect(page.getByTestId("set-up-game")).toBeVisible();
    await expect(page.getByTestId("set-up-start")).toBeVisible();
  });

  test("the board is still there, and says what it is", async ({ page }) => {
    /*
     * Removing it would take away the fastest way to meet one of the games
     * nobody has played, which is most of what that page is for. It was never
     * the wrong page — only the wrong name.
     */
    await page.goto("/games/gomoku");
    const board = page.getByTestId("game-play");
    // Waited for before anything is denied of it: `not.toContainText` passes
    // the instant it is asked, so on an unrendered page it would agree that
    // the button does not say Play by agreeing there is no button.
    await expect(board).toBeVisible();
    await expect(board).not.toContainText("Play ");
    await board.click();
    await expect(page).toHaveURL(/\/games\/gomoku\/play$/);
  });

  test("from the lobby, where the sentence used to be", async ({ page }) => {
    // The lobby held a one-line sentence with dropdowns in it that settled
    // some of a game and left the rest to be found at a board. It offers the
    // door now, and the room is where everything is decided.
    await page.goto("/games");
    const start = page.getByTestId("lobby-set-up");
    await expect(start).toBeVisible();
    await start.click();
    await expect(page).toHaveURL(/\/games\/new$/);
  });

  test("and there the game itself is the first thing to choose", async ({ page }) => {
    /*
     * The piece that was actually missing. /games/<game>/new settles a game
     * somebody has already picked; there was no way to say "I want a game"
     * without first saying which — which is why the lobby kept a form of its
     * own. The two screens are one screen, with the game still to choose.
     */
    await openSetUpPage(page);
    await expect(page.getByTestId("shared-rules-variant")).toBeVisible();

    /*
     * Where the address already names the game, changing it would make the
     * address a lie, so it is not offered.
     *
     * An absence is asserted only after something PRESENT on the same form has
     * been waited for. `toHaveCount(0)` passes the instant it is asked, so on
     * its own it cannot tell "this control is not offered" from "I asked
     * before the page had answered" — which is the quietest way for a test to
     * say nothing at all.
     */
    await openSetUpPage(page, "gomoku");
    await expect(page.getByTestId("set-up-with")).toBeVisible();
    await expect(page.getByTestId("shared-rules-variant")).toHaveCount(0);
  });

  test("nothing is written until the button at the bottom", async ({ page, request }) => {
    // The whole point of the ticket: no half-made game to land on. Opening the
    // screen and leaving creates nothing.
    const before = await request.get("/api/games/mine");
    const had = before.ok() ? JSON.stringify(await before.json()).length : 0;
    await page.goto("/games/new");
    await expect(page.getByTestId("set-up-game")).toBeVisible();
    await page.goto("/games");
    const after = await request.get("/api/games/mine");
    const has = after.ok() ? JSON.stringify(await after.json()).length : 0;
    expect(has, "looking at the setup screen starts nothing").toBe(had);
  });
});
