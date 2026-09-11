import { describe, expect, it } from "vitest";

import { RULE_VARIANT_LIST, VARIANT_SPECS, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { unwinnableBecause } from "./winnableGame";

/**
 * A game nobody can win must not be written.
 *
 * The bug this is for: a rematch stored three-by-three noughts and crosses
 * needing FIVE in a row. It accepted moves, it never ended, and nothing
 * objected until John played six of them.
 */
describe("a game has to be winnable to be written", () => {
  it("refuses the game John was given", () => {
    // The exact row that was on production, in the words of the bug.
    expect(unwinnableBecause({ variant: "tictactoe", size: 3, winLength: 5 })).toContain("3 in a row");
  });

  it("allows the same game under its own rules", () => {
    expect(unwinnableBecause({ variant: "tictactoe", size: 3, winLength: 3 })).toBeNull();
  });

  it("refuses a chosen line that will not fit the board", () => {
    /*
     * The same unwinnable game by the other road. Freestyle lets a player
     * choose, and the address accepts anything from three to nineteen — so a
     * nine-by-nine board asking for nineteen in a row is reachable today.
     */
    expect(unwinnableBecause({ variant: "freestyle", size: 9, winLength: 19 })).toContain("will not fit");
  });

  it("allows a chosen line that does fit", () => {
    expect(unwinnableBecause({ variant: "freestyle", size: 9, winLength: 5 })).toBeNull();
  });

  it("does not refuse a game that wins some other way", () => {
    /*
     * Mini Reversi is a four-by-four board carrying a five it never reads —
     * you win by having more stones, not by making a line. A check that only
     * compared the numbers would refuse a game that plays perfectly well,
     * which is how a guard like this usually goes wrong.
     */
    expect(unwinnableBecause({ variant: "miniReversi", size: 4, winLength: 5 })).toBeNull();
  });

  it("refuses a board the game is not played on", () => {
    expect(unwinnableBecause({ variant: "tictactoe", size: 9, winLength: 3 })).toContain("not played on");
  });

  it("refuses a game this site does not have", () => {
    expect(unwinnableBecause({ variant: "backgammon", size: 9, winLength: 5 })).toContain("not a game");
  });
});

/**
 * And the same rule read the other way: no variant may describe a game that
 * cannot be won. This is the gate rather than the guard — it fails the build
 * when a variant is written that way, instead of waiting for somebody to be
 * handed one.
 */
describe("every game this site offers can be won on every board it offers", () => {
  it.each(RULE_VARIANT_LIST.map((variant) => [variant] as const))("%s", (variant) => {
    const spec = VARIANT_SPECS[variant as RuleVariant];
    for (const size of boardSizesFor(variant as RuleVariant)) {
      // The length the site itself would write for this board.
      const winLength = spec.winLength ?? Math.min(5, size);
      expect(
        unwinnableBecause({ variant, size, winLength }),
        `${variant} on ${size}×${size} cannot be won as this site would write it`,
      ).toBeNull();
    }
  });
});
