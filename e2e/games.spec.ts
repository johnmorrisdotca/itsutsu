import { expect, test } from "@playwright/test";
import { openAdvanced, openSetup, playAt, playSequence } from "./support";

/**
 * The small games: each one driven the way a player drives it. The board
 * labels intersections the way a player reads them, so E5 on a 5×5 board is
 * the centre, and A1 is the bottom left.
 */
test.describe("the small games", () => {
  test("tic-tac-toe is three in a row on a locked 3×3 board", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("tictactoe");

    /*
     * Asked of the sentence rather than of two disabled selects, which is
     * where a fixed rule is stated now. The board itself is the proof either
     * way: nine cells, and three in a row ends it.
     */
    const fixed = page.getByTestId("fixed-by-rules");
    await expect(fixed).toContainText("3×3");
    await expect(fixed).toContainText("3 in a row");
    await expect(page.getByRole("button", { name: /, (empty|Black|White)/ })).toHaveCount(9);

    await playSequence(page, 3, [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]]);
    await expect(page.getByTestId("to-play")).toContainText("wins");
  });

  test("drop four lands a stone at the bottom of the column it was played in", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("dropFour");
    await expect(page.getByTestId("board-size")).toHaveValue("7");

    // Click the top of column D; the stone lands on D1.
    await page.getByRole("button", { name: /^D7, empty$/ }).click();
    await expect(page.getByRole("button", { name: "D1, Black stone" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^D7, empty$/ })).toBeVisible();
    await expect(page.getByTestId("variant-line")).toContainText("falls to the bottom");
  });

  test("twist five owes a quarter turn after each stone", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
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
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("trapThree");

    await playSequence(page, 5, [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3]]);
    await expect(page.getByTestId("to-play")).toContainText("made three in a row");
    await expect(page.getByTestId("to-play")).toContainText("Player 2 wins");
  });

  test("the move list folds away while playing, and the arrows step the record", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");
    await playSequence(page, 15, [[7, 7], [7, 8]]);
    await expect(page.getByTestId("move-history")).toBeVisible();
    await page.getByTestId("move-history-fold").locator("summary").click();
    await expect(page.getByTestId("move-history")).toBeHidden();
    await page.getByTestId("move-history-fold").locator("summary").click();
    await expect(page.getByTestId("move-history")).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("button", { name: /^J8, empty$/ })).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("button", { name: "J8, White stone" })).toBeVisible();
  });

  test("a game under way asks before New game throws it away", async ({ page }) => {
    await page.goto("/games/gomoku");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku");

    // Nothing to lose on an empty board: New game just starts one.
    await page.getByRole("button", { name: /^New game/ }).click();
    await expect(page.getByTestId("new-game-confirm")).toHaveCount(0);

    await playSequence(page, 15, [[7, 7], [7, 8]]);
    await page.getByRole("button", { name: /^New game/ }).click();
    await expect(page.getByTestId("new-game-confirm")).toBeVisible();
    await page.getByRole("button", { name: /^Never mind/ }).click();
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();

    await page.getByRole("button", { name: /^New game/ }).click();
    await page.getByTestId("new-game-yes").click();
    await expect(page.getByRole("button", { name: /^H8, empty$/ })).toBeVisible();
  });

  test("square four places four pieces then slides them", async ({ page }) => {
    await page.goto("/games/gomoku");
    await openSetup(page);
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

  test("fixed rules are stated rather than drawn as controls nobody may use", async ({ page }) => {
    /*
     * This test used to be called "fixed rules are shown greyed rather than
     * hidden", and asserted the board, the opening and the obstacles were
     * disabled selects. That was a real decision — a greyed control was how a
     * player read the rules at a glance, back when there was nowhere else to
     * read them.
     *
     * There is somewhere now: the set-up folds behind a summary that states
     * the rules. So a dead control had become the third place the same fact
     * appeared, paying a control's height to say what a clause says and
     * promising an interaction it would not honour.
     *
     * Changed on John's ruling, and this test rewritten with it on purpose
     * rather than loosened to let the change through. What is asserted is the
     * same guarantee it always made — NOTHING IS HIDDEN — asked of the
     * sentence instead of the select.
     */
    await page.goto("/games/gomoku");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("twistFour");
    await openAdvanced(page);

    const fixed = page.getByTestId("fixed-by-rules");
    await expect(fixed).toBeVisible();
    await expect(fixed).toContainText("Fixed by Twist Four");
    // The values themselves, not merely a note that something is fixed.
    await expect(fixed).toContainText("×");
    // And the controls they replace are gone, not greyed.
    await expect(page.getByTestId("board-size")).toHaveCount(0);
    await expect(page.getByTestId("obstacles")).toHaveCount(0);
    /*
     * The toggles are left as they were, and that is a line rather than an
     * oversight: a disabled checkbox showing on or off is already about as
     * short as the sentence would be, and "the threats here cannot be read"
     * is a different kind of statement from "this game fixes its board".
     */
    await expect(page.getByTestId("awareness")).toBeDisabled();
    await expect(page.getByLabel("Allow skipping a turn")).toBeDisabled();
  });
});
