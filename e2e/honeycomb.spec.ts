import { expect, test } from "@playwright/test";

import { openSetUpPage, openSetup } from "./support";

/**
 * HONEYCOMB: Reversi on a hexagon of hexagons.
 *
 * One browser case, as the New Game Gate asks: the game is opened the way a
 * reader opens it and the move that shows its rule working is played. The
 * rule that is new is the shape — six directions, a sealed centre, a ring of
 * six — so the check is that a first move turns a disc, and that the board is
 * drawn as a honeycomb rather than a grid.
 */
async function stonesOf(page: import("@playwright/test").Page, colour: "Black" | "White"): Promise<number> {
  return page.getByRole("button", { name: new RegExp(`, ${colour} stone$`) }).count();
}

test.describe("honeycomb", () => {
  test("opens on a honeycomb with the ring of six, and a first move turns a disc", async ({ page }) => {
    await page.goto("/games/honeycomb/play");
    await openSetup(page);
    await expect(page.getByTestId("rules")).toHaveValue("honeycomb");

    // Drawn as cells, not as a grid: one hexagon per open cell, the centre sealed.
    const cells = page.locator('[data-lattice="hexagon"] polygon');
    await expect(cells.first()).toBeVisible();
    await expect(page.locator('[data-lattice="hexagon"] polygon[data-cell="sealed"]')).toHaveCount(1);
    expect(await cells.count()).toBe(91);

    // Three of each round the sealed centre, and the centre itself is not a move.
    expect(await stonesOf(page, "Black")).toBe(3);
    expect(await stonesOf(page, "White")).toBe(3);
    await expect(page.getByRole("button", { name: /^F6, blocked$/ })).toBeDisabled();

    // A legal first move: one of the enabled empties. It brackets exactly one
    // white disc, so black goes from three to five and white from three to two.
    const legal = page.getByRole("button", { name: /, empty$/ }).and(page.locator(":not([disabled])"));
    await expect(legal.first()).toBeVisible();
    await legal.first().click();
    await expect.poll(() => stonesOf(page, "Black")).toBe(5);
    expect(await stonesOf(page, "White")).toBe(2);
  });

  /*
   * FOUR HEXAGONS, and the one that is worth driving in a browser is the
   * smallest: 37 cells is the board where a wrong radius would be most
   * visible and least likely to be noticed in a unit test, because the game
   * still plays perfectly on a hexagon of the wrong size.
   */
  test("comes in four hexagons, and the small one is drawn at its own size", async ({ page }) => {
    await openSetUpPage(page, "honeycomb");

    const boards = page.getByTestId("set-up-size");
    await expect(boards).toHaveCount(4);
    // The eleven-square — 91 cells, the board Hexversi is played on — is the one chosen.
    await expect(page.locator('[data-testid="set-up-size"][data-chosen="true"]')).toHaveAttribute("data-size", "11");

    await page.locator('[data-testid="set-up-size"][data-size="7"]').click();
    await expect(page.locator('[data-testid="set-up-size"][data-chosen="true"]')).toHaveAttribute("data-size", "7");

    /*
     * AND THE BOARD IS NAMED FOR WHAT IT IS. A hexagon is not a square of
     * anything, so the set-up used to announce the 91-cell board as "11×11"
     * — 121 squares that do not exist. It says the hexagon's own size now,
     * and the smallest board is where a wrong one would be plainest.
     */
    await expect(page.getByTestId("set-up-summary")).toContainText("37 cells");
    await expect(page.getByTestId("set-up-summary")).not.toContainText("7×7");
  });
});
