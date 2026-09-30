import { describe, expect, it } from "vitest";

import { RESULT_MARK_LOOK } from "./resultMark.constants";
import { markOfOutcome, markOfSeat, seatResult } from "./resultMarks";

describe("the result marks", () => {
  it("are three different shapes, not three colours of one", () => {
    const looks = Object.values(RESULT_MARK_LOOK);
    expect(new Set(looks.map((look) => look.path)).size).toBe(3);
    expect(new Set(looks.map((look) => look.name))).toEqual(new Set(["tick", "cross", "bar"]));
  });

  it("tick a win, cross a loss, and bar a draw", () => {
    expect(markOfOutcome("won")).toBe("success");
    expect(markOfOutcome("decided")).toBe("success");
    expect(markOfOutcome("lost")).toBe("failure");
    expect(markOfOutcome("draw")).toBe("other");
  });

  it("tell one seat's side of a game, and bar one not over or won by nobody", () => {
    expect(markOfSeat("black", "black", true)).toBe("success");
    expect(markOfSeat("white", "black", true)).toBe("failure");
    expect(markOfSeat(null, "black", true)).toBe("other");
    expect(markOfSeat("black", "black", false)).toBe("other");
  });

  it("tell a filed game to the reader who sat in it, and name the colour where nobody did", () => {
    expect(seatResult("black", "black", "Black won")).toEqual({ mark: "success", words: "You won" });
    expect(seatResult("white", "black", "White won")).toEqual({ mark: "failure", words: "You lost" });
    expect(seatResult("white", null, "White won")).toEqual({ mark: "success", words: "White won" });
    expect(seatResult("draw", "black", "Draw")).toEqual({ mark: "other", words: "Draw" });
    expect(seatResult("abandoned", null, "Unfinished")).toEqual({ mark: "other", words: "Unfinished" });
  });
});
