import { describe, expect, it } from "vitest";

import { readAdvantage } from "./advantage";
import {
  ADVANTAGE_MEASURES,
  MEASURE_DISPLAY,
  OUTLOOK_SIDE_DISPLAY,
  UNREADABLE_DISPLAY,
  UNREADABLE_REASONS,
} from "./advantage.constants";
import { OUTLOOK_DISPLAY, OUTLOOKS } from "./analysis.constants";
import { RULE_VARIANT_LIST, STONES, VARIANT_SPECS } from "./gomoku.constants";
import { createGame } from "./engine";
import { fromDiagram } from "./gomoku.test-support";
import { KOMI } from "./rules/go";
import type { Advantage } from "./advantage.types";

/**
 * Who is ahead while the game is on.
 *
 * The rule this suite exists to hold is the one the old reading broke: no
 * game is ever handed a number that was not measured. A game either has a
 * threat reading, or a quantity somebody could count for themselves, or it
 * says out loud that it cannot be read — and never an even bar standing in
 * for all three.
 */

function readingFor(variant: (typeof RULE_VARIANT_LIST)[number]): Advantage {
  return readAdvantage(createGame({ variant }));
}

describe("readAdvantage", () => {
  it("gives every game on the site a reading, and never falls through", () => {
    for (const variant of RULE_VARIANT_LIST) {
      const reading = readingFor(variant);
      expect(["threats", "count", "unreadable"], variant).toContain(reading.kind);
    }
  });

  it("reads the line games by threats, and never by a number", () => {
    for (const variant of RULE_VARIANT_LIST) {
      if (!VARIANT_SPECS[variant].analysis) continue;
      const reading = readingFor(variant);
      expect(reading.kind, variant).toBe("threats");
      /*
       * The point of the ticket. A percentage here would be a claim about a
       * search this site does not run, and would look most like a fact in the
       * positions where it is least reliable.
       */
      expect(reading, variant).not.toHaveProperty("black", expect.any(Number));
    }
  });

  it("never gives a game with analysis off a threat reading", () => {
    for (const variant of RULE_VARIANT_LIST) {
      if (VARIANT_SPECS[variant].analysis) continue;
      expect(readingFor(variant).kind, variant).not.toBe("threats");
    }
  });

  it("says plainly that a game cannot be read, rather than calling it even", () => {
    const reading = readingFor("twistFive");
    expect(reading.kind).toBe("unreadable");
    if (reading.kind !== "unreadable") throw new Error("expected unreadable");
    expect(reading.reason).toBe(UNREADABLE_REASONS.turning);
    // No numbers at all: an even bar is itself a claim about the position.
    expect(reading).not.toHaveProperty("black");
    expect(reading).not.toHaveProperty("white");
    expect(reading).not.toHaveProperty("lead");
  });

  it("picks the reason from the mechanism that defeats the reading", () => {
    const reasons: Partial<Record<string, string>> = {
      twistFour: UNREADABLE_REASONS.turning,
      dominoFive: UNREADABLE_REASONS.queued,
      blockFive: UNREADABLE_REASONS.queued,
      hex: UNREADABLE_REASONS.connection,
      squareFour: UNREADABLE_REASONS.square,
      makerBreaker: UNREADABLE_REASONS.asymmetric,
      wildTicTacToe: UNREADABLE_REASONS.shared,
      notakto: UNREADABLE_REASONS.shared,
    };
    for (const [variant, reason] of Object.entries(reasons)) {
      const reading = readingFor(variant as (typeof RULE_VARIANT_LIST)[number]);
      if (reading.kind !== "unreadable") throw new Error(`${variant} was not unreadable`);
      expect(reading.reason, variant).toBe(reason);
    }
  });
});

