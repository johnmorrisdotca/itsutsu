import { describe, expect, it } from "vitest";

import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

import { defaultGameOf, familyShown, gameForFamilyClick } from "./picker";

/**
 * The rules in the game picker that can be wrong invisibly.
 *
 * There is no component test setup here on purpose — "anything that needs a
 * browser is a Playwright test instead", says vitest.config.mts — so the
 * rules were lifted out of the component to where they can be asked
 * directly. Two regressions are guarded, and both have happened:
 *
 *  - A picker whose open family is state initialised from a prop is correct
 *    on the default game and wrong on every screen that arrives with a
 *    different one already chosen.
 *  - A picker where the open family and the chosen game are two separate
 *    pieces of state can show one family's games over another family's
 *    boards. That one shipped, and John found it in a minute.
 */
describe("which family the picker opens on", () => {
  it("opens on the family holding the chosen game, for every game there is", () => {
    /*
     * THE PRE-FILL CASE. A rematch, a challenge or a fork reaches this screen
     * with the game already decided, and thirty-two of the thirty-nine games
     * are not in the first family. Every one of them has to open on its own.
     */
    for (const variant of RULE_VARIANT_LIST) {
      const family = familyShown(variant);
      expect(family.games, `${variant} opened on "${family.title}", which does not hold it`).toContain(
        variant,
      );
    }
  });

  it("checks every family, so a passing run is about the whole row", () => {
    // If some family held no game in the list above, its row would never be
    // asserted and this suite would be quieter than it looks.
    const opened = new Set(RULE_VARIANT_LIST.map((variant) => familyShown(variant).title));
    expect([...opened].sort()).toEqual(GAME_FAMILIES.map((family) => family.title).sort());
  });

  it("still answers for a game the site no longer knows", () => {
    // Never null, never an empty row. A real family, with games in it.
    const family = familyShown("aGameThatWasRenamed");
    expect(family.games.length).toBeGreaterThan(0);
    expect(GAME_FAMILIES).toContain(family);
  });
});

describe("what a click on a family chooses", () => {
  it("every family stands for a real game that belongs to it", () => {
    for (const family of GAME_FAMILIES) {
      const game = defaultGameOf(family);
      expect(family.games, `${family.title} defaults outside itself`).toContain(game);
      expect(RULE_VARIANT_DISPLAY[game], `${family.title} defaults to a game with no copy`).toBeDefined();
    }
  });

  it("the game a family stands for is the one it is named after", () => {
    /*
     * The order of `GAME_FAMILIES[n].games` is load-bearing now: the first is
     * what a click on the family lands on. These are the ones a reader would
     * expect from the chip's own words, so if somebody reorders a family this
     * fails rather than quietly landing people on Misère Five.
     */
    const expected: Record<string, string> = {
      "Five in a row": "freestyle",
      Captures: "ninuki",
      Drops: "dropFour",
      "Pieces and twists": "dominoFive",
      Flips: "reversi",
      "Strange boards": "toroidalFive",
      Races: "halma",
      Connections: "hex",
      Checkers: "checkers",
      Territory: "go",
      "Small boards": "tictactoe",
    };
    // Every family is named, so a new one cannot slip past with no opinion.
    expect(Object.keys(expected).sort()).toEqual(GAME_FAMILIES.map((family) => family.title).sort());
    for (const family of GAME_FAMILIES) {
      expect(defaultGameOf(family), `${family.title}`).toBe(expected[family.title]);
    }
  });

  it("choosing a family moves the game, which is what the bug was", () => {
    /*
     * Hex to Drops: the click has to land on Drop Four, or the boards go on
     * offering Hex's 11, 13 and 19 under a row of drop games.
     */
    const drops = GAME_FAMILIES.find((family) => family.title === "Drops");
    expect(gameForFamilyClick(drops!, "hex")).toBe("dropFour");
    const flips = GAME_FAMILIES.find((family) => family.title === "Flips");
    expect(gameForFamilyClick(flips!, "hex")).toBe("reversi");
  });

  it("but a click on the family you are already in changes nothing", () => {
    /*
     * Null, not "freestyle". Somebody on Renju who taps the lit chip has not
     * asked to be moved to Gomoku, and a change fired here would be a second
     * pass through `applyRulesChange` and another chance to lose their board.
     */
    const five = GAME_FAMILIES.find((family) => family.title === "Five in a row");
    expect(gameForFamilyClick(five!, "renju")).toBeNull();
    expect(gameForFamilyClick(five!, "freestyle")).toBeNull();
  });

  it("lands every game on its own family without moving, and every other family with one click", () => {
    /*
     * The whole grid, both ways round: from any game, clicking its own family
     * is a no-op, and clicking any other family lands inside that other one.
     * This is the property the two-sources-of-truth bug broke.
     */
    for (const variant of RULE_VARIANT_LIST) {
      for (const family of GAME_FAMILIES) {
        const next = gameForFamilyClick(family, variant);
        if (family.games.includes(variant)) {
          expect(next, `${variant} in ${family.title} should not move`).toBeNull();
        } else {
          expect(family.games, `${variant} -> ${family.title} landed outside it`).toContain(next);
          // And the family shown after the click is the one that was clicked.
          expect(familyShown(next as string).title).toBe(family.title);
        }
      }
    }
  });

  it("treats a game it does not know as being in no family, so any click moves", () => {
    for (const family of GAME_FAMILIES) {
      expect(gameForFamilyClick(family, "aGameThatWasRenamed")).toBe(defaultGameOf(family));
    }
  });
});
