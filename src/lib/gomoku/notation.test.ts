import { describe, expect, it } from "vitest";
import { columnLetter, pointName, rowNumber } from "./notation";

describe("notation", () => {
  it("skips the letter I", () => {
    expect(columnLetter(0)).toBe("A");
    expect(columnLetter(7)).toBe("H");
    expect(columnLetter(8)).toBe("J");
  });

  it("numbers rows from the bottom", () => {
    expect(rowNumber(15, 14)).toBe(1);
    expect(rowNumber(15, 0)).toBe(15);
  });

  it("names the centre of a 15×15 board H8", () => {
    expect(pointName(15, { row: 7, col: 7 })).toBe("H8");
  });
});
