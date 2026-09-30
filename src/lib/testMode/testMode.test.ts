import { describe, expect, it, vi } from "vitest";

const asked: unknown[] = [];

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      findMany: async (args: unknown) => {
        asked.push(args);
        return [{ id: "test-1" }, { id: "test-2" }];
      },
    },
  },
}));
vi.mock("@/lib/auth/requireAdmin", () => ({ isAdminRequest: async () => false }));
vi.mock("@/lib/preferences/memberPreferences", () => ({ preferencesFor: async () => ({}) }));

const { HIDES_TEST_MEMBERS, hiddenMemberIds, shownRatingWhere, shownSolveWhere } = await import("./testMode");

describe("a table with no relation to Member hides test members by id", () => {
  it("asks for the test members' ids for an ordinary reader, and asks nothing for the operator in Test Mode", async () => {
    expect(await hiddenMemberIds(HIDES_TEST_MEMBERS)).toEqual(["test-1", "test-2"]);
    expect(asked).toEqual([{ where: { unclaimableBecause: "test" }, select: { id: true } }]);
    expect(await hiddenMemberIds({ showsTestMembers: true })).toEqual([]);
    expect(asked).toHaveLength(1);
  });

  it("keeps a rating row with no member behind its name, and filters nothing when nobody is hidden", () => {
    expect(shownRatingWhere(["test-1"])).toEqual({ OR: [{ memberId: null }, { memberId: { notIn: ["test-1"] } }] });
    expect(shownRatingWhere([])).toEqual({});
    expect(shownSolveWhere(["test-1"])).toEqual({ memberId: { notIn: ["test-1"] } });
    expect(shownSolveWhere([])).toEqual({});
  });
});
