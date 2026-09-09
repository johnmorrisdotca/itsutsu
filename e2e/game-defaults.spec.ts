import { expect, test } from "@playwright/test";

import { memberContext } from "./members";
import { openAdvanced, openSetup, playAt } from "./support";

/**
 * Where a new game starts for a member.
 *
 * The same handful of choices were being made again on every game and on
 * every device. What is checked here is that setting them once really does
 * change where a new board starts — and, just as importantly, that it does
 * not reach a game already under way.
 */
test.describe("new games start where the member said", () => {
  test("sets the board and the switches once, and a new game begins there", async ({
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `setter-${stamp}@example.test`,
      name: `Setter ${stamp}`,
    });
    const page = await context.newPage();

    await page.goto("/me");
    await expect(page.getByTestId("game-defaults")).toBeVisible();
    await page.getByTestId("default-size").selectOption("9");
    await page.getByTestId("save-game-defaults").click();
    await expect(page.getByText("Saved.")).toBeVisible();

    // A new game of the plain game: nine by nine, without being asked.
    await page.goto("/games/gomoku");
    await openSetup(page);
    await expect(page.getByTestId("board-size")).toHaveValue("9");
    // And the board really is that size: H8 exists on 9×9, T19 does not.
    await expect(page.getByRole("button", { name: /^E5, empty$/ })).toBeVisible();

    await context.close();
  });

  test("does not reach a game already under way", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `midgame-${stamp}@example.test`,
      name: `Midgame ${stamp}`,
    });
    const page = await context.newPage();

    // A game begun on the ordinary board, with a stone on it.
    await page.goto("/games/gomoku");
    await openSetup(page);
    await expect(page.getByTestId("board-size")).toHaveValue("15");
    await playAt(page, 15, 7, 7);
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();

    // The member changes where new games start, in another tab.
    const settings = await context.newPage();
    await settings.goto("/me");
    await settings.getByTestId("default-size").selectOption("19");
    await settings.getByTestId("save-game-defaults").click();
    await expect(settings.getByText("Saved.")).toBeVisible();
    await settings.close();

    // The game in progress is untouched: its settings are what was agreed.
    await page.reload();
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
    await openSetup(page);
    await expect(page.getByTestId("board-size")).toHaveValue("15");

    await context.close();
  });

  test("keeps the game its address names, whatever the defaults say", async ({
    browser,
    baseURL,
  }) => {
    // A standing board size must never turn /games/hex into something else.
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `hexer-${stamp}@example.test`,
      name: `Hexer ${stamp}`,
    });
    const page = await context.newPage();

    await page.goto("/me");
    await page.getByTestId("default-size").selectOption("19");
    await page.getByTestId("default-draw-limit").selectOption("half");
    await page.getByTestId("save-game-defaults").click();
    await expect(page.getByText("Saved.")).toBeVisible();

    await page.goto("/games/hex");
    await openSetup(page);
    await openAdvanced(page);
    // Hex is played on its own board, and cannot be given a length at all.
    await expect(page.getByTestId("draw-limit")).toBeDisabled();
    await context.close();
  });
});
