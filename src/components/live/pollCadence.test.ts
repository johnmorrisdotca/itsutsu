import { afterEach, describe, expect, it, vi } from "vitest";

import { MOVE_TIME_OPTIONS } from "@/lib/history/gameSettingsSchema";
import { IDLE_STOP_MS, POLL_MS, POLL_RELIEF_FLOOR_MS } from "./live.constants";
import { pollEvery, pollInterval } from "./pollCadence";

/*
 * John, 2026-09-15: "we have to stop doing things like that that will eat up
 * CPU time." Every ask is a paid function call, so the numbers themselves are
 * held here, not only the choice between them.
 */
describe("how often a live board asks what has happened", () => {
  const every = POLL_MS;

  it("asks every POLL_MS while somebody is looking at a game in play", () => {
    expect(pollInterval({ polling: true, awake: true, visible: true, every })).toBe(POLL_MS);
  });

  it("asks nothing at all from a hidden tab, awake or not", () => {
    expect(pollInterval({ polling: true, awake: true, visible: false, every })).toBe(0);
    expect(pollInterval({ polling: true, awake: false, visible: false, every })).toBe(0);
  });

  it("stops asking once nothing has happened for the idle window, even while looked at", () => {
    expect(pollInterval({ polling: true, awake: false, visible: true, every })).toBe(0);
  });

  it("stops asking once the game is over, looked at or not", () => {
    expect(pollInterval({ polling: false, awake: true, visible: true, every })).toBe(0);
    expect(pollInterval({ polling: false, awake: true, visible: false, every })).toBe(0);
  });

  it("asks no more often than every fifteen seconds", () => {
    expect(POLL_MS).toBeGreaterThanOrEqual(15_000);
  });

  it("stops within minutes of nothing happening, not an hour", () => {
    expect(IDLE_STOP_MS).toBeLessThanOrEqual(10 * 60_000);
    expect(IDLE_STOP_MS).toBeGreaterThan(POLL_MS);
  });

  it("never sleeps inside one move of the fastest clock this site offers", () => {
    const fastest = Math.min(...MOVE_TIME_OPTIONS.filter((ms): ms is number => ms !== null));
    expect(IDLE_STOP_MS).toBeGreaterThan(fastest);
  });
});

describe("the end-to-end suite's relief on the cadence", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is ignored in production, whatever it is set to", () => {
    expect(pollEvery({ nodeEnv: "production", relief: "6" })).toBe(POLL_MS);
    expect(pollEvery({ nodeEnv: "production", relief: "1000" })).toBe(POLL_MS);
  });

  it("divides the cadence where it is asked for", () => {
    expect(pollEvery({ nodeEnv: "development", relief: "6" })).toBe(POLL_MS / 6);
  });

  it("changes nothing where nobody set it, or set it to nothing sensible", () => {
    for (const relief of [undefined, "", "0", "-3", "0.5", "soon"]) {
      expect(pollEvery({ nodeEnv: "development", relief }), String(relief)).toBe(POLL_MS);
    }
  });

  it("cannot make a board ask faster than once a second", () => {
    expect(pollEvery({ nodeEnv: "development", relief: "1000" })).toBe(POLL_RELIEF_FLOOR_MS);
  });

  it("reads the real environment, and production still wins there", () => {
    vi.stubEnv("NEXT_PUBLIC_LIVE_POLL_RELIEF", "6");
    vi.stubEnv("NODE_ENV", "development");
    expect(pollEvery()).toBe(POLL_MS / 6);
    vi.stubEnv("NODE_ENV", "production");
    expect(pollEvery()).toBe(POLL_MS);
    expect(pollInterval({ polling: true, awake: true, visible: true })).toBe(POLL_MS);
  });
});
