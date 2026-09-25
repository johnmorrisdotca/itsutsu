import { describe, expect, it } from "vitest";

import { PHRASES, PHRASE_KEYS } from "@/lib/i18n/i18n.constants";
import { placeholdersIn } from "@/lib/i18n/i18n";

import { FEED_KINDS, FEED_OUTCOMES } from "./feed.constants";
import type { FeedEntry } from "./feed.types";
import { dayHeading, entryPhrase, phraseParts } from "./feedWords";

const who = { memberId: "m1", name: "Aki" };
const base = { id: "x", at: "2026-09-20T00:00:00.000Z", who };

function all(you: boolean): FeedEntry[] {
  return [
    { ...base, you, kind: FEED_KINDS.game, gameId: "g", variant: "freestyle", other: who, outcome: FEED_OUTCOMES.won },
    { ...base, you, kind: FEED_KINDS.game, gameId: "g", variant: "freestyle", other: who, outcome: FEED_OUTCOMES.lost },
    { ...base, you, kind: FEED_KINDS.game, gameId: "g", variant: "freestyle", other: who, outcome: FEED_OUTCOMES.drawn },
    { ...base, you, kind: FEED_KINDS.started, gameId: "g", variant: "freestyle", other: who },
    { ...base, you, kind: FEED_KINDS.started, gameId: "g", variant: "freestyle", other: null },
    { ...base, you, kind: FEED_KINDS.xp, points: 10 },
    { ...base, you, kind: FEED_KINDS.credited, points: 10 },
    { ...base, you, kind: FEED_KINDS.level, level: 3 },
    { ...base, you, kind: FEED_KINDS.puzzles, variant: "numberPlace", count: 1 },
    { ...base, you, kind: FEED_KINDS.puzzles, variant: "numberPlace", count: 4 },
  ];
}

describe("the sentence a line is said in", () => {
  it("is a different phrase for every kind of line, for you and for somebody else", () => {
    const keys = [...all(true), ...all(false)].map(entryPhrase);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(PHRASE_KEYS).toContain(key);
  });

  it("names the subject only when it is somebody else", () => {
    for (const entry of all(true)) expect(placeholdersIn(PHRASES[entryPhrase(entry)])).not.toContain("who");
    for (const entry of all(false)) expect(placeholdersIn(PHRASES[entryPhrase(entry)])).toContain("who");
  });

  it("names the game wherever a game is the subject", () => {
    for (const entry of [...all(true), ...all(false)]) {
      const slots = placeholdersIn(PHRASES[entryPhrase(entry)]);
      if (entry.kind === FEED_KINDS.game || entry.kind === FEED_KINDS.started || entry.kind === FEED_KINDS.puzzles) {
        expect(slots).toContain("game");
      }
    }
  });
});

describe("a sentence cut at its slots", () => {
  it("keeps the words and the slots in the order the sentence has them", () => {
    expect(phraseParts("{who} beat {other} at {game}")).toEqual([
      { slot: "who" },
      { text: " beat " },
      { slot: "other" },
      { text: " at " },
      { slot: "game" },
    ]);
  });

  it("keeps a sentence with no slots whole", () => {
    expect(phraseParts("Today")).toEqual([{ text: "Today" }]);
  });

  it("keeps words after the last slot", () => {
    expect(phraseParts("{game}で{other}に勝ちました")).toEqual([
      { slot: "game" },
      { text: "で" },
      { slot: "other" },
      { text: "に勝ちました" },
    ]);
  });
});

describe("a day's heading", () => {
  it("says today and yesterday, and otherwise the date", () => {
    expect(dayHeading("2026-09-25", "2026-09-25", "2026-09-24")).toEqual({ phrase: "feed.today" });
    expect(dayHeading("2026-09-24", "2026-09-25", "2026-09-24")).toEqual({ phrase: "feed.yesterday" });
    expect(dayHeading("2026-09-01", "2026-09-25", "2026-09-24")).toEqual({ date: "2026-09-01" });
  });
});
