import { describe, expect, it } from "vitest";

import { isHotSeat } from "@/lib/history/liveGame";
import { gameRatingRefusal, isRateable, ratingRefusal } from "./rateable";
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

/**
 * The question a page actually needs answered: `ratingRefusal` alone cannot
 * see a hot-seat game, because hot seat is a fact about the seat tokens, not
 * about the two names. This is the rule twelve production rows exposed —
 * `game.rated === true` displayed as a counted result for a game that never
 * moved anybody's rating and never could.
 */
describe("gameRatingRefusal", () => {
  it("says nothing for a game never asked to count, hot seat or not", () => {
    // A friendly is a choice, not a refusal — it gets its own badge, not this one.
    expect(gameRatingRefusal({ rated: false, hotSeat: false, blackName: "Aki", whiteName: "Sumi" })).toBeNull();
    expect(gameRatingRefusal({ rated: false, hotSeat: true, blackName: "Aki", whiteName: "Sumi" })).toBeNull();
  });

  it("counts an ordinary rated game between two different people", () => {
    expect(gameRatingRefusal({ rated: true, hotSeat: false, blackName: "Aki", whiteName: "Sumi" })).toBeNull();
  });

  it("refuses a hot-seat game even between two ordinary, different names", () => {
    // Ten of the twelve production rows are exactly this shape: two real,
    // distinct names, so `ratingRefusal` alone would wrongly say this counts.
    const hotSeat = isHotSeat({ blackToken: "same-token", whiteToken: "same-token" });
    expect(hotSeat).toBe(true);
    expect(gameRatingRefusal({ rated: true, hotSeat, blackName: "Aki", whiteName: "Sumi" })).toBe(
      RATING_REFUSALS.hotSeat,
    );
  });

  it("catches the John-versus-John shape, which is not hot seat at all", () => {
    // Two different seat tokens: `isHotSeat` reads false, exactly as it did
    // for the real row this case is drawn from. What refuses this one is the
    // folded name, not the seats — the finding this function exists to keep
    // a future "isHotSeat already covers it" simplification from re-breaking.
    const hotSeat = isHotSeat({ blackToken: "token-a", whiteToken: "token-b" });
    expect(hotSeat).toBe(false);
    expect(
      gameRatingRefusal({ rated: true, hotSeat, blackName: "John Morris", whiteName: "  john   morris " }),
    ).toBe(RATING_REFUSALS.onePlayer);
  });

  it("calls a hot-seat game hot-seat even when the shared name would also refuse it", () => {
    // Checked in the write path's own order: hot seat is decided, and
    // `recordResult` — so `ratingRefusal` — is never reached at all.
    expect(gameRatingRefusal({ rated: true, hotSeat: true, blackName: "Aki", whiteName: "Aki" })).toBe(
      RATING_REFUSALS.hotSeat,
    );
  });

  it("passes the other refusals through unchanged when the seats are not hot seat", () => {
    expect(
      gameRatingRefusal({ rated: true, hotSeat: false, blackName: "", whiteName: "Sumi" }),
    ).toBe(RATING_REFUSALS.unnamed);
    expect(
      gameRatingRefusal({ rated: true, hotSeat: false, blackName: "Chibi", whiteName: "Aki" }),
    ).toBe(RATING_REFUSALS.keptRecord);
  });
});
