import { describe, expect, it } from "vitest";

import { colourDistance, contrastRatio, leastColourDistance } from "./colourVision";

describe("colour distance as another reader sees it", () => {
  it("a colour is no distance from itself, and black and white are 100 apart in Lab", () => {
    expect(colourDistance("#79ac8c", "#79ac8c", "deuteranopia")).toBe(0);
    expect(colourDistance("#000000", "#ffffff", null)).toBeCloseTo(100, 0);
  });

  it("reads the two pairs of John's ticket as it did: the dark theme's green against grey, and orange against yellow, were close", () => {
    // --moss, --muted, --ochre and the kana yellow as the dark theme had them.
    expect(leastColourDistance("#93ab88", "#9b958c")).toBeGreaterThan(9);
    expect(leastColourDistance("#93ab88", "#9b958c")).toBeLessThan(11);
    expect(leastColourDistance("#d9aa5a", "#e3c24f")).toBeGreaterThan(8);
    expect(leastColourDistance("#d9aa5a", "#e3c24f")).toBeLessThan(10);
  });

  it("is the same whichever way round the pair is given", () => {
    expect(leastColourDistance("#d68141", "#ffdb42")).toBeCloseTo(leastColourDistance("#ffdb42", "#d68141"), 9);
  });

  it("measures WCAG contrast: white on black is 21 and a colour on itself is 1", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#79ac8c", "#79ac8c")).toBe(1);
  });

  it("refuses a colour it cannot read, rather than measuring black", () => {
    expect(() => colourDistance("green", "#ffffff", null)).toThrow("not a #rrggbb colour");
  });
});
