import { beforeEach, describe, expect, it, vi } from "vitest";

import { isRefusal } from "@/lib/api/paging";
import { XP_EVENTS } from "./xp.constants";

/**
 * PAGING A LEDGER, AGAINST A FAKE THAT HONOURS THE KEYSET IT IS HANDED.
 *
 * The property under test is that a member walking their own history sees every
 * award exactly once — no row twice, no row missed — while the list is growing
 * underneath them. That is the whole reason this site pages by cursor rather
 * than by offset, and it is a property no amount of reading the query can show.
 *
 * So the fake below does not pretend. It interprets the `where` object the real
 * code passes — the `OR`/`AND`/`gt`/`lt` shapes `keysetWhere` produces — sorts
 * by the `orderBy` it is given, and takes the `take` it is asked for. If
 * `keysetWhere` and `keysetOrderBy` ever disagree with each other, these cases
 * fail, which is exactly what a fake that re-implemented the arithmetic would
 * not do: that would be the classic false pass, green over a mechanism nobody is
 * running.
 *
 * It does NOT pretend to be a database in any other way. There is no
 * transaction and no index; the claim being tested is about order and
 * continuity, not about what Postgres guarantees.
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
let games: { id: string; variant: string }[] = [];
let gameReads = 0;

function value(row: Row, field: string): unknown {
  return (row as unknown as Record<string, unknown>)[field];
}

/** One comparison as Prisma spells it, over one row. */
function compares(held: unknown, test: unknown): boolean {
  if (test === null) return held === null || held === undefined;
  if (typeof test === "object" && test !== null) {
    const ops = test as Record<string, unknown>;
    if ("in" in ops) return (ops.in as unknown[]).includes(held);
    const left = held instanceof Date ? held.toISOString() : held;
    const right = (raw: unknown) => (raw instanceof Date ? raw.toISOString() : raw);
    if ("gt" in ops) return (left as never) > (right(ops.gt) as never);
    if ("lt" in ops) return (left as never) < (right(ops.lt) as never);
    if ("gte" in ops) return (left as never) >= (right(ops.gte) as never);
    if ("lte" in ops) return (left as never) <= (right(ops.lte) as never);
    return false;
  }
  const left = held instanceof Date ? held.toISOString() : held;
  return left === test;
}

function matches(row: Row, where: Record<string, unknown>): boolean {
  for (const [key, test] of Object.entries(where)) {
    if (key === "AND") {
      if (!(test as Record<string, unknown>[]).every((one) => matches(row, one))) return false;
    } else if (key === "OR") {
      if (!(test as Record<string, unknown>[]).some((one) => matches(row, one))) return false;
    } else if (!compares(value(row, key), test)) return false;
  }
  return true;
}

function ordered(rows: Row[], orderBy: Record<string, unknown>[]): Row[] {
  return [...rows].sort((left, right) => {
    for (const clause of orderBy) {
      const [field, howRaw] = Object.entries(clause)[0];
      const how = typeof howRaw === "string" ? howRaw : (howRaw as { sort: string }).sort;
      const a = value(left, field);
      const b = value(right, field);
      const sideA = a instanceof Date ? a.getTime() : a;
      const sideB = b instanceof Date ? b.getTime() : b;
      if (sideA === sideB) continue;
      const way = (sideA as never) < (sideB as never) ? -1 : 1;
      return how === "desc" ? -way : way;
    }
    return 0;
  });
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    xpEvent: {
      findMany: async (args: {
        where: Record<string, unknown>;
        orderBy: Record<string, unknown>[];
        take: number;
      }) => ordered(events.filter((row) => matches(row, args.where)), args.orderBy).slice(0, args.take),
    },
    game: {
      findMany: async (args: { where: { id: { in: string[] } } }) => {
        gameReads += 1;
        return games.filter((game) => args.where.id.in.includes(game.id));
      },
    },
  },
}));

const { XP_LEDGER_PAGE_MAX, xpLedgerPage } = await import("./xpHistoryPage");

const MINE = "member-mine";

/** An award at a fixed minute, so the fixtures read as a timeline. */
function award(minute: number, over: Partial<Row> = {}): Row {
  const id = over.id ?? `xp${String(minute).padStart(3, "0")}`;
  return {
    id,
    memberId: MINE,
    type: XP_EVENTS.dailyVisit,
    points: 5,
    subject: `2026-09-${String((minute % 28) + 1).padStart(2, "0")}`,
    dayKey: `2026-09-${String((minute % 28) + 1).padStart(2, "0")}`,
    createdAt: new Date(Date.UTC(2026, 8, 1, 0, minute)),
    ...over,
  };
}

