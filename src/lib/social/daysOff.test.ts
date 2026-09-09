import { describe, expect, it } from "vitest";

import {
  MOST_DAYS_OFF,
  WEEKDAYS,
  WEEKDAY_DISPLAY,
  cleanDaysOff,
  daysOffGraceMs,
  weekdayIn,
} from "./daysOff";

/**
 * The days of the week somebody does not play.
 *
 * The thing worth being careful about is whose days they are. A player in
 * Tokyo who says "not on Sundays" means their Sunday, which is half of
 * Saturday and half of Sunday in London. Getting that wrong would take a day
 * off from the wrong end of somebody's weekend, so most of what is checked
 * here is the time zone.
 */
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** 2026-09-06 is a Sunday. */
const SUNDAY_NOON_UTC = new Date("2026-09-06T12:00:00.000Z");

describe("which days a member named", () => {
  it("keeps the days they chose, in order, once each", () => {
    expect(cleanDaysOff([6, 0, 6])).toEqual([0, 6]);
  });

  it("throws away anything that is not a day of the week", () => {
    expect(cleanDaysOff([-1, 7, 3.5, 2])).toEqual([2]);
  });

  it("refuses all seven, because that is not a preference", () => {
    // Every deadline would be postponed for ever and no game could end.
    expect(cleanDaysOff([0, 1, 2, 3, 4, 5, 6])).toEqual([]);
    expect(MOST_DAYS_OFF).toBe(6);
  });

  it("allows six, which is somebody who plays one day a week", () => {
    expect(cleanDaysOff([0, 1, 2, 3, 4, 5])).toHaveLength(6);
  });

  it("has a name for every day, in both scripts", () => {
    for (const day of WEEKDAYS) {
      expect(WEEKDAY_DISPLAY[day].label.length).toBeGreaterThan(2);
      expect(WEEKDAY_DISPLAY[day].short).toHaveLength(3);
      expect(WEEKDAY_DISPLAY[day].kanji).toHaveLength(1);
    }
  });
});

describe("what day it is where the member is", () => {
  it("reads the day in their own zone, not the server's", () => {
    // Sunday noon UTC is Sunday in London and Sunday evening in Tokyo…
    expect(weekdayIn(SUNDAY_NOON_UTC, "Europe/London")).toBe(0);
    expect(weekdayIn(SUNDAY_NOON_UTC, "Asia/Tokyo")).toBe(0);
    // …but Sunday 22:00 UTC is already Monday in Tokyo.
    const late = new Date("2026-09-06T22:00:00.000Z");
    expect(weekdayIn(late, "Europe/London")).toBe(0);
    expect(weekdayIn(late, "Asia/Tokyo")).toBe(1);
  });

  it("falls back to the server's own day when no zone is set", () => {
    expect(weekdayIn(SUNDAY_NOON_UTC, "")).toBe(SUNDAY_NOON_UTC.getUTCDay());
  });

  it("does not throw on a zone nobody recognises", () => {
    expect(() => weekdayIn(SUNDAY_NOON_UTC, "Mars/Olympus")).not.toThrow();
  });
});

describe("a deadline that lands on a day off", () => {
  it("is left alone when the member named no days", () => {
    expect(daysOffGraceMs([], "Europe/London", SUNDAY_NOON_UTC)).toBe(0);
  });

  it("is left alone when it falls on a day they do play", () => {
    // They take Saturdays off; this is a Sunday.
    expect(daysOffGraceMs([6], "Europe/London", SUNDAY_NOON_UTC)).toBe(0);
  });

  it("moves to the end of the day when it falls on one", () => {
    // Sunday noon UTC, Sundays off, in UTC: twelve hours to midnight.
    expect(daysOffGraceMs([0], "UTC", SUNDAY_NOON_UTC)).toBe(12 * HOUR);
  });

  it("moves past a whole run of them", () => {
    // Saturday and Sunday off, deadline on Saturday noon: to Monday midnight.
    const saturday = new Date("2026-09-05T12:00:00.000Z");
    expect(daysOffGraceMs([6, 0], "UTC", saturday)).toBe(12 * HOUR + DAY);
  });

  it("measures the day where the member is", () => {
    /*
     * Sunday 20:00 UTC is Monday 05:00 in Tokyo. Somebody in Tokyo who takes
     * Sundays off is already past it and owed nothing; somebody in London is
     * still in their Sunday and gets the four hours to midnight.
     */
    const evening = new Date("2026-09-06T20:00:00.000Z");
    expect(daysOffGraceMs([0], "Asia/Tokyo", evening)).toBe(0);
    expect(daysOffGraceMs([0], "Europe/London", evening)).toBe(3 * HOUR);
  });

  it("gives nothing back for a day off that merely went by", () => {
    // The point is not to be asked to move on a day you do not play. A
    // deadline on a Monday is a Monday deadline, whatever the weekend held.
    const monday = new Date("2026-09-07T12:00:00.000Z");
    expect(daysOffGraceMs([6, 0], "UTC", monday)).toBe(0);
  });

  it("never postpones a deadline beyond a week", () => {
    // Six days off is the most anybody may take, so a run always ends.
    const grace = daysOffGraceMs([0, 1, 2, 3, 4, 5], "UTC", SUNDAY_NOON_UTC);
    expect(grace).toBeGreaterThan(0);
    expect(grace).toBeLessThanOrEqual(7 * DAY);
  });

  it("postpones nothing at all when every day was named", () => {
    // All seven is refused, so it reads as no days off rather than as a game
    // that can never end.
    expect(daysOffGraceMs([0, 1, 2, 3, 4, 5, 6], "UTC", SUNDAY_NOON_UTC)).toBe(0);
  });

  it("lands the deadline on a day they do play", () => {
    for (const days of [[0], [6, 0], [1, 2, 3]]) {
      for (const hour of [0, 6, 12, 23]) {
        const at = new Date(Date.UTC(2026, 8, 6, hour));
        const moved = new Date(at.getTime() + daysOffGraceMs(days, "UTC", at));
        expect(days).not.toContain(weekdayIn(moved, "UTC"));
      }
    }
  });
});
