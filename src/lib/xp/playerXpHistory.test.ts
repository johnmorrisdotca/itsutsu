import { beforeEach, describe, expect, it, vi } from "vitest";

import { BOT_MEMBERS } from "@/lib/bots/bots.constants";

import { IMPORTED_XP_EVENTS } from "./importedXp.constants";
import { XP_EVENTS } from "./xp.constants";

/**
 * A PLAYER'S XP HISTORY: DAYS, EACH DAY'S TOTAL, AND THE RUNNING TOTAL.
 *
 * Against a fake that honours the `where` it is handed, the way
 * `xpHistoryPage.test.ts` does and for its reason: the page read, the sum below
 * the page and the day totals are three queries that must agree about which
 * rows are whose and where a page ends, and a fake that re-did the arithmetic
 * would agree with the code whatever the code did. This one reads the `OR`,
 * `AND`, `in`, `lt` and `gt` shapes `keysetWhere` actually builds.
 *
 * The ledger below is shaped so the page boundary falls INSIDE a tie — sixteen
 * awards from one game's end, one timestamp — because that is the ordinary
 * case on this site and the one a running total would get wrong first.
 */

type Row = {
  id: string;
  memberId: string;
  type: string;
  points: number;
  subject: string;
  dayKey: string;
  createdAt: Date;
};

let events: Row[] = [];
const reads = { aggregate: 0, groupBy: 0 };

function held(row: Row, field: string): unknown {
  const value = (row as unknown as Record<string, unknown>)[field];
  return value instanceof Date ? value.toISOString() : value;
}

function compares(value: unknown, test: unknown): boolean {
  const right = (raw: unknown) => (raw instanceof Date ? raw.toISOString() : raw);
  if (typeof test === "object" && test !== null && !(test instanceof Date)) {
    const ops = test as Record<string, unknown>;
    if ("in" in ops) return (ops.in as unknown[]).includes(value);
    if ("gt" in ops) return (value as never) > (right(ops.gt) as never);
    if ("lt" in ops) return (value as never) < (right(ops.lt) as never);
    return false;
  }
  return value === right(test);
}

function matches(row: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, test]) => {
    if (key === "AND") return (test as Record<string, unknown>[]).every((one) => matches(row, one));
    if (key === "OR") return (test as Record<string, unknown>[]).some((one) => matches(row, one));
    return compares(held(row, key), test);
  });
}

function ordered(rows: Row[], orderBy: Record<string, string>[]): Row[] {
  return [...rows].sort((left, right) => {
    for (const clause of orderBy) {
      const [field, how] = Object.entries(clause)[0];
      const a = held(left, field) as string;
      const b = held(right, field) as string;
      if (a === b) continue;
      const way = a < b ? -1 : 1;
      return how === "desc" ? -way : way;
    }
    return 0;
  });
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    xpEvent: {
      findMany: async (args: { where: Record<string, unknown>; orderBy: Record<string, string>[]; take: number }) =>
        ordered(events.filter((row) => matches(row, args.where)), args.orderBy).slice(0, args.take),
      aggregate: async (args: { where: Record<string, unknown> }) => {
        reads.aggregate += 1;
        const hit = events.filter((row) => matches(row, args.where));
        return { _sum: { points: hit.length === 0 ? null : hit.reduce((sum, row) => sum + row.points, 0) } };
      },
      groupBy: async (args: { where: Record<string, unknown> }) => {
        reads.groupBy += 1;
        const sums = new Map<string, number>();
        for (const row of events.filter((one) => matches(one, args.where))) {
          sums.set(row.dayKey, (sums.get(row.dayKey) ?? 0) + row.points);
        }
        return [...sums].map(([dayKey, points]) => ({ dayKey, _sum: { points } }));
      },
    },
    game: { findMany: async () => [] },
  },
}));

const { playerXpHistory } = await import("./playerXpHistory");
const { XP_HISTORY_PAGE, xpHistoryDays, xpHistoryHref } = await import("./xpHistoryDays");

