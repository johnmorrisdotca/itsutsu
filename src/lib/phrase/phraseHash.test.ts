import { describe, expect, it } from "vitest";

import { canonicalPhrase } from "./phrase";
import { hashPhrase, phraseMatches } from "./phraseHash";

const WORDS = ["acid", "zebra", "mango", "flock"];

describe("hashPhrase", () => {
  it("verifies the phrase it was made from", async () => {
    const canonical = canonicalPhrase(WORDS);
    if (canonical === null) throw new Error("unreachable");
    expect(await phraseMatches(canonical, await hashPhrase(canonical))).toBe(true);
  });

  it("refuses a different phrase", async () => {
    const stored = await hashPhrase(canonicalPhrase(WORDS) ?? "");
    const other = canonicalPhrase(["acid", "zebra", "mango", "acorn"]);
    if (other === null) throw new Error("unreachable");
    expect(await phraseMatches(other, stored)).toBe(false);
  });

  it("is salted: the same phrase hashes differently every time", async () => {
    const canonical = canonicalPhrase(WORDS) ?? "";
    const first = await hashPhrase(canonical);
    const second = await hashPhrase(canonical);
    expect(first).not.toBe(second);
    // Both still verify — a salt that broke verification would be worse than none.
    expect(await phraseMatches(canonical, first)).toBe(true);
    expect(await phraseMatches(canonical, second)).toBe(true);
  });

  it("stores no trace of the words", async () => {
    const stored = await hashPhrase(canonicalPhrase(WORDS) ?? "");
    for (const word of WORDS) expect(stored.toLowerCase()).not.toContain(word);
  });

  it("says its own cost, so a stored hash can be checked years later", async () => {
    const stored = await hashPhrase(canonicalPhrase(WORDS) ?? "");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(stored.split("$")).toHaveLength(6);
  });
});

describe("phraseMatches", () => {
  it("is false for a member who has never set one, and does not throw", async () => {
    const canonical = canonicalPhrase(WORDS) ?? "";
    expect(await phraseMatches(canonical, null)).toBe(false);
    expect(await phraseMatches(canonical, "")).toBe(false);
  });

  it("is false for a stored value it cannot read, rather than throwing", async () => {
    const canonical = canonicalPhrase(WORDS) ?? "";
    expect(await phraseMatches(canonical, "nonsense")).toBe(false);
    expect(await phraseMatches(canonical, "scrypt$notanumber$8$1$aaaa$bbbb")).toBe(false);
    expect(await phraseMatches(canonical, "bcrypt$1$2$3$4$5")).toBe(false);
  });

  it("is false for an empty attempt, whatever is stored", async () => {
    const stored = await hashPhrase(canonicalPhrase(WORDS) ?? "");
    expect(await phraseMatches("", stored)).toBe(false);
  });

  /*
   * The property John asked for three times, proved at the level that decides
   * it: a phrase set in one order is entered in another and matches. Both sides
   * go through canonicalPhrase, which is the single normaliser — this test is
   * what would fail if a second one ever appeared.
   */
  it("matches the same four words tapped in a different order", async () => {
    const set = canonicalPhrase(["zebra", "acid", "mango", "flock"]);
    const entered = canonicalPhrase(["flock", "mango", "acid", "zebra"]);
    if (set === null || entered === null) throw new Error("unreachable");
    expect(await phraseMatches(entered, await hashPhrase(set))).toBe(true);
  });

  it("matches when the letters were tapped in a different case", async () => {
    const set = canonicalPhrase(WORDS);
    const entered = canonicalPhrase(["ACID", " Zebra ", "MANGO", "flock"]);
    if (set === null || entered === null) throw new Error("unreachable");
    expect(await phraseMatches(entered, await hashPhrase(set))).toBe(true);
  });
});
