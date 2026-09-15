import { describe, expect, it } from "vitest";

import { createGame } from "@/lib/gomoku/engine";
import { RULE_VARIANTS, STONES } from "@/lib/gomoku/gomoku.constants";
import { NO_PROGRESS_RULES, distanceHome, stalled } from "@/lib/gomoku/rules/noProgress";
import { seededRandom } from "@/lib/gomoku/rules/random";
import type { GameState, Move, Point, Stone } from "@/lib/gomoku/gomoku.types";

import { firesAt, firstFiring, longestStall, nearestRank, raceLedger, recommendCap } from "./stallMeasure";

/**
 * The measurement is only worth reading if it agrees with the rule it measures,
 * so these check it AGAINST `stalled` itself on Chinese Checkers' star board —
 * not against a restatement of what the rule was meant to do.
 */

const STAR = 17;
const settings = createGame({ variant: RULE_VARIANTS.chineseCheckers, size: STAR }).settings;
const CAP = NO_PROGRESS_RULES[RULE_VARIANTS.chineseCheckers]!.plies;

const stateOf = (moves: Move[]): GameState => ({ settings, moves, pendingTwist: null }) as unknown as GameState;

/** Two neighbouring points on the star, the second one step nearer this colour's home. */
function nearerStep(stone: Stone): { from: Point; to: Point } {
  for (let row = 1; row < STAR - 1; row += 1) {
    for (let col = 1; col < STAR - 1; col += 1) {
      const from = { row, col };
      for (const to of [
        { row: row + 1, col },
        { row: row - 1, col },
        { row, col: col + 1 },
        { row, col: col - 1 },
      ]) {
        if ((distanceHome(STAR, stone, to) as number) === (distanceHome(STAR, stone, from) as number) - 1) return { from, to };
      }
    }
  }
  throw new Error(`no nearer step for ${stone} on the star`);
}

const steps = { black: nearerStep(STONES.black), white: nearerStep(STONES.white) };

/** A ply by `stone`: one step nearer home, or the same step taken back. */
function ply(stone: Stone, nearer: boolean): Move {
  const { from, to } = steps[stone as "black" | "white"];
  return nearer
    ? { kind: "move", stone, row: to.row, col: to.col, from }
    : { kind: "move", stone, row: from.row, col: from.col, from: to };
}

/** Alternating plies, black first, each nearer with probability `forward`. */
function walk(length: number, seed: number, forward: number): Move[] {
  const random = seededRandom(seed);
  return Array.from({ length }, (_, at) => ply(at % 2 === 0 ? STONES.black : STONES.white, random() < forward));
}

/** The first move count at which the real rule draws the game, found by asking it after every ply. */
function ruleFires(moves: Move[]): number | null {
  for (let end = 1; end <= moves.length; end += 1) {
    if (stalled(stateOf(moves.slice(0, end)))) return end;
  }
  return null;
}

describe("the ledger reads the racing rule exactly", () => {
  it("fires on the same ply as the rule in force, and stays silent where the rule does", () => {
    let fired = 0;
    let silent = 0;
    for (let seed = 1; seed <= 12; seed += 1) {
      const moves = walk(CAP + 60, seed, seed % 3 === 0 ? 0.62 : 0.5);
      const ledger = raceLedger(stateOf(moves));
      expect(ledger).not.toBeNull();
      const expected = ruleFires(moves);
      expect(firstFiring(ledger!, CAP), `seed ${seed}`).toBe(expected);
      if (expected === null) silent += 1;
      else fired += 1;
    }
    // Both answers were really compared, or this proved nothing about one of them.
    expect(fired).toBeGreaterThan(0);
    expect(silent).toBeGreaterThan(0);
  });

  it("never fires across a ply that was not a step, as the rule refuses to", () => {
    const moves = walk(CAP + 20, 5, 0);
    moves[CAP - 10] = { kind: "pass", stone: STONES.white, row: -1, col: -1 } as Move;
    const ledger = raceLedger(stateOf(moves))!;
    expect(firstFiring(ledger, CAP)).toBe(ruleFires(moves));
    expect(firesAt(ledger, CAP, CAP + 5)).toBe(false);
  });

  it("finds the longest stall a brute-force count off the moves finds", () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const moves = walk(70, seed, 0.55);
      const gain = (move: Move) =>
        (distanceHome(STAR, move.stone, move) as number) - (distanceHome(STAR, move.stone, move.from as Point) as number);
      let expected: { plies: number; endsAt: number } | null = null;
      for (let window = moves.length; window >= 1 && expected === null; window -= 1) {
        for (let end = window; end <= moves.length; end += 1) {
          let black = 0;
          let white = 0;
          for (const move of moves.slice(end - window, end)) {
            if (move.stone === STONES.black) black += gain(move);
            else white += gain(move);
          }
          if (black >= 0 && white >= 0) {
            expected = { plies: window, endsAt: end };
            break;
          }
        }
      }
      expect(longestStall(raceLedger(stateOf(moves))!), `seed ${seed}`).toEqual(expected);
    }
  });

  it("finds no stall in a game where both sides get nearer every move", () => {
    const ledger = raceLedger(stateOf(walk(200, 1, 1)))!;
    expect(longestStall(ledger)).toBeNull();
    expect(firstFiring(ledger, 50)).toBeNull();
  });

  it("declines to measure a board whose camps the rule cannot read, rather than reading zeros", () => {
    const square = createGame({ variant: RULE_VARIANTS.squareFour, size: 5 }).settings;
    expect(raceLedger({ settings: square, moves: [], pendingTwist: null } as unknown as GameState)).toBeNull();
  });
});

describe("the recommendation", () => {
  it("refuses to recommend anything from no won games", () => {
    expect(recommendCap(400, []).verdict).toBe("unmeasured");
  });

  it("says raise when the cap would have called off a game that was then won", () => {
    const said = recommendCap(400, [
      { longest: 30, endedByCurrentCap: false },
      { longest: 410, endedByCurrentCap: true },
    ]);
    expect(said.verdict).toBe("raise");
    expect(said.wonGamesEnded).toBe(1);
    expect(said.suggested).toBe(8200);
  });

  it("says keep when the cap is at least the margin over the longest stall", () => {
    const said = recommendCap(400, [{ longest: 20, endedByCurrentCap: false }]);
    expect(said.verdict).toBe("keep");
    expect(said.suggested).toBeNull();
  });

  it("says thin when no won game is ended but the margin is short, and names the number that would carry it", () => {
    const said = recommendCap(400, [{ longest: 37, endedByCurrentCap: false }]);
    expect(said.verdict).toBe("thin");
    expect(said.suggested).toBe(750);
  });

  it("reads quantiles by nearest rank", () => {
    expect(nearestRank([], 0.5)).toBeNull();
    expect(nearestRank([1, 2, 3, 4], 0.5)).toBe(2);
    expect(nearestRank([1, 2, 3, 4], 1)).toBe(4);
    expect(nearestRank([7], 0.9)).toBe(7);
  });
});
