import { expect, test } from "@playwright/test";
import { gamesMade } from "./tidy";
import { ready } from "./support";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * Turning the board round, for yourself.
 *
 * A per-viewer view and nothing else: it moves no stone, changes no
 * coordinate, and the other seat never learns of it. The thing to prove is
 * both halves of that — that the board really does turn, gutters and all, and
 * that the opponent's board does not.
 */
test.describe("turning the board round", () => {
  async function game(request: import("@playwright/test").APIRequestContext) {
    const response = await request.post("/api/games/live", {
      data: { blackName: `Kaya ${Date.now().toString(36)}`, whiteName: "Sumi", size: 9 },
    });
    expect(response.status()).toBe(201);
    const game = (await response.json()) as { id: string; blackToken: string; whiteToken: string };
    tidyAway(game.id);
    return game;
  }

  test("turns the board, and takes the letters and numbers with it", async ({ page, request }) => {
    const live = await game(request);
    await page.goto(`/games/gomoku/match/${live.id}/seat/${live.blackToken}`);
    await page.waitForURL(/\/games\/gomoku\//);

    /*
     * The board and the Turn button are both the shared game's, and both are
     * server-rendered: a stone played or a turn asked for before React
     * attaches is dropped, and the failure lands on a coordinate.
     */
    await ready(page, "shared-game");
    // A stone somewhere off-centre, so a half turn is visible rather than symmetric.
    await page.getByRole("button", { name: /^A9, empty$/ }).click();
    await expect(page.getByRole("button", { name: "A9, Black stone" })).toBeVisible();

    const board = page.getByRole("button", { name: /^[A-J]\d+, / });
    // Unturned, the first cell drawn is the top-left, A9.
    await expect(board.first()).toHaveAccessibleName(/^A9, /);

    await page.getByTestId("turn-board").click();

    // Turned, the first cell drawn is the opposite corner — and A9 is now last.
    await expect(board.first()).toHaveAccessibleName(/^J1, /);
    await expect(board.last()).toHaveAccessibleName(/^A9, Black stone$/);
  });

  test("the other player's board does not move", async ({ browser, request }) => {
    const live = await game(request);
    const black = await (await browser.newContext()).newPage();
    const white = await (await browser.newContext()).newPage();
    await black.goto(`/games/gomoku/match/${live.id}/seat/${live.blackToken}`);
    await white.goto(`/games/gomoku/match/${live.id}/seat/${live.whiteToken}`);

    await ready(black, "shared-game");
    await black.getByTestId("turn-board").click();
    await expect(black.getByRole("button", { name: /^[A-J]\d+, / }).first()).toHaveAccessibleName(
      /^J1, /,
    );

    // White's board is where it always was. This is the whole promise.
    await white.reload();
    await expect(white.getByRole("button", { name: /^[A-J]\d+, / }).first()).toHaveAccessibleName(
      /^A9, /,
    );
    await expect(white.getByTestId("turn-board")).toHaveText(/Turn the board round/);
  });

  test("the record shows the game the way it was being read", async ({ page, request }) => {
    const live = await game(request);
    await page.goto(`/games/gomoku/match/${live.id}/seat/${live.blackToken}`);
    await page.waitForURL(/\/games\/gomoku\//);
    await ready(page, "shared-game");
    await page.getByRole("button", { name: /^A9, empty$/ }).click();
    await expect(page.getByRole("button", { name: "A9, Black stone" })).toBeVisible();
    await page.getByTestId("turn-board").click();

    // The same game, filed. It was being read upside down; it still is.
    await request.post(`/api/games/${live.id}/resign`, { data: { token: live.whiteToken } });
    await page.goto(`/games/gomoku/match/${live.id}`);
    await expect(page.getByRole("button", { name: /^[A-J]\d+, / }).first()).toHaveAccessibleName(/^J1, /);
    await expect(page.getByTestId("turn-board")).toHaveText(/Turn the board back/);
  });

  test("is remembered for that game, and not for another", async ({ page, request }) => {
    const one = await game(request);
    const two = await game(request);

    await page.goto(`/games/gomoku/match/${one.id}/seat/${one.blackToken}`);
    await page.waitForURL(/\/games\/gomoku\//);
    await ready(page, "shared-game");
    await page.getByTestId("turn-board").click();
    await expect(page.getByTestId("turn-board")).toHaveText(/Turn the board back/);

    // Still turned when you come back to it.
    await page.reload();
    await expect(page.getByTestId("turn-board")).toHaveText(/Turn the board back/);

    // A different game is a different sitting, and is left alone.
    await page.goto(`/games/gomoku/match/${two.id}/seat/${two.blackToken}`);
    await page.waitForURL(/\/games\/gomoku\//);
    await expect(page.getByTestId("turn-board")).toHaveText(/Turn the board round/);
  });
});
