import { describe, expect, it } from "vitest";

import { NO_HANDICAP, NO_HEAD_START, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Handicap, HeadStart } from "@/lib/gomoku/gomoku.types";

import { parseHandicap, parseHeadStart, storedHandicap } from "./gameSettingsSchema";

/**
 * A HEAD START IS KEPT IN THE HANDICAP COLUMN, and read back from it.
 *
 * One JSON column holds everything that makes a game uneven on purpose: the
 * handicap's fields where they always were, and a head start under `headStart`
 * beside them. These are the properties the rest of the site leans on — that a
 * stored head start comes back whole, that the handicap reads exactly as before
 * whether or not a head start sits beside it, and that a head start given with
 * no handicap has NO stone key, so `seatWhere.ts`'s even-game match (a null
 * stone) cannot take it for an even game.
 */

const onBlack: Handicap = { ...NO_HANDICAP, stone: STONES.black, doubleThree: true };
const start: HeadStart = { stone: STONES.white, freeTurns: 2, traditional: 4 };

describe("storing a head start beside a handicap", () => {
  it("stores nothing for an even game", () => {
    expect(storedHandicap(NO_HANDICAP, NO_HEAD_START)).toBeNull();
    // A colour with nothing given is an even game too.
    expect(storedHandicap(NO_HANDICAP, { stone: STONES.black, freeTurns: 0, traditional: 0 })).toBeNull();
  });

  it("stores a handicap alone exactly as it always was", () => {
    expect(storedHandicap(onBlack, NO_HEAD_START)).toEqual(onBlack);
  });

  it("stores a head start alone with no stone key, so no even-game match can read it", () => {
    const stored = storedHandicap(NO_HANDICAP, start);
    expect(stored).toEqual({ headStart: start });
    expect(stored !== null && "stone" in stored).toBe(false);
  });

  it("stores both side by side", () => {
    expect(storedHandicap(onBlack, start)).toEqual({ ...onBlack, headStart: start });
  });
});

describe("reading them back", () => {
  it("gives back what was stored, each half on its own", () => {
    for (const [handicap, headStart] of [
      [NO_HANDICAP, start],
      [onBlack, NO_HEAD_START],
      [onBlack, start],
    ] as const) {
      const column = JSON.parse(JSON.stringify(storedHandicap(handicap, headStart)));
      expect(parseHandicap(column)).toEqual(handicap);
      expect(parseHeadStart(column)).toEqual(headStart);
    }
  });

  it("reads a game stored before head starts existed as an even start", () => {
    expect(parseHeadStart(null)).toEqual(NO_HEAD_START);
    expect(parseHeadStart(onBlack)).toEqual(NO_HEAD_START);
    expect(parseHeadStart({ stone: null })).toEqual(NO_HEAD_START);
  });

  it("reads anything it cannot as no head start, never as part of one", () => {
    expect(parseHeadStart({ headStart: { stone: "green", freeTurns: 1, traditional: 0 } })).toEqual(NO_HEAD_START);
    expect(parseHeadStart({ headStart: { stone: STONES.black, freeTurns: 7, traditional: 0 } })).toEqual(NO_HEAD_START);
    expect(parseHeadStart({ headStart: "black" })).toEqual(NO_HEAD_START);
  });
});
