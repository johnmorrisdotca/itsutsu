import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
const awardDailyVisit = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: (...args: unknown[]) => queryRaw(...args) } }));
vi.mock("@/lib/xp/dailyVisit", () => ({ awardDailyVisit: (...args: unknown[]) => awardDailyVisit(...args) }));

import { touchMemberFromPoll } from "./memberRow";

/** The SQL a tagged-template call was made with, joined, and the values beside it. */
function sent(call: unknown[]): { sql: string; values: unknown[] } {
  const [strings, ...values] = call as [TemplateStringsArray, ...unknown[]];
  return { sql: strings.join("?"), values };
}

describe("a live board's ask marks its reader as seen", () => {
  const now = new Date("2026-09-26T09:00:00Z");

  beforeEach(() => {
    queryRaw.mockReset();
    awardDailyVisit.mockReset();
  });

  it("is one conditional statement, at most once a minute, never for a banned member", async () => {
    queryRaw.mockResolvedValueOnce([]);
    await touchMemberFromPoll({ by: "id", value: "m-kuro" }, now);
    expect(queryRaw).toHaveBeenCalledTimes(1);
    const { sql, values } = sent(queryRaw.mock.calls[0]!);
    expect(sql).toMatch(/^\s*UPDATE "Member"/);
    expect(sql).toContain('"lastSeenAt" < ');
    expect(sql).toContain('"bannedAt" IS NULL');
    expect(values).toContainEqual(new Date(now.getTime() - 60_000));
    expect(values).toContainEqual(now);
  });

  it("pays nothing and asks nothing more when the stamp was inside the minute", async () => {
    queryRaw.mockResolvedValueOnce([]);
    await touchMemberFromPoll({ by: "id", value: "m-kuro" }, now);
    expect(awardDailyVisit).not.toHaveBeenCalled();
  });

  it("hands the day's visit the row AS IT WAS, so a board left open over midnight still pays the new day", async () => {
    const was = {
      id: "m-kuro",
      lastSeenAt: new Date("2026-09-25T23:58:00Z"),
      timeZone: "Asia/Tokyo",
      awayUntil: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      played: 12,
    };
    queryRaw.mockResolvedValueOnce([was]);
    await touchMemberFromPoll({ by: "id", value: "m-kuro" }, now);
    expect(awardDailyVisit).toHaveBeenCalledWith(was, now);
  });
});