const MINE = "member-mine";

function award(id: string, over: Partial<Row>): Row {
  return {
    id,
    memberId: MINE,
    type: XP_EVENTS.dailyVisit,
    points: 5,
    subject: id,
    dayKey: "2026-09-01",
    createdAt: new Date("2026-09-01T08:00:00Z"),
    ...over,
  };
}

/** Every page of a member's history, walked the way the "Older awards" link walks it. */
async function walk(memberId = MINE) {
  const pages = [];
  let cursor: string | null = null;
  for (let guard = 0; guard < 20; guard += 1) {
    const page = await playerXpHistory({ memberId, cursor });
    pages.push(page);
    if (page.next === null) return pages;
    cursor = page.next;
  }
  throw new Error("a history that never ends");
}

beforeEach(() => {
  reads.aggregate = 0;
  reads.groupBy = 0;
  events = [
    // 2026-09-01: seven visits a minute apart, 35 in all.
    ...Array.from({ length: 7 }, (_, i) =>
      award(`a${i}`, { createdAt: new Date(`2026-09-01T08:0${i}:00Z`) }),
    ),
    // 2026-09-02: sixteen awards from one game's end, ONE timestamp, 160 in all.
    ...Array.from({ length: 16 }, (_, i) =>
      award(`b${String(i).padStart(2, "0")}`, {
        type: XP_EVENTS.gameFinished,
        points: 10,
        subject: `game-${i}`,
        dayKey: "2026-09-02",
        createdAt: new Date("2026-09-02T09:00:00Z"),
      }),
    ),
    // 2026-09-03: credit from another site, then a first at a game here. 3,025.
    award("c0", {
      type: IMPORTED_XP_EVENTS.importedGames,
      points: 3000,
      subject: "ItsYourTurn.com@120=3000",
      dayKey: "2026-09-03",
      createdAt: new Date("2026-09-03T10:00:00Z"),
    }),
    award("c1", {
      type: XP_EVENTS.firstOfVariant,
      points: 25,
      subject: "renju",
      dayKey: "2026-09-03",
      createdAt: new Date("2026-09-03T11:00:00Z"),
    }),
    // Somebody else's, on the same days. No sum on this page may count it.
    award("z0", { memberId: "member-theirs", points: 999, dayKey: "2026-09-02", createdAt: new Date("2026-09-02T12:00:00Z") }),
  ];
});

