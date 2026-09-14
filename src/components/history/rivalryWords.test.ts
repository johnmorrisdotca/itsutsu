import { describe, expect, it } from "vitest";

import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { speaker } from "@/lib/i18n/i18n";
import type { RivalryTallyShown } from "@/lib/record/rivalry.types";

import { lineWords, streakWords } from "./rivalryWords";

/**
 * "You" is said to one of the two and to nobody else.
 *
 * The controller's rule, and the reason both halves are tested: a page narrowed
 * to two other people, or a match somebody is watching, reads both names —
 * "Dan leads John M. 3–2" — because "You lead Dan" there would be a sentence
 * about the wrong person.
 */

const en = speaker("en");
const ja = speaker("ja");
const john = { memberId: "cm-john", name: "John Morris", level: 7 };
const dan = { memberId: "cm-dan", name: "Dan", level: null };
const asJohn = { one: john, other: dan, readerIsOne: true };
const watching = { one: john, other: dan, readerIsOne: false };

const tally = (streak: RivalryTallyShown["streak"]): RivalryTallyShown => ({
  wins: 0,
  losses: 0,
  draws: 0,
  total: 0,
  lastPlayedAt: null,
  streak,
});

describe("the line, to one of the two", () => {
  it("says John's own examples in his words", () => {
    expect(lineWords(en, asJohn, { kind: "neverGame", variant: "ninuki" })).toBe(
      `You and Dan have never played ${RULE_VARIANT_DISPLAY.ninuki.label} before`,
    );
    expect(lineWords(en, asJohn, { kind: "gap", unit: "years", count: 2 })).toBe("You haven't played Dan in 2 years");
    expect(lineWords(en, asJohn, { kind: "streak", outcome: "loss", count: 3 })).toBe(
      "You've lost to Dan 3 times in a row",
    );
    expect(lineWords(en, asJohn, { kind: "tied", score: 4 })).toBe("You and Dan are tied 4–4");
    expect(lineWords(en, asJohn, { kind: "lead", leader: "one", ahead: 5, behind: 2 })).toBe("You lead Dan 5–2");
  });

  it("says who leads when it is the other one", () => {
    expect(lineWords(en, asJohn, { kind: "lead", leader: "other", ahead: 3, behind: 2 })).toBe("Dan leads you 3–2");
  });

  it("says a first win either way round", () => {
    expect(lineWords(en, asJohn, { kind: "firstWin", winner: "one" })).toBe("Your first win against Dan");
    expect(lineWords(en, asJohn, { kind: "firstWin", winner: "other" })).toBe("Dan's first win against you");
  });

  it("says a single year as a year", () => {
    expect(lineWords(en, asJohn, { kind: "gap", unit: "years", count: 1 })).toBe("You haven't played Dan in a year");
  });
});

describe("the line, to anybody else", () => {
  it("uses both names and never 'you'", () => {
    const lines = [
      lineWords(en, watching, { kind: "never" }),
      lineWords(en, watching, { kind: "lead", leader: "other", ahead: 3, behind: 2 }),
      lineWords(en, watching, { kind: "streak", outcome: "win", count: 4 }),
      lineWords(en, watching, { kind: "tied", score: 1 }),
      lineWords(en, watching, { kind: "gap", unit: "months", count: 7 }),
      lineWords(en, watching, { kind: "firstWin", winner: "other" }),
      lineWords(en, watching, { kind: "allDrawn" }),
      lineWords(en, watching, { kind: "streak", outcome: "draw", count: 3 }),
    ];
    expect(lines[0]).toBe("John M. and Dan have never played each other");
    expect(lines[1]).toBe("Dan leads John M. 3–2");
    expect(lines[2]).toBe("John M. has beaten Dan 4 times in a row");
    expect(lines[3]).toBe("John M. and Dan are tied 1–1");
    expect(lines[4]).toBe("John M. and Dan haven't played each other in 7 months");
    expect(lines[5]).toBe("Dan's first win against John M.");
    expect(lines[6]).toBe("Every game between John M. and Dan has been a draw");
    expect(lines[7]).toBe("The last 3 games between John M. and Dan were draws");
    for (const line of lines) expect(line.toLowerCase()).not.toMatch(/\byou/);
  });

  it("names the winner of a losing run for the reader's side from the other side", () => {
    expect(lineWords(en, watching, { kind: "streak", outcome: "loss", count: 3 })).toBe(
      "Dan has beaten John M. 3 times in a row",
    );
  });
});

describe("the line in Japanese", () => {
  it("names the game in its own script and keeps both names", () => {
    const line = lineWords(ja, watching, { kind: "neverGame", variant: "ninuki" });
    expect(line).toContain(RULE_VARIANT_DISPLAY.ninuki.kanji);
    expect(line).toContain("John M.");
    expect(line).toContain("Dan");
  });
});

describe("the streak stat", () => {
  it("is a dash's worth of nothing for no games", () => {
    expect(streakWords(en, asJohn, tally(null))).toBeNull();
  });

  it("has its own words for a run of one", () => {
    expect(streakWords(en, asJohn, tally({ kind: "loss", count: 1 }))).toBe("Dan won the last game");
    expect(streakWords(en, asJohn, tally({ kind: "draw", count: 1 }))).toBe("The last game was a draw");
  });

  it("counts a longer run, in names", () => {
    expect(streakWords(en, asJohn, tally({ kind: "win", count: 3 }))).toBe("John M. won the last 3");
    expect(streakWords(en, asJohn, tally({ kind: "draw", count: 2 }))).toBe("The last 2 were draws");
  });
});
