import { describe, expect, it } from "vitest";

import { WORDS_IN_A_GRID, padStep, wordsWithPrefix } from "./wordIndex";
import { WORDLIST } from "./wordlist.constants";

describe("wordsWithPrefix", () => {
  it("gives the whole list for no prefix", () => {
    expect(wordsWithPrefix("")).toHaveLength(WORDLIST.length);
  });

  it("narrows, in the order a reader scans", () => {
    const zs = wordsWithPrefix("z");
    expect(zs).toContain("zebra");
    expect(zs).not.toContain("acid");
    expect([...zs]).toEqual([...zs].sort());
  });

  it("folds case and padding, because a prefix is built from taps not typing", () => {
    expect(wordsWithPrefix(" Z ")).toEqual(wordsWithPrefix("z"));
  });

  it("gives nothing for a prefix no word has", () => {
    expect(wordsWithPrefix("zz")).toEqual([]);
  });
});

describe("padStep", () => {
  it("opens on letters, never on a grid of 1,296 words", () => {
    const step = padStep("");
    expect(step.kind).toBe("letters");
    if (step.kind !== "letters") throw new Error("unreachable");
    // Only letters some word actually starts with; "x" has one word, and counts.
    expect(step.letters).toContain("s");
    expect(step.letters).toContain("x");
    expect(step.letters.length).toBeLessThanOrEqual(26);
  });

  it("shows the words as soon as a prefix narrows to a grid somebody can scan", () => {
    // "x" has a single word on this list, so one tap is enough.
    const step = padStep("x");
    expect(step.kind).toBe("words");
    if (step.kind !== "words") throw new Error("unreachable");
    expect(step.words.length).toBeLessThanOrEqual(WORDS_IN_A_GRID);
  });

  it("asks for a second letter where one letter is still too many", () => {
    // "s" holds 220 of the 1,296 words: a grid of those is not scannable.
    const step = padStep("s");
    expect(step.kind).toBe("letters");
    if (step.kind !== "letters") throw new Error("unreachable");
    expect(step.letters).toContain("t");
    for (const letter of step.letters) expect(wordsWithPrefix(`s${letter}`).length).toBeGreaterThan(0);
  });

  it("always reaches a grid within two letters, for every letter on the list", () => {
    const first = padStep("");
    if (first.kind !== "letters") throw new Error("unreachable");
    for (const letter of first.letters) {
      const step = padStep(letter);
      if (step.kind === "words") continue;
      // A letter the pad offered must never lead nowhere.
      expect(step.kind).toBe("letters");
      if (step.kind !== "letters") continue;
      for (const second of step.letters) {
        const deeper = padStep(`${letter}${second}`);
        expect(deeper.kind).toBe("words");
      }
    }
  });

  it("refuses a prefix nothing matches rather than offering an empty grid", () => {
    const step = padStep("zz");
    expect(step.kind).toBe("none");
  });

  it("never offers a letter that leads nowhere", () => {
    const step = padStep("");
    if (step.kind !== "letters") throw new Error("unreachable");
    for (const letter of step.letters) {
      expect(wordsWithPrefix(letter).length).toBeGreaterThan(0);
    }
  });

  it("reaches every word on the list — nothing is unenterable", () => {
    const reachable = new Set<string>();
    const first = padStep("");
    if (first.kind !== "letters") throw new Error("unreachable");
    for (const letter of first.letters) {
      const step = padStep(letter);
      if (step.kind === "words") {
        for (const word of step.words) reachable.add(word);
        continue;
      }
      if (step.kind !== "letters") continue;
      for (const second of step.letters) {
        const deeper = padStep(`${letter}${second}`);
        if (deeper.kind === "words") for (const word of deeper.words) reachable.add(word);
      }
    }
    expect(reachable.size).toBe(WORDLIST.length);
  });
});
