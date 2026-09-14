import { describe, expect, it } from "vitest";

import { GAME_STATUS, STONES, WIN_REASONS } from "@/lib/gomoku/gomoku.constants";
import type { Cell, GameState } from "@/lib/gomoku/gomoku.types";
import { replayGame } from "@/lib/gomoku/replay";
import { scoreArea } from "@/lib/gomoku/rules/go";

import { gameResultFacts } from "./gameResult";

/**
 * HOW A FINISHED GAME CAME OUT, AND WHY — one case per kind of ending.
 *
 * The record says who won and the engine says why, so each case hands over the
 * stored result and the position the moves replay to, the way the page does.
 */

type Final = Pick<GameState, "status" | "winner" | "winBy" | "captures" | "board" | "settings">;

/** A won position with only the parts a win is read from; a draw is replayed for real below. */
function final(over: Partial<Final> = {}): GameState {
  return {
    status: GAME_STATUS.won,
    winner: STONES.black,
    winBy: WIN_REASONS.line,
    captures: { black: 0, white: 0 },
    board: [],
    settings: { size: 3 } as GameState["settings"],
    ...over,
  } as GameState;
}

const none = { black: 0, white: 0 };

describe("who it is said to", () => {
  it("tells the winner they won and the loser they lost", () => {
    expect(gameResultFacts({ result: "black", final: final(), forfeits: none, seat: STONES.black, hotSeat: false })).toEqual({
      outcome: "won",
      winner: STONES.black,
      reason: WIN_REASONS.line,
      score: null,
    });
    expect(
      gameResultFacts({ result: "black", final: final(), forfeits: none, seat: STONES.white, hotSeat: false })?.outcome,
    ).toBe("lost");
  });

  it("says a game at one screen by colour, since both people there are you", () => {
    expect(
      gameResultFacts({ result: "white", final: final({ winner: STONES.white }), forfeits: none, seat: STONES.black, hotSeat: true })
        ?.outcome,
    ).toBe("decided");
  });

  it("is a draw for nobody, with the engine's reason, and nothing at all for a game with no result", () => {
    // A real game of noughts and crosses that fills the board with nobody winning.
    const catsGame = replayGame({
      size: 3,
      winLength: 3,
      variant: "tictactoe",
      obstacles: "none",
      opener: STONES.black,
      moveTimeMs: null,
      moves: [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 2, col: 0 },
        { row: 1, col: 0 },
        { row: 1, col: 2 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
      ],
    });
    expect(catsGame.status).toBe(GAME_STATUS.draw);
    const draw = gameResultFacts({ result: "draw", final: catsGame, forfeits: none, seat: STONES.black, hotSeat: false });
    expect(draw).toEqual({ outcome: "draw", winner: null, reason: "boardFull", score: null });

    // A draw on the record that the replay does not read as one is said plainly, never given a reason.
    const unexplained = gameResultFacts({
      result: "draw",
      final: final({ status: GAME_STATUS.playing, winner: null, winBy: null }),
      forfeits: none,
      seat: STONES.black,
      hotSeat: false,
    });
    expect(unexplained?.reason).toBe("draw");
    expect(gameResultFacts({ result: "abandoned", final: final(), forfeits: none, seat: STONES.black, hotSeat: false })).toBeNull();
  });
});

describe("why", () => {
  it("takes the engine's reason where the replay reaches the same verdict", () => {
    for (const reason of [WIN_REASONS.line, WIN_REASONS.connection, WIN_REASONS.camp, WIN_REASONS.blocked]) {
      expect(
        gameResultFacts({ result: "black", final: final({ winBy: reason }), forfeits: none, seat: STONES.black, hotSeat: false })
          ?.reason,
      ).toBe(reason);
    }
  });

  it("reads a game closed with no move as a resignation, and as time where the loser's forfeit was counted", () => {
    const running = final({ status: GAME_STATUS.playing, winner: null, winBy: null });
    expect(
      gameResultFacts({ result: "white", final: running, forfeits: none, seat: STONES.white, hotSeat: false })?.reason,
    ).toBe(WIN_REASONS.resign);
    expect(
      gameResultFacts({ result: "white", final: running, forfeits: { black: 1, white: 0 }, seat: STONES.white, hotSeat: false })
        ?.reason,
    ).toBe(WIN_REASONS.time);
  });

  it("never takes a reason from a replay that disagrees with the record about who won", () => {
    const disagrees = final({ winner: STONES.white, winBy: WIN_REASONS.line });
    expect(
      gameResultFacts({ result: "black", final: disagrees, forfeits: none, seat: STONES.black, hotSeat: false })?.reason,
    ).toBe(WIN_REASONS.resign);
  });
});

describe("the score, where the game keeps one", () => {
  it("counts the pairs captured in a capture game", () => {
    const facts = gameResultFacts({
      result: "black",
      final: final({ winBy: WIN_REASONS.captures, captures: { black: 5, white: 2 } }),
      forfeits: none,
      seat: STONES.black,
      hotSeat: false,
    });
    expect(facts?.score).toEqual({ kind: "captures", black: 5, white: 2 });
  });

  it("counts the discs of a game decided on the count", () => {
    const board: Cell[] = ["black", "black", "white", null, "black", "white", "black", null, null];
    const facts = gameResultFacts({
      result: "black",
      final: final({ winBy: WIN_REASONS.count, board }),
      forfeits: none,
      seat: STONES.white,
      hotSeat: false,
    });
    expect(facts?.score).toEqual({ kind: "discs", black: 4, white: 2 });
  });

  it("measures the area of a territory game", () => {
    const board: Cell[] = ["black", null, "white", "black", null, "white", "black", null, "white"];
    const facts = gameResultFacts({
      result: "black",
      final: final({ winBy: WIN_REASONS.territory, board }),
      forfeits: none,
      seat: STONES.black,
      hotSeat: false,
    });
    expect(facts?.score).toEqual({ kind: "area", ...scoreArea(board, 3) });
  });

  it("says no score for a game that keeps none, rather than a 0–0", () => {
    expect(
      gameResultFacts({ result: "black", final: final(), forfeits: none, seat: STONES.black, hotSeat: false })?.score,
    ).toBeNull();
  });
});
