import { describe, expect, it } from "vitest";

import { shapeScore } from "./analysis";
import { createGame } from "./engine";
import { DIRECTIONS, GAME_STATUS, MOVE_KINDS, RULE_VARIANTS, VARIANT_SPECS } from "./gomoku.constants";
import { LineBoard, fitsLineBoard, sideOf } from "./lineBoard";
import { chooseTurn } from "./opponent";
import { boardScore } from "./opponentEval";
import { applyTurn } from "./opponentTurns";
import { candidatePoints } from "./threats";
import type { GameState, RuleVariant, Stone } from "./gomoku.types";

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** The most of `stone`'s stones in an open window through the empty point — counted cell by cell, the long way. */
function openCountTheLongWay(state: GameState, index: number, stone: Stone): number {
  const { size, winLength } = state.settings;
  const row = Math.floor(index / size);
  const col = index - row * size;
  let best = 0;
  for (const step of DIRECTIONS) {
    for (let start = -(winLength - 1); start <= 0; start += 1) {
      let own = 0;
      let open = true;
      for (let k = start; k < start + winLength; k += 1) {
        const r = row + step.row * k;
        const c = col + step.col * k;
        if (r < 0 || c < 0 || r >= size || c >= size) {
          open = false;
          break;
        }
        if (k === 0) continue;
        const cell = state.board[r * size + c];
        if (cell === stone) own += 1;
        else if (cell !== null) {
          open = false;
          break;
        }
      }
      if (open && own > best) best = own;
    }
  }
  return best;
}

/** Every reading the board keeps, against the function it stands in for. */
function expectSameReadings(board: LineBoard, state: GameState): void {
  const spec = VARIANT_SPECS[state.settings.variant];
  expect(board.toPlay).toBe(state.toPlay);
  expect(board.status).toBe(state.status);
  expect(board.cells).toEqual(state.board);
  for (const stone of ["black", "white"] as const) {
    expect(board.boardScore(stone)).toBe(boardScore(state, stone, spec));
  }
  const near = new Set(candidatePoints(state).map((point) => point.row * state.settings.size + point.col));
  for (let index = 0; index < state.board.length; index += 1) {
    if (state.moves.length > 0) expect(board.isCandidate(index)).toBe(near.has(index));
    if (state.board[index] !== null) continue;
    const point = board.pointAt(index);
    for (const stone of ["black", "white"] as const) {
      expect(board.shapes[sideOf(stone) * board.points + index]).toBe(shapeScore(state.board, state.settings, stone, point));
      const open = openCountTheLongWay(state, index, stone);
      expect(board.openCount(index, stone)).toBe(open);
      // The running counts agree with the count read from the codes.
      expect(board.fiveLines[sideOf(stone) * board.points + index] > 0).toBe(open >= state.settings.winLength - 1);
      expect(board.fourLines[sideOf(stone) * board.points + index] > 0).toBe(open >= state.settings.winLength - 2);
    }
  }
  // And the empty-point sums are the sums over the empty points.
  for (const stone of ["black", "white"] as const) {
    let fives = 0;
    let fours = 0;
    for (let index = 0; index < state.board.length; index += 1) {
      if (state.board[index] !== null) continue;
      fives += board.fiveLines[sideOf(stone) * board.points + index];
      fours += board.fourLines[sideOf(stone) * board.points + index];
    }
    expect(board.emptyFiveLines[sideOf(stone)]).toBe(fives);
    expect(board.emptyFourLines[sideOf(stone)]).toBe(fours);
  }
}

describe("a line board, edited in place", () => {
  const cases: Array<[RuleVariant, number]> = [
    [RULE_VARIANTS.freestyle, 15],
    [RULE_VARIANTS.standard, 15],
    [RULE_VARIANTS.renju, 15],
    [RULE_VARIANTS.omok, 15],
    [RULE_VARIANTS.freestyle, 9],
    [RULE_VARIANTS.freestyle, 19],
  ];

  for (const [variant, size] of cases) {
    it(`reads every position of a real ${variant} ${size}×${size} game exactly as the engine and the scorers do`, () => {
      const random = seeded(size * 31 + variant.length);
      let state = createGame({ variant, size } as never);
      // Asserted rather than skipped: a case that quietly did not apply would pass having checked nothing.
      expect(fitsLineBoard(state)).toBe(true);
      const board = new LineBoard(state);
      let checked = 0;
      while (state.status === GAME_STATUS.playing && state.moves.length < 60) {
        expectSameReadings(board, state);

        // Every candidate, laid and lifted: the same verdict as the engine's, and nothing left behind.
        const key = board.key();
        for (const point of candidatePoints(state)) {
          const index = point.row * size + point.col;
          const after = applyTurn(state, { kind: MOVE_KINDS.place, row: point.row, col: point.col });
          const laid = board.place(index);
          expect(laid).toBe(after !== state);
          if (!laid) continue;
          expect(board.status).toBe(after.status);
          expect(board.winner).toBe(after.winner);
          board.undo();
          checked += 1;
        }
        expect(board.key()).toBe(key);

        const turn = chooseTurn(state, "dan", random, { nodes: 200 });
        if (turn === null || turn.kind !== MOVE_KINDS.place) break;
        const next = applyTurn(state, turn);
        expect(board.place(turn.row * size + turn.col)).toBe(true);
        state = next;
      }
      expect(checked).toBeGreaterThan(100);
    }, 120_000);
  }

  it("takes back a whole line of stones to the board it started from", () => {
    const start = createGame({ variant: RULE_VARIANTS.freestyle, size: 15 } as never);
    const opened = applyTurn(start, { kind: MOVE_KINDS.place, row: 7, col: 7 });
    const board = new LineBoard(opened);
    const key = board.key();
    const scores = [board.boardScore("black"), board.shapes[board.points + 7 * 15 + 8]];
    for (const index of [7 * 15 + 8, 8 * 15 + 8, 6 * 15 + 6, 9 * 15 + 9, 5 * 15 + 5]) expect(board.place(index)).toBe(true);
    for (let k = 0; k < 5; k += 1) board.undo();
    expect(board.key()).toBe(key);
    expect([board.boardScore("black"), board.shapes[board.points + 7 * 15 + 8]]).toEqual(scores);
    expect(board.cells).toEqual(opened.board);
  });
});
