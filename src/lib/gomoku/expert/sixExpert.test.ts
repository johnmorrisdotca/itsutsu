import { describe, expect, it } from "vitest";

import { createGame, indexOf } from "../engine";
import { MOVE_KINDS, RULE_VARIANTS, STONES, VARIANT_SPECS } from "../gomoku.constants";
import { seededRandom } from "../rules/random";
import { expertTurn } from "./expertSearch";
import { SIX_EXPERT, blocksNeeded, sixRead } from "./sixExpert";
import type { Cell, GameState, Move, Stone } from "../gomoku.types";

/**
 * THE CONNECT6 PLAYER, held to the game's one idea: a threat is six with at
 * most two stones missing, a defender blocks two a turn, and three threats
 * that need three blocks are a win.
 */

/*
 * A position mid-game: the stones, and a last move by the other colour, so the
 * side to move has a whole turn of two stones — with no history at all the
 * engine reads it as Black's opening turn, which is one.
 */
function position(stones: [number, number, Stone][], toPlay: Stone, size = 13): GameState {
  const fresh = createGame({ variant: RULE_VARIANTS.connect6, size });
  const board: Cell[] = fresh.board.map(() => null);
  for (const [row, col, stone] of stones) board[indexOf(size, { row, col })] = stone;
  const other: Stone = toPlay === STONES.black ? STONES.white : STONES.black;
  const last: Move = { row: 0, col: 0, stone: other, kind: MOVE_KINDS.place };
  return { ...fresh, board, toPlay, moves: [last] };
}

const reading = { nodes: 20_000, millis: 20_000 };
const at = (turn: { kind: string; row?: number; col?: number } | null) =>
  turn !== null && turn.kind === MOVE_KINDS.place ? `${turn.row},${turn.col}` : "none";

describe("which game the Connect6 player has studied", () => {
  it("is Connect6, read from the spec", () => {
    const studied = Object.values(RULE_VARIANTS).filter((variant) => SIX_EXPERT.applies(VARIANT_SPECS[variant]));
    expect(studied).toEqual([RULE_VARIANTS.connect6]);
  });
});

describe("blocks, not lines", () => {
  it("counts a row of four with room both ways as needing one or two blocks, not one per stretch", () => {
    // Four in a row on row 6, cols 4-7: every stretch of six through it shares its ends.
    const stones: [number, number, Stone][] = [4, 5, 6, 7].map((col) => [6, col, STONES.black]);
    const state = position(stones, STONES.white);
    const threats: { black: number; white: number; empties: number[] }[] = [];
    // Rebuild the black threats the reading sees, through its own export.
    for (let start = 0; start <= 13 - 6; start += 1) {
      const cols = Array.from({ length: 6 }, (_, step) => start + step);
      const black = cols.filter((col) => col >= 4 && col <= 7).length;
      if (black >= 4) threats.push({ black, white: 0, empties: cols.filter((col) => col < 4 || col > 7).map((col) => indexOf(13, { row: 6, col })) });
    }
    expect(blocksNeeded(threats)).toBeLessThanOrEqual(2);
    expect(sixRead(state, STONES.black)).toBeGreaterThan(0);
  });

  it("reads two separate open fours against a defender with two stones as won, and one as not", () => {
    /*
     * An open row of four needs two blocks — one at each end — so one row is
     * parried by a whole turn and two rows need four stones against two. Rows
     * far apart, White to move with a whole turn.
     */
    const row = (r: number): [number, number, Stone][] => [3, 4, 5, 6].map((col) => [r, col, STONES.black]);
    const one = sixRead(position(row(2), STONES.white), STONES.black);
    const two = sixRead(position([...row(2), ...row(9)], STONES.white), STONES.black);
    expect(two - one).toBeGreaterThan(50_000);
    expect(one).toBeLessThan(50_000);
  });
});

describe("what it plays", () => {
  it("finishes six when it has the stones to", () => {
    // Four in a row with both stones of a turn to play: the six is there.
    const state = position([4, 5, 6, 7].map((col) => [6, col, STONES.black] as [number, number, Stone]), STONES.black);
    const first = expertTurn(state, SIX_EXPERT, seededRandom(1), reading);
    expect(["6,3", "6,8", "6,2", "6,9"]).toContain(at(first));
  });

  it("blocks a four the other side could finish next turn", () => {
    const stones: [number, number, Stone][] = [4, 5, 6, 7].map((col) => [6, col, STONES.white]);
    stones.push([0, 0, STONES.black], [12, 12, STONES.black]);
    const state = position(stones, STONES.black);
    const first = expertTurn(state, SIX_EXPERT, seededRandom(1), reading);
    // Any stone on the row next to the four, or one beyond: the points that break every six through it.
    expect(["6,2", "6,3", "6,8", "6,9"]).toContain(at(first));
  });
});
