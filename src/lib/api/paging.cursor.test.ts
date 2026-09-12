import { describe, expect, it } from "vitest";

import {
  decodeCursor,
  encodeCursor,
  keysetOrderBy,
  keysetWhere,
  nextCursorFrom,
  takeFor,
} from "./paging.cursor";
import type { CursorPosition, SortColumn, SortDirection } from "./paging.types";

type Field = "playedAt" | "moveCount" | "durationMs";

const PLAYED: SortColumn<Field> = {
  param: "played",
  field: "playedAt",
  label: "Played",
  firstPress: "desc",
  index: "Game_playedAt_idx",
};

const MOVES: SortColumn<Field> = {
  param: "moves",
  field: "moveCount",
  label: "Moves",
  firstPress: "desc",
  index: null,
  unindexedBecause: "A hundred and thirty rows, sorted in memory by Postgres.",
};

const DURATION: SortColumn<Field> = {
  param: "duration",
  field: "durationMs",
  label: "Time taken",
  firstPress: "desc",
  nullable: true,
  index: null,
  unindexedBecause: "A hundred and thirty rows, sorted in memory by Postgres.",
};

describe("encodeCursor / decodeCursor", () => {
  it("round-trips a string value", () => {
    const position = {
      value: "2026-09-12T10:00:00.000Z",
      id: "k3m9-p2qx",
      sort: { param: "played", direction: "desc" as SortDirection },
    };
    const back = decodeCursor(encodeCursor(position), position.sort);
    expect(back).toEqual(position);
  });

  it("round-trips a number and a null", () => {
    for (const value of [0, 42, -7, null]) {
      const position = { value, id: "abcd-1234", sort: { param: "moves", direction: "asc" as SortDirection } };
      expect(decodeCursor(encodeCursor(position), position.sort)).toEqual(position);
    }
  });

  /*
   * base64url and not base64: `+` in a query parameter decodes as a space, so a
   * cursor containing one would come back corrupted with nothing reporting it.
   */
  it("is safe in a query string", () => {
    const cursor = encodeCursor({
      value: "a value with spaces + pluses / slashes",
      id: "z9y8-x7w6",
      sort: { param: "played", direction: "desc" },
    });
    expect(cursor).not.toMatch(/[+/=]/);
    const round = new URLSearchParams(`cursor=${cursor}`).get("cursor");
    expect(round).toBe(cursor);
  });

  it("is opaque — the id is not legible in it", () => {
    const cursor = encodeCursor({ value: 1, id: "k3m9-p2qx", sort: { param: "moves", direction: "desc" } });
    expect(cursor).not.toContain("k3m9");
  });

  /*
   * THE ONE PROPERTY THAT STOPS A SILENT WRONG PAGE. A cursor is a position in
   * one ordering; handed to another it names a row whose neighbours are different
   * rows, so the page that comes back repeats some and skips others.
   */
  it("refuses a cursor made for another sort", () => {
    const cursor = encodeCursor({ value: 5, id: "abcd-1234", sort: { param: "moves", direction: "desc" } });
    expect(decodeCursor(cursor, { param: "played", direction: "desc" })).toBeNull();
    expect(decodeCursor(cursor, { param: "moves", direction: "asc" })).toBeNull();
    expect(decodeCursor(cursor, { param: "moves", direction: "desc" })).not.toBeNull();
  });

  it("refuses rubbish rather than throwing", () => {
    const sort = { param: "played", direction: "desc" as SortDirection };
    for (const bad of ["", "!!!!", "abc", "e30", Buffer.from("{}", "utf8").toString("base64url")]) {
      expect(decodeCursor(bad, sort)).toBeNull();
    }
  });

  it("refuses a cursor with no id, which could not name a row", () => {
    const cursor = Buffer.from(JSON.stringify({ s: "played", d: "d", v: 1, i: "" }), "utf8").toString(
      "base64url",
    );
    expect(decodeCursor(cursor, { param: "played", direction: "desc" })).toBeNull();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// A tiny reader for the subset of Prisma's `where` that `keysetWhere` emits, so
// the paging property below can be proved without a database. The real read is
// exercised end to end by the browser spec; what is worth proving here is the
// ARITHMETIC, and that is what this evaluates.
// ───────────────────────────────────────────────────────────────────────────

type Row = { id: string; playedAt: string; moveCount: number; durationMs: number | null };

function matches(row: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === "AND") return (value as Record<string, unknown>[]).every((one) => matches(row, one));
    if (key === "OR") return (value as Record<string, unknown>[]).some((one) => matches(row, one));

    const actual = (row as unknown as Record<string, unknown>)[key];
    if (value === null) return actual === null;
    if (typeof value === "object" && value !== null) {
      return Object.entries(value as Record<string, unknown>).every(([op, bound]) => {
        if (actual === null) return false;
        if (op === "gt") return (actual as number | string) > (bound as number | string);
        if (op === "lt") return (actual as number | string) < (bound as number | string);
        throw new Error(`the reader does not know the operator "${op}"`);
      });
    }
    return actual === value;
  });
}

function sorted(rows: readonly Row[], column: SortColumn<Field>, direction: SortDirection): Row[] {
  const order = keysetOrderBy(column, direction);
  const nullsLast = column.nullable === true;
  return [...rows].sort((a, b) => {
    const left = (a as unknown as Record<string, unknown>)[column.field] as number | string | null;
    const right = (b as unknown as Record<string, unknown>)[column.field] as number | string | null;
    if (left !== right) {
      if (left === null) return nullsLast ? 1 : -1;
      if (right === null) return nullsLast ? -1 : 1;
      const ahead = left < right ? -1 : 1;
      return direction === "asc" ? ahead : -ahead;
    }
    // The id is always ascending, whichever way the column went. See keysetWhere.
    expect(order[order.length - 1]).toEqual({ id: "asc" });
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/** Pages a list the way a route does: read one extra, hand back a cursor. */
function walk(
  table: () => readonly Row[],
  column: SortColumn<Field>,
  direction: SortDirection,
  limit: number,
  /** Run between pages, so an insertion can land mid-walk. */
  between?: (page: number) => void,
): Row[] {
  const seen: Row[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 50; page += 1) {
    const all: Row[] = sorted(table(), column, direction);
    const after: CursorPosition | null =
      cursor === null ? null : decodeCursor(cursor, { param: column.param, direction });
    const eligible: Row[] =
      after === null ? all : all.filter((row) => matches(row, keysetWhere(column, direction, after)));
    const read: Row[] = eligible.slice(0, takeFor(limit));
    const taken: { rows: Row[]; next: string | null } = nextCursorFrom<Row, Field>(
      read,
      column,
      direction,
      limit,
    );
    seen.push(...taken.rows);
    if (taken.next === null) return seen;
    cursor = taken.next;
    between?.(page);
  }
  throw new Error("the walk never reached the end");
}

function game(id: string, playedAt: string, moveCount: number, durationMs: number | null = null): Row {
  return { id, playedAt, moveCount, durationMs };
}

const RECORD: Row[] = Array.from({ length: 23 }, (_, index) =>
  game(
    `g${String(index).padStart(2, "0")}`,
    `2026-09-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
    // Deliberately tied: several games are the same length, so the tiebreaker matters.
    10 + (index % 4),
    index % 5 === 0 ? null : 1000 * index,
  ),
);

describe("paging a list", () => {
  it("reads every row exactly once, in order, over several pages", () => {
    for (const direction of ["asc", "desc"] as const) {
      for (const column of [PLAYED, MOVES, DURATION]) {
        const seen = walk(() => RECORD, column, direction, 5);
        expect(seen.map((row) => row.id)).toEqual(sorted(RECORD, column, direction).map((row) => row.id));
      }
    }
  });

  /*
   * THE FAULT THIS CONVENTION EXISTS TO REMOVE, stated as a test.
   *
   * With `skip`/`take`, a row inserted above the page being read shifts every
   * row down one, so the next page repeats a row the reader has already seen;
   * a row removed above produces a gap instead. A correspondence site finishes
   * a game every few hours and every one is an insertion at the top of the
   * record, so this is the ordinary case rather than a corner of it.
   */
  it("shows no row twice and skips none when rows are inserted between pages", () => {
    const table = [...RECORD];
    let added = 0;
    const seen = walk(
      () => table,
      PLAYED,
      "desc",
      5,
      () => {
        added += 1;
        // Newest first, so a new game lands at the very top of the list being read.
        table.unshift(game(`new${added}`, `2026-10-${String(added).padStart(2, "0")}T00:00:00.000Z`, 12));
      },
    );

    const ids = seen.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Every game that was there when the walk started was shown.
    for (const row of RECORD) expect(ids).toContain(row.id);
  });

  it("shows no row twice and skips none when rows are inserted on a tied column", () => {
    const table = [...RECORD];
    let added = 0;
    const seen = walk(
      () => table,
      MOVES,
      "desc",
      4,
      () => {
        added += 1;
        table.unshift(game(`new${added}`, "2026-10-01T00:00:00.000Z", 13));
      },
    );
    const ids = seen.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const row of RECORD) expect(ids).toContain(row.id);
  });

  /*
   * The nulls are the half that silently disappears. Order them last and get the
   * keyset wrong in the obvious way, and every game recorded without a clock
   * stops existing past the first page of a sort by duration — no error, and a
   * page that looks complete.
   */
  it("reaches the nulls, which sort last in both directions", () => {
    const nulls = RECORD.filter((row) => row.durationMs === null).map((row) => row.id);
    expect(nulls.length).toBeGreaterThan(1);

    for (const direction of ["asc", "desc"] as const) {
      const seen = walk(() => RECORD, DURATION, direction, 4).map((row) => row.id);
      for (const id of nulls) expect(seen).toContain(id);
      expect(seen.slice(-nulls.length).sort()).toEqual([...nulls].sort());
    }
  });

  it("deletions above the page leave a gap in nothing", () => {
    const table = [...RECORD];
    const seen = walk(() => table, PLAYED, "desc", 5, () => {
      // Remove the newest remaining game, which the reader has already passed.
      table.shift();
    });
    const ids = seen.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("nextCursorFrom", () => {
  it("says the page is the last one when the extra row did not arrive", () => {
    const rows = RECORD.slice(0, 5);
    expect(nextCursorFrom(rows, PLAYED, "desc", 5).next).toBeNull();
    expect(nextCursorFrom(rows, PLAYED, "desc", 5).rows).toHaveLength(5);
  });

  it("trims the extra row off the page it hands back", () => {
    const { rows, next } = nextCursorFrom(RECORD.slice(0, 6), PLAYED, "desc", 5);
    expect(rows).toHaveLength(5);
    expect(next).not.toBeNull();
    expect(decodeCursor(next!, { param: "played", direction: "desc" })?.id).toBe(rows[4].id);
  });

  it("carries a Date as its ISO string, so a cursor holds one type and not two", () => {
    const when = new Date("2026-09-12T10:00:00.000Z");
    const rows = [
      { id: "a", playedAt: when },
      { id: "b", playedAt: when },
    ];
    const { next } = nextCursorFrom(rows, PLAYED, "desc", 1);
    expect(decodeCursor(next!, { param: "played", direction: "desc" })?.value).toBe(when.toISOString());
  });
});

describe("keysetOrderBy", () => {
  it("ends with the ascending id, whichever way the column went", () => {
    expect(keysetOrderBy(PLAYED, "desc")).toEqual([{ playedAt: "desc" }, { id: "asc" }]);
    expect(keysetOrderBy(PLAYED, "asc")).toEqual([{ playedAt: "asc" }, { id: "asc" }]);
  });

  it("pins a nullable column's nulls last in both directions", () => {
    expect(keysetOrderBy(DURATION, "desc")).toEqual([
      { durationMs: { sort: "desc", nulls: "last" } },
      { id: "asc" },
    ]);
    expect(keysetOrderBy(DURATION, "asc")).toEqual([
      { durationMs: { sort: "asc", nulls: "last" } },
      { id: "asc" },
    ]);
  });
});
