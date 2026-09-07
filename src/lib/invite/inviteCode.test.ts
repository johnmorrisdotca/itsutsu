import { describe, expect, it } from "vitest";
import {
  CODE_WORDS,
  codeWords,
  codesMatch,
  generateInviteCode,
  isWellFormedCode,
  normaliseInviteCode,
} from "./inviteCode";
import { INVITE_WORDS } from "./words";

/** Deterministic, so a failing case can be replayed. */
function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("the wordlist", () => {
  it("has no duplicates", () => {
    expect(new Set(INVITE_WORDS).size).toBe(INVITE_WORDS.length);
  });

  it("is large enough that three words resist guessing", () => {
    // With the redeem endpoint limited to five tries a minute, this is years.
    expect(INVITE_WORDS.length ** CODE_WORDS).toBeGreaterThan(10_000_000);
  });

  it("holds only plain lowercase letters, so a code normalises cleanly", () => {
    for (const word of INVITE_WORDS) expect(word).toMatch(/^[a-z]+$/);
  });

  it("avoids the romaji spellings that two people would write differently", () => {
    for (const word of INVITE_WORDS) {
      // A doubled letter is the small-tsu and long-vowel problem.
      expect(word, `${word} has a doubled letter`).not.toMatch(/(.)\1/);
      // "n" before a labial is written n or m depending on who is writing.
      expect(word, `${word} has n before a labial`).not.toMatch(/n[bmp]/);
    }
  });
});

describe("generateInviteCode", () => {
  it("makes three hyphenated words from the list", () => {
    const code = generateInviteCode(rng(1));
    const parts = code.split("-");

    expect(parts).toHaveLength(CODE_WORDS);
    for (const part of parts) expect(INVITE_WORDS).toContain(part);
  });

  it("is reproducible from its source of randomness", () => {
    expect(generateInviteCode(rng(42))).toBe(generateInviteCode(rng(42)));
  });

  it("does not keep producing the same code", () => {
    const codes = new Set(
      Array.from({ length: 200 }, (_, seed) => generateInviteCode(rng(seed + 1))),
    );
    expect(codes.size).toBeGreaterThan(190);
  });

  it("always produces something it would accept back", () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      expect(isWellFormedCode(generateInviteCode(rng(seed)))).toBe(true);
    }
  });
});

describe("normaliseInviteCode", () => {
  it.each([
    ["hoshi-kuma-nami", "hoshi-kuma-nami"],
    ["Hoshi Kuma Nami", "hoshi-kuma-nami"],
    ["HOSHI-KUMA-NAMI", "hoshi-kuma-nami"],
    ["  hoshi , kuma . nami  ", "hoshi-kuma-nami"],
    ["hoshi—kuma—nami", "hoshi-kuma-nami"],
    ["hoshi_kuma_nami.", "hoshi-kuma-nami"],
  ])("reads %j as %j", (input, expected) => {
    expect(normaliseInviteCode(input)).toBe(expected);
  });

  it("survives an empty string", () => {
    expect(normaliseInviteCode("   ")).toBe("");
  });
});

describe("isWellFormedCode", () => {
  it("accepts a code made of real words", () => {
    expect(isWellFormedCode("hoshi kuma nami")).toBe(true);
  });

  it("rejects the wrong number of words", () => {
    expect(isWellFormedCode("hoshi-kuma")).toBe(false);
    expect(isWellFormedCode("hoshi-kuma-nami-yuki")).toBe(false);
  });

  it("rejects words that are not on the list", () => {
    expect(isWellFormedCode("hoshi-kuma-zzzz")).toBe(false);
  });

  it("rejects rubbish without touching the database", () => {
    for (const input of ["", "   ", "'; DROP TABLE", "<script>"]) {
      expect(isWellFormedCode(input)).toBe(false);
    }
  });
});

describe("codesMatch", () => {
  it("matches regardless of how the code was typed", () => {
    expect(codesMatch("Hoshi Kuma Nami", "hoshi-kuma-nami")).toBe(true);
  });

  it("does not match a different code", () => {
    expect(codesMatch("hoshi-kuma-nami", "hoshi-kuma-yuki")).toBe(false);
  });

  it("does not match a prefix", () => {
    expect(codesMatch("hoshi-kuma", "hoshi-kuma-nami")).toBe(false);
  });
});

describe("codeWords", () => {
  it("splits a code for display", () => {
    expect(codeWords("Hoshi Kuma Nami")).toEqual(["hoshi", "kuma", "nami"]);
  });
});
