import { beforeEach, describe, expect, it, vi } from "vitest";

import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import type { GameState } from "@/lib/gomoku/gomoku.types";

/**
 * A DRAW'S REASON IS ASKED IN THE BOARD'S ORDER.
 *
 * Each rule is the engine's, tested beside it; what is tested here is the order,
 * because a position can satisfy two of them and the card must give the reason the
 * board gives (`GameStatus`) — never a second account of the same game.
 */

const answers = {
  couldNotFinish: false,
  endedWithNoMoves: false,
  repeatedTooOften: false,
  endingRanOut: false,
  drawnByLength: false,
};

vi.mock("@/lib/gomoku/rules/noProgress", () => ({ couldNotFinish: () => answers.couldNotFinish }));
vi.mock("@/lib/gomoku/rules/forcedPass", () => ({ endedWithNoMoves: () => answers.endedWithNoMoves }));
vi.mock("@/lib/gomoku/rules/checkersDraws", () => ({
  repeatedTooOften: () => answers.repeatedTooOften,
  endingRanOut: () => answers.endingRanOut,
}));
vi.mock("@/lib/gomoku/engine", () => ({ drawnByLength: () => answers.drawnByLength }));

const { drawReasonOf } = await import("./gameResult");

const drawn = (board: GameState["board"]) => ({ status: GAME_STATUS.draw, board }) as GameState;

beforeEach(() => {
  for (const key of Object.keys(answers) as (keyof typeof answers)[]) answers[key] = false;
});

describe("why a draw is a draw", () => {
  it("asks each rule in turn, first match wins", () => {
    answers.couldNotFinish = true;
    answers.endedWithNoMoves = true;
    expect(drawReasonOf(drawn([null]))).toBe("unfinishable");
    answers.couldNotFinish = false;
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

  it("tells a line made by both at once from a full board, and says nothing for a position that is not drawn", () => {
    expect(drawReasonOf(drawn([null, "black"]))).toBe("bothLines");
    expect(drawReasonOf(drawn(["white", "black"]))).toBe("boardFull");
    expect(drawReasonOf({ status: GAME_STATUS.playing, board: [] } as unknown as GameState)).toBe("draw");
  });
});
