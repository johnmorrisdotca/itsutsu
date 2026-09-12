import { describe, expect, it } from "vitest";

import { isNewDay, isWeekend, xpDayKey, xpWeekKey } from "./xpDay";

/**
 * The day, for somebody.
 *
 * Every case here uses a fixed instant. A test that asks `new Date()` what day
 * it is passes until the suite is run near midnight in whichever zone the
 * machine is in, and then fails in a file about something else.
 */

describe("the day an instant falls on", () => {
  it("reads as YYYY-MM-DD, which sorts", () => {
    expect(xpDayKey(new Date("2026-09-12T12:00:00.000Z"))).toBe("2026-09-12");
    expect(xpDayKey(new Date("2026-01-05T12:00:00.000Z"))).toBe("2026-01-05");
  });

  it("answers in the member's own zone, not the server's", () => {
    // Half past six in the evening UTC is already tomorrow in Tokyo. UmaKuma
    // hardcodes Vancouver; this site has members in Japan, Estonia and Canada,
    // and a fixed zone would end somebody's day in the afternoon and break a
    // streak on a day they played.
    const evening = new Date("2026-09-12T18:30:00.000Z");
    expect(xpDayKey(evening, "Asia/Tokyo")).toBe("2026-09-13");
    expect(xpDayKey(evening, "America/Vancouver")).toBe("2026-09-12");
    expect(xpDayKey(evening, "Europe/Tallinn")).toBe("2026-09-12");
  });

  it("treats no zone as UTC, which is the ordinary case", () => {
    // Member.timeZone is @default(""), so empty is most rows rather than an error.
    const at = new Date("2026-09-12T23:30:00.000Z");
    expect(xpDayKey(at, "")).toBe("2026-09-12");
    expect(xpDayKey(at, null)).toBe("2026-09-12");
    expect(xpDayKey(at, undefined)).toBe("2026-09-12");
  });

  it("falls back to UTC on a zone it cannot read, rather than throwing", () => {
    // The zone is a profile field a member typed. A day key off by a few hours
    // costs them one streak day; an exception costs them the page.
    expect(xpDayKey(new Date("2026-09-12T12:00:00.000Z"), "Mars/Olympus")).toBe("2026-09-12");
  });
});

describe("whether it is a new day", () => {
  it("is false within one day and true across the boundary", () => {
    const morning = new Date("2026-09-12T08:00:00.000Z");
    const evening = new Date("2026-09-12T22:00:00.000Z");
    const tomorrow = new Date("2026-09-13T01:00:00.000Z");

    expect(isNewDay(morning, evening)).toBe(false);
    expect(isNewDay(morning, tomorrow)).toBe(true);
  });

  it("crosses where the member's own day crosses", () => {
    // For a member in Tokyo these two instants are the 12th and the 13th; for
    // one in Vancouver they are both the 12th. The daily visit fires for the
    // first and not the second, which is the whole reason the zone is read.
    const before = new Date("2026-09-12T14:00:00.000Z");
    const after = new Date("2026-09-12T16:00:00.000Z");

    expect(isNewDay(before, after, "Asia/Tokyo")).toBe(true);
    expect(isNewDay(before, after, "America/Vancouver")).toBe(false);
  });
});

describe("the week, for a weekend award", () => {
  it("puts a Saturday and the Sunday after it in one week", () => {
    // The whole reason for ISO weeks rather than an invented weekend id: a
    // member who plays on both days earns the award once.
    const saturday = new Date("2026-09-12T12:00:00.000Z");
    const sunday = new Date("2026-09-13T12:00:00.000Z");
    expect(xpWeekKey(saturday)).toBe(xpWeekKey(sunday));
  });

  it("puts the next weekend in a different week", () => {
    expect(xpWeekKey(new Date("2026-09-12T12:00:00.000Z"))).not.toBe(
      xpWeekKey(new Date("2026-09-19T12:00:00.000Z")),
    );
  });

  it("reads as YYYY-Www", () => {
    expect(xpWeekKey(new Date("2026-09-12T12:00:00.000Z"))).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("keeps the Friday before out of the weekend's week only where it should", () => {
    // Friday the 11th is the same ISO week as Saturday the 12th — the week runs
    // Monday to Sunday. So the week key alone does not decide a weekend;
    // `isWeekend` does, and the key only decides how often.
    expect(xpWeekKey(new Date("2026-09-11T12:00:00.000Z"))).toBe(
      xpWeekKey(new Date("2026-09-12T12:00:00.000Z")),
    );
  });
});

describe("whether it is the weekend", () => {
  it("is true on a Saturday and a Sunday and false on the weekdays", () => {
    expect(isWeekend(new Date("2026-09-12T12:00:00.000Z"))).toBe(true);
    expect(isWeekend(new Date("2026-09-13T12:00:00.000Z"))).toBe(true);
    expect(isWeekend(new Date("2026-09-14T12:00:00.000Z"))).toBe(false);
    expect(isWeekend(new Date("2026-09-11T12:00:00.000Z"))).toBe(false);
  });

  it("asks about the member's own Saturday", () => {
    // Friday evening UTC is already Saturday in Tokyo, and a member there is at
    // the weekend when their calendar says so.
    const fridayEvening = new Date("2026-09-11T16:00:00.000Z");
    expect(isWeekend(fridayEvening, "Asia/Tokyo")).toBe(true);
    expect(isWeekend(fridayEvening)).toBe(false);
  });
});
