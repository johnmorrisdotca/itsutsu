import { describe, expect, it } from "vitest";

import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";

import { familyShown } from "./picker";

/**
 * The one rule in the game picker that can be wrong invisibly.
 *
 * There is no component test setup here on purpose — "anything that needs a
 * browser is a Playwright test instead", says vitest.config.mts — so the rule
 * was lifted out of the component to where it can be asked directly. What is
 * being guarded is a specific regression: a picker whose open family is state
 * initialised from a prop is correct on the default game and wrong on every
 * screen that arrives with a different one already chosen.
 */
describe("which family the picker opens on", () => {
  it("opens on the family holding the chosen game, for every game there is", () => {
    /*
     * THE PRE-FILL CASE, and it is the reason this file exists. A rematch, a
     * challenge or a fork reaches this screen with the game already decided,
     * and forty of the thirty-nine games are not in the first family. Every
     * one of them has to open on its own.
     */
    for (const variant of RULE_VARIANT_LIST) {
      const family = familyShown(variant, null);
      expect(family.games, `${variant} opened on "${family.title}", which does not hold it`).toContain(
        variant,
      );
    }
  });

  it("checks every family, so a passing run is about the whole row", () => {
    // If some family held no game in the list above, its row would never be
    // asserted and this suite would be quieter than it looks.
    const opened = new Set(RULE_VARIANT_LIST.map((variant) => familyShown(variant, null).title));
    expect([...opened].sort()).toEqual(GAME_FAMILIES.map((family) => family.title).sort());
  });

  it("shows the family somebody opened, whatever game is chosen", () => {
    // Browsing is a decision and outranks the chosen game's own family.
    for (const family of GAME_FAMILIES) {
      expect(familyShown("freestyle", family.title).title).toBe(family.title);
    }
  });

  it("ignores a family that does not exist rather than emptying the row", () => {
    /*
     * A stale name — a family renamed under a browsing value held in state —
     * falls back to the chosen game's own family. An empty second row would
     * read as a broken control, and "no family" is not an answer this can
     * afford to give: see the note in gamePicker.ts.
     */
    expect(familyShown("reversi", "A family that was renamed").games).toContain("reversi");
    expect(familyShown("reversi", "").games).toContain("reversi");
  });

  it("still answers for a game the site no longer knows", () => {
    // Never null, never an empty row. A real family, with games in it.
    const family = familyShown("aGameThatWasRenamed", null);
    expect(family.games.length).toBeGreaterThan(0);
    expect(GAME_FAMILIES).toContain(family);
  });
});
