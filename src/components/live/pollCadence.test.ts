import { afterEach, describe, expect, it, vi } from "vitest";

import { MOVE_TIME_OPTIONS } from "@/lib/history/gameSettingsSchema";
import { IDLE_STOP_MS, POLL_FAST_MS, POLL_MS, POLL_RELIEF_FLOOR_MS, PRESENT_WITHIN_MS } from "./live.constants";
import { pollEvery, pollInterval, waitingOnSomebodyHere } from "./pollCadence";

/*
 * John, 2026-09-15: "we have to stop doing things like that that will eat up
 * CPU time." Every ask is a paid function call, so the numbers themselves are
 * held here, not only the choice between them.
 */
describe("how often a live board asks what has happened", () => {
  const every = POLL_MS;
  const fast = POLL_FAST_MS;

  /*
   * EVERY COMBINATION, not a sample: visible or hidden, the other player here
   * or not, the game active or finished, the board awake or asleep. Only one
   * row in sixteen asks fast, and only two ask at all.
   */
  const flags = [true, false] as const;
  for (const visible of flags)
    for (const otherHere of flags)
      for (const polling of flags)
        for (const awake of flags) {
          const expected = !visible || !polling || !awake ? 0 : otherHere ? POLL_FAST_MS : POLL_MS;
          it(`${visible ? "visible" : "hidden"}, other ${otherHere ? "here" : "away"}, ${polling ? "active" : "finished"}, ${awake ? "awake" : "asleep"}: ${expected} ms`, () => {
            expect(pollInterval({ polling, awake, visible, otherHere, every, fast })).toBe(expected);
          });
        }

  it("asks no more often than every fifteen seconds unless the player it waits on is here", () => {
    expect(POLL_MS).toBeGreaterThanOrEqual(15_000);
  });

  it("asks no more often than every three seconds even then — John's exception, and no wider", () => {
    expect(POLL_FAST_MS).toBeGreaterThanOrEqual(3_000);
    expect(POLL_FAST_MS).toBeLessThan(POLL_MS);
  });

  it("asks fast at a cadence SWR really keeps, which the suite's floor cannot raise", () => {
    const SWR_DEDUPING_MS = 2_000;
    expect(POLL_FAST_MS).toBeGreaterThan(SWR_DEDUPING_MS);
    expect(POLL_FAST_MS).toBeGreaterThanOrEqual(POLL_RELIEF_FLOOR_MS);
  });

  it("counts a player as here for two minutes, which a board asking at either cadence keeps stamped", () => {
    expect(PRESENT_WITHIN_MS).toBe(2 * 60_000);
    // Stamped at most once a minute (`TOUCH_EVERY_MS`), so the gap between stamps is under a minute and one ask.
    expect(PRESENT_WITHIN_MS).toBeGreaterThan(60_000 + POLL_MS);
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

describe("whether a board is waiting on somebody who is here", () => {
  const both = { black: true, white: true };
  const seats = { blackMemberId: "kuro", whiteMemberId: "shiro" };

  it("is the seat to move, when that is the other player and they are here", () => {
    expect(waitingOnSomebodyHere({ here: both, toPlay: "white", seat: "black", ...seats })).toBe(true);
    expect(waitingOnSomebodyHere({ here: { black: true, white: false }, toPlay: "white", seat: "black", ...seats })).toBe(false);
  });

  it("is never the reader's own turn: nothing is coming", () => {
    expect(waitingOnSomebodyHere({ here: both, toPlay: "black", seat: "black", ...seats })).toBe(false);
  });

  it("is the player to move, for a spectator", () => {
    expect(waitingOnSomebodyHere({ here: { black: false, white: true }, toPlay: "white", seat: null, ...seats })).toBe(true);
    expect(waitingOnSomebodyHere({ here: { black: true, white: false }, toPlay: "white", seat: null, ...seats })).toBe(false);
  });

  it("is never a game where one member holds both seats", () => {
    const one = { blackMemberId: "kuro", whiteMemberId: "kuro" };
    expect(waitingOnSomebodyHere({ here: both, toPlay: "white", seat: "black", ...one })).toBe(false);
  });

  it("is not known, and so not fast, before an answer has said who is here", () => {
    expect(waitingOnSomebodyHere({ here: null, toPlay: "white", seat: "black", ...seats })).toBe(false);
  });
});

describe("the end-to-end suite's relief on the cadence", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is ignored in production, whatever it is set to, at either cadence", () => {
    expect(pollEvery({ nodeEnv: "production", relief: "6" })).toBe(POLL_MS);
    expect(pollEvery({ nodeEnv: "production", relief: "1000" })).toBe(POLL_MS);
    expect(pollEvery({ nodeEnv: "production", relief: "6", suite: "" })).toBe(POLL_MS);
    expect(pollEvery({ nodeEnv: "production", relief: "6" }, POLL_FAST_MS)).toBe(POLL_FAST_MS);
    expect(pollEvery({ nodeEnv: "production", relief: "1000", suite: "" }, POLL_FAST_MS)).toBe(POLL_FAST_MS);
  });

  it("applies on the suite's own production build, which says so (`suiteServer.ts`)", () => {
    expect(pollEvery({ nodeEnv: "production", relief: "6", suite: "1" })).toBeLessThan(POLL_MS);
  });

  it("divides whichever cadence applies where it is asked for, down to the same floor", () => {
    expect(pollEvery({ nodeEnv: "development", relief: "3" })).toBe(POLL_MS / 3);
    // Three seconds halved is under the floor, so at any relief the floor decides the fast cadence.
    expect(pollEvery({ nodeEnv: "development", relief: "2" }, POLL_FAST_MS)).toBe(
      Math.max(POLL_RELIEF_FLOOR_MS, POLL_FAST_MS / 2),
    );
    expect(pollEvery({ nodeEnv: "development", relief: "20" }, POLL_FAST_MS)).toBe(POLL_RELIEF_FLOOR_MS);
  });

  it("divides the operator's own intervals the same way, and never makes one slower than it was set", () => {
    // The site panel's settings reach the board as `base` (`liveBoardIntervals`).
    expect(pollEvery({ nodeEnv: "development", relief: "2" }, 40_000)).toBe(20_000);
    expect(pollEvery({ nodeEnv: "development", relief: "20" }, 2_000)).toBe(2_000);
    expect(pollEvery({ nodeEnv: "production", relief: "20" }, 2_000)).toBe(2_000);
    expect(pollEvery({ nodeEnv: "production", relief: "20" }, 40_000)).toBe(40_000);
  });

  it("changes nothing where nobody set it, or set it to nothing sensible", () => {
    for (const relief of [undefined, "", "0", "-3", "0.5", "soon"]) {
      expect(pollEvery({ nodeEnv: "development", relief }), String(relief)).toBe(POLL_MS);
    }
  });

  it("cannot make a board ask faster than SWR would really ask", () => {
    /*
     * SWR drops an ask made within its two-second `dedupingInterval` of the
     * last, so a floor at or under it would have the page state a cadence it
     * does not keep — which is what a floor of one second did at the suite's
     * relief of 20, measured by e2e/live-poll-cadence.spec.ts.
     */
    const SWR_DEDUPING_MS = 2_000;
    expect(POLL_RELIEF_FLOOR_MS).toBeGreaterThan(SWR_DEDUPING_MS);
    expect(pollEvery({ nodeEnv: "development", relief: "1000" })).toBe(POLL_RELIEF_FLOOR_MS);
    // The suite's own RATE_LIMIT_RELIEF is 20, which the floor holds.
    expect(pollEvery({ nodeEnv: "development", relief: "20" })).toBe(POLL_RELIEF_FLOOR_MS);
  });

  it("reads the real environment, and production still wins there", () => {
    vi.stubEnv("LIVE_POLL_RELIEF", "3");
    vi.stubEnv("NODE_ENV", "development");
    expect(pollEvery()).toBe(POLL_MS / 3);
    vi.stubEnv("NODE_ENV", "production");
    expect(pollEvery()).toBe(POLL_MS);
    expect(pollInterval({ polling: true, awake: true, visible: true, otherHere: false })).toBe(POLL_MS);
    expect(pollInterval({ polling: true, awake: true, visible: true, otherHere: true })).toBe(POLL_FAST_MS);
  });

  it("is the suite's RATE_LIMIT_RELIEF, handed over by next.config.ts, and nothing where that is unset", async () => {
    vi.stubEnv("RATE_LIMIT_RELIEF", "20");
    vi.resetModules();
    const relieved = (await import("../../../next.config")).default;
    expect(relieved.env?.LIVE_POLL_RELIEF).toBe("20");

    vi.stubEnv("RATE_LIMIT_RELIEF", undefined);
    vi.resetModules();
    const plain = (await import("../../../next.config")).default;
    expect(plain.env?.LIVE_POLL_RELIEF).toBe("");
    expect(pollEvery({ nodeEnv: "development", relief: plain.env?.LIVE_POLL_RELIEF })).toBe(POLL_MS);
  });
});
