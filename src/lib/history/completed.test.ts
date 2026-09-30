import { describe, expect, it } from "vitest";

import { completedBefore, mergeCompleted, type CompletedRow } from "./completed";

/** A row of some kind at a time; the merge reads only `kind`, `at` and `key`. */
function row(kind: CompletedRow["kind"], at: string, id: string): CompletedRow {
  return { kind, at, key: `${kind}:${id}` } as CompletedRow;
}

describe("the Completed tab's one list", () => {
  it("puts every kind of game in one order, newest first", () => {
    const page = mergeCompleted(
      [
        row("game", "2026-09-28T10:00:00.000Z", "a"),
        row("solve", "2026-09-30T10:00:00.000Z", "b"),
        row("table", "2026-09-29T10:00:00.000Z", "c"),
        row("device", "2026-09-29T12:00:00.000Z", "d"),
      ],
      10,
      false,
    );
    expect(page.rows.map((one) => one.kind)).toEqual(["solve", "device", "table", "game"]);
    expect(page.next).toBeNull();
  });

  it("cuts to a page and starts the next before the last row shown", () => {
    const page = mergeCompleted([row("game", "2026-09-28T10:00:00.000Z", "a"), row("solve", "2026-09-30T10:00:00.000Z", "b"), row("table", "2026-09-29T10:00:00.000Z", "c")], 2, false);
    expect(page.rows.map((one) => one.key)).toEqual(["solve:b", "table:c"]);
    expect(page.next).toBe("2026-09-29T10:00:00.000Z");
  });

  it("goes on when a kind had more past its own page, even when the merge fits", () => {
    const page = mergeCompleted([row("game", "2026-09-28T10:00:00.000Z", "a")], 2, true);
    expect(page.next).toBe("2026-09-28T10:00:00.000Z");
  });

  it("says nothing more on an empty list", () => {
    expect(mergeCompleted([], 20, true)).toEqual({ rows: [], next: null });
  });

  it("reads back only a time it handed out", () => {
    expect(completedBefore("2026-09-29T10:00:00.000Z")?.toISOString()).toBe("2026-09-29T10:00:00.000Z");
    expect(completedBefore(null)).toBeNull();
    expect(completedBefore("yesterday")).toBeNull();
    // A cursor from the list as it was before, the games' own: the first page, not an error.
    expect(completedBefore("eyJzIjoibGFzdCJ9")).toBeNull();
  });
});
