import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { pagingSpecProblems, sortWords } from "./paging";
import type { SortSpec } from "./paging.types";
import { GAME_SORT_SPEC } from "@/lib/history/gameHistory.sort";
import { LADDER_SORT_SPEC } from "@/lib/rating/ladder.sort";
import { XP_LEDGER_SORT } from "@/lib/xp/xpHistory.sort";

/**
 * THE GATE OVER EVERY SORTABLE LIST ON THE SITE.
 *
 * A sort declaration is data, and data goes wrong quietly: a fallback naming a
 * column somebody renamed, two columns claiming one word in the address, an
 * index name that no longer exists. None of that fails a build on its own, and
 * all of it produces a list ordered by something nobody chose — or, worse, a
 * list whose ordering is a full scan on a table that grew.
 *
 * EVERY SPEC IS LISTED HERE BY HAND, and that is the point rather than a
 * shortcoming. A test that discovered specs by walking the filesystem would
 * pass on the day somebody wrote one it could not find, which is exactly the
 * day it matters. A new sortable list adds a line below; forgetting to is
 * caught by the other half of this file, which counts them.
 */
const SPECS: { of: string; spec: SortSpec<string> }[] = [
  { of: "the record", spec: GAME_SORT_SPEC as SortSpec<string> },
  { of: "the ladder", spec: LADDER_SORT_SPEC as SortSpec<string> },
  /*
   * A member's own XP ledger, on /me's XP tab. Declared in `xpHistory.sort.ts`
   * and not in `xpHistoryPage.ts`, which does the reading — for the reason its
   * two neighbours above are split the same way: this gate imports every spec on
   * the site, and a spec declared beside the query would drag `server-only` and
   * a `PrismaClient` into it.
   */
  { of: "a member's XP", spec: XP_LEDGER_SORT as SortSpec<string> },
];

/**
 * Every index Prisma will have created, by the name it gives one.
 *
 * Read out of the schema rather than listed here, because a list of index names
 * beside the schema is the same two-lists-that-must-agree problem this whole
 * convention exists to remove. Prisma names an unnamed index
 * `<Model>_<column>…_idx`, which is what production reports for every one of
 * these — checked with `pg_indexes` on 2026-09-12.
 */
function indexesInSchema(): Set<string> {
  const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
  const names = new Set<string>();
  let model = "";
  for (const line of schema.split("\n")) {
    const declared = /^model\s+(\w+)\s*\{/.exec(line);
    if (declared !== null) model = declared[1];

    const index = /@@(index|unique)\(\[([^\]]+)\]/.exec(line);
    if (index !== null && model !== "") {
      const columns = index[2].split(",").map((one) => one.trim());
      names.add(`${model}_${columns.join("_")}_${index[1] === "unique" ? "key" : "idx"}`);
    }
    // A model's primary key, which is an index and is named this way.
    if (/^\s+\w+\s+\S+\s+@id\b/.test(line) && model !== "") names.add(`${model}_pkey`);
  }
  return names;
}

describe("every sort declaration", () => {
  it.each(SPECS)("$of is sound", ({ spec }) => {
    expect(pagingSpecProblems(spec)).toEqual([]);
  });

  /*
   * AN INDEX NAMED IN A DECLARATION HAS TO EXIST. This is the check worth having
   * and the one a type cannot make: `index: "Game_playedAt_idx"` is a string,
   * and a string satisfies the compiler whether or not the database has ever
   * heard of it. A renamed or dropped index leaves a column declared cheap and
   * silently scanning — the fault taken off the landing page in 0.139.0, wearing
   * a reassurance.
   */
  it.each(SPECS)("$of only names indexes the schema actually has", ({ spec }) => {
    const have = indexesInSchema();
    const claimed = spec.columns
      .map((column) => column.index)
      .filter((name): name is string => name !== null);
    expect(claimed.length).toBeGreaterThan(0);
    for (const name of claimed) expect([...have]).toContain(name);
  });

  /*
   * THE CHECK ABOVE MUST BE ABLE TO FAIL. A schema reader that returned
   * everything, or that quietly returned nothing and looped over an empty list
   * of claims, would pass every assertion in this file while checking nothing —
   * a false pass, which is the failure mode worth spending five lines on. So:
   * the names it finds are real ones, and a plausible-looking invention is not
   * among them.
   */
  it("reads real index names out of the schema and refuses an invented one", () => {
    const have = indexesInSchema();
    expect(have.has("Game_playedAt_idx")).toBe(true);
    expect(have.has("Player_rating_idx")).toBe(true);
    expect(have.has("Game_moveCount_idx")).toBe(false);
    expect(have.has("Game_durationMs_idx")).toBe(false);
  });

  it.each(SPECS)("$of speaks plain words in an address", ({ spec }) => {
    for (const word of sortWords(spec)) {
      // Kebab or a plain word. No camelCase, no underscores, nothing encoded.
      expect(word).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  /*
   * The count is what catches a spec nobody added above. It is deliberately a
   * hard number: a new sortable list makes this fail, and the failure is a
   * reminder to add the line rather than a reason to loosen it.
   */
  it("is the whole list of them", () => {
    expect(SPECS).toHaveLength(3);
  });
});
