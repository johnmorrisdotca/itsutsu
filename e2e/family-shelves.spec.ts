import { expect, test, type Page } from "@playwright/test";

import { GAME_FAMILIES } from "../src/lib/gomoku/families";
import { openSetUpPage } from "./support";

/**
 * A GAME ON TWO SHELVES IS ONE GAME.
 *
 * John, 2026-09-15: Small boards held Tic-tac-toe and no small Reversi, though
 * one would belong there just as much — "a family is a way of finding a game,
 * not a filing cabinet". So Mini Reversi lives under Turn and take — the family
 * that was Flips until it took Captures in on 2026-09-22 — and is listed under
 * Small boards too (`ALSO_LISTED_IN`). Picked from either shelf it has to be the
 * same game: the same address on the page before it.
 *
 * Driven by clicking, the way a reader browses the set-up page — a family, then
 * the game. Nothing reloads and nobody presses Begin, so no game is written —
 * which is the whole claim: one address, one game, whichever shelf it was
 * found on. It used to press Start to a second page and come back by that
 * page's own Change button; the game is stated on this screen now.
 */

const GAME = "miniReversi";
/** What the screen calls it, for the summary line that says which game it is about. */
const NAME = "Mini Reversi";
/**
 * Its home shelf, read from the catalogue rather than written here. It was the
 * literal "Flips", and the family was retitled Turn and take with every unit
 * test green and this spec left expecting a name no screen printed any more.
 */
const HOME = GAME_FAMILIES.find((family) => family.games.includes(GAME))!.title;

/** Opens a family, picks Mini Reversi from its shelf, and says which game the screen is then about. */
async function pickFrom(page: Page, family: string, note: string | null): Promise<string | null> {
  const tile = page.locator(`[data-testid="set-up-family"][data-family="${family}"]`);
  await tile.click();
  await expect(tile).toHaveAttribute("data-open", "true");

  const chip = page.getByTestId("set-up-family-games").locator(`[data-testid="set-up-variant"][data-variant="${GAME}"]`);
  await chip.click();
  await expect(chip).toHaveAttribute("data-chosen", "true");
  // Choosing it does not move the reader off the shelf they found it on.
  await expect(tile).toHaveAttribute("data-open", "true");

  /*
   * Where it lives is said on the line under the games, for the game chosen:
   * a tile is one fixed box with no third line to give it (John, 2026-09-24: "Game
   * boxes should also be consistent").
   */
  const line = page.getByTestId("set-up-variant-hint");
  await expect(line).toBeVisible();
  if (note === null) {
    // At home it says nothing about elsewhere — asked only now that the line is known to be drawn.
    await expect(line.getByTestId("set-up-variant-home")).toHaveCount(0);
  } else {
    await expect(line.getByTestId("set-up-variant-home")).toHaveText(note);
  }

  /*
   * WHICH GAME THE SCREEN IS NOW ABOUT. It used to be read off the doorstep's
   * address, one press further on; the set-up screen states and begins the
   * game itself, so the address to compare is this one's. Read after the chip
   * is known to be chosen, so it is a fact about a screen that has answered.
   */
  await expect(page.getByTestId("set-up-summary")).toContainText(NAME);
  return new URL(page.url()).searchParams.get("game");
}

test.describe("a game listed on two shelves", () => {
  test("Mini Reversi picked from Small boards is the same game as Mini Reversi picked from its home", async ({ page }) => {
    await openSetUpPage(page);

    const fromSmallBoards = await pickFrom(page, "Small boards", `also under ${HOME}`);
    expect(fromSmallBoards).toBe("mini-reversi");

    // And the same game from its home shelf, on the same screen: one address, one game.
    const fromHome = await pickFrom(page, HOME, null);
    expect(fromHome).toBe(fromSmallBoards);
  });
});
