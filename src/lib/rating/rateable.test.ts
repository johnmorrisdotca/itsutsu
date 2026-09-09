import { describe, expect, it } from "vitest";

import { isRateable, ratingRefusal } from "./rateable";
import { RATING_REFUSALS, RATING_REFUSAL_DISPLAY } from "./rateable.constants";

describe("ratingRefusal", () => {
  it("says yes to two different people", () => {
    expect(ratingRefusal("Aki", "Sumi")).toBeNull();
    expect(isRateable("Aki", "Sumi")).toBe(true);
  });

  it("refuses a game somebody played against themselves", () => {
    expect(ratingRefusal("John", "John")).toBe(RATING_REFUSALS.onePlayer);
  });

  it("refuses it however the one name is spelt", () => {
    // Two devices, two typings, one person: this is the case that goes unnoticed.
    expect(ratingRefusal("John Morris", "  john   morris ")).toBe(RATING_REFUSALS.onePlayer);
  });

  it("refuses a seat nobody put a name on", () => {
    expect(ratingRefusal("", "Sumi")).toBe(RATING_REFUSALS.unnamed);
    expect(ratingRefusal("Aki", "   ")).toBe(RATING_REFUSALS.unnamed);
  });

  it("refuses a name kept from before this site", () => {
    expect(ratingRefusal("Chibi", "Aki")).toBe(RATING_REFUSALS.keptRecord);
    expect(ratingRefusal("Aki", "Kyokosan")).toBe(RATING_REFUSALS.keptRecord);
  });

  it("calls one kept name on both seats one player, not a kept record", () => {
    // Both are true. The more useful answer is the one the player can act on.
    expect(ratingRefusal("Chibi", "chibi")).toBe(RATING_REFUSALS.onePlayer);
  });

  it("lets a live member play under their own elsewhere name", () => {
    // An "elsewhere" record belongs to somebody who plays here; reserving it
    // would lock them out of their own ladder.
    expect(ratingRefusal("jmorris", "Aki")).toBeNull();
  });

  it("has a sentence for every refusal, so none can be shown as a blank", () => {
    for (const refusal of Object.values(RATING_REFUSALS)) {
      const display = RATING_REFUSAL_DISPLAY[refusal];
      expect(display.playing.length).toBeGreaterThan(0);
      expect(display.filed.length).toBeGreaterThan(0);
      expect(display.kanji.length).toBeGreaterThan(0);
      expect(display.sentence.length).toBeGreaterThan(20);
    }
  });
});
