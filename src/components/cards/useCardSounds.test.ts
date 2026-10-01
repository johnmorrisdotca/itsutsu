import { describe, expect, it } from "vitest";

import { cardSoundFor } from "./useCardSounds";

describe("cardSoundFor", () => {
  it("shuffles and deals when a hand is dealt, up to thirteen cards' sound", () => {
    expect(cardSoundFor(0, 20)).toEqual({ kind: "deal", count: 13, shuffle: true });
    expect(cardSoundFor(3, 8)).toEqual({ kind: "deal", count: 5, shuffle: true });
  });

  it("deals one card when one is drawn", () => {
    expect(cardSoundFor(7, 8)).toEqual({ kind: "deal", count: 1, shuffle: false });
  });

  it("plays a card when cards leave the hands", () => {
    expect(cardSoundFor(8, 7)).toEqual({ kind: "play", count: 1, shuffle: false });
    expect(cardSoundFor(8, 4)).toEqual({ kind: "play", count: 1, shuffle: false });
  });

  it("is silent when nothing held changed, as a pass or a bid", () => {
    expect(cardSoundFor(8, 8)).toBeNull();
  });
});
