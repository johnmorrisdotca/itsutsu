import { describe, expect, it } from "vitest";

import { cellHint, rowHint } from "./hintCell";

describe("where a hint goes", () => {
  // A 3×3 answer, row-major.
  const answer = [1, 2, 3, 2, 3, 1, 3, 1, 2];

  it("fills the cell with the most right cells in its row and column, never a printed one", () => {
    const current = [1, 2, 0, 0, 0, 0, 3, 0, 0];
    // Cell 2 (row 0, col 2) has two right in its row and none in its column; cell 0 is printed and right anyway.
    expect(cellHint(3, (index) => index === 0, current, answer)).toBe(2);
  });

  it("fixes a wrong cell as readily as an empty one", () => {
    const current = [1, 2, 3, 2, 3, 1, 3, 2, 2];
    expect(cellHint(3, () => false, current, answer)).toBe(7);
  });

  it("says nothing when every cell is right", () => {
    expect(cellHint(3, () => false, answer, answer)).toBeNull();
  });

  it("gives Hidden Stones the row with most ruled out", () => {
    // Only row 1 is not right: it is the hint whatever the crosses say.
    expect(rowHint(3, [0, -1, 1], [0, 2, 1], (row) => [0, 1, 2][row]!)).toBe(1);
    // Rows 1 and 2 are not right; row 2 has more ruled out.
    expect(rowHint(3, [0, -1, -1], [0, 2, 1], (row) => [0, 1, 2][row]!)).toBe(2);
    expect(rowHint(2, [0, 1], [0, 1], () => 0)).toBeNull();
  });
});
