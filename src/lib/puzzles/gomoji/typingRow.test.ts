import { describe, expect, it } from "vitest";

import { backspace, choose, clearAt, emptyRow, lettersIn, step, typeLetter, wordOf, type TypingRow } from "./typingRow";

/** These letters typed into a row of five. */
function typed(letters: string): TypingRow {
  return [...letters].reduce(typeLetter, emptyRow(5));
}

describe("the row being typed", () => {
  it("fills from the left, and stops past the end rather than writing over the last letter", () => {
    const full = typed("crane");
    expect(full).toEqual({ slots: ["c", "r", "a", "n", "e"], at: 5 });
    expect(typeLetter(full, "x")).toBe(full);
    expect(wordOf(full)).toBe("crane");
  });

  it("replaces a letter that is tapped, and moves on to the next empty place", () => {
    const chosen = choose(typed("crane"), 2);
    expect(typeLetter(chosen, "o")).toEqual({ slots: ["c", "r", "o", "n", "e"], at: 5 });
    const holed = clearAt(choose(typed("cr"), 0));
    expect(typeLetter(holed, "b")).toEqual({ slots: ["b", "r", "", "", ""], at: 2 });
  });

  it("clears the chosen letter with Delete, Backspace or Space, and keeps the place chosen", () => {
    const chosen = choose(typed("crane"), 1);
    expect(backspace(chosen)).toEqual({ slots: ["c", "", "a", "n", "e"], at: 1 });
    expect(clearAt(chosen)).toEqual({ slots: ["c", "", "a", "n", "e"], at: 1 });
    expect(wordOf(clearAt(chosen))).toBeNull();
    expect(lettersIn(clearAt(chosen))).toBe(4);
  });

  it("takes back the letter before an empty place, as the published game does, and nothing at the start", () => {
    expect(backspace(typed("cra"))).toEqual({ slots: ["c", "r", "", "", ""], at: 2 });
    expect(backspace(typed("crane"))).toEqual({ slots: ["c", "r", "a", "n", ""], at: 4 });
    const start = emptyRow(5);
    expect(backspace(start)).toBe(start);
    expect(clearAt(typed("crane"))).toEqual(typed("crane"));
  });

  it("moves with the arrows and never leaves the row", () => {
    expect(step(emptyRow(5), -1).at).toBe(0);
    expect(step(typed("crane"), -1).at).toBe(4);
    expect(step(choose(emptyRow(5), 4), 1).at).toBe(4);
    expect(choose(emptyRow(5), 9).at).toBe(0);
  });
});
