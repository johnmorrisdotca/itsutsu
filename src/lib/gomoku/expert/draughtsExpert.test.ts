import { describe, expect, it } from "vitest";

import { createGame, indexOf } from "../engine";
import { MOVE_KINDS, RULE_VARIANTS, STONES, VARIANT_SPECS } from "../gomoku.constants";
import { seededRandom } from "../rules/random";
import { DRAUGHTS_EXPERT, draughtsRead, draughtsTurns } from "./draughtsExpert";
import { expertTurn } from "./expertSearch";
import type { Cell, GameState, Point, RuleVariant, Stone } from "../gomoku.types";

/**
 * THE DRAUGHTS PLAYER, held to what a draughts player knows.
 *
 * Each case is a position a club player would read at a glance, built on
 * English checkers' own board — Black starts on rows 0-2 and moves down the
 * board, White on rows 5-7 and moves up — and the search is asked what it
 * would play. The engine decides what is legal throughout.
 */

type Piece = { at: [number, number]; stone: Stone; king?: boolean };

function position(pieces: Piece[], toPlay: Stone = STONES.black, variant: RuleVariant = RULE_VARIANTS.checkers): GameState {
  const fresh = createGame({ variant, size: 8 });
  const board: Cell[] = fresh.board.map((cell) => (cell === STONES.black || cell === STONES.white ? null : cell));
  const kings: Point[] = [];
  for (const piece of pieces) {
    const point = { row: piece.at[0], col: piece.at[1] };
    board[indexOf(8, point)] = piece.stone;
    if (piece.king) kings.push(point);
  }
  return { ...fresh, board, kings, toPlay };
}

const reading = { nodes: 40_000, millis: 20_000 };

describe("which games the draughts player has studied", () => {
  it("is decided by the spec: every game with checkers rules, and nothing else", () => {
    const studied = Object.values(RULE_VARIANTS).filter((variant) => DRAUGHTS_EXPERT.applies(VARIANT_SPECS[variant]));
    expect(studied.sort()).toEqual(
      [
        RULE_VARIANTS.checkers,
        RULE_VARIANTS.internationalDraughts,
        RULE_VARIANTS.brazilianDraughts,
        RULE_VARIANTS.canadianCheckers,
        RULE_VARIANTS.russianDraughts,
        RULE_VARIANTS.poolCheckers,
      ].sort(),
    );
  });
});

describe("what it counts", () => {
  it("counts a king above a man", () => {
    const man = position([{ at: [3, 2], stone: STONES.black }, { at: [7, 6], stone: STONES.white }]);
    const king = position([{ at: [3, 2], stone: STONES.black, king: true }, { at: [7, 6], stone: STONES.white }]);
    expect(draughtsRead(king, STONES.black)).toBeGreaterThan(draughtsRead(man, STONES.black));
  });

  it("wants pieces off when it is ahead: the same lead is worth more over fewer pieces", () => {
    const three = position([
      { at: [3, 2], stone: STONES.black, king: true },
      { at: [3, 4], stone: STONES.black, king: true },
      { at: [4, 3], stone: STONES.black, king: true },
      { at: [4, 5], stone: STONES.white, king: true },
      { at: [2, 3], stone: STONES.white, king: true },
    ]);
    const two = position([
      { at: [3, 2], stone: STONES.black, king: true },
      { at: [3, 4], stone: STONES.black, king: true },
      { at: [4, 5], stone: STONES.white, king: true },
    ]);
    expect(draughtsRead(two, STONES.black)).toBeGreaterThan(draughtsRead(three, STONES.black));
  });

  it("holds its own first row while the other side has a man that could crown", () => {
    const home = position([{ at: [0, 1], stone: STONES.black }, { at: [6, 1], stone: STONES.white }]);
    const out = position([{ at: [1, 2], stone: STONES.black }, { at: [6, 1], stone: STONES.white }]);
    expect(draughtsRead(home, STONES.black)).toBeGreaterThan(draughtsRead(out, STONES.black));
  });
});

describe("what it plays", () => {
  it("crowns a man that would otherwise be taken", () => {
    /*
     * White's king on (5,0) jumps the man on (6,1) into (7,2) next move unless
     * it goes now — and forward is the crowning row. Black has another man to
     * move instead, which is the move a player who could not see it would make.
     */
    const state = position([
      { at: [6, 1], stone: STONES.black },
      { at: [1, 2], stone: STONES.black },
      { at: [5, 0], stone: STONES.white, king: true },
    ]);
    const turn = expertTurn(state, DRAUGHTS_EXPERT, seededRandom(7), reading);
    expect(turn?.kind).toBe(MOVE_KINDS.move);
    expect(turn && "row" in turn ? turn.row : null).toBe(7);
  });

  it("does not step a man where it will be taken for nothing", () => {
    /*
     * Black's man on (3,2) can go to (4,3) or (4,1). White's man on (5,4)
     * jumps (4,3) into the square Black has just left, so only (4,1) is safe.
     */
    const state = position([
      { at: [3, 2], stone: STONES.black },
      { at: [0, 5], stone: STONES.black },
      { at: [5, 4], stone: STONES.white },
      { at: [7, 0], stone: STONES.white },
    ]);
    const turn = expertTurn(state, DRAUGHTS_EXPERT, seededRandom(7), reading);
    expect(turn && "from" in turn ? [turn.from?.row, turn.from?.col, turn.row, turn.col] : null).not.toEqual([3, 2, 4, 3]);
  });

  it("offers every legal move to the search, ordered, and nothing illegal", () => {
    const state = createGame({ variant: RULE_VARIANTS.checkers, size: 8 });
    // Seven men can step at the start of English checkers, each to one or two squares.
    const turns = draughtsTurns(state, 100);
    expect(turns.length).toBe(7);
    expect(turns.every((turn) => turn.kind === MOVE_KINDS.move)).toBe(true);
  });
});