describe("a player's XP history, read", () => {
  it("shows every award once, newest first, in runs of days", async () => {
    const pages = await walk();
    expect(pages).toHaveLength(2);
    const ids = pages.flatMap((page) => page.days.flatMap((day) => day.entries.map((entry) => entry.id)));
    expect(ids).toHaveLength(25);
    expect(new Set(ids).size).toBe(25);
    expect(ids.slice(0, 3)).toEqual(["c1", "c0", "b00"]);
    expect(ids.at(-1)).toBe("a0");
    expect(pages[0].days.flatMap((day) => day.entries)).toHaveLength(XP_HISTORY_PAGE);
    expect(pages[0].days.map((day) => day.dayKey)).toEqual(["2026-09-03", "2026-09-02"]);
    expect(pages[1].days.map((day) => day.dayKey)).toEqual(["2026-09-02", "2026-09-01"]);
  });

  it("gives each day its WHOLE total, on both sides of the page it was split by", async () => {
    const [first, second] = await walk();
    expect(first.days.map((day) => day.total)).toEqual([3025, 160]);
    // The game's end is thirteen rows on page one and three on page two, and 160 on both.
    expect(first.days[1].entries).toHaveLength(13);
    expect(second.days[0].entries).toHaveLength(3);
    expect(second.days.map((day) => day.total)).toEqual([160, 35]);
  });

  it("carries a running total that is continuous across pages, through a tie", async () => {
    const pages = await walk();
    const entries = pages.flatMap((page) => page.days.flatMap((day) => day.entries));
    // What the member's awards come to, newest first: the top row is the whole.
    expect(entries[0].runningTotal).toBe(3220);
    entries.forEach((entry, at) => {
      const fromHereDown = entries.slice(at).reduce((sum, one) => sum + one.points, 0);
      expect(entry.runningTotal, entry.id).toBe(fromHereDown);
    });
    // The seam itself: page two opens exactly where page one left off.
    const lastOfFirst = pages[0].days.at(-1)?.entries.at(-1);
    const firstOfSecond = pages[1].days[0].entries[0];
    expect(firstOfSecond.runningTotal).toBe((lastOfFirst?.runningTotal ?? 0) - (lastOfFirst?.points ?? 0));
    expect(entries.at(-1)?.runningTotal).toBe(5);
  });

  it("marks credit from another site, and never makes it a game here", async () => {
    const [first] = await walk();
    const [imported, here] = [first.days[0].entries[1], first.days[0].entries[0]];
    expect(imported.id).toBe("c0");
    expect(imported.elsewhere).toBe(true);
    expect(imported.about).toEqual({ of: "words", said: "ItsYourTurn.com" });
    expect(here.elsewhere).toBe(false);
    expect(here.about).toEqual({ of: "game", variant: "renju" });
    expect(first.days[1].entries.every((entry) => !entry.elsewhere)).toBe(true);
  });

  it("spends one sum and one day read per page, and none on an empty history", async () => {
    await walk();
    expect(reads).toEqual({ aggregate: 2, groupBy: 2 });
    reads.aggregate = 0;
    reads.groupBy = 0;
    const nobody = await playerXpHistory({ memberId: "member-new", cursor: null });
    expect(nobody).toEqual({ days: [], next: null, skipped: { unknownType: 0 } });
    expect(reads).toEqual({ aggregate: 0, groupBy: 0 });
  });

  it("reads a program's ledger exactly as a person's", async () => {
    const program = BOT_MEMBERS.meijin.id;
    events = events.map((row) => ({ ...row, memberId: row.memberId === MINE ? program : row.memberId }));
    const pages = await walk(program);
    expect(pages[0].days[0].entries[0].runningTotal).toBe(3220);
    expect(pages.flatMap((page) => page.days.flatMap((day) => day.entries))).toHaveLength(25);
  });
});

describe("the days, as arithmetic", () => {
  const row = (id: string, dayKey: string, points: number) => ({
    id,
    type: XP_EVENTS.dailyVisit,
    points,
    label: "A new day",
    kanji: "",
    blurb: "",
    about: { of: "nobody" as const },
    dayKey,
    earnedAt: "2026-09-01T00:00:00.000Z",
  });

  it("keeps two runs under one day apart rather than reordering the ledger", () => {
    const days = xpHistoryDays(
      [row("x", "2026-09-02", 1), row("y", "2026-09-01", 2), row("z", "2026-09-02", 3)],
      { olderThanPage: 10, dayTotals: new Map([["2026-09-02", 4]]) },
    );
    expect(days.map((day) => day.dayKey)).toEqual(["2026-09-02", "2026-09-01", "2026-09-02"]);
    expect(days.map((day) => day.entries.map((entry) => entry.runningTotal))).toEqual([[16], [15], [13]]);
    // A day the read did not total is said as nothing, not as this page's part of it.
    expect(days.map((day) => day.total)).toEqual([4, null, 4]);
  });

  it("builds the next page's address on the XP tab, keeping everything else", () => {
    const params = new URLSearchParams("scope=here&xp-cursor=old");
    expect(xpHistoryHref("/players/m1", params, "abc")).toBe("/players/m1?scope=here&xp-cursor=abc&view=xp#xp-history");
    expect(xpHistoryHref("/players/m1", params, null)).toBe("/players/m1?scope=here&view=xp#xp-history");
  });
});
