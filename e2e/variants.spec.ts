import { expect, test } from "@playwright/test";
import { openAdvanced, openSetup, playAt, playSequence } from "./support";

/**
 * The rule variants, driven the way a player drives them: through the games
 * browser and the settings, then by putting stones on the board.
 */
test.describe("rule variants", () => {
  test("the games browser lists every variant and switches the rules", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.getByTestId("open-game-browser").first().click();

    const browser = page.getByTestId("game-browser");
    await expect(browser).toBeVisible();
    for (const variant of ["freestyle", "standard", "renju", "omok", "caro", "ninuki", "connect6"]) {
      await expect(browser.getByTestId(`game-card-${variant}`)).toBeVisible();
    }
    await expect(browser.getByTestId("game-card-renju")).toContainText("double three");

    await browser.getByTestId("play-renju").click();
    await expect(browser).toBeHidden();
    await expect(page.getByTestId("rules")).toHaveValue("renju");
    await expect(page.getByTestId("first-player")).toBeDisabled();
  });

  test("renju marks black's double three as forbidden and refuses it", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("board-size").selectOption("9");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("renju");

    // Black builds two stones along row 4 and two down column 4; white stays away.
    await playSequence(page, 9, [
      [4, 2], [0, 0],
      [4, 3], [0, 1],
      [2, 4], [0, 2],
      [3, 4], [0, 3],
    ]);

    // 4,4 would make two open threes at once: it is E5 on a 9×9 board.
    const forbidden = page.getByRole("button", { name: /^E5, forbidden$/ });
    await expect(forbidden).toBeVisible();
    await expect(forbidden).toBeDisabled();
    await expect(page.getByTestId("variant-line")).toContainText("double three");
    // A harmless point is still open to black.
    await expect(page.getByRole("button", { name: /^H1, empty$/ })).toBeEnabled();
  });

  test("swap2 pauses after three stones for a colour choice", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("opening").selectOption("swap2");
    await expect(page.getByTestId("opening-notice")).toContainText("first three stones");

    await playSequence(page, 15, [[7, 7], [7, 8], [8, 8]]);

    const choice = page.getByTestId("opening-choice");
    await expect(choice).toBeVisible();
    await expect(choice).toContainText("Player 2");
    await expect(page.getByTestId("extend-opening")).toBeVisible();
    // No stone may be placed until the choice is made.
    await expect(page.getByRole("button", { name: /^A15, empty$/ })).toBeDisabled();

    await page.getByTestId("take-black").click();
    await expect(choice).toBeHidden();
    // White moves next, and after the swap white is Player 1.
    await expect(page.getByTestId("to-play")).toContainText("Player 1");
    await expect(page.getByRole("button", { name: /^A15, empty$/ })).toBeEnabled();
  });

  test("connect6 gives two stones a turn after the first", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("connect6");
    await openSetup(page);
    await page.getByTestId("board-size").selectOption("19");

    await playAt(page, 19, 9, 9);
    await expect(page.getByTestId("to-play")).toContainText("White");
    await playAt(page, 19, 9, 10);
    // Still white: the second stone of the pair.
    await expect(page.getByTestId("to-play")).toContainText("White");
    await expect(page.getByTestId("variant-line")).toContainText("Stone 2 of 2");
    await playAt(page, 19, 9, 11);
    await expect(page.getByTestId("to-play")).toContainText("Black");
  });

  test("a handicap forbids one colour a shape the game otherwise allows", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("board-size").selectOption("9");
    await openAdvanced(page);
    await page.getByTestId("handicap-stone").selectOption("black");
    await page.getByLabel(/^No double three/).check();

    await playSequence(page, 9, [
      [4, 2], [0, 0],
      [4, 3], [0, 1],
      [2, 4], [0, 2],
      [3, 4], [0, 3],
    ]);

    // Plain Gomoku would allow E5; the handicap marks it forbidden for black only.
    await expect(page.getByRole("button", { name: /^E5, forbidden$/ })).toBeDisabled();
    await expect(page.getByTestId("variant-line")).toContainText("Black plays with a handicap");
    // The swap openings are withdrawn while a handicap is set.
    await expect(page.getByTestId("opening").locator("option[value=swap2]")).toHaveCount(0);
  });

  test("ninuki lifts a flanked pair off the board", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("board-size").selectOption("9");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("ninuki");

    // Black at 4,1; white at 4,2 and 4,3; black closes the trap at 4,4.
    await playSequence(page, 9, [
      [4, 1], [4, 2],
      [0, 0], [4, 3],
      [4, 4],
    ]);

    await expect(page.getByRole("button", { name: /^C5, empty$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^D5, empty$/ })).toBeVisible();
    await expect(page.getByTestId("variant-line")).toContainText("Black 2");
  });
});
