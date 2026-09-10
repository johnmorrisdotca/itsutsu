import { describe, expect, it } from "vitest";

import { createGame } from "../engine";
import { MOVE_KINDS, RULE_VARIANTS, STONES, VARIANT_SPECS } from "../gomoku.constants";
import { fromDiagram } from "../gomoku.test-support";
import { seededRandom } from "../rules/random";
import { BOT_TIERS, TIER_SPECS } from "../opponent.constants";
import { chooseTurn } from "../opponent";
import { applyTurn } from "../opponentTurns";
import { EXPERT_KINDS } from "./expert.constants";
import { expertFor, masteredTurn, tiersFor } from "./experts";
import { flipApplies, flipCandidates, flipRead, squareValue } from "./flipExpert";
import { lineApplies, lineCandidates, lineValue } from "./lineExpert";
import { lineRead } from "./lineShapes";
import type { GameState } from "../gomoku.types";

/**
 * What the two specialists actually know.
 *
 * The series in `specialists.match.test.ts` proves they win; this proves they
 * win for the reasons claimed. A player that beat the ladder by accident would
 * pass the series and fail every case here, and a reading that quietly stopped
 * counting corners would keep passing the series for as long as the ladder
 * stayed weak.
 */

/** A Reversi board from a diagram, with the flipping rules in force. */
function reversi(diagram: string, toPlay = STONES.black): GameState {
  return fromDiagram(diagram, {
    toPlay,
    settings: { variant: RULE_VARIANTS.reversi },
  });
}

describe("which games each specialist has studied", () => {
  it("takes the flipping boards where the larger pile wins, and no others", () => {
    for (const variant of [
      RULE_VARIANTS.reversi,
      RULE_VARIANTS.classicReversi,
      RULE_VARIANTS.miniReversi,
      RULE_VARIANTS.grandReversi,
    ]) {
      expect(flipApplies(VARIANT_SPECS[variant]), variant).toBe(true);
    }
    /*
     * The giveaway board is excluded on purpose. Every sentence of the
     * reading — corners are permanent, mobility wins, a small pile is a strong
     * position — is a different sentence when the smaller pile wins, and a
     * specialist guessing outside its game is the exact failure this whole
     * module exists because of.
     */
    expect(flipApplies(VARIANT_SPECS[RULE_VARIANTS.antiReversi])).toBe(false);
    expect(flipApplies(VARIANT_SPECS[RULE_VARIANTS.freestyle])).toBe(false);
    expect(flipApplies(VARIANT_SPECS[RULE_VARIANTS.go])).toBe(false);
  });

  it("takes the ordinary five-in-a-row boards, and no others", () => {
    for (const variant of [
      RULE_VARIANTS.freestyle,
      RULE_VARIANTS.standard,
      RULE_VARIANTS.renju,
      RULE_VARIANTS.omok,
    ]) {
      expect(lineApplies(VARIANT_SPECS[variant]), variant).toBe(true);
    }
    // Making the line loses here, so every threat the reading counts is backwards.
    expect(lineApplies(VARIANT_SPECS[RULE_VARIANTS.misereFive])).toBe(false);
    // A five that has to be open at one end is not the five this reading counts.
    expect(lineApplies(VARIANT_SPECS[RULE_VARIANTS.caro])).toBe(false);
    // Captures move stones the reading has already counted.
    expect(lineApplies(VARIANT_SPECS[RULE_VARIANTS.ninuki])).toBe(false);
    // Two stones a turn is a different game about the same shape.
    expect(lineApplies(VARIANT_SPECS[RULE_VARIANTS.connect6])).toBe(false);
    // The edges join, so a line the reading cannot see runs across the board.
    expect(lineApplies(VARIANT_SPECS[RULE_VARIANTS.toroidalFive])).toBe(false);
    expect(lineApplies(VARIANT_SPECS[RULE_VARIANTS.reversi])).toBe(false);
  });

  it("offers a specialist at its own game and nowhere else", () => {
    expect(tiersFor(RULE_VARIANTS.reversi)).toContain(BOT_TIERS.tamenoki);
    expect(tiersFor(RULE_VARIANTS.reversi)).not.toContain(BOT_TIERS.meritalu);
    expect(tiersFor(RULE_VARIANTS.freestyle)).toContain(BOT_TIERS.meritalu);
    expect(tiersFor(RULE_VARIANTS.freestyle)).not.toContain(BOT_TIERS.tamenoki);
    // Nobody's specialty, so it is the graded ladder and only the ladder.
    expect(tiersFor(RULE_VARIANTS.halma)).not.toContain(BOT_TIERS.tamenoki);
    expect(tiersFor(RULE_VARIANTS.halma)).not.toContain(BOT_TIERS.meritalu);
    // Every game keeps all five graded players, whatever else it gets.
    for (const variant of [RULE_VARIANTS.reversi, RULE_VARIANTS.freestyle, RULE_VARIANTS.halma]) {
      expect(tiersFor(variant)).toContain(BOT_TIERS.guoshou);
      expect(tiersFor(variant).length).toBeGreaterThanOrEqual(5);
    }
  });

  it("says nothing at all for a player who has studied nothing", () => {
    const board = createGame({ variant: RULE_VARIANTS.reversi, size: 8 }, 0);
    expect(expertFor(TIER_SPECS.guoshou.expertise, VARIANT_SPECS[RULE_VARIANTS.reversi])).toBeNull();
    expect(masteredTurn(board, TIER_SPECS.guoshou, seededRandom(1))).toBeNull();
    // And nothing for a specialist away from its own board.
    expect(masteredTurn(board, TIER_SPECS.meritalu, seededRandom(1))).toBeNull();
    expect(masteredTurn(board, TIER_SPECS.tamenoki, seededRandom(1))).not.toBeNull();
    expect(TIER_SPECS.tamenoki.expertise).toEqual([EXPERT_KINDS.flip]);
    expect(TIER_SPECS.meritalu.expertise).toEqual([EXPERT_KINDS.line]);
  });
});

