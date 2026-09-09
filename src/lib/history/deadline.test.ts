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

/**
 * A seat nobody is sitting in.
 *
 * A game posted for anyone to take showed "White must move by … · overdue"
 * with a live button to claim the turn, against a White who did not exist
 * yet. Worse than the nonsense on screen: nothing stopped the claim from
 * succeeding and filing a result against an empty chair.
 */
describe("a game still waiting for somebody to sit down", () => {
  const at = new Date("2026-09-09T12:00:00.000Z");

  it("runs no clock while a seat is still posted", () => {
    expect(
      deadlineFor({ moveTimeMs: 60_000, lastMoveAt: at, openSeat: "white" }),
    ).toBeNull();
  });

  it("runs no clock even when a deadline was already written down", () => {
    // createLiveGame writes a deadline the moment the game exists, before
    // anybody has taken the other seat.
    expect(
      deadlineFor({
        moveTimeMs: 60_000,
        lastMoveAt: at,
        deadlineAt: new Date("2026-09-09T12:01:00.000Z"),
        openSeat: "white",
      }),
    ).toBeNull();
  });

  it("starts the clock once the seat is taken", () => {
    expect(
      deadlineFor({ moveTimeMs: 60_000, lastMoveAt: at, openSeat: null })?.toISOString(),
    ).toBe("2026-09-09T12:01:00.000Z");
  });

  it("leaves a game that was never posted exactly as it was", () => {
    // Most games have no open seat at all, and nothing about them changes.
    expect(deadlineFor({ moveTimeMs: 60_000, lastMoveAt: at })?.toISOString()).toBe(
      "2026-09-09T12:01:00.000Z",
    );
  });
});