describe("the counted games", () => {
  it("counts discs in every flipping game, including the big and small boards", () => {
    for (const variant of RULE_VARIANT_LIST) {
      if (!VARIANT_SPECS[variant].flips) continue;
      const reading = readingFor(variant);
      expect(reading.kind, variant).toBe("count");
      if (reading.kind !== "count") continue;
      expect(reading.measure, variant).toBe(ADVANTAGE_MEASURES.discs);
    }
  });

  it("counts a Reversi opening as two discs each, and calls it level", () => {
    const reading = readAdvantage(createGame({ variant: "reversi" }));
    if (reading.kind !== "count") throw new Error("expected a count");
    expect(reading.black).toBe(2);
    expect(reading.white).toBe(2);
    expect(reading.lead).toBeNull();
  });

  it("gives the lead to the bigger pile in Reversi", () => {
    const state = fromDiagram(
      [
        ". . . . . . . .",
        ". . . . . . . .",
        ". . . . . . . .",
        ". . . x x . . .",
        ". . . x o . . .",
        ". . . . . . . .",
        ". . . . . . . .",
        ". . . . . . . .",
      ].join("\n"),
      { settings: { variant: "reversi", size: 8 } },
    );
    const reading = readAdvantage(state);
    if (reading.kind !== "count") throw new Error("expected a count");
    expect(reading.black).toBe(3);
    expect(reading.white).toBe(1);
    expect(reading.lead).toBe(STONES.black);
  });

  it("gives the lead to the SMALLER pile in Anti-Reversi, which is the misere one", () => {
    /*
     * The case that makes the count worth having rather than decorative. Anti
     * Reversi is won by finishing with fewer discs, so the side with more of
     * them is behind. A panel that called the bigger number the lead would be
     * confidently, visibly wrong in the one game where the difference is the
     * whole point.
     */
    const board = [
      ". . . . . . . .",
      ". . . . . . . .",
      ". . . . . . . .",
      ". . . x x . . .",
      ". . . x o . . .",
      ". . . . . . . .",
      ". . . . . . . .",
      ". . . . . . . .",
    ].join("\n");
    const plain = readAdvantage(fromDiagram(board, { settings: { variant: "reversi", size: 8 } }));
    const misere = readAdvantage(
      fromDiagram(board, { settings: { variant: "antiReversi", size: 8 } }),
    );

    if (plain.kind !== "count" || misere.kind !== "count") throw new Error("expected counts");
    expect(plain.black).toBe(misere.black);
    expect(plain.white).toBe(misere.white);
    // Same board, same numbers, opposite lead — because the object is opposite.
    expect(plain.lead).toBe(STONES.black);
    expect(misere.lead).toBe(STONES.white);
  });

  it("counts pieces home in both race games, and starts them at nobody home", () => {
    for (const variant of ["halma", "chineseCheckers"] as const) {
      const reading = readingFor(variant);
      if (reading.kind !== "count") throw new Error(`${variant} was not a count`);
      expect(reading.measure, variant).toBe(ADVANTAGE_MEASURES.home);
      expect(reading.black, variant).toBe(0);
      expect(reading.white, variant).toBe(0);
      expect(reading.lead, variant).toBeNull();
    }
  });

  it("does not invert a race, whatever misere means elsewhere", () => {
    // Only a disc count is ever read the other way round; you cannot win a
    // race home by getting fewer pieces there.
    for (const variant of ["halma", "chineseCheckers", "checkers"] as const) {
      expect(VARIANT_SPECS[variant].misere, variant).toBe(false);
    }
  });

  it("scores Go by area, with komi, and never calls an empty board level", () => {
    /*
     * The game where counting is the whole point, and the one place a naive
     * reading would have been most embarrassing: without komi an untouched
     * board reads 0-0 and level, when White is six and a half points up before
     * a stone is played. The half point is also what stops a tie, so the lead
     * is always answerable.
     */
    const reading = readAdvantage(createGame({ variant: "go" }));
    if (reading.kind !== "count") throw new Error("expected a count");
    expect(reading.measure).toBe(ADVANTAGE_MEASURES.score);
    expect(reading.black).toBe(0);
    expect(reading.white).toBe(KOMI);
    expect(reading.lead).toBe(STONES.white);
  });

  it("gives Go's empty regions to the colour that surrounds them", () => {
    // Black walls off the top-left corner; those empty points are Black's.
    const state = fromDiagram(
      [
        ". . x . . . . . .",
        ". . x . . . . . .",
        "x x x . . . . . .",
        ". . . . . . . . .",
        ". . . . . . . . .",
        ". . . . . . . o .",
        ". . . . . . . . .",
        ". . . . . . . . .",
        ". . . . . . . . .",
      ].join("\n"),
      { settings: { variant: "go", size: 9 } },
    );
    const reading = readAdvantage(state);
    if (reading.kind !== "count") throw new Error("expected a count");
    // Five stones, plus the four empty points they enclose.
    expect(reading.black).toBe(9);
    expect(reading.white).toBe(1 + KOMI);
    expect(reading.lead).toBe(STONES.black);
  });

  it("counts material in checkers, and starts it level", () => {
    const reading = readingFor("checkers");
    if (reading.kind !== "count") throw new Error("expected a count");
    expect(reading.measure).toBe(ADVANTAGE_MEASURES.material);
    expect(reading.black).toBe(reading.white);
    expect(reading.black).toBeGreaterThan(0);
    expect(reading.lead).toBeNull();
  });
});

