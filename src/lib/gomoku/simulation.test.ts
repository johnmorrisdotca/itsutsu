import { describe, expect, it } from "vitest";

import {
  createGame,
  emptyPoints,
  forbiddenPoints,
  playMove,
  pointOf,
  replayMoves,
} from "./engine";
import type { Stone } from "./gomoku.types";
import { GAME_STATUS, RULE_VARIANTS } from "./gomoku.constants";
import { rulesFor } from "./rules/handicap";
import { bruteForceWinner, playOut } from "./simulation.support";

describe("simulated games", () => {
  const GAMES = 120;

  it(`plays ${GAMES} full games on a 9x9 board without breaking an invariant`, () => {
    const outcomes = { won: 0, draw: 0, playing: 0 };
    for (let seed = 1; seed <= GAMES; seed += 1) {
      const final = playOut({ size: 9 }, seed);
      outcomes[final.status] += 1;
    }
    // Random play on a small board should reach a real end almost every time.
    expect(outcomes.won + outcomes.draw).toBe(GAMES);
  });

  it("plays full games on every board size", () => {
    for (const size of [9, 13, 15, 19]) {
      for (let seed = 1; seed <= 8; seed += 1) {
        playOut({ size }, seed * 31 + size);
      }
    }
  });

  it("plays full games under every rule variant", () => {
    for (const variant of Object.values(RULE_VARIANTS)) {
      for (let seed = 1; seed <= 25; seed += 1) {
        playOut({ size: 9, variant }, seed * 7 + variant.length);
      }
    }
  });

  it("plays full games with the star points sealed", () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const final = playOut({ size: 9, obstacles: "hoshi" }, seed * 13);
      // Obstacles are never played on and never disappear.
      expect(final.board.filter((cell) => cell === "blocked")).toHaveLength(4);
    }
  });

  it("plays full games with undo switched off", () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      playOut({ size: 9, allowUndo: false }, seed * 17);
    }
  });

  it("never lets a standard game be won by an overline", () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const final = playOut({ size: 9, variant: RULE_VARIANTS.standard }, seed * 3);
      if (final.status !== GAME_STATUS.won) continue;

      // The winning line must be exactly five, never six or more.
      expect(final.winningLine).toHaveLength(final.settings.winLength);
    }
  });

  it("never gives a colour more stones in a turn than its variant allows", () => {
    for (const variant of Object.values(RULE_VARIANTS)) {
      // The flipping games pass a stuck colour by, so one colour may move twice; restated by hand.
      if (["reversi", "classicReversi", "antiReversi", "miniReversi"].includes(variant)) continue;
      for (let seed = 1; seed <= 12; seed += 1) {
        const final = playOut({ size: 9, variant }, seed * 11 + variant.length);

        // Walk the record counting each unbroken run of one colour.
        let run = 0;
        let previous: Stone | null = null;
        for (const move of final.moves) {
          // Identity is the mover, which differs from the colour where the mover chooses it.
          const mover = move.by ?? move.stone;
          run = mover === previous ? run + 1 : 1;
          previous = mover;
          expect(
            run,
            `${variant} seed ${seed}: ${run} stones in one turn`,
          ).toBeLessThanOrEqual(rulesFor(final.settings, mover).stonesPerTurn);
        }
      }
    }
  });

  it("can replay every game from its move list alone", () => {
    for (const variant of Object.values(RULE_VARIANTS)) {
      for (let seed = 1; seed <= 10; seed += 1) {
        const final = playOut({ size: 9, variant }, seed * 19 + variant.length);

        /*
         * A stored game is its settings plus its moves, nothing else — that is
         * the whole reason history stores a move list and never a board. If a
         * replay could diverge, a saved game and the game that was played
         * would be different games.
         */
        const start = createGame({ ...final.settings, firstPlayer: final.opener });
        const timeline = replayMoves(
          start,
          final.moves.map((move) => ({
            row: move.row,
            col: move.col,
            kind: move.kind,
            from: move.from,
            twist: move.twist,
            cells: move.cells,
            // The colour placed, which the replay needs where the mover chose it.
            stone: move.stone,
          })),
          final.opening.choices,
        );
        const replayed = timeline[timeline.length - 1];

        expect(replayed.board, `${variant} seed ${seed}: replayed board differs`)
          .toEqual(final.board);
        expect(replayed.status).toBe(final.status);
        expect(replayed.winner).toBe(final.winner);
        expect(replayed.captures).toEqual(final.captures);
      }
    }
  });

  it("refuses every illegal move by returning the very same state", () => {
    for (const variant of Object.values(RULE_VARIANTS)) {
      const state = playOut({ size: 9, variant }, 909 + variant.length);
      const size = state.settings.size;

      // Off the board, and on a point that is already taken.
      for (const point of [
        { row: -1, col: 0 },
        { row: 0, col: size },
        { row: size, col: size },
      ]) {
        expect(playMove(state, point), `${variant}: off-board move was accepted`)
          .toBe(state);
      }
      const taken = state.moves[0];
      if (taken !== undefined) {
        expect(playMove(state, { row: taken.row, col: taken.col })).toBe(state);
      }
    }
  });

  it("only ever forbids empty points, and only where a variant says so", () => {
    for (const variant of Object.values(RULE_VARIANTS)) {
      const state = playOut({ size: 9, variant }, 555 + variant.length);
      const empties = new Set(
        emptyPoints(state).map((point) => `${point.row},${point.col}`),
      );

      for (const point of forbiddenPoints(state)) {
        expect(
          empties.has(`${point.row},${point.col}`),
          `${variant}: forbade a point that is not empty`,
        ).toBe(true);
      }
    }
  });

  it("reports the same result for the same seed every time", () => {
    const once = playOut({ size: 9 }, 4242);
    const twice = playOut({ size: 9 }, 4242);
    expect(twice.moves).toEqual(once.moves);
    expect(twice.winner).toBe(once.winner);
  });
});

/** A sanity check on the checker itself, so a silent no-op cannot pass. */
describe("the brute force scanner", () => {
  it("finds a win the engine would also find", () => {
    let state = createGame({ size: 9 });
    for (const [row, col] of [[4, 0], [0, 0], [4, 1], [0, 1], [4, 2], [0, 2], [4, 3], [0, 3], [4, 4]]) {
      state = playMove(state, { row, col });
    }
    expect(state.winner).toBe("black");
    expect(bruteForceWinner(state.board, state.settings)).toBe("black");
  });

  it("finds nothing on an empty board", () => {
    const game = createGame({ size: 9 });
    expect(bruteForceWinner(game.board, game.settings)).toBeNull();
    expect(pointOf(9, 0)).toEqual({ row: 0, col: 0 });
  });
});
