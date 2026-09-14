import { expect, test, type Locator, type Page } from "@playwright/test";

import { chooseGame, openMoreSettings, openSetUpPage } from "./support";

/**
 * ONE CHOICE IS STILL CHOSEN.
 *
 * John, with screenshots of the set-up screen: "BUG: Checkers, if there is
 * only one board, it should be checked... like boards with > 1 game type."
 * Checkers' single 8×8 block had no check mark beside Go's checked 19×19, and
 * the same shape had just shipped for a sole opening: Reversi's one opening
 * was a plain card with no radio. A sole option is drawn as a chosen option
 * is — the chosen style, the check, a radio of one that is checked.
 *
 * Driven the way a reader meets it: the generic set-up screen, the game with
 * one board chosen from its picker, then a game with several, then back; the
 * same for openings. Every assertion waits on the screen's ready marker
 * through `openSetUpPage` and on the tile being chosen through `chooseGame`;
 * nothing reloads. (A set-up page whose address names the game offers no game
 * picker, which is where the first draft of this spec stalled.)
 */

/** The check on a tile shows only when its radio is checked; opacity is what says so. */
async function expectMarked(tile: Locator) {
  await expect(tile).toHaveAttribute("data-chosen", "true");
  await expect(tile.getByRole("radio")).toBeChecked();
  await expect(tile.getByTestId("pick-mark")).toHaveCSS("opacity", "1");
}

function sizeTiles(page: Page): Locator {
  return page.getByTestId("set-up-size");
}

test.describe("a sole option is drawn as a chosen one", () => {
  test("Checkers' one board is checked, Go's chosen board is checked the same way, and back", async ({ page }) => {
    // The generic set-up screen, which offers the game picker; a page whose
    // address names the game does not, so switching games happens here.
    await openSetUpPage(page);
    await chooseGame(page, "checkers");
    await expect(sizeTiles(page)).toHaveCount(1);
    const sole = sizeTiles(page).first();
    await expect(sole).toHaveAttribute("data-only", "true");
    await expectMarked(sole);

    // Several boards: the chosen one carries the same check, the others none.
    await chooseGame(page, "go");
    await expect(sizeTiles(page)).toHaveCount(3);
    const chosen = page.locator('[data-testid="set-up-size"][data-chosen="true"]');
    await expect(chosen).toHaveCount(1);
    await expectMarked(chosen);
    await expect(page.locator('[data-testid="set-up-size"][data-chosen="false"]').first().getByTestId("pick-mark")).toHaveCSS("opacity", "0");

    // The way back: one board again, still checked.
    await chooseGame(page, "checkers");
    await expect(sizeTiles(page)).toHaveCount(1);
    await expectMarked(sizeTiles(page).first());
  });

  test("Reversi's one opening is a checked tile like any chosen opening, and back", async ({ page }) => {
    await openSetUpPage(page);
    await chooseGame(page, "reversi");
    await openMoreSettings(page);
    const openings = page.getByTestId("set-up-opening");
    await expect(openings).toHaveCount(1);
    await expect(openings.first()).toHaveAttribute("data-only", "true");
    await expectMarked(openings.first());

    await chooseGame(page, "freestyle");
    await expect(openings).toHaveCount(3);
    const chosen = page.locator('[data-testid="set-up-opening"][data-chosen="true"]');
    await expect(chosen).toHaveCount(1);
    await expectMarked(chosen);

    await chooseGame(page, "reversi");
    await expect(openings).toHaveCount(1);
    await expectMarked(openings.first());
  });
});
