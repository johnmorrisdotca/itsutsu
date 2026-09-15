import { describe, expect, it } from "vitest";

import { RECORD_SCOPES } from "@/lib/rating/recordScope";

import { IMPORTED_XP_TYPES } from "./importedXp.constants";
import {
  xpBehindText,
  xpGainText,
  xpGainWindow,
  xpGainsFrom,
  xpGainsWhere,
  xpGapsFor,
} from "./xpGains";

/**
 * The XP board's Today, 7 days and Behind next, as arithmetic. The read that
 * feeds them is `xpBoardGains.test.ts`.
 */

describe("a member's two windows, in their own days", () => {
  it("is today and the six days before it, for a member with no zone of their own", () => {
    expect(xpGainWindow(new Date("2026-09-14T12:00:00Z"), "")).toEqual({ today: "2026-09-14", from: "2026-09-08" });
  });

  it("is THEIR today, which is already tomorrow in Tokyo", () => {
    expect(xpGainWindow(new Date("2026-09-14T20:00:00Z"), "Asia/Tokyo")).toEqual({
      today: "2026-09-15",
      from: "2026-09-09",
    });
  });

  it("crosses a month by the calendar", () => {
    expect(xpGainWindow(new Date("2026-09-03T12:00:00Z"), "UTC").from).toBe("2026-08-28");
  });
});

describe("what one read asks the ledger for", () => {
  const windows = new Map([
    ["m1", { today: "2026-09-14", from: "2026-09-08" }],
    ["m2", { today: "2026-09-15", from: "2026-09-09" }],
  ]);

  it("asks for each member from their own first day", () => {
    expect(xpGainsWhere(windows, RECORD_SCOPES.everywhere)).toEqual({
      OR: [
        { memberId: "m1", dayKey: { gte: "2026-09-08" } },
        { memberId: "m2", dayKey: { gte: "2026-09-09" } },
      ],
    });
  });

  it("leaves imported credit out under Itsutsu only, as the total it ranks by does", () => {
    const where = xpGainsWhere(windows, RECORD_SCOPES.here);
    expect(where.type).toEqual({ notIn: [...IMPORTED_XP_TYPES] });
  });
});

describe("each member's gains", () => {
  const windows = new Map([
    ["m1", { today: "2026-09-14", from: "2026-09-08" }],
    ["quiet", { today: "2026-09-14", from: "2026-09-08" }],
  ]);

  it("sums today and the seven days, and ignores what is older", () => {
    const gains = xpGainsFrom(windows, [
      { memberId: "m1", dayKey: "2026-09-14", points: 30 },
      { memberId: "m1", dayKey: "2026-09-11", points: 100 },
      { memberId: "m1", dayKey: "2026-09-08", points: 5 },
      { memberId: "m1", dayKey: "2026-09-07", points: 400 },
    ]);
    expect(gains.get("m1")).toEqual({ today: 30, week: 135 });
  });

  it("answers nought for a member the read covered and found nothing for", () => {
    expect(xpGainsFrom(windows, []).get("quiet")).toEqual({ today: 0, week: 0 });
  });

  it("answers nothing for a member the read did not cover", () => {
    const gains = xpGainsFrom(windows, [{ memberId: "stranger", dayKey: "2026-09-14", points: 9 }]);
    expect(gains.has("stranger")).toBe(false);
  });

  it("counts a day ahead of today in the week and not in today", () => {
    const gains = xpGainsFrom(windows, [{ memberId: "m1", dayKey: "2026-09-15", points: 7 }]);
    expect(gains.get("m1")).toEqual({ today: 0, week: 7 });
  });
});

describe("how far each row trails the row above", () => {
  it("is blank at the top of the board and the difference below it", () => {
    expect(xpGapsFor([100, 80, 80, 10], null)).toEqual([null, 20, 0, 70]);
  });

  it("measures a later page's first row from the row above it on the page before", () => {
    expect(xpGapsFor([100, 80], 150)).toEqual([50, 20]);
  });

  it("is negative for a row ahead of the one above, in an order that is not by XP", () => {
    expect(xpGapsFor([10, 100], null)).toEqual([null, -90]);
  });

  it("is nothing for an empty page", () => {
    expect(xpGapsFor([], 40)).toEqual([]);
  });
});

describe("as the board prints them", () => {
  it("prints a gain with its sign, nought as nought, and an unmeasured one as a dash", () => {
    expect(xpGainText(1250)).toBe("+1,250");
    expect(xpGainText(0)).toBe("0");
    expect(xpGainText(undefined)).toBe("—");
  });

  it("prints the top row's gap as nothing and a row ahead as a dash", () => {
    expect(xpBehindText(null)).toBe("");
    expect(xpBehindText(0)).toBe("0");
    expect(xpBehindText(2500)).toBe("2,500");
    expect(xpBehindText(-90)).toBe("—");
  });
});
