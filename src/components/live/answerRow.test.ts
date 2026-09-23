import { describe, expect, it } from "vitest";

import { answerColumns, answerPlace, answerRowFoot } from "./answerRow";

/*
 * John, 2026-09-22: "Handicap, when clicked moves to 2nd row! Should keep that
 * column!!!" The whole promise is that a button's place does not depend on
 * whether anything is open — which is a property of these numbers alone.
 */
describe("a row of answers", () => {
  it("puts each button in its own column on the first line", () => {
    expect([0, 1, 2].map((index) => answerPlace(index, 3).head)).toEqual([
      { gridColumn: "1", gridRow: "1" },
      { gridColumn: "2", gridRow: "1" },
      { gridColumn: "3", gridRow: "1" },
    ]);
    expect(answerColumns(2)).toEqual({ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" });
  });

  it("opens every answer's choices on a line of its own, under all the buttons", () => {
    expect(answerPlace(0, 2).body).toEqual({ gridColumn: "1 / -1", gridRow: "2" });
    expect(answerPlace(1, 2).body).toEqual({ gridColumn: "1 / -1", gridRow: "3" });
    expect(answerRowFoot(2)).toEqual({ gridColumn: "1 / -1", gridRow: "4" });
  });

  it("wraps past three across, and still keeps the choices below every button", () => {
    expect(answerPlace(3, 5).head).toEqual({ gridColumn: "1", gridRow: "2" });
    expect(answerPlace(0, 5).body.gridRow).toBe("3");
    expect(answerPlace(4, 5).section).toEqual({ gridColumn: "1 / -1", gridRow: "1 / span 7" });
  });
});
