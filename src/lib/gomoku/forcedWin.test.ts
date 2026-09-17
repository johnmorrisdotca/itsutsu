import { describe, expect, it } from "vitest";

import { createGame, legalPoints } from "./engine";
import { findWinningLine } from "./rules/lines";
import { indexOf } from "./rules/board";
import { GAME_STATUS, MOVE_KINDS, RULE_VARIANTS, STONES } from "./gomoku.constants";
import { chooseTurn } from "./opponent";
import { applyTurn } from "./opponentTurns";
import { findsForcedWins, forcedBudget, forcedWinTurn } from "./forcedWin";
import type { GameState, RuleVariant, Stone } from "./gomoku.types";

type Cells = Array<[number, number]>;

/** Black and white stones laid alternately, black first, so the record is a real game. */
function position(black: Cells, white: Cells, variant: RuleVariant = RULE_VARIANTS.freestyle, size = 15): GameState {
  let state = createGame({ variant, size } as never);
  for (let at = 0; at < Math.max(black.length, white.length); at += 1) {
    for (const [row, col] of [black[at], white[at]].filter((one) => one !== undefined)) {
      const next = applyTurn(state, { kind: MOVE_KINDS.place, row, col });
      if (next === state) throw new Error(`the engine refused ${row},${col}`);
      state = next;
    }
  }
  return state;
}

/** Whether `stone`, to move, can make five right now. */
function fiveNow(state: GameState): boolean {
  for (const point of legalPoints(state)) {
    const board = state.board.slice();
    board[indexOf(state.settings.size, point)] = state.toPlay;
    if (findWinningLine(board, state.settings, point).length > 0) return true;
  }
  return false;
}

/**
 * An independent check of a claimed win, played out against EVERY reply the
 * defender has, not just the block the finder expects. Any reply that is not a
 * block must leave a five to make; any block must leave another win by fours.
 */
function holds(state: GameState, me: Stone, fours: number): boolean {
  if (fiveNow(state)) return true;
  if (fours === 0) return false;
  const turn = forcedWinTurn(state, forcedBudget({ nodes: 1_000_000 }));
  if (turn === null || turn.kind !== MOVE_KINDS.place) return false;
  const after = applyTurn(state, turn);
  if (after === state) return false;
  if (after.status !== GAME_STATUS.playing) return after.winner === me;
  for (const reply of legalPoints(after)) {
    const next = applyTurn(after, { kind: MOVE_KINDS.place, row: reply.row, col: reply.col });
    if (next === after) continue;
    if (next.status !== GAME_STATUS.playing) return false;
    if (!holds(next, me, fours - 1)) return false;
  }
  return true;
}

describe("a win by fours", () => {
  /*
   *   row 8:  W  B  B  B  .  A          A = (8,9) is a four; white must take (8,8)
   *   row 9:     W  B  B  B  C          C = (9,9) is then a four on row 9 AND on
   *   col 9:  A, C, (10,9), (11,9), W   column 9 — two completions, one stone
   */
  const black: Cells = [[8, 5], [8, 6], [8, 7], [9, 6], [9, 7], [9, 8], [10, 9], [11, 9]];
  const white: Cells = [[8, 4], [9, 5], [12, 9], [0, 0], [0, 3], [3, 0], [14, 14], [14, 11]];

  it("finds a chain the defender cannot get out of", () => {
    const state = position(black, white);
    expect(state.toPlay).toBe(STONES.black);
    expect(fiveNow(state)).toBe(false);
    const turn = forcedWinTurn(state, forcedBudget({ millis: 2_000 }));
    expect(turn).not.toBeNull();
    expect(holds(state, STONES.black, 6)).toBe(true);
  });

  it("is what the top grades play, and ahead of anything the search would prefer", () => {
    const state = position(black, white);
    const forced = forcedWinTurn(state, forcedBudget({ nodes: 1_000_000 }));
    expect(chooseTurn(state, "guoshou", () => 0.5, { nodes: 1_000_000 })).toEqual(forced);
  });

  it("says nothing while the defender has a five of their own to make", () => {
    // White has four in a row on row 0: black's fours force nothing, the block does.
    const state = position(black.slice(0, 5), [[8, 4], [0, 0], [0, 1], [0, 2], [0, 3]]);
    expect(state.toPlay).toBe(STONES.black);
    expect(forcedWinTurn(state, forcedBudget({ nodes: 1_000_000 }))).toBeNull();
  });

  it("claims nothing where a four has answers the finder does not know", () => {
    // Captures answer a four without taking its point; two stones a turn answer and attack at once.
    expect(findsForcedWins(createGame({ variant: RULE_VARIANTS.ninuki, size: 15 } as never))).toBe(false);
    expect(findsForcedWins(createGame({ variant: RULE_VARIANTS.connect6, size: 19 } as never))).toBe(false);
    expect(findsForcedWins(createGame({ variant: RULE_VARIANTS.dropFour } as never))).toBe(false);
  });

  it("never claims a win that does not hold, across real games in three rule sets", () => {
    let claimed = 0;
    for (const variant of [RULE_VARIANTS.freestyle, RULE_VARIANTS.standard, RULE_VARIANTS.renju]) {
      for (let game = 0; game < 6; game += 1) {
        let seed = 17 + game * 101 + variant.length;
        const random = () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed / 2 ** 32;
        };
        let state = createGame({ variant, size: 15 } as never);
        while (state.status === GAME_STATUS.playing && state.moves.length < 120) {
          if (findsForcedWins(state) && !fiveNow(state) && forcedWinTurn(state, forcedBudget({ nodes: 20_000 })) !== null) {
            claimed += 1;
            expect(holds(state, state.toPlay, 8), `${variant} game ${game} at move ${state.moves.length}`).toBe(true);
            break;
          }
          const turn = chooseTurn(state, game % 2 === 0 ? "kyu" : "razryad", random, { nodes: 300 });
          if (turn === null) break;
          state = applyTurn(state, turn);
        }
      }
    }
    // The check means nothing if the games never produced a claim to check.
    expect(claimed).toBeGreaterThan(5);
  }, 240_000);
});