describe("the threat reading", () => {
  it("hands the lead to the side with the better outlook", () => {
    // Black has an open three and white has nothing.
    const state = fromDiagram(
      [
        ". . . . . . . . .",
        ". . . . . . . . .",
        ". . . . . . . . .",
        ". . . . . . . . .",
        ". . . x x x . . .",
        ". . . . . . . . .",
        ". . . . . . . . .",
        ". . . . . . . . .",
        ". . . . . . . . .",
      ].join("\n"),
      { toPlay: STONES.black, settings: { variant: "freestyle", size: 9 } },
    );
    const reading = readAdvantage(state);
    if (reading.kind !== "threats") throw new Error("expected a threat reading");
    expect(reading.lead).toBe(STONES.black);
  });

  it("calls an untouched board level", () => {
    const reading = readAdvantage(createGame({ variant: "freestyle" }));
    if (reading.kind !== "threats") throw new Error("expected a threat reading");
    expect(reading.lead).toBeNull();
    expect(reading.decided).toBe(false);
  });
});

describe("the copy", () => {
  it("has a label, kanji and note for every quantity it can count", () => {
    for (const measure of Object.values(ADVANTAGE_MEASURES)) {
      const copy = MEASURE_DISPLAY[measure];
      expect(copy, measure).toBeDefined();
      expect(copy.label.length, measure).toBeGreaterThan(3);
      expect(copy.kanji.length, measure).toBeGreaterThan(0);
      expect(copy.note.length, measure).toBeGreaterThan(20);
      expect(copy.fewerNote.length, measure).toBeGreaterThan(20);
    }
  });

  it("has a sentence for every reason a game cannot be read", () => {
    for (const reason of Object.values(UNREADABLE_REASONS)) {
      const copy = UNREADABLE_DISPLAY[reason];
      expect(copy, reason).toBeDefined();
      expect(copy.kanji.length, reason).toBeGreaterThan(0);
      // Long enough to actually say why, not just that.
      expect(copy.sentence.length, reason).toBeGreaterThan(60);
    }
  });

  it("uses every reason and every measure it defines", () => {
    const measures = new Set<string>();
    const reasons = new Set<string>();
    for (const variant of RULE_VARIANT_LIST) {
      const reading = readingFor(variant);
      if (reading.kind === "count") measures.add(reading.measure);
      if (reading.kind === "unreadable") reasons.add(reading.reason);
    }
    // Copy nothing reaches is copy nobody proof-reads.
    expect([...measures].sort()).toEqual(Object.values(ADVANTAGE_MEASURES).sort());
    expect([...reasons].sort()).toEqual(Object.values(UNREADABLE_REASONS).sort());
  });
});

describe("one vocabulary, two places", () => {
  it("says the same kanji about a side as the banner says to them", () => {
    /*
     * The banner over the board speaks to the player to move; this panel
     * speaks about both colours. The words differ because the grammar must,
     * but the kanji are the game's own and drifting apart would leave one
     * position with two names.
     */
    for (const outlook of Object.values(OUTLOOKS)) {
      expect(OUTLOOK_SIDE_DISPLAY[outlook].kanji, outlook).toBe(OUTLOOK_DISPLAY[outlook].kanji);
      expect(OUTLOOK_SIDE_DISPLAY[outlook].label.length, outlook).toBeGreaterThan(3);
      // Said about a player, never to them: no second person in this panel.
      expect(OUTLOOK_SIDE_DISPLAY[outlook].label, outlook).not.toMatch(/\bYou\b|\bYour\b/);
    }
  });
});
