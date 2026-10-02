import { describe, expect, it } from "vitest";

import { keptRunAsked, puzzleAsked, puzzleQuery } from "./puzzleAddress";
import { clockFor, clockLimitMs, countdownSaying, countdownSeconds, isOutOfTime, isPuzzleClock, isUrgent, timeLeftMs } from "./puzzleClock";
import { PUZZLE_CLOCK_DISPLAY, PUZZLE_CLOCK_LIST, PUZZLE_KIND_LIST, offersClock } from "./puzzles.constants";
import { clockText } from "./clockText";

const read = (query: string) => Object.fromEntries(new URLSearchParams(query.slice(1)));

describe("the countdowns", () => {
  it("are none, then Tortoise five minutes, Fox three and Rabbit one, slowest first", () => {
    expect(PUZZLE_CLOCK_LIST).toEqual(["none", "tortoise", "fox", "rabbit"]);
    expect(PUZZLE_CLOCK_LIST.map(clockLimitMs)).toEqual([null, 300_000, 180_000, 60_000]);
    expect(PUZZLE_CLOCK_DISPLAY.tortoise.kanji).toBe("亀");
    expect(PUZZLE_CLOCK_DISPLAY.fox.kanji).toBe("狐");
    expect(PUZZLE_CLOCK_DISPLAY.rabbit.kanji).toBe("兎");
    // The allowance as written on a chip or a table is the allowance.
    for (const clock of PUZZLE_CLOCK_LIST) {
      const ms = clockLimitMs(clock);
      expect(PUZZLE_CLOCK_DISPLAY[clock].time).toBe(ms === null ? "" : clockText(ms));
    }
  });

  it("are offered on every puzzle but Tsunagi's and Meikyuu's fixed levels, Kumimoji, the card games and the cube", () => {
    // Solitaire's measure is its clock counting up and its moves: a five-minute Klondike is a different game.
    // The cube's is its clock counting up from its look at the scramble, as competitions time one.
    expect(PUZZLE_KIND_LIST.filter((kind) => !offersClock(kind))).toEqual(["tsunagi", "kumimoji", "solitaire", "freecell", "spider", "cube", "meikyuu"]);
  });

  it("name no other clock", () => {
    expect(isPuzzleClock("rabbit")).toBe(true);
    expect(isPuzzleClock("turtle")).toBe(false);
    expect(isPuzzleClock(undefined)).toBe(false);
    expect(clockFor("numberPlace", "fox")).toBe("fox");
    expect(clockFor("numberPlace", "snail")).toBe("none");
    expect(clockFor("tsunagi", "rabbit")).toBe("none");
  });
});

describe("the time left", () => {
  it("is the allowance less the time taken, never below nought, and nothing with no clock", () => {
    expect(timeLeftMs("rabbit", 0)).toBe(60_000);
    expect(timeLeftMs("rabbit", 45_500)).toBe(14_500);
    expect(timeLeftMs("rabbit", 90_000)).toBe(0);
    expect(timeLeftMs("none", 90_000)).toBeNull();
  });

  it("stops while paused, because the time taken does: a pause taken off the clock is taken off the countdown", () => {
    // Started at 0, paused from 20 s to 50 s, read at 70 s: 40 s taken, as `useSolve` counts it.
    const taken = 70_000 - 0 - (50_000 - 20_000);
    expect(timeLeftMs("rabbit", taken)).toBe(20_000);
    expect(isOutOfTime("rabbit", taken)).toBe(false);
  });

  it("carries into a kept run opened again: what was left when it was kept", () => {
    expect(timeLeftMs("fox", 170_000)).toBe(10_000);
    expect(isOutOfTime("fox", 170_000 + 9_999)).toBe(false);
    expect(isOutOfTime("fox", 180_000)).toBe(true);
  });

  it("runs out exactly at the allowance, and never with no clock", () => {
    expect(isOutOfTime("rabbit", 59_999)).toBe(false);
    expect(isOutOfTime("rabbit", 60_000)).toBe(true);
    expect(isOutOfTime("none", 10 * 60 * 60 * 1000)).toBe(false);
  });

  it("reads 1:00 until a whole second has gone and 0:00 only at the end", () => {
    expect(clockText(countdownSeconds(60_000) * 1000)).toBe("1:00");
    expect(clockText(countdownSeconds(59_001) * 1000)).toBe("1:00");
    expect(clockText(countdownSeconds(59_000) * 1000)).toBe("0:59");
    expect(clockText(countdownSeconds(1) * 1000)).toBe("0:01");
    expect(clockText(countdownSeconds(0) * 1000)).toBe("0:00");
  });

  it("is urgent in the last ten seconds only", () => {
    expect(isUrgent(10_001)).toBe(false);
    expect(isUrgent(10_000)).toBe(true);
    expect(isUrgent(1)).toBe(true);
    expect(isUrgent(0)).toBe(false);
    expect(isUrgent(null)).toBe(false);
  });
});

describe("what a screen reader hears", () => {
  it("is the minute marks and the last ten seconds, the same words between marks", () => {
    const heard = new Set<string>();
    for (let left = 300_000; left >= 0; left -= 250) heard.add(countdownSaying("tortoise", left));
    expect([...heard]).toEqual(["", "4 minutes left.", "3 minutes left.", "2 minutes left.", "One minute left.", "Ten seconds left.", "Time is up."]);
  });

  it("says nothing at the start of a Rabbit, then the ten seconds", () => {
    expect(countdownSaying("rabbit", 60_000)).toBe("");
    expect(countdownSaying("rabbit", 30_000)).toBe("");
    expect(countdownSaying("rabbit", 9_000)).toBe("Ten seconds left.");
    expect(countdownSaying("none", 9_000)).toBe("");
  });
});

describe("the clock in a puzzle's address", () => {
  it("is written only when there is one, and read back", () => {
    expect(puzzleQuery({ size: 9, level: "easy", seed: 5, clock: "rabbit" })).toBe("?size=9&level=easy&seed=5&clock=rabbit");
    expect(puzzleQuery({ size: 9, level: "easy", seed: 5, clock: "none" })).toBe("?size=9&level=easy&seed=5");
    for (const clock of PUZZLE_CLOCK_LIST) {
      expect(puzzleAsked("numberPlace", read(puzzleQuery({ size: 9, level: "easy", seed: 5, clock }))).clock).toBe(clock);
      expect(puzzleAsked("gomoji", read(puzzleQuery({ size: 5, level: "easy", seed: 5, clock }))).clock).toBe(clock);
    }
  });

  it("is none for a clock nobody offers, and on a puzzle that offers none", () => {
    expect(puzzleAsked("numberPlace", { clock: "snail" }).clock).toBe("none");
    expect(puzzleAsked("tsunagi", { size: "5", seed: "3", clock: "rabbit" }).clock).toBe("none");
    expect(puzzleAsked("kumimoji", { clock: "fox" }).clock).toBe("none");
  });

  it("comes back from a kept run, so Continue opens it on the same clock", () => {
    const run = { size: 9, level: "medium", seed: 11, checksAllowed: null, hintsAllowed: false, strict: false, clock: "fox" };
    expect(keptRunAsked("numberPlace", run).clock).toBe("fox");
    expect(puzzleQuery(keptRunAsked("numberPlace", run))).toBe("?size=9&level=medium&seed=11&clock=fox");
    // A run kept before clocks existed has none.
    expect(keptRunAsked("numberPlace", { ...run, clock: undefined }).clock).toBe("none");
  });
});
