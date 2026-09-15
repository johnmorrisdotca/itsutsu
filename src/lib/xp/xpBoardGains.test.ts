import { beforeEach, describe, expect, it, vi } from "vitest";

import { encodeCursor } from "@/lib/api/paging.cursor";
import { RECORD_SCOPES } from "@/lib/rating/recordScope";

import { IMPORTED_XP_EVENTS } from "./importedXp.constants";
import { XP_EVENTS } from "./xp.constants";

/**
 * THE XP BOARD'S GAINS, READ: ONE QUERY FOR A PAGE, IN THE BOARD'S SCOPE.
 *
 * The fake honours the `OR`, `gte` and `notIn` the real `where` carries, so a
 * scope that forgot to leave imported credit out, or a window read from the
 * wrong member, changes the answer here rather than passing over it.
 */

type Event = { memberId: string; type: string; dayKey: string; points: number };
type Totals = { id: string; xp: number; xpEverywhere: number };

let events: Event[] = [];
let members: Totals[] = [];
const reads = { groupBy: 0, findUnique: 0 };

function matches(row: Event, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, test]) => {
    if (key === "OR") return (test as Record<string, unknown>[]).some((one) => matches(row, one));
    const value = (row as unknown as Record<string, unknown>)[key];
    if (typeof test === "object" && test !== null) {
      const ops = test as { gte?: string; notIn?: string[] };
      if (ops.gte !== undefined) return (value as string) >= ops.gte;
      if (ops.notIn !== undefined) return !ops.notIn.includes(value as string);
      return false;
    }
    return value === test;
  });
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    xpEvent: {
      groupBy: async (args: { where: Record<string, unknown> }) => {
        reads.groupBy += 1;
        const sums = new Map<string, { memberId: string; dayKey: string; _sum: { points: number } }>();
        for (const row of events.filter((one) => matches(one, args.where))) {
          const key = `${row.memberId}|${row.dayKey}`;
          const held = sums.get(key) ?? { memberId: row.memberId, dayKey: row.dayKey, _sum: { points: 0 } };
          held._sum.points += row.points;
          sums.set(key, held);
        }
        return [...sums.values()];
      },
    },
    member: {
      findUnique: async (args: { where: { id: string } }) => {
        reads.findUnique += 1;
        return members.find((one) => one.id === args.where.id) ?? null;
      },
    },
  },
}));

const { fetchXpAboveTotal, fetchXpBoardGains } = await import("./xpBoardGains");
const { readXpBoardPaging } = await import("./xpBoard");

const NOW = new Date("2026-09-14T12:00:00Z");

beforeEach(() => {
  reads.groupBy = 0;
  reads.findUnique = 0;
  events = [
    { memberId: "m0", type: XP_EVENTS.gameWon, dayKey: "2026-09-14", points: 20 },
    { memberId: "m0", type: IMPORTED_XP_EVENTS.importedGames, dayKey: "2026-09-14", points: 30 },
    { memberId: "m0", type: XP_EVENTS.gameFinished, dayKey: "2026-09-11", points: 100 },
    { memberId: "m0", type: XP_EVENTS.firstOfVariant, dayKey: "2026-09-04", points: 400 },
    // Somebody not on this page, on the same day.
    { memberId: "elsewhere", type: XP_EVENTS.gameWon, dayKey: "2026-09-14", points: 999 },
  ];
  members = [{ id: "m-above", xp: 480, xpEverywhere: 510 }];
});

const page = Array.from({ length: 25 }, (_, i) => ({ id: `m${i}`, timeZone: "" }));

describe("the gains on one page of the board", () => {
  it("are ONE query for the whole page, however many rows", async () => {
    await fetchXpBoardGains({ rows: page, scope: RECORD_SCOPES.everywhere, now: NOW });
    expect(reads.groupBy).toBe(1);
  });

  it("count imported credit Everywhere and leave it out under Itsutsu only", async () => {
    const everywhere = await fetchXpBoardGains({ rows: page, scope: RECORD_SCOPES.everywhere, now: NOW });
    expect(everywhere.get("m0")).toEqual({ today: 50, week: 150 });
    const here = await fetchXpBoardGains({ rows: page, scope: RECORD_SCOPES.here, now: NOW });
    expect(here.get("m0")).toEqual({ today: 20, week: 120 });
  });

  it("answer nought for everybody else on the page, and nothing for anyone off it", async () => {
    const gains = await fetchXpBoardGains({ rows: page, scope: RECORD_SCOPES.everywhere, now: NOW });
    expect(gains.get("m24")).toEqual({ today: 0, week: 0 });
    expect(gains.has("elsewhere")).toBe(false);
  });

  it("ask nothing for an empty board", async () => {
    expect((await fetchXpBoardGains({ rows: [], scope: RECORD_SCOPES.here, now: NOW })).size).toBe(0);
    expect(reads.groupBy).toBe(0);
  });
});

describe("the row above a page's first", () => {
  const paging = readXpBoardPaging(new URLSearchParams(), RECORD_SCOPES.everywhere);
  if ("error" in paging) throw new Error(paging.error);
  const cursorAt = (id: string) => encodeCursor({ value: 510, id, sort: { param: "xp", direction: "desc" } });

  it("is nobody on the first page, and costs nothing", async () => {
    expect(await fetchXpAboveTotal({ cursor: null, sort: paging.sort, scope: RECORD_SCOPES.everywhere })).toBeNull();
    expect(reads.findUnique).toBe(0);
  });

  it("is the row the cursor names, counted in the board's scope", async () => {
    const cursor = cursorAt("m-above");
    expect(await fetchXpAboveTotal({ cursor, sort: paging.sort, scope: RECORD_SCOPES.everywhere })).toBe(510);
    expect(await fetchXpAboveTotal({ cursor, sort: paging.sort, scope: RECORD_SCOPES.here })).toBe(480);
  });

  it("is nothing for a row that has gone, or a cursor nobody can read", async () => {
    expect(await fetchXpAboveTotal({ cursor: cursorAt("gone"), sort: paging.sort, scope: RECORD_SCOPES.everywhere })).toBeNull();
    expect(await fetchXpAboveTotal({ cursor: "not-a-cursor", sort: paging.sort, scope: RECORD_SCOPES.everywhere })).toBeNull();
  });
});
