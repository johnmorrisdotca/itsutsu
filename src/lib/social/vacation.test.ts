import { describe, expect, it } from "vitest";

import { awayDays, graceMs, timeOffGraceMs } from "./vacation";

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

/**
 * The two kinds of time off, together.
 *
 * A holiday is a span of dates out of a small yearly allowance; days off are
 * standing and cost nothing. Both hold a deadline back, and the order they
 * are applied in is not a detail: pushing a deadline out of a holiday can
 * land it on a Sunday, and somebody who does not play on Sundays is owed
 * that too.
 */
describe("a holiday and a standing day off together", () => {
  const HOUR = 3_600_000;
  // 2026-09-04 is a Friday; 2026-09-06 a Sunday.
  const since = new Date("2026-09-04T00:00:00.000Z");
  const deadline = new Date("2026-09-04T12:00:00.000Z");

  it("gives nothing when the member asked for neither", () => {
    expect(timeOffGraceMs({ away: null, daysOff: [], timeZone: "UTC" }, since, deadline)).toBe(0);
  });

  it("gives the holiday alone when no day was named", () => {
    const away = { from: new Date("2026-09-04T06:00:00.000Z"), until: new Date("2026-09-04T18:00:00.000Z") };
    const grace = timeOffGraceMs({ away, daysOff: [], timeZone: "UTC" }, since, deadline);
    expect(grace).toBe(6 * HOUR);
  });

  it("steps over a Sunday the holiday pushed it onto", () => {
    /*
     * The case the order exists for. A holiday to Sunday noon moves the
     * deadline from Friday noon to Sunday noon; a player who does not play
     * on Sundays should then get the rest of that Sunday, not be asked to
     * move on it.
     */
    const away = { from: new Date("2026-09-04T00:00:00.000Z"), until: new Date("2026-09-06T12:00:00.000Z") };
    const off = { away, daysOff: [0], timeZone: "UTC" };
    const grace = timeOffGraceMs(off, since, deadline);
    const landed = new Date(deadline.getTime() + grace);
    expect(landed.getUTCDay()).not.toBe(0);
    // Monday, once the Sunday it was pushed onto has been stepped over.
    expect(landed.toISOString()).toBe("2026-09-07T00:00:00.000Z");
  });

  it("gives the day off alone when there is no holiday", () => {
    const sunday = new Date("2026-09-06T12:00:00.000Z");
    const grace = timeOffGraceMs({ away: null, daysOff: [0], timeZone: "UTC" }, since, sunday);
    expect(grace).toBe(12 * HOUR);
  });
});
