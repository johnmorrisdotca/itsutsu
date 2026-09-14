import { describe, expect, it } from "vitest";

import { OPENING_RULES, RULE_VARIANT_LIST, STONES, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

import { openingStones, openingZone } from "./openingPicture";
import { openingsOffered } from "./rulesDraft";

/**
 * The little picture of each opening, checked as data: a picture of Pro that
 * put black's second stone inside the square it has to leave would be teaching
 * the rule backwards.
 */

/** Every opening a game offers, at every board that game is offered on. */
function everyOffer() {
  return RULE_VARIANT_LIST.flatMap((variant) =>
    openingsOffered(variant).flatMap((opening) =>
      boardSizesFor(variant as RuleVariant).map((size) => ({ variant, opening, size })),
    ),
  );
}

describe("openingZone", () => {
  it("is the 5×5 for Pro and the 7×7 for Long Pro, centred", () => {
    expect(openingZone(OPENING_RULES.pro, 15)).toEqual({ from: 5, span: 5 });
    expect(openingZone(OPENING_RULES.longPro, 15)).toEqual({ from: 4, span: 7 });
    expect(openingZone(OPENING_RULES.pro, 19)).toEqual({ from: 7, span: 5 });
  });

  it("is nothing at all for Free, rather than a square of no size", () => {
    expect(openingZone(OPENING_RULES.free, 15)).toBeNull();
  });
});

describe("openingStones", () => {
  it("keeps every stone on the board, wherever the opening is offered", () => {
    for (const { variant, opening, size } of everyOffer()) {
      for (const stone of openingStones(opening, size)) {
        expect(stone.row, `${variant} ${opening} ${size}`).toBeGreaterThanOrEqual(0);
        expect(stone.col, `${variant} ${opening} ${size}`).toBeGreaterThanOrEqual(0);
        expect(stone.row, `${variant} ${opening} ${size}`).toBeLessThan(size);
        expect(stone.col, `${variant} ${opening} ${size}`).toBeLessThan(size);
      }
    }
  });

  it("never puts two stones on one point", () => {
    for (const { opening, size } of everyOffer()) {
      const points = openingStones(opening, size).map((stone) => `${stone.row},${stone.col}`);
      expect(new Set(points).size).toBe(points.length);
    }
  });

  it("draws the rule the right way round: black on tengen, black's second outside the square", () => {
    for (const { opening, size } of everyOffer()) {
      const zone = openingZone(opening, size);
      if (zone === null) continue;
      const centre = Math.floor(size / 2);
      const [first, , third] = openingStones(opening, size);
      expect(first).toEqual({ row: centre, col: centre, colour: STONES.black });
      expect(third?.colour).toBe(STONES.black);
      const inside = (at: number) => at >= zone.from && at < zone.from + zone.span;
      expect(inside(third?.row ?? -1) && inside(third?.col ?? -1), `${opening} at ${size}`).toBe(false);
    }
  });
});
