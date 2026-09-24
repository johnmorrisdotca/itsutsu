import { describe, expect, it } from "vitest";

import { RACE_SITTING_MS, canFinish, canStart, raceOutcome, seatState } from "./raceState";

const at = (ms: number) => new Date(ms);

describe("a seat's state", () => {
  it("waits until Start, solves after it, and has given up when the sitting runs out", () => {
    expect(seatState({ startedAt: null, finishedAt: null }, at(10))).toEqual({ state: "waiting" });
    expect(seatState({ startedAt: at(10), finishedAt: null }, at(20))).toEqual({ state: "solving", since: at(10) });
    expect(seatState({ startedAt: at(10), finishedAt: null }, at(10 + RACE_SITTING_MS + 1))).toEqual({ state: "gaveUp" });
    expect(seatState({ startedAt: at(10), finishedAt: at(70) }, at(1000))).toEqual({ state: "finished", elapsedMs: 60 });
  });

  it("may start only while waiting, and finish only while solving", () => {
    expect(canStart({ state: "waiting" })).toBe(true);
    expect(canStart({ state: "solving", since: at(1) })).toBe(false);
    expect(canFinish({ state: "solving", since: at(1) })).toBe(true);
    expect(canFinish({ state: "finished", elapsedMs: 5 })).toBe(false);
    expect(canFinish({ state: "gaveUp" })).toBe(false);
  });
});

describe("who won", () => {
  it("is not over while a seat is waiting or solving", () => {
    expect(raceOutcome({ state: "finished", elapsedMs: 5 }, { state: "waiting" })).toEqual({ over: false });
    expect(raceOutcome({ state: "finished", elapsedMs: 5 }, { state: "solving", since: at(1) })).toEqual({ over: false });
  });

  it("is the faster finish, the only finish, nobody for a tie, and nobody when both gave up", () => {
    expect(raceOutcome({ state: "finished", elapsedMs: 5 }, { state: "finished", elapsedMs: 9 })).toEqual({ over: true, winner: "host" });
    expect(raceOutcome({ state: "finished", elapsedMs: 9 }, { state: "finished", elapsedMs: 5 })).toEqual({ over: true, winner: "guest" });
    expect(raceOutcome({ state: "gaveUp" }, { state: "finished", elapsedMs: 5 })).toEqual({ over: true, winner: "guest" });
    expect(raceOutcome({ state: "finished", elapsedMs: 5 }, { state: "finished", elapsedMs: 5 })).toEqual({ over: true, winner: null });
    expect(raceOutcome({ state: "gaveUp" }, { state: "gaveUp" })).toEqual({ over: true, winner: null });
  });
});