/** Walks every page and returns the ids in the order a reader would meet them. */
async function walk(query: string, limit: number): Promise<string[]> {
  const seen: string[] = [];
  let cursor: string | null = null;
  for (let guard = 0; guard < 50; guard += 1) {
    const params = new URLSearchParams(query);
    params.set("limit", String(limit));
    if (cursor !== null) params.set("cursor", cursor);
    const page = await xpLedgerPage({ memberId: MINE, params });
    if (isRefusal(page)) throw new Error(page.error);
    seen.push(...page.items.map((row) => row.id));
    if (page.next === null) return seen;
    cursor = page.next;
  }
  throw new Error("a ledger that never ends");
}

beforeEach(() => {
  events = Array.from({ length: 23 }, (_, index) => award(index));
  games = [];
  gameReads = 0;
});

describe("walking a member's own ledger", () => {
  it("shows every award once, newest first, and then stops", async () => {
    const seen = await walk("", 5);
    expect(seen.length).toBe(23);
    expect(new Set(seen).size).toBe(23);
    // Newest first is the default, and the order across pages is one order.
    expect(seen[0]).toBe("xp022");
    expect(seen[22]).toBe("xp000");
  });

  it("reads nobody else's awards", async () => {
    events.push(award(99, { id: "theirs", memberId: "member-someone-else" }));
    expect(await walk("", 5)).not.toContain("theirs");
  });

  it("breaks a tie by id, so two awards in one second cannot swap between pages", async () => {
    /*
     * The tiebreaker is not optional. Four awards land in the same transaction
     * when a game ends, so identical timestamps are the ordinary case here — and
     * ordering by the timestamp alone leaves them in whatever order the planner
     * liked, which makes page two disagree with page one about what it showed.
     */
    const sameMoment = new Date(Date.UTC(2026, 8, 2, 12, 0));
    events = ["a", "b", "c", "d"].map((letter) =>
      award(0, { id: `tie-${letter}`, createdAt: sameMoment }),
    );
    const walked = await walk("", 2);
    expect(walked).toEqual(["tie-a", "tie-b", "tie-c", "tie-d"]);
  });

  it("pages oldest-first too, over the same index", async () => {
    const seen = await walk("sort=earned%3Aasc", 7);
    expect(seen.length).toBe(23);
    expect(seen[0]).toBe("xp000");
    expect(seen[22]).toBe("xp022");
  });
});

describe("a ledger that grows while it is being read", () => {
  it("does not repeat a row when something is earned above the page", async () => {
    /*
     * THE WHOLE ARGUMENT FOR A CURSOR. With `skip: 5`, earning one award between
     * two page turns pushes every row down one, and the reader is handed a row
     * they have already read with nothing reporting it. A ledger is the one list
     * here where that is certain rather than possible: every row is an insertion
     * at the top, by definition.
     */
    const first = await xpLedgerPage({ memberId: MINE, params: new URLSearchParams("limit=5") });
    if (isRefusal(first)) throw new Error(first.error);
    const firstIds = first.items.map((row) => row.id);

    events.push(award(99, { id: "earned-mid-read" }));

    const second = await xpLedgerPage({
      memberId: MINE,
      params: new URLSearchParams(`limit=5&cursor=${encodeURIComponent(first.next ?? "")}`),
    });
    if (isRefusal(second)) throw new Error(second.error);
    const secondIds = second.items.map((row) => row.id);

    expect(secondIds.filter((id) => firstIds.includes(id))).toEqual([]);
    expect(secondIds).toEqual(["xp017", "xp016", "xp015", "xp014", "xp013"]);
  });

  it("does not skip a row when one above the page is swept", async () => {
    const first = await xpLedgerPage({ memberId: MINE, params: new URLSearchParams("limit=5") });
    if (isRefusal(first)) throw new Error(first.error);

    // A retention sweep takes the newest row. An offset would leave a gap here.
    events = events.filter((row) => row.id !== "xp022");

    const second = await xpLedgerPage({
      memberId: MINE,
      params: new URLSearchParams(`limit=5&cursor=${encodeURIComponent(first.next ?? "")}`),
    });
    if (isRefusal(second)) throw new Error(second.error);
    expect(second.items.map((row) => row.id)).toEqual(["xp017", "xp016", "xp015", "xp014", "xp013"]);
  });
});

