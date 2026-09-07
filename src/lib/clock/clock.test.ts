import { describe, expect, it } from "vitest";
import {
  completeMove,
  formatDuration,
  hasClock,
  readClock,
  startClock,
  tick,
} from "./clock";
import { TIME_CONTROLS } from "./clock.constants";
import type { TimeControl } from "./clock.types";

/** Ten seconds of main time, then two five-second periods. */
const SHORT: TimeControl = { mainMs: 10_000, byoyomiMs: 5_000, periods: 2 };

describe("hasClock", () => {
  it("is false for a game with no time control", () => {
    expect(hasClock(TIME_CONTROLS.none)).toBe(false);
  });

  it("is true for every preset that runs a clock", () => {
    for (const name of ["blitz", "rapid", "classical"] as const) {
      expect(hasClock(TIME_CONTROLS[name])).toBe(true);
    }
  });
});

describe("main time", () => {
  it("counts down without touching the periods", () => {
    const clock = tick(startClock(SHORT), 4_000, SHORT);

    expect(clock.mainMs).toBe(6_000);
    expect(clock.inByoyomi).toBe(false);
    expect(clock.periodsLeft).toBe(2);
  });

  it("drops into byoyomi with a full period when it runs out", () => {
    const clock = tick(startClock(SHORT), 10_000, SHORT);

    expect(clock.mainMs).toBe(0);
    expect(clock.inByoyomi).toBe(true);
    expect(clock.periodMs).toBe(5_000);
    expect(clock.flagged).toBe(false);
  });

  it("carries the overspill into the first period", () => {
    const clock = tick(startClock(SHORT), 12_000, SHORT);

    expect(clock.inByoyomi).toBe(true);
    expect(clock.periodMs).toBe(3_000);
    expect(clock.periodsLeft).toBe(2);
  });

  it("flags immediately when there is no byoyomi to fall into", () => {
    const suddenDeath: TimeControl = { mainMs: 5_000, byoyomiMs: 0, periods: 0 };
    expect(tick(startClock(suddenDeath), 5_000, suddenDeath).flagged).toBe(true);
  });
});

describe("byoyomi", () => {
  it("gives the period back when the move is finished inside it", () => {
    let clock = tick(startClock(SHORT), 13_000, SHORT);
    expect(clock.periodMs).toBe(2_000);

    clock = completeMove(clock, SHORT);

    // The period is whole again, and none was spent.
    expect(clock.periodMs).toBe(5_000);
    expect(clock.periodsLeft).toBe(2);
  });

  it("consumes a period when one is used up", () => {
    const clock = tick(startClock(SHORT), 15_000, SHORT);

    expect(clock.periodsLeft).toBe(1);
    expect(clock.periodMs).toBe(5_000);
    expect(clock.flagged).toBe(false);
  });

  it("burns through several periods in one long think", () => {
    const clock = tick(startClock(SHORT), 19_000, SHORT);

    expect(clock.periodsLeft).toBe(1);
    expect(clock.periodMs).toBe(1_000);
  });

  it("flags once the last period is gone", () => {
    const clock = tick(startClock(SHORT), 30_000, SHORT);

    expect(clock.flagged).toBe(true);
    expect(clock.periodsLeft).toBe(0);
  });

  it("stays flagged and stops changing", () => {
    const flagged = tick(startClock(SHORT), 30_000, SHORT);
    expect(tick(flagged, 5_000, SHORT)).toBe(flagged);
    expect(completeMove(flagged, SHORT)).toBe(flagged);
  });

  it("leaves main time alone when a move finishes before byoyomi", () => {
    const clock = tick(startClock(SHORT), 3_000, SHORT);
    expect(completeMove(clock, SHORT)).toBe(clock);
  });
});

describe("a control that is byoyomi from the start", () => {
  const immediate: TimeControl = { mainMs: 0, byoyomiMs: 5_000, periods: 1 };

  it("begins in byoyomi", () => {
    const clock = startClock(immediate);
    expect(clock.inByoyomi).toBe(true);
    expect(clock.periodMs).toBe(5_000);
  });

  it("flags when its only period runs out", () => {
    expect(tick(startClock(immediate), 5_000, immediate).flagged).toBe(true);
  });
});

describe("formatDuration", () => {
  it("reads as minutes and seconds", () => {
    expect(formatDuration(725_000)).toBe("12:05");
    expect(formatDuration(60_000)).toBe("1:00");
  });

  it("reads in tenths once it is nearly out", () => {
    expect(formatDuration(8_400)).toBe("8.4");
  });

  it("never reads below zero", () => {
    expect(formatDuration(-500)).toBe("0.0");
  });
});

describe("readClock", () => {
  it("reports main time before byoyomi and period time after", () => {
    const main = tick(startClock(TIME_CONTROLS.rapid), 60_000, TIME_CONTROLS.rapid);
    expect(readClock(main)).toMatchObject({ time: "9:00", byoyomi: false });

    const byoyomi = tick(startClock(SHORT), 11_000, SHORT);
    expect(readClock(byoyomi)).toMatchObject({ byoyomi: true, periodsLeft: 2 });
  });
});
