import { expect, test, type Page } from "@playwright/test";

/**
 * A turn with no move in it passes itself, and the board says so.
 *
 * John, on Othello: "when you CANNOT make a move... probably don't need to wait
 * for the player to skip. we skip for him I presume." The sequence below is a
 * real game from the opening, checked against the engine before it was written
 * here: White's eighth move, C8, leaves Black with no disc to turn anywhere,
 * while White still has one.
 *
 * The practice board is rendered on the client alone, so its squares and their
 * handlers arrive together and there is no hydration to wait on. The one
 * absence asserted is asserted after the move before it has been seen to land.
 */

async function place(page: Page, name: string) {
  await page.getByRole("button", { name: new RegExp(`^${name}, empty$`) }).click();
}

test.describe("a turn with no move passes itself", () => {
  test("Reversi: White's move leaves Black nothing to play, so Black's turn passes and the board says why", async ({ page }) => {
    await page.goto("/games/reversi/play");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/reversi/play");
    await expect(page.getByTestId("to-play")).toContainText("Black");

    for (const [at, name] of ["D6", "C6", "E3", "D7", "D8", "E8", "B7"].entries()) {
      await place(page, name);
      await expect(page.getByTestId("to-play")).toContainText(at % 2 === 0 ? "White" : "Black");
    }
    // Black to play, with a move: nothing has passed.
    await expect(page.getByTestId("turn-passed")).toHaveCount(0);

    await place(page, "C8");
    await expect(page.getByRole("button", { name: "C8, White stone", exact: true })).toBeVisible();
    await expect(page.getByTestId("turn-passed")).toHaveText("Black had no move, so their turn passed.");
    // Nobody pressed anything: the turn is White's again.
    await expect(page.getByTestId("to-play")).toContainText("White");
  });
});
