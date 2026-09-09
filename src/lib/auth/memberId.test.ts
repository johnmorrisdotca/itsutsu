import { describe, expect, it } from "vitest";

import {
  MEMBER_ID_MAX,
  MEMBER_ID_MIN,
  UNCLAIMABLE_REASONS,
  canBeClaimed,
  idCharacters,
  isMemberId,
  isUnclaimableReason,
  makeMemberId,
} from "./memberId";

/**
 * A member's own name for the database.
 *
 * Two kinds of id go through one validator: the ones this site draws at
 * random, and the handful curated by hand for the histories carried over
 * from ItsYourTurn and GoldToken. One rule for both is the point — a second
 * opinion about what an id may look like is a second opinion that drifts.
 */
function drawWith(values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("an id this site draws", () => {
  it("is long enough that a collision is not a thing to worry about", () => {
    const id = makeMemberId();
    expect(id).toHaveLength(16);
    expect(isMemberId(id)).toBe(true);
  });

  it("uses no character that can be mistaken for another", () => {
    // No 0, 1, i, l or o anywhere, however the draw falls.
    for (let seed = 0; seed < 200; seed += 1) {
      const id = makeMemberId(drawWith([seed / 200]));
      expect(id).not.toMatch(/[01ilo]/);
    }
  });

  it("is reproducible from the numbers it was given", () => {
    expect(makeMemberId(drawWith([0]))).toBe(makeMemberId(drawWith([0])));
    expect(makeMemberId(drawWith([0]))).not.toBe(makeMemberId(drawWith([0.5])));
  });

  it("does not repeat itself across many draws", () => {
    const drawn = new Set(Array.from({ length: 500 }, () => makeMemberId()));
    expect(drawn.size).toBe(500);
  });
});

describe("an id curated by hand", () => {
  it("accepts a readable id grouped like a game address", () => {
    expect(isMemberId("chjb-jjac-k794-q84")).toBe(true);
    expect(isMemberId("kyqk-qsan-japa-n794-5")).toBe(true);
  });

  it("accepts letters the generated alphabet leaves out", () => {
    // The restriction exists for reading an id aloud, which never happens to
    // a member id — and "chibi" cannot be spelled without an i.
    expect(isMemberId("chibi")).toBe(true);
    expect(isMemberId("kyokosan")).toBe(true);
    expect(isMemberId("jack-1625")).toBe(true);
  });
});

describe("what is not an id at all", () => {
  it("refuses anything that is not a string", () => {
    for (const value of [null, undefined, 1940, {}, [], true]) {
      expect(isMemberId(value)).toBe(false);
    }
  });

  it("refuses capitals, spaces and punctuation", () => {
    for (const value of ["Chibi", "chibi 1940", "chibi_1940", "chibi.1940", "chibi/1940", "chibi@x"]) {
      expect(isMemberId(value), value).toBe(false);
    }
  });

  it("refuses an address, which is the whole point of having these", () => {
    expect(isMemberId("john@spxis.com")).toBe(false);
  });

  it("refuses a hyphen at either end, or two together", () => {
    for (const value of ["-chibi", "chibi-", "chibi--1940"]) {
      expect(isMemberId(value), value).toBe(false);
    }
  });

  it("refuses one too short or too long", () => {
    expect(isMemberId("a".repeat(MEMBER_ID_MIN - 1))).toBe(false);
    expect(isMemberId("a".repeat(MEMBER_ID_MIN))).toBe(true);
    expect(isMemberId("a".repeat(MEMBER_ID_MAX))).toBe(true);
    expect(isMemberId("a".repeat(MEMBER_ID_MAX + 1))).toBe(false);
  });

  it("refuses an empty string", () => {
    expect(isMemberId("")).toBe(false);
  });
});

describe("a row that may never be claimed", () => {
  it("reads null as nothing standing in the way", () => {
    expect(canBeClaimed(null)).toBe(true);
  });

  it("reads any reason at all as a refusal", () => {
    for (const reason of Object.values(UNCLAIMABLE_REASONS)) {
      expect(canBeClaimed(reason)).toBe(false);
    }
    // Even a reason this version does not know: an unrecognised one must
    // shut the door rather than open it.
    expect(canBeClaimed("something-later")).toBe(false);
  });

  it("knows the reasons it was given, and no others", () => {
    expect(isUnclaimableReason("kept-record")).toBe(true);
    expect(isUnclaimableReason("seed")).toBe(true);
    for (const value of ["", "other", null, undefined, 1]) {
      expect(isUnclaimableReason(value)).toBe(false);
    }
  });
});

/**
 * Building an id out of real characters.
 *
 * John wanted the curated ids made from words that mean something — chibi,
 * jack, kyokosan, japan, and a few years — rather than drawn at random. The
 * alphabet forbids 0, 1, i, l and o, and those names land on exactly those,
 * so each banned character is swapped for the one it is banned for looking
 * like instead of being dropped and losing the word.
 */
describe("an id built from words", () => {
  it("swaps a letter for the one it was banned for looking like", () => {
    expect(idCharacters("chibi")).toBe("chjbj");
    expect(idCharacters("kyokosan")).toBe("kyqkqsan");
    expect(idCharacters("1940")).toBe("794q");
    expect(idCharacters("1945")).toBe("7945");
  });

  it("leaves a word alone when nothing in it is banned", () => {
    expect(idCharacters("jack")).toBe("jack");
    expect(idCharacters("japan")).toBe("japan");
    expect(idCharacters("84")).toBe("84");
  });

  it("folds case and drops what is neither a letter nor a digit", () => {
    expect(idCharacters("Chibi 1940!")).toBe("chjbj794q");
  });

  it("never produces a character the alphabet forbids", () => {
    for (const word of ["Illinois", "Toronto", "1001", "Lolo", "OLIVIA"]) {
      expect(idCharacters(word), word).not.toMatch(/[01ilo]/);
    }
  });

  it("makes the two ids that were chosen", () => {
    // The kept records, as they stand in the database.
    const chibi = `${idCharacters("chibi")}${idCharacters("jack")}${idCharacters("1940")}${idCharacters("84")}`;
    expect(chibi).toBe("chjbjjack794q84");
    expect(isMemberId("chjb-jjac-k794-q84")).toBe(true);
    expect(isMemberId("kyqk-qsan-japa-n794-5")).toBe(true);
  });
});
