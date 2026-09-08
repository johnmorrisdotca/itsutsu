import { describe, expect, it } from "vitest";

import { awayDays, graceMs } from "./vacation";

const day = 86_400_000;
const t = (hours: number) => new Date(hours * 3_600_000);

describe("vacation grace", () => {
  it("gives nothing when the away range misses the move's window", () => {
    expect(graceMs({ from: t(100), until: t(120) }, t(0), t(24))).toBe(0);
    expect(graceMs(null, t(0), t(24))).toBe(0);
  });

  it("pushes the deadline out by the away time inside the window", () => {
    // Away for hours 10–14 of a 24-hour move: four hours of grace.
    expect(graceMs({ from: t(10), until: t(14) }, t(0), t(24))).toBe(4 * 3_600_000);
  });

  it("waits for the range to end when the pushed deadline is still inside it", () => {
    // Away from hour 20 to hour 60: the deadline at 24 waits until 60.
    expect(graceMs({ from: t(20), until: t(60) }, t(0), t(24))).toBe(36 * 3_600_000);
  });

  it("counts whole days, at least one", () => {
    expect(awayDays(new Date(0), new Date(day * 3))).toBe(3);
    expect(awayDays(new Date(0), new Date(day / 2))).toBe(1);
    expect(awayDays(new Date(0), new Date(day * 2.5))).toBe(3);
  });
});
