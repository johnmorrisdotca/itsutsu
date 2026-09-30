import { describe, expect, it } from "vitest";

import { puzzleOutcome, puzzleSizeLabel } from "./puzzleOutcome";

describe("how a puzzle ended", () => {
  it("says a card game was won or given up, never found", () => {
    expect(puzzleOutcome("solitaire", true, false, { used: 131, allowed: 0, unit: "moves" })).toEqual({ words: "Won", mark: "success" });
    expect(puzzleOutcome("solitaire", false, false, { used: 40, allowed: 0, unit: "moves" })).toEqual({ words: "Given up", mark: "failure" });
    expect(puzzleOutcome("spider", false, true, null)).toEqual({ words: "Given up", mark: "failure" });
  });

  it("says a word was found, or its guesses ran out, or its clock did", () => {
    expect(puzzleOutcome("gomoji", true, false, { used: 3, allowed: 6 }).words).toBe("Found");
    expect(puzzleOutcome("gomoji", false, true, { used: 6, allowed: 6 })).toEqual({ words: "Out of guesses", mark: "failure" });
    expect(puzzleOutcome("gomoji", false, true, { used: 4, allowed: 6 }).words).toBe("Out of time");
    expect(puzzleOutcome("koushi", false, false, { used: 15, allowed: 15, unit: "swaps" }).words).toBe("Out of swaps");
  });

  it("says a grid was solved, ran out of time, or was given up", () => {
    expect(puzzleOutcome("numberPlace", true, true, null)).toEqual({ words: "Solved", mark: "success" });
    expect(puzzleOutcome("numberPlace", false, true, null).words).toBe("Out of time");
    expect(puzzleOutcome("numberPlace", false, false, null).words).toBe("Given up");
  });

  it("names each puzzle's size for what it is", () => {
    expect(puzzleSizeLabel("solitaire")).toBe("Draw");
    expect(puzzleSizeLabel("mahjong")).toBe("Layout");
    expect(puzzleSizeLabel("gomojiKana")).toBe("Length");
    expect(puzzleSizeLabel("numberPlace")).toBe("Size");
  });
});