describe("what the parameters are allowed to say", () => {
  it("refuses a sort this list does not have, by name", async () => {
    const page = await xpLedgerPage({ memberId: MINE, params: new URLSearchParams("sort=points") });
    expect(isRefusal(page)).toBe(true);
    if (isRefusal(page)) expect(page.error).toContain("points");
  });

  it("starts again from the top for a cursor it cannot read", async () => {
    /*
     * Not a refusal, and the difference is deliberate: a cursor is something
     * this site handed out, so an unreadable one means a stale link or a changed
     * sort rather than a reader who did anything wrong. An unknown sort column
     * has no such honest fallback.
     */
    const page = await xpLedgerPage({
      memberId: MINE,
      params: new URLSearchParams("limit=3&cursor=not-a-cursor"),
    });
    if (isRefusal(page)) throw new Error(page.error);
    expect(page.items.map((row) => row.id)).toEqual(["xp022", "xp021", "xp020"]);
  });

  it("refuses a cursor built for the other direction", async () => {
    // A position in one ordering names a row whose neighbours are different rows
    // in another; honouring it would repeat some and skip others silently.
    const descending = await xpLedgerPage({
      memberId: MINE,
      params: new URLSearchParams("limit=3"),
    });
    if (isRefusal(descending)) throw new Error(descending.error);
    const ascending = await xpLedgerPage({
      memberId: MINE,
      params: new URLSearchParams(
        `limit=3&sort=earned%3Aasc&cursor=${encodeURIComponent(descending.next ?? "")}`,
      ),
    });
    if (isRefusal(ascending)) throw new Error(ascending.error);
    expect(ascending.items.map((row) => row.id)).toEqual(["xp000", "xp001", "xp002"]);
  });

  it("clamps a limit nobody may have, rather than refusing it", async () => {
    const page = await xpLedgerPage({
      memberId: MINE,
      params: new URLSearchParams("limit=9999"),
    });
    if (isRefusal(page)) throw new Error(page.error);
    expect(page.items.length).toBeLessThanOrEqual(XP_LEDGER_PAGE_MAX);
  });

  it("says nothing about a total it did not count", async () => {
    // The convention's rule: a list with no total shows no total, and adding a
    // count per page turn is a second query with nothing behind it. The heading
    // above the ledger has the two numbers that matter, off the Member row.
    const page = await xpLedgerPage({ memberId: MINE, params: new URLSearchParams("limit=5") });
    if (isRefusal(page)) throw new Error(page.error);
    expect(page.total).toBeUndefined();
  });
});

describe("the games behind the game-keyed awards", () => {
  beforeEach(() => {
    events = [
      award(3, { id: "won", type: XP_EVENTS.gameWon, subject: "game-1", points: 20 }),
      award(2, { id: "finished", type: XP_EVENTS.gameFinished, subject: "game-1", points: 10 }),
      award(1, { id: "swept", type: XP_EVENTS.gameFinished, subject: "game-gone", points: 10 }),
    ];
    games = [{ id: "game-1", variant: "renju" }];
  });

  it("reads them in ONE query, however many rows named a game", async () => {
    const page = await xpLedgerPage({ memberId: MINE, params: new URLSearchParams() });
    if (isRefusal(page)) throw new Error(page.error);
    expect(gameReads).toBe(1);
    expect(page.items.map((row) => row.about)).toEqual([
      { of: "match", gameId: "game-1", variant: "renju" },
      { of: "match", gameId: "game-1", variant: "renju" },
      // A game that has been swept keeps null, and its row stays unlinked rather
      // than pointing at a match that is no longer there.
      { of: "match", gameId: "game-gone", variant: null },
    ]);
  });

  it("asks nothing when no row on the page named a game", async () => {
    events = [award(1), award(2)];
    const page = await xpLedgerPage({ memberId: MINE, params: new URLSearchParams() });
    if (isRefusal(page)) throw new Error(page.error);
    expect(gameReads).toBe(0);
  });
});

describe("a row this deploy cannot explain", () => {
  it("is dropped and counted, and does not open a gap in the paging", async () => {
    /*
     * `XpEvent.type` is a plain string, so a row written by a newer deploy can
     * reach a page that has never heard of it. The row goes — printing
     * "undefined +10" is worse than printing nothing — and the count is how a
     * deploy that starts dropping rows says so.
     *
     * Dropped AFTER the cursor is built, which is the part that matters: the
     * page is one shorter, and the next cursor still names the last row the
     * database returned rather than the last row shown.
     */
    events = [
      award(5, { id: "known" }),
      award(4, { id: "future", type: "somethingNobodyHasWrittenYet" }),
      award(3, { id: "older" }),
    ];
    const page = await xpLedgerPage({ memberId: MINE, params: new URLSearchParams("limit=2") });
    if (isRefusal(page)) throw new Error(page.error);
    expect(page.items.map((row) => row.id)).toEqual(["known"]);
    expect(page.skipped.unknownType).toBe(1);

    const rest = await xpLedgerPage({
      memberId: MINE,
      params: new URLSearchParams(`limit=2&cursor=${encodeURIComponent(page.next ?? "")}`),
    });
    if (isRefusal(rest)) throw new Error(rest.error);
    expect(rest.items.map((row) => row.id)).toEqual(["older"]);
  });
});
