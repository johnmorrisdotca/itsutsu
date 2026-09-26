import { describe, expect, it } from "vitest";

import { startOfMonth, startOfWeek } from "./puzzleBoards";

describe("where the weekly and monthly boards start", () => {
  it("a week starts on Monday at midnight UTC, whatever day it is", () => {
    // Saturday 26 September 2026, late in the day: the week began on Monday the 21st.
    expect(startOfWeek(new Date("2026-09-26T23:30:00Z")).toISOString()).toBe("2026-09-21T00:00:00.000Z");
    // A Monday is its own week's first day, from its first moment.
    expect(startOfWeek(new Date("2026-09-21T00:00:00Z")).toISOString()).toBe("2026-09-21T00:00:00.000Z");
    // A Sunday belongs to the week that began six days before, across a month's end.
    expect(startOfWeek(new Date("2026-11-01T12:00:00Z")).toISOString()).toBe("2026-10-26T00:00:00.000Z");
  });

  it("a month starts on the first at midnight UTC", () => {
    expect(startOfMonth(new Date("2026-09-26T23:30:00Z")).toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
});
