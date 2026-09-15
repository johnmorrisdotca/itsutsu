import { beforeEach, describe, expect, it, vi } from "vitest";

import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import type { GameState } from "@/lib/gomoku/gomoku.types";
import type { StalledDraw } from "@/lib/gomoku/rules/noProgress";

/**
 * A DRAW'S REASON IS ASKED IN THE BOARD'S ORDER.
 *
 * Each rule is the engine's, tested beside it; what is tested here is the order,
 * because a position can satisfy two of them and the card must give the reason the
 * board gives (`GameStatus`) — never a second account of the same game.
 */

const answers = {
  stalledDrawOf: null as StalledDraw | null,
  endedWithNoMoves: false,
  repeatedTooOften: false,
  endingRanOut: false,
  drawnByLength: false,
};

vi.mock("@/lib/gomoku/rules/noProgress", () => ({
  stalledDrawOf: () => answers.stalledDrawOf,
}));
vi.mock("@/lib/gomoku/rules/forcedPass", () => ({ endedWithNoMoves: () => answers.endedWithNoMoves }));
vi.mock("@/lib/gomoku/rules/checkersDraws", () => ({
  repeatedTooOften: () => answers.repeatedTooOften,
  endingRanOut: () => answers.endingRanOut,
}));
vi.mock("@/lib/gomoku/engine", () => ({ drawnByLength: () => answers.drawnByLength }));

const { drawReasonOf } = await import("./gameResult");

const drawn = (board: GameState["board"]) => ({ status: GAME_STATUS.draw, board }) as GameState;

beforeEach(() => {
  answers.stalledDrawOf = null;
  answers.endedWithNoMoves = false;
  answers.repeatedTooOften = false;
  answers.endingRanOut = false;
  answers.drawnByLength = false;
});

describe("why a draw is a draw", () => {
  it("asks each rule in turn, first match wins", () => {
    answers.stalledDrawOf = { measure: "taking", plies: 80 };
    answers.endedWithNoMoves = true;
    expect(drawReasonOf(drawn([null]))).toBe("noProgressTaking");
    answers.stalledDrawOf = null;
    expect(drawReasonOf(drawn([null]))).toBe("noMoves");
    answers.endedWithNoMoves = false;
    answers.repeatedTooOften = true;
    answers.endingRanOut = true;
    expect(drawReasonOf(drawn([null]))).toBe("repetition");
    answers.repeatedTooOften = false;
    expect(drawReasonOf(drawn([null]))).toBe("endgameCount");
    answers.endingRanOut = false;
    answers.drawnByLength = true;
    expect(drawReasonOf(drawn([null]))).toBe("length");
  });

  it("names the no-progress rule that drew a stalled game, one reason per measure", () => {
    answers.stalledDrawOf = { measure: "racing", plies: 400 };
    expect(drawReasonOf(drawn([null]))).toBe("noProgressRacing");
    answers.stalledDrawOf = { measure: "taking", plies: 80 };
    expect(drawReasonOf(drawn([null]))).toBe("noProgressTaking");
    answers.stalledDrawOf = { measure: "placing", plies: 4000 };
    expect(drawReasonOf(drawn([null]))).toBe("noProgressPlacing");
  });

  it("tells a line made by both at once from a full board, and says nothing for a position that is not drawn", () => {
    expect(drawReasonOf(drawn([null, "black"]))).toBe("bothLines");
    expect(drawReasonOf(drawn(["white", "black"]))).toBe("boardFull");
    expect(drawReasonOf({ status: GAME_STATUS.playing, board: [] } as unknown as GameState)).toBe("draw");
  });
});