describe("the Reversi reading", () => {
  it("would rather hold a corner than hold discs", () => {
    /*
     * Black has one disc, in a corner that can never be turned. White has six
     * in the middle, every one of which can. The shared reading, which counts
     * discs weighted by how full the board is, prefers white's pile; a Reversi
     * player prefers black's corner, and so does this.
     */
    const held = reversi(`
      x . . . . . . .
      . o o o . . . .
      . o o o . . . .
      . . . . . . . .
      . . . . . . . .
      . . . . . . . .
      . . . . . . . .
      . . . . . . . .
    `);
    expect(flipRead(held, STONES.black)).toBeGreaterThan(0);
    expect(flipRead(held, STONES.white)).toBeLessThan(0);
  });

  it("reads the two sides as exact opposites", () => {
    const board = reversi(`
      x . . . . . . .
      . o o o . . . .
      . o x o . . . .
      . . . o . . . .
      . . . . . . . .
      . . . . . . . .
      . . . . . . . .
      . . . . . . . .
    `);
    expect(flipRead(board, STONES.black)).toBeCloseTo(-flipRead(board, STONES.white), 6);
  });

  it("counts the square beside an empty corner as the liability it is", () => {
    // The same one disc, on the square diagonally inside an empty corner.
    const poison = reversi(`
      . . . . . . . .
      . x . . . . . .
      . . . . . . . .
      . . . . . . . .
      . . . . . . . .
      . . . . . . . .
      . . . . . . . .
      . . . . . . . .
    `);
    expect(flipRead(poison, STONES.black)).toBeLessThan(0);
    expect(squareValue(8, { row: 1, col: 1 })).toBeLessThan(squareValue(8, { row: 3, col: 3 }));
    expect(squareValue(8, { row: 0, col: 0 })).toBeGreaterThan(squareValue(8, { row: 0, col: 3 }));
  });

  it("prefers the corner to the pile of discs", () => {
    /*
     * Black to move, with two moves available. The corner turns two discs and
     * can never be turned back; the move on the third row turns four, and
     * turning four discs on the third row is the sort of move that loses a
     * game of Reversi. A reading that counts discs takes the four.
     *
     * The move is compared here rather than the search's answer to the whole
     * position, because that is the claim being made about the reading. What
     * the search does with it over eight plies is the series' business, and
     * the series says it wins fifty games out of fifty.
     */
    const state = reversi(`
      . o o x . . . .
      . . . . . . . .
      . o o o o x . .
      . . . . . . . .
      . . . . . . . .
      . . . . . . . .
      . . . . . . . .
      . . . . . . . .
    `);
    const options = flipCandidates(state, 20);
    expect(options).toHaveLength(2);
    // Ordered corner first, which is where nearly all of a search's pruning comes from.
    expect(options[0]).toEqual({ row: 0, col: 0 });

    const read = (row: number, col: number) => {
      const after = applyTurn(state, { kind: MOVE_KINDS.place, row, col });
      expect(after).not.toBe(state);
      return flipRead(after, STONES.black);
    };
    expect(read(0, 0)).toBeGreaterThan(read(2, 0));
  });
});

