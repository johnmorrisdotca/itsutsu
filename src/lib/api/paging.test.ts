import { describe, expect, it } from "vitest";

import {
  PAGE_LIMIT_CEILING,
  ariaSort,
  isRefusal,
  pagingSpecProblems,
  parseCursor,
  parseLimit,
  parseSort,
  sortHref,
  sortWords,
} from "./paging";
import type { SortSpec } from "./paging.types";

type Field = "playedAt" | "moveCount" | "durationMs";

const SPEC: SortSpec<Field> = {
  of: "the record",
  columns: [
    { param: "played", field: "playedAt", label: "Played", firstPress: "desc", index: "Game_playedAt_idx" },
    {
      param: "moves",
      field: "moveCount",
      label: "Moves",
      firstPress: "desc",
      index: null,
      unindexedBecause: "A hundred and thirty rows, so the sort is done in memory by Postgres.",
    },
    {
      param: "duration",
      field: "durationMs",
      label: "Time taken",
      firstPress: "desc",
      nullable: true,
      index: null,
      unindexedBecause: "A hundred and thirty rows, so the sort is done in memory by Postgres.",
    },
  ],
  fallback: { param: "played", direction: "desc" },
  tiebreak: "id",
};

const at = (query: string) => new URLSearchParams(query);

describe("parseSort", () => {
  it("falls back when nothing was asked, and says it was not asked", () => {
    const choice = parseSort(SPEC, at(""));
    expect(isRefusal(choice)).toBe(false);
    if (isRefusal(choice)) return;
    expect(choice.column.param).toBe("played");
    expect(choice.direction).toBe("desc");
    expect(choice.asked).toBe(false);
  });

  it("reads the canonical attached direction", () => {
    const choice = parseSort(SPEC, at("sort=moves:asc"));
    if (isRefusal(choice)) throw new Error(choice.error);
    expect(choice.column.field).toBe("moveCount");
    expect(choice.direction).toBe("asc");
    expect(choice.asked).toBe(true);
  });

  /*
   * The addresses this site already hands out. A convention that read the column
   * and dropped the direction would render the other way round with nothing
   * saying so, which is the failure this pair of spellings exists to avoid.
   */
  it("still reads the older order= spelling", () => {
    const choice = parseSort(SPEC, at("sort=moves&order=asc"));
    if (isRefusal(choice)) throw new Error(choice.error);
    expect(choice.direction).toBe("asc");
  });

  it("lets the attached direction win over order=, because a heading just wrote it", () => {
    const choice = parseSort(SPEC, at("sort=moves:desc&order=asc"));
    if (isRefusal(choice)) throw new Error(choice.error);
    expect(choice.direction).toBe("desc");
  });

  it("uses the column's first press when only the column was named", () => {
    const choice = parseSort(SPEC, at("sort=moves"));
    if (isRefusal(choice)) throw new Error(choice.error);
    expect(choice.direction).toBe("desc");
  });

  it("refuses an unknown column BY NAME and lists what it accepts", () => {
    const choice = parseSort(SPEC, at("sort=passwordHash"));
    if (!isRefusal(choice)) throw new Error("an unknown column was accepted");
    expect(choice.error).toContain("passwordHash");
    for (const word of sortWords(SPEC)) expect(choice.error).toContain(word);
  });

  it("refuses a direction that is not one", () => {
    const attached = parseSort(SPEC, at("sort=moves:sideways"));
    expect(isRefusal(attached)).toBe(true);
    const older = parseSort(SPEC, at("sort=moves&order=sideways"));
    expect(isRefusal(older)).toBe(true);
  });
});

describe("parseLimit", () => {
  it("is the fallback when unasked, unreadable or absurd", () => {
    expect(parseLimit(at(""), { fallback: 20 })).toBe(20);
    expect(parseLimit(at("limit=abc"), { fallback: 20 })).toBe(20);
    expect(parseLimit(at("limit=0"), { fallback: 20 })).toBe(20);
    expect(parseLimit(at("limit=-5"), { fallback: 20 })).toBe(20);
    expect(parseLimit(at("limit=2.5"), { fallback: 20 })).toBe(20);
  });

  it("clamps to the list's maximum, and never past the shared ceiling", () => {
    expect(parseLimit(at("limit=1000"), { max: 50 })).toBe(50);
    expect(parseLimit(at("limit=1000"), { max: 10_000 })).toBe(PAGE_LIMIT_CEILING);
    expect(parseLimit(at("limit=7"), { max: 50 })).toBe(7);
  });
});

