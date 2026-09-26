import { beforeAll, describe, expect, it } from "vitest";

import { prepareEveryPuzzle } from "../generate";
import { archiveMonthAsked, archiveMonths, archiveWeeks, lastPastDay } from "./dailyArchive";
import { DAILY_WORDS_EPOCH, dayAfter, dayIndexOf } from "./dailyDay";
import { dailyLengths, dailyWordOf } from "./dailyPools";

beforeAll(prepareEveryPuzzle);

const days = (weeks: ReturnType<typeof archiveWeeks>) => weeks.flatMap((week) => week.days.map((row) => row.day));

describe("the archive of past words", () => {
  it("shows nothing on the first day, since no day has passed yet", () => {
    expect(lastPastDay(DAILY_WORDS_EPOCH)).toBeNull();
    expect(archiveMonths(DAILY_WORDS_EPOCH)).toEqual([]);
    expect(archiveWeeks("gomoji", DAILY_WORDS_EPOCH, "all")).toEqual([]);
  });

  it("never holds today or a day to come, and holds every day before it", () => {
    const today = dayAfter(DAILY_WORDS_EPOCH, 100);
    const listed = days(archiveWeeks("gomojiKana", today, "all"));
    expect(listed).not.toContain(today);
    expect(listed.every((day) => day < today)).toBe(true);
    expect(listed).toHaveLength(100);
    expect(listed[0]).toBe(dayAfter(today, -1));
    expect(listed.at(-1)).toBe(DAILY_WORDS_EPOCH);
    // Nor is today's word anywhere in what is handed to the page.
    const todays = dailyWordOf("gomojiKana", 4, today)!.word;
    const yesterdays = dailyWordOf("gomojiKana", 4, dayAfter(today, -1))!.word;
    const text = JSON.stringify(archiveWeeks("gomojiKana", today, "all"));
    expect(text).toContain(yesterdays);
    // A word can recur only a cycle later, so over a hundred days today's word is nowhere in the list.
    expect(text.includes(`"${todays}"`)).toBe(false);
  });

  it("groups the days Monday to Sunday, newest first, and narrows to a month", () => {
    const today = dayAfter(DAILY_WORDS_EPOCH, 60);
    const months = archiveMonths(today);
    expect(months[0]).toBe(dayAfter(today, -1).slice(0, 7));
    expect(months.at(-1)).toBe(DAILY_WORDS_EPOCH.slice(0, 7));
    for (const week of archiveWeeks("gomoji", today, "all")) {
      expect(week.days.length).toBeLessThanOrEqual(7);
      for (const row of week.days) expect(dayIndexOf(row.day) - dayIndexOf(week.monday)).toBeLessThan(7);
    }
    const october = archiveWeeks("gomoji", today, "2026-10");
    expect(days(october).every((day) => day.startsWith("2026-10"))).toBe(true);
    expect(days(october)).toHaveLength(31);
  });

  it("links each word to its own day's puzzle, and each day to its page", () => {
    const [week] = archiveWeeks("gomojiMot", dayAfter(DAILY_WORDS_EPOCH, 3), "all");
    const row = week!.days[0]!;
    // One word a length the puzzle offers, read from its spec as the archive does (6 joined on 2026-09-26).
    expect(row.words.map((each) => each.size)).toEqual(dailyLengths("gomojiMot"));
    expect(row.words[0]!.href).toMatch(/^\/games\/gomoji-mot\/play\?size=4&level=medium&seed=10\d{8}$/);
    expect(row.dayHref).toBe(`/games/gomoji-mot/daily/${row.day}`);
    expect(row.words[0]!.word).toBe(row.words[0]!.word.toUpperCase());
  });

  it("reads the month asked for only when it has words", () => {
    expect(archiveMonthAsked("2026-10", ["2026-10", "2026-09"])).toBe("2026-10");
    expect(archiveMonthAsked("2031-01", ["2026-10", "2026-09"])).toBe("2026-10");
    expect(archiveMonthAsked("all", ["2026-10"])).toBe("all");
    expect(archiveMonthAsked(undefined, [])).toBe("all");
  });
});
