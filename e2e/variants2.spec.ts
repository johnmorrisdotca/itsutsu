import { expect, test } from "@playwright/test";
import { openSetup, playAt } from "./support";

/**
 * The second wave of games: the choose-a-colour games, the one-colour game,
 * the pair-and-triple capture game, and the wormhole. Driven through the
 * settings and the board, as a player would.
 */
test.describe("more variants", () => {
  test("maker and breaker: the mover picks the colour and any five is the maker's", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("makerBreaker");
    await expect(page.getByTestId("board-size")).toHaveValue("6");
    await expect(page.getByTestId("board-size")).toBeDisabled();
    await expect(page.getByTestId("colour-chooser")).toBeVisible();
    await expect(page.getByTestId("variant-line")).toContainText("Maker");

    // Seat one, black, lays a white stone.
    await page.getByTestId("place-white").click();
    await playAt(page, 6, 0, 0);
    await expect(page.getByRole("button", { name: /^A\d, White stone$/ })).toHaveCount(1);
    // The turn passed to seat two all the same.
    await expect(page.getByTestId("to-play")).toContainText("White");

    // Both players lay white along the top row: the fifth is the maker's win, whoever laid it.
    await page.getByTestId("place-white").click();
    await playAt(page, 6, 0, 1);
    await playAt(page, 6, 0, 2);
    await playAt(page, 6, 0, 3);
    await playAt(page, 6, 0, 4);
    await expect(page.getByTestId("to-play")).toContainText(/wins in 5 moves/);
  });

  test("notakto: every stone is black and the third in a row loses", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("notakto");
    await expect(page.getByTestId("board-size")).toHaveValue("3");
    await expect(page.getByTestId("colour-chooser")).toHaveCount(0);
    await playAt(page, 3, 0, 0);
    await playAt(page, 3, 1, 1);
    await expect(page.getByRole("button", { name: /, Black stone$/ })).toHaveCount(2);
    await expect(page.getByRole("button", { name: /, White stone$/ })).toHaveCount(0);
    // Seat one is forced along the diagonal and loses by it.
    await playAt(page, 3, 2, 2);
    await expect(page.getByTestId("to-play")).toContainText(/wins/);
  });

  test("sannuki counts captures in stones, fifteen to win", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("board-size").selectOption("9");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("sannuki");
    await expect(page.getByTestId("variant-line")).toContainText("15");
    // Black flanks a white triple: x o o o x on row 4.
    await playAt(page, 9, 4, 0);
    await playAt(page, 9, 4, 1);
    await playAt(page, 9, 0, 0);
    await playAt(page, 9, 4, 2);
    await playAt(page, 9, 0, 1);
    await playAt(page, 9, 4, 3);
    await playAt(page, 9, 4, 4);
    await expect(page.getByRole("button", { name: /, White stone$/ })).toHaveCount(0);
    await expect(page.getByTestId("variant-line")).toContainText(/Black 3/);
  });

  test("worm drop shows two wormhole mouths on a 7×7 board", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("wormDrop");
    await expect(page.getByTestId("board-size")).toHaveValue("7");
    await expect(page.getByRole("button", { name: /, wormhole$/ })).toHaveCount(2);
  });

  test("the rules page and game browser name what a clone is inspired by", async ({ page }) => {
    await page.goto("/rules/drop-four");
    await expect(page.getByTestId("inspired-by")).toContainText("Connect Four");
    await page.goto("/rules/gomoku");
    await expect(page.getByTestId("inspired-by")).toHaveCount(0);
    await page.goto("/games/gomoku");
    await page.getByTestId("open-game-browser").first().click();
    await expect(page.getByTestId("inspired-twistFive")).toContainText("Pentago");
  });
});

test.describe("the flipping games", () => {
  test("reversi opens with four legal moves and a move turns the bracketed disc", async ({ page }) => {
    await page.goto("/games/reversi");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/reversi");
    await expect(page.getByTestId("disc-count")).toHaveText(/2.*2/);
    const legal = page.getByRole("button", { name: /empty$/ }).and(page.locator(":not([disabled])"));
    await expect(legal).toHaveCount(4);
    await page.getByRole("button", { name: /^D6, empty$/ }).click();
    await expect(page.getByTestId("disc-count")).toHaveText(/4.*1/);
    await expect(page.getByTestId("to-play")).toContainText("White");
    // Undo turns the disc back, not only lifts the one placed.
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("disc-count")).toHaveText(/2.*2/);
  });

  test("the rules page for a flipping game speaks of discs, at its kebab address", async ({ page }) => {
    await page.goto("/rules/anti-reversi");
    await expect(page.getByText(/fewer discs/i).first()).toBeVisible();
    expect((await page.request.get("/rules/antiReversi")).status()).toBe(404);
  });
});

