import { describe, expect, it } from "vitest";

import { MESSAGE_MAX, QUICK_PHRASES, REACTION_EMOJI } from "./reactions.constants";

/**
 * The quick phrases are a fixed list shown as buttons and sent as messages, so
 * they have to satisfy both: every one must be a real reaction the API will
 * take, and short enough to read at a glance.
 */
describe("quick phrases", () => {
  it("each carries an emoji the site actually sends", () => {
    // A phrase with an emoji outside the set would be refused by the API and
    // fall over as a button nobody could use.
    for (const phrase of QUICK_PHRASES) {
      expect(REACTION_EMOJI).toContain(phrase.emoji);
    }
  });

  it("each fits in a message", () => {
    for (const phrase of QUICK_PHRASES) {
      expect(phrase.text.trim()).not.toBe("");
      expect(phrase.text.length).toBeLessThanOrEqual(MESSAGE_MAX);
    }
  });

  it("says each thing once", () => {
    // They are keyed by their text where they are rendered, and two buttons
    // saying the same thing is a list nobody thought about.
    const said = QUICK_PHRASES.map((phrase) => phrase.text);
    expect(new Set(said).size).toBe(said.length);
  });

  it("stays short enough to read as a button", () => {
    // Not a style rule: a phrase longer than a glance is slower than typing,
    // which is the whole thing these exist to beat.
    for (const phrase of QUICK_PHRASES) {
      expect(phrase.text.length).toBeLessThanOrEqual(32);
    }
  });

  it("covers the shape of a correspondence game", () => {
    // Arriving, waiting, apologising and leaving: the four things a game
    // played a move a day needs words for and an emoji cannot say.
    const all = QUICK_PHRASES.map((phrase) => phrase.text.toLowerCase()).join(" | ");
    expect(all).toContain("hello");
    expect(all).toContain("no rush");
    expect(all).toContain("sorry");
    expect(all).toContain("good game");
  });
});
