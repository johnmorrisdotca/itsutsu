import { expect, test } from "@playwright/test";

import { aComputerOpponent, chooseOpponent, openSetUpPage, ready, startAndBegin } from "./support";
import { gamesMade } from "./tidy";

/**
 * WHICH SEAT YOU TAKE, chosen before the game exists.
 *
 * Whoever asked for a game was black — the opener, who in most of these
 * games has the better of it — so making the game meant taking the better
 * seat every time. GoldToken's step 2 asks "Let me be: Player 1 / Player 2";
 * this screen does now, with a third answer drawn by lot as Begin is pressed.
 *
 * Driven by pressing, and read off the BOARD: the seat is proved by whose
 * move the game says it is, not by the control having been pressed.
 */
const tidyAway = gamesMade();

test.describe("choosing your colour", () => {
  test("white gives the opening away, and the board says so", async ({ page }) => {
    await openSetUpPage(page, "gomoku");
    const computer = await aComputerOpponent(page, 0);
    await chooseOpponent(page, computer);
    await ready(page, "set-up-game");

    // The choice is offered, black by default, and the sentence names the seat.
    await expect(page.getByTestId("set-up-colour")).toBeVisible();
    await expect(page.getByTestId("set-up-colour-black")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("set-up-seating")).toContainText("you are black");

    await page.getByTestId("set-up-colour-white").click();
    await expect(page.getByTestId("set-up-seating")).toContainText("you are white");
    // Kept in the address, so a reload keeps the choice.
    await expect(page).toHaveURL(/colour=white/);

    await startAndBegin(page);
    await page.waitForURL(/\/games\/gomoku\/match\//, { timeout: 30_000 });
    tidyAway(/match\/([^/?#]+)/.exec(page.url())?.[1] ?? "");
    // Black opens, and black is the program: its stone is down and it is now White's turn — yours.
    await expect(page.getByTestId("turn-banner")).toContainText(/your move|You/i, { timeout: 20_000 });
    await expect(page.getByRole("button", { name: /, Black stone$/ })).toHaveCount(1);
  });

  test("a lot is said as a lot, and drawn only when Begin is pressed", async ({ page }) => {
    await openSetUpPage(page, "gomoku");
    const computer = await aComputerOpponent(page, 0);
    await chooseOpponent(page, computer);
    await ready(page, "set-up-game");
    await page.getByTestId("set-up-colour-lot").click();
    // Nothing names a colour yet, because none has been drawn.
    await expect(page.getByTestId("set-up-seating")).toContainText("drawn by lot");
    await expect(page.getByTestId("set-up-seating")).not.toContainText(/you are (black|white)/);
    await startAndBegin(page);
    await page.waitForURL(/\/games\/gomoku\/match\//, { timeout: 30_000 });
    tidyAway(/match\/([^/?#]+)/.exec(page.url())?.[1] ?? "");
  });

  /*
   * Under Swap and Swap2 the opening decides the colours, so the choice would
   * be a lie there — but a SHARED game offers only Free, Pro and Long Pro
   * (`SHARED_OPENINGS`), so that branch cannot be reached from this screen.
   * `colourChoice.test.ts` holds it instead.
   */
  test("is not offered for a seat posted for anyone", async ({ page }) => {
    await openSetUpPage(page, "gomoku");
    await ready(page, "set-up-game");
    await expect(page.getByTestId("set-up-seating")).toBeVisible();
    await expect(page.getByTestId("set-up-colour")).toHaveCount(0);
  });
});