describe("parseCursor", () => {
  it("is null for absent and blank, and the trimmed value otherwise", () => {
    expect(parseCursor(at(""))).toBeNull();
    expect(parseCursor(at("cursor=%20"))).toBeNull();
    expect(parseCursor(at("cursor=abc"))).toBe("abc");
  });
});

describe("sortHref", () => {
  const current = parseSort(SPEC, at("sort=played:desc"));
  if (isRefusal(current)) throw new Error(current.error);

  it("keeps every other parameter, so the same rows are sorted", () => {
    const href = sortHref("/history", at("sort=played:desc&player=Hanachan&pool=people"), current, SPEC.columns[1]);
    expect(href).toContain("player=Hanachan");
    expect(href).toContain("pool=people");
    expect(href).toContain("sort=moves%3Adesc");
  });

  /*
   * A cursor is a position in the OLD order. Carried into a new one it opens the
   * middle of a list and calls it the top — silently, and looking exactly like a
   * sort that worked.
   */
  it("drops the cursor and the page, which belong to the old order", () => {
    const href = sortHref("/history", at("sort=played:desc&cursor=abc&page=4"), current, SPEC.columns[1]);
    expect(href).not.toContain("cursor");
    expect(href).not.toContain("page");
  });

  it("flips on a second press of the column already sorted by", () => {
    const href = sortHref("/history", at("sort=played:desc"), current, SPEC.columns[0]);
    expect(href).toContain("sort=played%3Aasc");
  });

  it("starts a new column at its own first press rather than the current direction", () => {
    const ascending = parseSort(SPEC, at("sort=played:asc"));
    if (isRefusal(ascending)) throw new Error(ascending.error);
    const href = sortHref("/history", at("sort=played:asc"), ascending, SPEC.columns[1]);
    expect(href).toContain("sort=moves%3Adesc");
  });

  /*
   * Pressing the column the list FELL BACK to is a first press, not a flip.
   * Otherwise /history — which is sorted by Played without anybody asking —
   * would answer the first press on Played with ascending, showing the oldest
   * games to a reader who asked for the newest.
   */
  it("treats a press on the fallback column as a first press", () => {
    const fell = parseSort(SPEC, at(""));
    if (isRefusal(fell)) throw new Error(fell.error);
    const href = sortHref("/history", at(""), fell, SPEC.columns[0]);
    expect(href).toContain("sort=played%3Adesc");
  });

  it("returns the bare address plus the sort when there is nothing else in the query", () => {
    // The cursor is the only other parameter, and it does not survive a press.
    expect(sortHref("/history", at("cursor=abc"), current, SPEC.columns[0])).toBe(
      "/history?sort=played%3Aasc",
    );
  });
});

describe("ariaSort", () => {
  it("speaks the long words, and only about the column in force", () => {
    const choice = parseSort(SPEC, at("sort=played:asc"));
    if (isRefusal(choice)) throw new Error(choice.error);
    expect(ariaSort(choice, SPEC.columns[0])).toBe("ascending");
    expect(ariaSort(choice, SPEC.columns[1])).toBe("none");
  });
});

describe("pagingSpecProblems", () => {
  it("passes a sound spec", () => {
    expect(pagingSpecProblems(SPEC)).toEqual([]);
  });

  it("catches a fallback naming a column that is not declared", () => {
    const problems = pagingSpecProblems({ ...SPEC, fallback: { param: "rating", direction: "desc" } });
    expect(problems.join(" ")).toContain("rating");
  });

  it("catches the same word declared twice", () => {
    const problems = pagingSpecProblems({ ...SPEC, columns: [SPEC.columns[0], SPEC.columns[0]] });
    expect(problems.join(" ")).toContain("twice");
  });

  it("catches camelCase in an address", () => {
    const problems = pagingSpecProblems({
      ...SPEC,
      columns: [{ param: "moveCount", field: "moveCount", label: "Moves", firstPress: "desc", index: "x" }],
      fallback: { param: "moveCount", direction: "desc" },
    });
    expect(problems.join(" ")).toContain("camelCase");
  });

  /* A blank reason satisfies the type. It must not satisfy the gate. */
  it("catches an unindexed column whose reason says nothing", () => {
    const problems = pagingSpecProblems({
      ...SPEC,
      columns: [
        { param: "moves", field: "moveCount", label: "Moves", firstPress: "desc", index: null, unindexedBecause: "  " },
      ],
      fallback: { param: "moves", direction: "desc" },
    });
    expect(problems.join(" ")).toContain("no reason");
  });

  it("throws rather than guessing when a spec falls back to a column it lacks", () => {
    expect(() => parseSort({ ...SPEC, fallback: { param: "nope", direction: "desc" } }, at(""))).toThrow(
      /nope/,
    );
  });
});
