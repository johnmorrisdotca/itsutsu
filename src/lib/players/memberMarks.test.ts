import { describe, expect, it } from "vitest";

import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";

import { memberMarks, NEW_FOR_DAYS } from "./memberMarks";

const NOW = Date.parse("2026-09-24T12:00:00.000Z");
const DAY = 86_400_000;

function row(overrides: Partial<Parameters<typeof memberMarks>[0]> = {}) {
  return {
    country: "Canada",
    botTier: null,
    unclaimableBecause: null,
    createdAt: new Date(NOW - 100 * DAY),
    ...overrides,
  };
}

describe("memberMarks", () => {
  it("gives an ordinary member their flag and no badge", () => {
    expect(memberMarks(row(), NOW)).toEqual({ country: "Canada", kind: "member", isNew: false });
  });

  it("marks a person new for two weeks and not a moment after", () => {
    expect(memberMarks(row({ createdAt: new Date(NOW - (NEW_FOR_DAYS - 1) * DAY) }), NOW).isNew).toBe(true);
    expect(memberMarks(row({ createdAt: new Date(NOW - NEW_FOR_DAYS * DAY) }), NOW).isNew).toBe(false);
  });

  it("calls a program a bot, and never new, however recently its row was made", () => {
    expect(memberMarks(row({ botTier: "kyu", createdAt: new Date(NOW - DAY) }), NOW)).toEqual({
      country: "Canada",
      kind: "robot",
      isNew: false,
    });
  });

  it("never welcomes a kept record as new either", () => {
    const kept = memberMarks(
      row({ unclaimableBecause: UNCLAIMABLE_REASONS.keptRecord, createdAt: new Date(NOW - DAY) }),
      NOW,
    );
    expect(kept.kind).toBe("kept-record");
    expect(kept.isNew).toBe(false);
  });

  it("treats no country as nowhere rather than a blank flag", () => {
    expect(memberMarks(row({ country: null }), NOW).country).toBe("");
    expect(memberMarks(row({ country: "  Japan " }), NOW).country).toBe("Japan");
  });
});
