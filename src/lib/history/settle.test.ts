import { describe, expect, it } from "vitest";

import { createGame } from "@/lib/gomoku/engine";
import { GAME_STATUS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameDetail } from "./gameHistory.types";
import { settleFromRecord } from "./settle";

/**
 * Some games end by something that is not a move — a resignation, a strict
 * timeout — so the move list alone shows them as still being played. The
 * record closes them; these say it may only ever close, never decide.
 */
const playing = () => createGame({ variant: "freestyle", size: 9 });

function record(over: Partial<GameDetail>): GameDetail {
  return { status: "finished", result: "win", winner: STONES.white, ...over } as GameDetail;
}

describe("settleFromRecord", () => {
  it("closes a game the record says somebody resigned", () => {
    const settled = settleFromRecord(playing(), record({}));
    expect(settled.status).toBe(GAME_STATUS.won);
    expect(settled.winner).toBe(STONES.white);
  });

  it("closes a drawn one as a draw", () => {
    expect(settleFromRecord(playing(), record({ result: "draw" })).status).toBe(GAME_STATUS.draw);
  });

  it("leaves a game still being played alone", () => {
    const state = playing();
    expect(settleFromRecord(state, record({ status: "active" }))).toBe(state);
  });

  it("never overrules a result the rules produced", () => {
    // The engine has the last word on anything it can decide for itself: the
    // record only closes games it has left open.
    const won = { ...playing(), status: GAME_STATUS.won, winner: STONES.black } as ReturnType<typeof playing>;
    expect(settleFromRecord(won, record({ winner: STONES.white }))).toBe(won);
  });

  it("leaves it open when the record names no winner", () => {
    // An abandoned game has no result to anybody's credit.
    const state = playing();
    expect(settleFromRecord(state, record({ result: "abandoned", winner: null }))).toBe(state);
  });

  it("leaves the input untouched, as everything about a game state does", () => {
    const state = playing();
    settleFromRecord(state, record({}));
    expect(state.status).toBe(GAME_STATUS.playing);
  });
});
