import { describe, expect, it } from "vitest";

import { createGame, playMove } from "@/lib/gomoku/engine";
import { GAME_STATUS, MOVE_KINDS, OPENING_RULES, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameState } from "@/lib/gomoku/gomoku.types";
import { UNSETTLED, settledPosition, settledTurn } from "./settledTurn";

/**
 * The stored turn, and the three things it has to be able to say: whose move,
 * nobody's move, and nothing said.
 *
 * The cases that matter are not the ordinary ones. They are the pairs a
 * database can hold that no writer here would produce — a status this engine
 * has never heard of, a running game with nobody to move — because those are
 * what a wrong answer would come out of, and a wrong answer here shows the
 * wrong player's name beside a board.
 */

/** Plays a run of stones through the engine, so the state is a real one. */
function played(state: GameState, points: { row: number; col: number }[]): GameState {
  return points.reduce((s, point) => playMove(s, point, MOVE_KINDS.place, null), state);
}

describe("settledTurn", () => {
  it("names the colour to move in a running game", () => {
    const state = createGame({ size: 15, winLength: 5, variant: "freestyle" });
    expect(settledTurn(state)).toEqual({
      settledStatus: GAME_STATUS.playing,
      settledToPlay: STONES.black,
    });
  });

  it("names nobody once the game is over", () => {
    /*
     * A real five in a row rather than a hand-made state: what is stored has
     * to be what the engine actually settled on, and a literal would only
     * prove the function copies its argument.
     */
    const won = played(createGame({ size: 15, winLength: 5, variant: "freestyle" }), [
      { row: 7, col: 3 }, { row: 0, col: 0 },
      { row: 7, col: 4 }, { row: 1, col: 0 },
      { row: 7, col: 5 }, { row: 2, col: 0 },
      { row: 7, col: 6 }, { row: 3, col: 0 },
      { row: 7, col: 7 },
    ]);
    expect(won.status).toBe(GAME_STATUS.won);
    expect(settledTurn(won)).toEqual({ settledStatus: GAME_STATUS.won, settledToPlay: null });
  });

  it("keeps the same colour to move through a Connect6 turn", () => {
    /*
     * The case a move count cannot answer. Connect6 lays two stones a turn, so
     * after white's first stone of a turn it is STILL white to move with an
     * odd number of stones on the board — and one more makes it black with an
     * even number. Parity says the opposite of the truth in one of the two.
     */
    const start = createGame({ size: 19, winLength: 6, variant: "connect6" });
    const opening = played(start, [{ row: 9, col: 9 }]);
    const first = played(opening, [{ row: 9, col: 10 }]);
    expect(first.moves.length).toBe(2);
    expect(settledTurn(first).settledToPlay).toBe(STONES.white);

    const second = played(first, [{ row: 10, col: 10 }]);
    expect(second.moves.length).toBe(3);
    expect(settledTurn(second).settledToPlay).toBe(STONES.black);
  });

  it("reads the turn a swap opening decides, not the one white was asked for", () => {
    /*
     * A game set up for white to open under a protocol that puts black on move
     * one. The stored opener says white; the engine says black, and the engine
     * is what a seat is told. Nothing counting moves from the stored column
     * could get this right.
     */
    const swapped = createGame({
      size: 15,
      winLength: 5,
      variant: "freestyle",
      opening: OPENING_RULES.swap,
      firstPlayer: STONES.white,
    });
    expect(settledTurn(swapped).settledToPlay).toBe(STONES.black);
  });
});

describe("settledPosition", () => {
  it("says nothing when nothing has been written", () => {
    expect(settledPosition({ settledStatus: null, settledToPlay: null })).toBeNull();
  });

  it("says nothing for a status this engine does not know", () => {
    // Not "assume it is running": a row nobody here wrote is a row to replay.
    expect(settledPosition({ settledStatus: "abandoned", settledToPlay: STONES.black })).toBeNull();
  });

  it("says nothing for a running game with nobody to move", () => {
    // A pair settledTurn cannot produce, so it is not one to reason from.
    expect(settledPosition({ settledStatus: GAME_STATUS.playing, settledToPlay: null })).toBeNull();
  });

  it("says nothing for a colour that is not a stone", () => {
    expect(settledPosition({ settledStatus: GAME_STATUS.playing, settledToPlay: "blue" })).toBeNull();
  });

  it("reads a running game back", () => {
    expect(settledPosition({ settledStatus: GAME_STATUS.playing, settledToPlay: STONES.white })).toEqual({
      running: true,
      toPlay: STONES.white,
    });
  });

  it("reads an ended game back, whatever colour the row carries", () => {
    for (const status of [GAME_STATUS.won, GAME_STATUS.draw]) {
      expect(settledPosition({ settledStatus: status, settledToPlay: STONES.black })).toEqual({
        running: false,
        toPlay: null,
      });
    }
  });

  it("reads back exactly what settledTurn wrote, for every shape of state", () => {
    const states: GameState[] = [
      createGame({ size: 15, winLength: 5, variant: "freestyle" }),
      played(createGame({ size: 19, winLength: 6, variant: "connect6" }), [
        { row: 9, col: 9 }, { row: 9, col: 10 },
      ]),
      createGame({ size: 15, winLength: 5, variant: "freestyle", opening: OPENING_RULES.swap, firstPlayer: STONES.white }),
    ];
    for (const state of states) {
      const stored = settledTurn(state);
      expect(settledPosition(stored)).toEqual({ running: true, toPlay: state.toPlay });
    }
  });
});

describe("UNSETTLED", () => {
  it("is the pair that says nothing, and reads back as nothing", () => {
    expect(UNSETTLED).toEqual({ settledStatus: null, settledToPlay: null });
    expect(settledPosition(UNSETTLED)).toBeNull();
  });
});
