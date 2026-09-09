import { describe, expect, it } from "vitest";

import { addUp, countText, figuresOf, recordText, scoreOf, winRateText } from "./figures";

describe("figures worked out from a won-lost-drawn record", () => {
  it("counts every game played, draws included", () => {
    expect(figuresOf({ won: 2077, lost: 1355, drawn: 8 }).played).toBe(3440);
  });

  it("counts a draw as half a game won, the way the ratings here score one", () => {
    // Two won, two lost, two drawn is dead level however it is counted.
    expect(figuresOf({ won: 2, lost: 2, drawn: 2 }).winRate).toBe(0.5);
    // A record that is nothing but draws is level too, which the other
    // definition — wins over decisive games — cannot say at all.
    expect(figuresOf({ won: 0, lost: 0, drawn: 4 }).winRate).toBe(0.5);
  });

  it("agrees with what a game is worth to the ratings", () => {
    // The two statements of "a draw is a half" are kept in step here rather
    // than by anybody remembering: a rate is the mean of the scores.
    const results = ["won", "drawn", "lost", "lost"] as const;
    const mean = results.reduce((sum, one) => sum + scoreOf(one), 0) / results.length;
    expect(figuresOf({ won: 1, lost: 2, drawn: 1 }).winRate).toBe(mean);
  });

  it("has no win rate for a record with no games in it", () => {
    expect(figuresOf({ won: 0, lost: 0, drawn: 0 }).winRate).toBeNull();
    expect(winRateText(null)).toBe("—");
  });

  it("prints a rate to one decimal", () => {
    expect(winRateText(0.605)).toBe("60.5%");
    expect(winRateText(1)).toBe("100.0%");
    expect(winRateText(0)).toBe("0.0%");
  });

  it("separates the thousands, because these records run to thousands", () => {
    expect(countText(3440)).toBe("3,440");
    expect(countText(8)).toBe("8");
  });

  it("writes a record the way every table here writes one", () => {
    expect(recordText({ won: 2077, lost: 1355, drawn: 8 })).toBe("2,077W · 1,355L · 8D");
  });
});

describe("adding records up", () => {
  it("sums each column and nothing else", () => {
    expect(addUp([
      { won: 1, lost: 2, drawn: 3 },
      { won: 10, lost: 20, drawn: 30 },
    ])).toEqual({ won: 11, lost: 22, drawn: 33 });
  });

  it("is zero for nothing at all", () => {
    expect(addUp([])).toEqual({ won: 0, lost: 0, drawn: 0 });
  });
});
