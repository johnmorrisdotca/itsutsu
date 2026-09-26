import { describe, expect, it } from "vitest";

import { COUNTDOWN_LIST, COUNTDOWNS, countdownBlurb, countdownOfMs, isCountdownKey, isTimeUp, ranOutOfTime, timeLeft, unsolvedWords } from "./countdown";
import { keptRunAsked, puzzleAsked, puzzleQuery } from "./puzzleAddress";
import { puzzleRulesPage } from "./puzzleRulesPage";
import { PUZZLE_KIND_LIST } from "./puzzles.constants";

const query = (text: string) => Object.fromEntries(new URLSearchParams(text.slice(1)));

describe("a countdown on any puzzle", () => {
  it("is the Tortoise's five minutes, the Fox's three or the Rabbit's one", () => {
    expect(COUNTDOWN_LIST.map((key) => COUNTDOWNS[key].ms)).toEqual([300_000, 180_000, 60_000]);
    expect(countdownOfMs(180_000)).toBe("fox");
    expect(countdownOfMs(120_000)).toBeNull();
    expect(countdownOfMs(null)).toBeNull();
    expect(isCountdownKey("rabbit")).toBe(true);
    expect(isCountdownKey("hare")).toBe(false);
  });

  it("is off unless asked for, and an address that asks for one reads back with it", () => {
    expect(puzzleAsked("numberPlace", {}).countdown).toBeUndefined();
    expect(puzzleQuery({ size: 9, level: "medium", seed: 7 })).not.toContain("countdown");
    for (const kind of ["numberPlace", "gomoji", "hiddenStones"] as const) {
      const asked = puzzleAsked(kind, query(puzzleQuery({ ...puzzleAsked(kind, {}), seed: 7, countdown: "fox" })));
      expect(asked.countdown, kind).toBe("fox");
    }
    // A fixed level keeps it too: Tsunagi's levels carry the countdown chosen at its set-up.
    expect(puzzleAsked("tsunagi", { size: "5", seed: "3", countdown: "rabbit" }).countdown).toBe("rabbit");
    expect(puzzleAsked("numberPlace", { countdown: "hare" }).countdown).toBeUndefined();
  });

  it("goes with a kept run, so Continue plays against what was chosen", () => {
    const run = { size: 9, level: "medium", seed: 7, checksAllowed: null, hintsAllowed: false, strict: false };
    expect(keptRunAsked("numberPlace", { ...run, countdownMs: 60_000 }).countdown).toBe("rabbit");
    expect(keptRunAsked("numberPlace", { ...run, countdownMs: null }).countdown).toBeUndefined();
    expect(keptRunAsked("numberPlace", run).countdown).toBeUndefined();
  });

  it("runs out only when the clock reaches it, and never below nought", () => {
    expect(isTimeUp(60_000, 59_999)).toBe(false);
    expect(isTimeUp(60_000, 60_000)).toBe(true);
    expect(isTimeUp(90_000, 90_000)).toBe(false);
    expect(timeLeft(60_000, 75_000)).toBe(0);
    expect(timeLeft(180_000, 30_000)).toBe(150_000);
  });

  it("tells a puzzle whose time ran out from a word that ran out of guesses", () => {
    expect(unsolvedWords({ solved: false, countdownMs: 60_000, elapsedMs: 60_000 })).toBe("Time's up");
    expect(unsolvedWords({ solved: false, countdownMs: 60_000, elapsedMs: 41_000 })).toBe("Not found");
    expect(unsolvedWords({ solved: false, countdownMs: null, elapsedMs: 600_000 })).toBe("Not found");
    expect(ranOutOfTime({ solved: true, countdownMs: 60_000, elapsedMs: 60_000 })).toBe(false);
  });

  it("is said under the chips and on every puzzle's rules page", () => {
    expect(countdownBlurb(null)).toMatch(/No countdown/);
    expect(countdownBlurb("fox")).toMatch(/3 minutes/);
    for (const kind of PUZZLE_KIND_LIST) {
      const page = puzzleRulesPage(kind);
      expect(JSON.stringify(page), kind).toContain("Tortoise");
    }
  });
});
