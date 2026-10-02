import { describe, expect, it } from "vitest";

import { LETTER_MS, revealAttrs } from "./wordReveal";

describe("a word's letters arriving in a replay", () => {
  it("comes in left to right and leaves right to left, the last to finish flagged", () => {
    const delays = (dir: "in" | "out") => Array.from({ length: 5 }, (_, at) => revealAttrs(dir, at, 5));
    const into = delays("in").map((each) => Number.parseInt(String(each.style["--reveal-delay" as keyof typeof each.style])));
    const out = delays("out").map((each) => Number.parseInt(String(each.style["--reveal-delay" as keyof typeof each.style])));
    expect(into).toEqual([...into].sort((a, b) => a - b));
    expect(out).toEqual([...out].sort((a, b) => b - a));
    expect(delays("in").map((each) => each.data["data-reveal-end"])).toEqual([undefined, undefined, undefined, undefined, "true"]);
    expect(delays("out").map((each) => each.data["data-reveal-end"])).toEqual(["true", undefined, undefined, undefined, undefined]);
  });

  it("is over well inside a step of Play, whatever the word's length", () => {
    for (const size of [1, 3, 5, 8, 12]) {
      const last = Math.max(...Array.from({ length: size }, (_, at) => Number.parseInt(String(revealAttrs("in", at, size).style["--reveal-delay" as never]))));
      expect(last + LETTER_MS).toBeLessThan(250);
    }
  });
});
