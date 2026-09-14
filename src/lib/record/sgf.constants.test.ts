import { describe, expect, it } from "vitest";

import { RULE_VARIANT_LIST, STARTING_DISCS, VARIANT_SPECS, WIN_LENGTH } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant, VariantSpec } from "@/lib/gomoku/gomoku.types";
import { SGF_GAME_TYPES, SGF_TYPES } from "./sgf.constants";

/**
 * The variant table, held to the rules.
 *
 * A row in `SGF_TYPES` is a claim that a game IS the game SGF numbers — and
 * the rules of every game here are already data in `VARIANT_SPECS`. So each
 * claim is checked against the spec it is about, and a game that changes its
 * rules, or a new game written as a copy of an old row, cannot keep a type it
 * no longer plays.
 */

/** Five in a row as Gomoku and Renju know it: one stone a turn, laid anywhere, never moved, never taken, on a plain board. */
function isPlainFiveInARow(spec: VariantSpec): boolean {
  return (
    spec.stonesPerTurn === 1 &&
    spec.firstTurnStones === 1 &&
    (spec.winLength === null || spec.winLength === WIN_LENGTH) &&
    !spec.captures &&
    spec.placement === "free" &&
    spec.loseLength === null &&
    spec.quadrantSize === null &&
    spec.pieces === null &&
    !spec.squareWins &&
    spec.wrap === "none" &&
    spec.deadSquares === 0 &&
    spec.hotSquares === 0 &&
    !spec.lineClear &&
    !spec.misere &&
    spec.queue === null &&
    spec.singles === 0 &&
    spec.wormholes === 0 &&
    !spec.anyColour &&
    !spec.singleColour &&
    !spec.makerBreaker &&
    !spec.flips &&
    !spec.camps &&
    !spec.connects &&
    !spec.checkers &&
    !spec.chineseCheckers &&
    !spec.go
  );
}

function mappedTo(gm: number): RuleVariant[] {
  return RULE_VARIANT_LIST.filter((variant) => SGF_TYPES[variant].gm === gm);
}

describe("which games are written as which SGF type", () => {
  it("writes as Gomoku+Renju exactly the games that are plain five in a row", () => {
    expect(mappedTo(SGF_GAME_TYPES.gomoku)).toEqual(RULE_VARIANT_LIST.filter((variant) => isPlainFiveInARow(VARIANT_SPECS[variant])));
  });

  it("writes as Othello only a flipping game that starts from Othello's four discs and is won by the most", () => {
    const othello = mappedTo(SGF_GAME_TYPES.othello);
    expect(othello.length).toBeGreaterThan(0);
    for (const variant of othello) {
      const spec = VARIANT_SPECS[variant];
      expect(spec.flips && spec.startingDiscs === STARTING_DISCS.fixed && !spec.misere, variant).toBe(true);
    }
  });

  it("writes as Go only Go, and as Hex only the connection game", () => {
    expect(mappedTo(SGF_GAME_TYPES.go).every((variant) => VARIANT_SPECS[variant].go)).toBe(true);
    expect(mappedTo(SGF_GAME_TYPES.go)).toHaveLength(1);
    expect(mappedTo(SGF_GAME_TYPES.hex).every((variant) => VARIANT_SPECS[variant].connects)).toBe(true);
    expect(mappedTo(SGF_GAME_TYPES.hex)).toHaveLength(1);
  });

  it("gives every game it will not write a reason somebody can read", () => {
    for (const variant of RULE_VARIANT_LIST) {
      const row = SGF_TYPES[variant];
      if (row.gm === null) expect(row.why.length, `${variant} has no real reason`).toBeGreaterThan(30);
    }
  });

  it("uses only numbers SGF itself gives", () => {
    for (const variant of RULE_VARIANT_LIST) expect([null, 1, 2, 4, 11]).toContain(SGF_TYPES[variant].gm);
  });
});
