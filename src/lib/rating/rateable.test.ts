import { describe, expect, it } from "vitest";

import { NO_HANDICAP, NO_HEAD_START, STONES } from "@/lib/gomoku/gomoku.constants";
import { isHotSeat } from "@/lib/history/liveGame";
import { gameRatingRefusal, isRateable, ratingImpossible, ratingRefusal } from "./rateable";
import { RATING_REFUSALS, RATING_REFUSAL_DISPLAY, RATING_REFUSED_WORD } from "./rateable.constants";

/** A game played straight: what every case below is, unless it says otherwise. */
const straight = { headStart: NO_HEAD_START, handicap: NO_HANDICAP };
/** A handicap on black, the stronger player's own seat in the case John described. */
const handicapped = { headStart: NO_HEAD_START, handicap: { ...NO_HANDICAP, stone: STONES.black, doubleThree: true } };

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
      // And a short form, for the settings line and the row that used to read
      // "Rated" off the column beneath a notice saying it would not count.
      expect(display.short.startsWith(RATING_REFUSED_WORD), refusal).toBe(true);
      expect(display.short.length, refusal).toBeGreaterThan(RATING_REFUSED_WORD.length);
    }
  });
});

/**
 * The same rule with the row's own flag taken out of it — what the AUDIT asks,
 * where the column is the thing under suspicion and so cannot gate the
 * question. See `ratedButRefused.ts`.
 */
describe("ratingImpossible", () => {
  it("answers whatever the column says, because it is never shown the column", () => {
    // The twelve, as stored: rated true, one token in both seats.
    expect(ratingImpossible({ hotSeat: true, blackName: "Aki", whiteName: "Sumi" })).toBe(
      RATING_REFUSALS.hotSeat,
    );
    // And the same game after the audit has corrected it. Still one screen.
    expect(ratingImpossible({ hotSeat: true, blackName: "Aki", whiteName: "Sumi" })).toBe(
      RATING_REFUSALS.hotSeat,
    );
  });

  it("says nothing about a game two different people could have rated", () => {
    expect(ratingImpossible({ hotSeat: false, blackName: "Aki", whiteName: "Sumi" })).toBeNull();
  });

  it("is the whole of what gameRatingRefusal does once the flag says yes, for a game played straight", () => {
    // Two functions, one rule: the split is the flag and the handicap, so a
    // future change to either cannot leave the audit and the pages disagreeing.
    for (const [black, white, hotSeat] of [
      ["Aki", "Sumi", false],
      ["Aki", "Sumi", true],
      ["John Morris", "  john   morris ", false],
      ["", "Sumi", false],
      ["Chibi", "Aki", false],
    ] as const) {
      expect(gameRatingRefusal({ rated: true, hotSeat, blackName: black, whiteName: white, ...straight })).toBe(
        ratingImpossible({ hotSeat, blackName: black, whiteName: white }),
      );
    }
  });

  /*
   * THE AUDIT IS BLIND TO A HANDICAP, ON PURPOSE. It writes `rated: false` onto
   * the finished rows it refuses, and a handicap game finished before a
   * handicap was refused did move both players' ratings. Nothing existing is
   * rewritten by this change — so the audit's question takes no handicap at
   * all, and the pages' does.
   */
  it("never refuses a handicap, which the pages do and the audit must not", () => {
    const names = { hotSeat: false, blackName: "Aki", whiteName: "Sumi" };
    expect(ratingImpossible(names)).toBeNull();
    expect(gameRatingRefusal({ rated: true, ...names, ...handicapped })).toBe(RATING_REFUSALS.handicap);
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
    expect(
      gameRatingRefusal({ rated: false, hotSeat: false, blackName: "Aki", whiteName: "Sumi", ...straight }),
    ).toBeNull();
    expect(
      gameRatingRefusal({ rated: false, hotSeat: true, blackName: "Aki", whiteName: "Sumi", ...straight }),
    ).toBeNull();
  });

  it("counts an ordinary rated game between two different people", () => {
    expect(
      gameRatingRefusal({ rated: true, hotSeat: false, blackName: "Aki", whiteName: "Sumi", ...straight }),
    ).toBeNull();
  });

  it("refuses a hot-seat game even between two ordinary, different names", () => {
    // Ten of the twelve production rows are exactly this shape: two real,
    // distinct names, so `ratingRefusal` alone would wrongly say this counts.
    const hotSeat = isHotSeat({ blackToken: "same-token", whiteToken: "same-token" });
    expect(hotSeat).toBe(true);
    expect(gameRatingRefusal({ rated: true, hotSeat, blackName: "Aki", whiteName: "Sumi", ...straight })).toBe(
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
      gameRatingRefusal({
        rated: true,
        hotSeat,
        blackName: "John Morris",
        whiteName: "  john   morris ",
        ...straight,
      }),
    ).toBe(RATING_REFUSALS.onePlayer);
  });

  it("calls a hot-seat game hot-seat even when the shared name would also refuse it", () => {
    // Checked in the write path's own order: hot seat is decided, and
    // `recordResult` — so `ratingRefusal` — is never reached at all.
    expect(gameRatingRefusal({ rated: true, hotSeat: true, blackName: "Aki", whiteName: "Aki", ...straight })).toBe(
      RATING_REFUSALS.hotSeat,
    );
  });

  it("passes the other refusals through unchanged when the seats are not hot seat", () => {
    expect(
      gameRatingRefusal({ rated: true, hotSeat: false, blackName: "", whiteName: "Sumi", ...straight }),
    ).toBe(RATING_REFUSALS.unnamed);
    expect(
      gameRatingRefusal({ rated: true, hotSeat: false, blackName: "Chibi", whiteName: "Aki", ...straight }),
    ).toBe(RATING_REFUSALS.keptRecord);
  });
});

/**
 * A HANDICAP GAME MOVES NOBODY'S RATING. John, asked whether a game with a
 * handicap should move both players' ratings: "Fine don't".
 */
describe("gameRatingRefusal and a handicap", () => {
  const people = { hotSeat: false, blackName: "Aki", whiteName: "Sumi" };

  it("refuses a rated game between two different people with a handicap on either colour", () => {
    expect(gameRatingRefusal({ rated: true, ...people, ...handicapped })).toBe(RATING_REFUSALS.handicap);
    const onWhite = { headStart: NO_HEAD_START, handicap: { ...NO_HANDICAP, stone: STONES.white, longerLine: true } };
    expect(gameRatingRefusal({ rated: true, ...people, ...onWhite })).toBe(RATING_REFUSALS.handicap);
  });

  it("gives the reason whatever the flag says, because a handicap game has no friendly to choose", () => {
    // The set-up screen shows the fact where the Rated and Friendly tiles were,
    // and creation stores it unrated — so the flag is nobody's decision, and the
    // filed game still owes its reader the reason.
    expect(gameRatingRefusal({ rated: false, ...people, ...handicapped })).toBe(RATING_REFUSALS.handicap);
  });

  it("says a refusal the write path would have met first, first", () => {
    expect(gameRatingRefusal({ rated: true, ...people, hotSeat: true, ...handicapped })).toBe(
      RATING_REFUSALS.hotSeat,
    );
    expect(
      gameRatingRefusal({ rated: true, ...people, blackName: "John", whiteName: "john", ...handicapped }),
    ).toBe(RATING_REFUSALS.onePlayer);
  });

  it("leaves a game played straight exactly as it was", () => {
    expect(gameRatingRefusal({ rated: true, ...people, ...straight })).toBeNull();
    expect(gameRatingRefusal({ rated: false, ...people, ...straight })).toBeNull();
  });
});
