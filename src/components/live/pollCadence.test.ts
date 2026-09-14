import { describe, expect, it } from "vitest";

import { BACKGROUND_POLL_MS, POLL_MS } from "./live.constants";
import { pollInterval } from "./pollCadence";

describe("how often a live board asks what has happened", () => {
  it("asks every POLL_MS while somebody is looking at a game in play", () => {
    expect(pollInterval({ polling: true, awake: true, visible: true })).toBe(POLL_MS);
  });

  it("keeps asking from a hidden tab, every BACKGROUND_POLL_MS", () => {
    expect(pollInterval({ polling: true, awake: true, visible: false })).toBe(BACKGROUND_POLL_MS);
  });

  it("asks less often in the background than in front, or the slowing does nothing", () => {
    expect(BACKGROUND_POLL_MS).toBeGreaterThan(POLL_MS);
    expect(POLL_MS).toBeGreaterThan(0);
  });

  it("stops asking once the game is over, looked at or not", () => {
    expect(pollInterval({ polling: false, awake: true, visible: true })).toBe(0);
    expect(pollInterval({ polling: false, awake: true, visible: false })).toBe(0);
  });

  it("stops asking from a hidden tab that has gone to sleep", () => {
    expect(pollInterval({ polling: true, awake: false, visible: false })).toBe(0);
  });
});
