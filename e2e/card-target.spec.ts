import { expect, test } from "@playwright/test";

import { GAME_FAMILIES } from "../src/lib/gomoku/families";
import { slugFor } from "../src/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "../src/lib/gomoku/variants.constants";

/**
 * A game's card is the way into the game — the whole card, not the two words
 * of its name.
 *
 * John, on the family cards: "Mousing over a game should show us a button to
 * click… right now we're forced to click the name." The bordered box read as
 * one object and answered on two words of it. The name is now stretched over
 * the card and a round chevron says so; see STRETCHED_CARD in
 * ui.constants.ts for how, and why it is not a second link.
 *
 * DRIVEN THE WAY A READER DRIVES IT — a click on the tagline, a click on the
 * chevron, Enter on the name from the keyboard — never by reading a class or
 * asserting an href. A stretched face that renders perfectly and swallows
 * nothing is only proved by clicking somewhere that is not the name; the
 * record list once had a name that rendered as a link and did nothing, and
 * nothing but a click would have found it.
 *
 * The first game of the first family, read from the tables rather than
 * written down, so a reordering of the catalogue does not fail this for a
 * reason that has nothing to do with cards.
 */
const FIRST = GAME_FAMILIES[0].games[0];
const COPY = RULE_VARIANT_DISPLAY[FIRST];
const GAME = `/games/${slugFor(FIRST)}`;

test.describe("a game's card opens the game", () => {
  test("from its tagline, which is not the name", async ({ page }) => {
    await page.goto("/games");
    const card = page.getByTestId("family-game").first();
    await expect(card).toContainText(COPY.label);
    /*
     * One link to the game in the card, however many links the card holds:
     * a signed-in card also carries a count (to the record) and a last game
     * (to that match), and neither of those is a second way to the game.
     */
    await expect(card.locator(`a[href="${GAME}"]`)).toHaveCount(1);
    await card.getByText(COPY.tagline, { exact: true }).click();
    await expect(page).toHaveURL(GAME);
  });

  test("from the chevron, which is a sign and not a second link", async ({ page }) => {
    await page.goto("/games");
    const card = page.getByTestId("family-game").first();
    const arrow = card.getByTestId("card-arrow");
    await expect(arrow).toBeVisible();
    /*
     * Clicked THROUGH rather than clicked. The chevron passes pointer events
     * to the card's face — it is a sign, not a control — so Playwright would
     * refuse to click it directly as an element that receives no events. A
     * click on the CARD at the chevron's centre is what a finger does.
     */
    const at = await arrow.boundingBox();
    const from = await card.boundingBox();
    expect(at, "the chevron has a box").not.toBeNull();
    expect(from, "the card has a box").not.toBeNull();
    await card.click({
      position: { x: at!.x + at!.width / 2 - from!.x, y: at!.y + at!.height / 2 - from!.y },
    });
    await expect(page).toHaveURL(GAME);
  });

  test("from the keyboard, on the name, which is the card's one stop", async ({ page }) => {
    await page.goto("/games");
    const card = page.getByTestId("family-game").first();
    const name = card.getByTestId("game-name");
    await name.focus();
    await expect(name).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(GAME);
  });
});
