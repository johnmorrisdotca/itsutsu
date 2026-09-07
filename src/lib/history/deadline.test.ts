import { describe, expect, it } from "vitest";
import { forfeitTurn, createGame, playMove } from "@/lib/gomoku/engine";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import { deadlineFor, describeMoveTime, describeRemaining, isOverdue } from "./deadline";

describe("deadlines", () => {
  const at = new Date("2026-09-07T10:00:00Z");

  it("runs from the last move for the limit, and is null without a clock", () => {
    expect(deadlineFor({ moveTimeMs: null, lastMoveAt: at })).toBeNull();
    expect(deadlineFor({ moveTimeMs: 60_000, lastMoveAt: null })).toBeNull();
    expect(deadlineFor({ moveTimeMs: 60_000, lastMoveAt: at })?.toISOString()).toBe(
      "2026-09-07T10:01:00.000Z",
    );
    expect(deadlineFor({ moveTimeMs: 60_000, lastMoveAt: at.toISOString() })?.getTime()).toBe(
      at.getTime() + 60_000,
    );
  });

  it("is overdue only once the moment has passed", () => {
    const deadline = deadlineFor({ moveTimeMs: 60_000, lastMoveAt: at });
    expect(isOverdue(deadline, new Date(at.getTime() + 59_000))).toBe(false);
    expect(isOverdue(deadline, new Date(at.getTime() + 60_000))).toBe(true);
    expect(isOverdue(null, at)).toBe(false);
  });

  it("describes limits and remaining time in words", () => {
    expect(describeMoveTime(null)).toBe("No clock");
    expect(describeMoveTime(5 * 60_000)).toBe("5 minutes a move");
    expect(describeMoveTime(60 * 60_000)).toBe("1 hour a move");
    expect(describeMoveTime(3 * 24 * 60 * 60_000)).toBe("3 days a move");
    const deadline = new Date(at.getTime() + 2 * 60 * 60_000 + 5 * 60_000);
    expect(describeRemaining(deadline, at)).toBe("2h 05m");
    expect(describeRemaining(new Date(at.getTime() + 45_000), at)).toBe("45s");
    expect(describeRemaining(at, new Date(at.getTime() + 1))).toBe("overdue");
  });
});

describe("forfeiting a turn", () => {
  it("passes the turn on the record without touching the board", () => {
    const game = playMove(createGame(), { row: 7, col: 7 });
    const forfeited = forfeitTurn(game);
    expect(forfeited.board).toEqual(game.board);
    expect(forfeited.toPlay).toBe(STONES.black);
    expect(forfeited.moves[forfeited.moves.length - 1]).toMatchObject({ kind: "pass", stone: STONES.white });
    // Two forfeits in a row do not end the game; the forfeit count does that.
    expect(forfeitTurn(forfeitTurn(forfeited)).status).toBe("playing");
  });

  it("does nothing while a colour choice or a finished game is pending", () => {
    const game = createGame({ opening: "swap" });
    const three = [ { row: 7, col: 7 }, { row: 7, col: 8 }, { row: 8, col: 8 } ].reduce(
      (state, point) => playMove(state, point),
      game,
    );
    expect(forfeitTurn(three)).toBe(three);
  });
});
