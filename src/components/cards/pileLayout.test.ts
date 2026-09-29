import { describe, expect, it } from "vitest";

import { freshDeck } from "@/lib/cards/deck";

import { DEFAULT_STEP, LEAST_FACE_UP, pileLayout } from "./pileLayout";

const deck = freshDeck();
const pile = (down: number, up: number) => [
  ...deck.slice(0, down).map((card) => ({ card, faceUp: false })),
  ...deck.slice(down, down + up).map((card) => ({ card, faceUp: true })),
];

describe("a pile's layout", () => {
  it("squares a stack up, whatever it holds", () => {
    expect(pileLayout({ cards: pile(3, 2), spread: "stack" })).toEqual({ offsets: [0, 0, 0, 0, 0], extent: 0 });
  });

  it("overlaps a column by a sliver under a face-down card and a strip under a face-up one", () => {
    const { offsets, extent } = pileLayout({ cards: pile(2, 3), spread: "down" });
    const { faceDown, faceUp } = DEFAULT_STEP;
    expect(offsets).toEqual([0, faceDown, 2 * faceDown, 2 * faceDown + faceUp, 2 * faceDown + 2 * faceUp].map((x) => expect.closeTo(x, 9)));
    expect(extent).toBeCloseTo(2 * faceDown + 2 * faceUp, 9);
  });

  it("squeezes a long column into its room, face-down cards first, never covering a rank", () => {
    const long = pile(6, 12);
    const loose = pileLayout({ cards: long, spread: "down" });
    const tight = pileLayout({ cards: long, spread: "down", room: 4 });
    expect(loose.extent).toBeGreaterThan(3);
    expect(tight.extent).toBeLessThan(loose.extent);
    const upSteps = tight.offsets.slice(7).map((at, i) => at - tight.offsets[6 + i]);
    for (const gap of upSteps) expect(gap).toBeGreaterThanOrEqual(LEAST_FACE_UP - 1e-9);
    // A short column is left as it is.
    expect(pileLayout({ cards: pile(1, 1), spread: "down", room: 4 })).toEqual(pileLayout({ cards: pile(1, 1), spread: "down" }));
  });

  it("spreads only the last few of a waste, and keeps its width whatever it holds", () => {
    const { offsets, extent } = pileLayout({ cards: pile(0, 5), spread: "right", showLast: 3 });
    expect(offsets).toEqual([0, 0, 0, DEFAULT_STEP.faceUp, 2 * DEFAULT_STEP.faceUp]);
    expect(extent).toBeCloseTo(2 * DEFAULT_STEP.faceUp, 9);
    expect(pileLayout({ cards: pile(0, 1), spread: "right", showLast: 3 }).extent).toBeCloseTo(extent, 9);
  });
});
