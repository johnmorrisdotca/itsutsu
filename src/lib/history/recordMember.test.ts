import { beforeEach, describe, expect, it, vi } from "vitest";

import { isRefusal } from "@/lib/api/paging";
import { toGameHistoryQuery } from "./gameHistoryQuery";
import type { GameHistoryQuery } from "./gameHistory.types";

type Row = { key: string; name: string; updatedAt: Date };

let players: Row[] = [];
let member: { name: string } | null = null;

const playerFindMany = vi.fn(async () => players);
const memberFindUnique = vi.fn(async () => member);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    player: { findMany: () => playerFindMany() },
    member: { findUnique: () => memberFindUnique() },
  },
}));

const { nameForMember, resolveMember, withMemberResolved } = await import("./recordMember");

const query = (search: string): GameHistoryQuery => {
  const parsed = toGameHistoryQuery(new URL(`https://example.test/api/games${search}`));
  if (isRefusal(parsed)) throw new Error(parsed.error);
  return parsed;
};

beforeEach(() => {
  players = [];
  member = null;
  playerFindMany.mockClear();
  memberFindUnique.mockClear();
});

describe("resolveMember", () => {
  /*
   * AN UNKNOWN ID WAS LOOKED UP THREE TIMES. The page resolved it, found nobody,
   * and passed on a query whose `member` was still set — so the page read and the
   * whole-record read each looked it up again. Settling `member` in both outcomes
   * is the fix, and the second call below is the one that used to hit the database.
   */
  it("looks an unknown id up once, and hands on a query nothing will ask about again", async () => {
    const resolved = await resolveMember(query("?member=nobody-here"));
    expect(resolved.unknown).toBe(true);
    expect(resolved.query.member).toBeNull();
    expect(resolved.query.player).toBeNull();
    expect(memberFindUnique).toHaveBeenCalledTimes(1);

    await withMemberResolved(resolved.query);
    await withMemberResolved(resolved.query);
    expect(memberFindUnique).toHaveBeenCalledTimes(1);
    expect(playerFindMany).toHaveBeenCalledTimes(1);
  });

  it("turns a known id into the name its record is counted under", async () => {
    member = { name: "Hanako" };
    players = [{ key: "hanako", name: "Hanako", updatedAt: new Date("2026-09-01") }];
    const resolved = await resolveMember(query("?member=cm-hanako&outcome=won"));
    expect(resolved).toMatchObject({ unknown: false, query: { member: null, player: "Hanako", outcome: "won" } });
  });

  it("asks nothing when no member was named", async () => {
    const resolved = await resolveMember(query("?player=Alice"));
    expect(resolved).toMatchObject({ unknown: false, query: { player: "Alice", member: null } });
    expect(memberFindUnique).not.toHaveBeenCalled();
  });
});

/*
 * TWO `Player` ROWS FOR ONE MEMBER. `findFirst` with no order let the database
 * choose; the row that should win is listed SECOND here, so a "first row" rule
 * fails this case.
 */
describe("nameForMember with two rows", () => {
  it("resolves the row keyed by the member's current name, not whichever came first", async () => {
    member = { name: "Hanako Mori" };
    players = [
      { key: "hanachan", name: "Hanachan", updatedAt: new Date("2026-09-10") },
      { key: "hanako mori", name: "Hanako Mori", updatedAt: new Date("2026-08-01") },
    ];
    expect(await nameForMember("cm-hanako")).toBe("Hanako Mori");
  });
});
