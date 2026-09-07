import { expect, test } from "@playwright/test";
import { openAdvanced, playAt, playSequence } from "./support";

/**
 * The small games: each one driven the way a player drives it. The board
 * labels intersections the way a player reads them, so E5 on a 5×5 board is
 * the centre, and A1 is the bottom left.
 */
test.describe("the small games", () => {
  test("tic-tac-toe is three in a row on a locked 3×3 board", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("rules").selectOption("tictactoe");

    await expect(page.getByTestId("board-size")).toBeDisabled();
    await expect(page.getByTestId("board-size")).toHaveValue("3");
    await expect(page.getByTestId("win-length")).toBeDisabled();
    await expect(page.getByRole("button", { name: /, (empty|Black|White)/ })).toHaveCount(9);

    await playSequence(page, 3, [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]]);
    await expect(page.getByTestId("to-play")).toContainText("wins");
  });

  test("drop four lands a stone at the bottom of the column it was played in", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("rules").selectOption("dropFour");
    await expect(page.getByTestId("board-size")).toHaveValue("7");

    // Click the top of column D; the stone lands on D1.
    await page.getByRole("button", { name: /^D7, empty$/ }).click();
    await expect(page.getByRole("button", { name: "D1, Black stone" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^D7, empty$/ })).toBeVisible();
    await expect(page.getByTestId("variant-line")).toContainText("falls to the bottom");
  });

  test("twist five owes a quarter turn after each stone", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("rules").selectOption("twistFive");

    await expect(page.getByTestId("twist-controls")).toHaveCount(0);
    await playAt(page, 6, 0, 0);
    await expect(page.getByTestId("twist-controls")).toBeVisible();
    await expect(page.getByTestId("variant-line")).toContainText("Turn a quadrant");
    // No stone may be placed until the turn is taken.
    await expect(page.getByRole("button", { name: /^F1, empty$/ })).toBeDisabled();

    await page.getByTestId("twist-0-cw").click();
    await expect(page.getByTestId("twist-controls")).toHaveCount(0);
    // A6 turned clockwise inside the top-left quadrant lands on C6.
    await expect(page.getByRole("button", { name: "C6, Black stone" })).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("White");
  });

  test("trap three loses on three in a row", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("rules").selectOption("trapThree");

    await playSequence(page, 5, [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3]]);
    await expect(page.getByTestId("to-play")).toContainText("made three in a row");
    await expect(page.getByTestId("to-play")).toContainText("Player 2 wins");
  });

  test("square four places four pieces then slides them", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("rules").selectOption("squareFour");

    await playSequence(page, 5, [
      [0, 0], [4, 4], [0, 1], [4, 3], [0, 2], [4, 2], [1, 4], [3, 0],
    ]);
    await expect(page.getByTestId("variant-line")).toContainText("Pick one of your pieces");
    // An empty point is not playable now; a black piece is.
    await expect(page.getByRole("button", { name: /^C3, empty$/ })).toBeDisabled();
    await page.getByRole("button", { name: "C5, Black stone" }).click();
    await expect(page.getByTestId("variant-line")).toContainText("Choose the point");
    await page.getByRole("button", { name: /^D4, empty$/ }).click();
    await expect(page.getByRole("button", { name: "D4, Black stone" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^C5, empty$/ })).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("White");
  });

  test("fixed rules are shown greyed rather than hidden", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("rules").selectOption("twistFour");
    await openAdvanced(page);

    await expect(page.getByTestId("board-size")).toBeDisabled();
    await expect(page.getByTestId("opening")).toBeDisabled();
    await expect(page.getByTestId("obstacles")).toBeDisabled();
    await expect(page.getByTestId("awareness")).toBeDisabled();
    await expect(page.getByLabel("Allow skipping a turn")).toBeDisabled();
    await expect(page.getByText(/Fixed by Twist Four/).first()).toBeVisible();
  });
});
