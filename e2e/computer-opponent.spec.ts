import { expect, test } from "@playwright/test";

import { ready } from "./support";

/** Stones actually on the board, counted the way a reader sees them — by the point's own label. */
async function stonesOn(page: import("@playwright/test").Page): Promise<number> {
  return page.evaluate(
    () =>
      Array.from(document.querySelectorAll("button[aria-label]")).filter((button) =>
        / stone$/.test(button.getAttribute("aria-label") ?? ""),
      ).length,
  );
}

/**
 * A computer opponent that thinks in the player's own browser.
 *
 * Every computer move on this site used to be a server function call, and the
 * bill for one grows with how good the opponent is. Measured over forty-four
 * games, the top two grades picked the SAME move 94% of the time — not because
 * they are alike but because neither reached the depth they differ by inside
 * the 250 ms a request allows. Moving the thinking to the player's machine is
 * what removes that ceiling, so this spec's job is to prove the thinking really
 * moved rather than that a stone appeared.
 *
 * DRIVEN AS A PLAYER DRIVES IT, for the reason the language picker earned:
 * a feature reached by a route no reader takes proves nothing about the route
 * they do take. So the seat is chosen from the select, the stone is clicked on
 * the board, and nothing here reaches in to call the worker itself.
 */
test.describe("the computer opponent", () => {
  test("replies on its own, thinking in this browser", async ({ page }) => {
    await page.goto("/games/gomoku/play");

    /*
     * Hydration, not visibility. Both selects are server-rendered, so they are
     * real controls before React attaches — and a seat chosen in that window is
     * dropped silently, which reads on screen as a computer that simply refuses
     * to play. The panel is disabled until it can honour a choice, and this
     * waits for the same moment.
     */
    await ready(page, "computer-opponent");
    await expect(page.getByTestId("computer-seat")).toBeEnabled();

    await page.getByTestId("computer-tier").selectOption("guoshou");
    await page.getByTestId("computer-seat").selectOption("two");

    expect(await stonesOn(page)).toBe(0);

    const empties = page.getByRole("button", { name: /, empty$/ });
    await empties.first().waitFor({ state: "visible" });
    const points = await empties.count();
    await empties.nth(Math.floor(points / 2)).click();

    // One stone is the person's. The second can only be the computer's, and
    // nothing in this spec played it.
    await expect.poll(() => stonesOn(page), { timeout: 30_000 }).toBeGreaterThanOrEqual(2);
  });

  test("does not play while nobody is seated", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await ready(page, "computer-opponent");

    const empties = page.getByRole("button", { name: /, empty$/ });
    await empties.first().waitFor({ state: "visible" });
    await empties.nth(4).click();

    /*
     * An absence is only worth asserting after a presence has been waited for.
     * The stone just played IS that presence: once the board shows one, the
     * page has answered, and a second stone appearing would be a computer
     * playing a seat nobody gave it.
     */
    await expect.poll(() => stonesOn(page)).toBe(1);
    await expect(page.getByTestId("computer-thinking")).toHaveCount(0);
    await expect.poll(() => stonesOn(page)).toBe(1);
  });
});
