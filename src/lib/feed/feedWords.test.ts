import { describe, expect, it } from "vitest";

import { PHRASES, PHRASE_KEYS } from "@/lib/i18n/i18n.constants";
import { placeholdersIn } from "@/lib/i18n/i18n";

import { FEED_KINDS, FEED_OUTCOMES } from "./feed.constants";
import type { FeedEntry, FeedNewsEntry } from "./feed.types";
import { dayHeading, entryPhrase, phraseParts } from "./feedWords";
import { SITE_NEWS } from "./siteNews.constants";

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

describe("the sentence a line of the site's news is said in", () => {
  const news = (over: Partial<FeedNewsEntry>): FeedNewsEntry => ({
    ...base,
    you: false,
    kind: FEED_KINDS.news,
    news: SITE_NEWS.firstWin,
    named: true,
    variant: "reversi",
    gameId: "g",
    other: null,
    outcome: null,
    subject: "",
    ...over,
  });
  const every: FeedNewsEntry[] = [
    news({ news: SITE_NEWS.firstGameOfGame, outcome: FEED_OUTCOMES.won, other: who }),
    news({ news: SITE_NEWS.firstGameOfGame, outcome: FEED_OUTCOMES.drawn, other: who }),
    news({ news: SITE_NEWS.firstGameOfGame, named: false }),
    news({ news: SITE_NEWS.tookFirstPlace }),
    news({ news: SITE_NEWS.hardBotBeaten, other: who }),
    news({ news: SITE_NEWS.hardBotBeaten, named: false, other: who }),
    news({ news: SITE_NEWS.firstWin }),
    news({ news: SITE_NEWS.firstLoss }),
    news({ news: SITE_NEWS.bestTime, subject: "9:hard:1000" }),
    news({ news: SITE_NEWS.bestTime, named: false, subject: "9:hard:1000" }),
  ];

  it("is a phrase of its own for every kind, named and not", () => {
    const keys = every.map(entryPhrase);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(PHRASE_KEYS).toContain(key);
  });

  it("names a person only in a line allowed to, and names the game in every one", () => {
    for (const entry of every) {
      const slots = placeholdersIn(PHRASES[entryPhrase(entry)]);
      expect(slots.includes("who"), entryPhrase(entry)).toBe(entry.named);
      expect(slots, entryPhrase(entry)).toContain("game");
    }
  });

  it("gives a day's new games a sentence with room for all of them", () => {
    const added: FeedEntry = { ...base, you: false, kind: FEED_KINDS.added, variants: ["reversi", "hex"] };
    expect(placeholdersIn(PHRASES[entryPhrase(added)])).toEqual(["games"]);
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