describe("the five-in-a-row reading", () => {
  const settings = { variant: RULE_VARIANTS.freestyle } as const;

  it("finds the point that completes five, and only a real one", () => {
    const four = fromDiagram(
      `
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . x x x x . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
    `,
      { settings },
    );
    const black = lineRead(four.board, 9, 5, STONES.black, false);
    // Either end finishes it: two points to five, which cannot both be blocked.
    expect(black.fives.length).toBe(2);
    const white = lineRead(four.board, 9, 5, STONES.white, false);
    expect(white.fives.length).toBe(0);
  });

  it("knows an open three from a three with one end shut", () => {
    const open = fromDiagram(
      `
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . x x x . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
    `,
      { settings },
    );
    const shut = fromDiagram(
      `
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . o x x x . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
    `,
      { settings },
    );
    expect(lineRead(open.board, 9, 5, STONES.black, false).openThrees).toBeGreaterThan(0);
    expect(lineRead(shut.board, 9, 5, STONES.black, false).openThrees).toBe(0);
  });

  it("does not offer a six as a five where the rule says five means five", () => {
    /*
     * Black has four with one of its own already pressed against the left
     * flank. Filling the gap on that side makes six, which wins in freestyle
     * and does not win under the standard rule — so the point is a five in
     * one game and not in the other, from exactly the same board.
     */
    const board = fromDiagram(
      `
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . x . x x x x . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
    `,
      { settings },
    ).board;
    const loose = lineRead(board, 9, 5, STONES.black, false);
    const strict = lineRead(board, 9, 5, STONES.black, true);
    expect(loose.fives.length).toBeGreaterThan(strict.fives.length);
  });

  it("answers a four rather than weighing thirteen quiet moves", () => {
    // Black has four in a row and white is to move: there is one move here.
    const state = fromDiagram(
      `
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . o x x x x . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
    `,
      { toPlay: STONES.white, settings },
    );
    const candidates = lineCandidates(state, 16);
    expect(candidates).toEqual([{ row: 4, col: 6 }]);
  });

  it("takes its own five ahead of blocking theirs", () => {
    const state = fromDiagram(
      `
      . . . . . . . . .
      . o o o o . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . x x x x . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
    `,
      { toPlay: STONES.black, settings },
    );
    const chosen = chooseTurn(state, BOT_TIERS.meritalu, seededRandom(9), {
      nodes: 500,
      millis: 60_000,
    });
    const after = applyTurn(state, chosen!);
    expect(after.winner, "the specialist did not take the win in hand").toBe(STONES.black);
  });

  it("values a threat more highly for the side about to play it", () => {
    const four = fromDiagram(
      `
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . x x x x . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
    `,
      { toPlay: STONES.black, settings },
    );
    const theirs = fromDiagram(
      `
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . x x x x . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
    `,
      { toPlay: STONES.white, settings },
    );
    expect(lineValue(four, STONES.black)).toBeGreaterThan(lineValue(theirs, STONES.black));
  });
});
