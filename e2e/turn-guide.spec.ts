import { expect, test, type Page } from "@playwright/test";

/**
 * The turn guide, clicked through as a player would.
 *
 * John, on a Checkers board with a capture on offer: "there's no indicator that
 * my leading black should jump… the others are non-selectable and even greyed
 * out/dimmer ever so slightly." And on Othello: "when there's only 1 possible
 * move, or two, we might as well highlight the moves and dim the ones that
 * aren't possible."
 *
 * Every sequence starts from the real opening and was checked against the
 * engine first. The practice board is rendered on the client alone, so its
 * squares and their handlers arrive together and there is no hydration to wait
 * on. Each absence below is asserted only after something present on the same
 * position has been waited for.
 */

async function openBoard(page: Page, slug: string) {
  await page.goto(`/games/${slug}/play`);
  await page.evaluate(() => window.localStorage.clear());
  await page.goto(`/games/${slug}/play`);
}

function square(page: Page, name: string) {
  return page.getByRole("button", { name: new RegExp(`^${name}, `) });
}

async function place(page: Page, name: string, then: "Black" | "White") {
  await page.getByRole("button", { name: new RegExp(`^${name}, empty$`) }).click();
  await expect(page.getByTestId("to-play")).toContainText(then);
}

test.describe("the turn guide", () => {
  test("Checkers: a forced capture marks the piece that must jump, and the others cannot be picked up", async ({ page }) => {
    await openBoard(page, "checkers");

    // An ordinary opening turn: seven moves, nothing narrowed, nothing marked.
    await expect(page.getByTestId("to-play")).toContainText("Black");
    await expect(page.locator("[data-guide]")).toHaveCount(0);

    await square(page, "D6").click();
    await square(page, "E5").click();
    await expect(page.getByTestId("to-play")).toContainText("White");
    await square(page, "C3").click();
    await square(page, "D4").click();
    await expect(page.getByTestId("to-play")).toContainText("Black");

    // Black must capture with E5: it is marked, the rule is said, and every other black man is held back.
    await expect(square(page, "E5")).toHaveAttribute("data-guide", "choice");
    await expect(page.getByTestId("turn-guide")).toContainText("You must capture.");
    await expect(square(page, "B6")).toHaveAttribute("data-guide", "unavailable");
    await expect(square(page, "B6")).toBeDisabled();
    await expect(page.locator('[data-guide="choice"]')).toHaveCount(1);

    // The marked piece still plays as it always did.
    await square(page, "E5").click();
    await square(page, "C3").click();
    await expect(page.getByRole("button", { name: "C3, Black stone", exact: true })).toBeVisible();

    // And the guide follows the turn: White now has captures of its own to make.
    await expect(page.getByTestId("to-play")).toContainText("White");
    await expect(page.getByTestId("turn-guide")).toContainText("You must capture.");
    await expect(square(page, "B2")).toHaveAttribute("data-guide", "choice");
  });

  test("Reversi: with only two moves, both are marked and the rest of the board is veiled", async ({ page }) => {
    await openBoard(page, "reversi");
    await expect(page.getByTestId("to-play")).toContainText("Black");
    await expect(page.locator("[data-guide]")).toHaveCount(0);

    await place(page, "F4", "White");
    await place(page, "F3", "Black");
    await place(page, "E3", "White");

    await expect(page.locator('[data-guide="choice"]')).toHaveCount(2);
    await expect(square(page, "F5")).toHaveAttribute("data-guide", "choice");
    await expect(square(page, "D3")).toHaveAttribute("data-guide", "choice");
    await expect(square(page, "A1")).toHaveAttribute("data-guide", "veiled");
    await expect(square(page, "A1")).toBeDisabled();
    // Said to a screen reader; nothing needs explaining on screen.
    await expect(page.getByTestId("turn-guide")).toContainText("Only 2 moves: F5 and D3.");

    // A marked point plays as it always did.
    await place(page, "F5", "Black");
    await expect(square(page, "F5")).toHaveAttribute("aria-label", "F5, White stone");
  });

  test("Reversi: a single legal move is the only square marked", async ({ page }) => {
    await openBoard(page, "reversi");
    await expect(page.getByTestId("to-play")).toContainText("Black");

    await place(page, "C5", "White");
    await place(page, "E6", "Black");
    await place(page, "F7", "White");
    await place(page, "C3", "Black");
    await place(page, "E3", "White");

    await expect(page.locator('[data-guide="choice"]')).toHaveCount(1);
    await expect(square(page, "F6")).toHaveAttribute("data-guide", "choice");
    await expect(page.getByTestId("turn-guide")).toContainText("Only one move: F6.");
  });
});
