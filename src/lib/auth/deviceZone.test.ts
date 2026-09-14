import { describe, expect, it } from "vitest";

import { zoneWorthRecording } from "./deviceZone";

/**
 * What a browser's zone is worth writing.
 *
 * The case that matters is the second one. Before it existed, a member whose
 * browser agreed with the country's guess sent the same value back on every page
 * load — the row still read as a guess afterwards, so the sender mounted again,
 * and again. One write ever was the promise; a write per page was the behaviour.
 */
describe("whether a device's zone is worth a write", () => {
  it("records a zone where nothing is held", () => {
    expect(zoneWorthRecording("America/Vancouver", null)).toBe("America/Vancouver");
  });

  it("writes nothing when the device agrees with the guess already held", () => {
    expect(zoneWorthRecording("America/Toronto", "America/Toronto")).toBeNull();
  });

  it("replaces a guess the device disagrees with: a measurement beats an inference", () => {
    // John's own case. Canada guesses Toronto; he is in Vancouver.
    expect(zoneWorthRecording("America/Vancouver", "America/Toronto")).toBe("America/Vancouver");
  });

  it("writes nothing for a browser that will not say", () => {
    expect(zoneWorthRecording(null, null)).toBeNull();
    expect(zoneWorthRecording("   ", "America/Toronto")).toBeNull();
  });
});
