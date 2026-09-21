import { expect, test } from "@playwright/test";

import { openSetup } from "./support";

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
    const cells = page.locator('[data-honeycomb="true"] polygon');
    await expect(cells.first()).toBeVisible();
    await expect(page.locator('[data-honeycomb="true"] polygon[data-cell="sealed"]')).toHaveCount(1);
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
});
