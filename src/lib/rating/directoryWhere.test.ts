import { describe, expect, it } from "vitest";

import {
  AWAY_AFTER_DAYS,
  DIRECTORY_WHO,
  NO_FILTER,
  filterDirectory,
  type DirectoryFilter,
} from "./directoryFilter";
import {
  EVERY_MEMBER,
  EVER_SEEN,
  NEVER_SEEN,
  directoryWhere,
  narrowsAnything,
} from "./directoryWhere";

/**
 * ONE NARROWING, TWO SPELLINGS, AND THEY HAVE TO AGREE.
 *
 * `filterDirectory` narrows a list already in memory — the computers tab still
 * does that, and so does the operator's roster. `directoryWhere` is the same
 * three rules as a condition the database answers, which the members directory
 * needed the moment it started PAGING: a narrowing applied after a page is read
 * hands out a cursor saying there is more over a page of three rows, and each
 * page is separately correct while the list as a whole is nonsense.
 *
 * Two statements of one rule is the standing hazard, so this interprets the
 * `where` against the same rows `filterDirectory` is given and insists the two
 * pick the same members. `interpret` below understands exactly the clause
 * shapes `directoryWhere` builds and THROWS on anything else — so a clause
 * added to the builder and not to this file fails loudly rather than being
 * quietly ignored, which would be a test agreeing with itself.
 */

type Row = {
  id: string;
  botTier: string | null;
  lastSeenAt: string;
  unclaimableBecause: string | null;
  profile: { tier: "unrated" | "provisional" | "established" } | null;
};

const NOW = Date.parse("2026-09-12T12:00:00.000Z");
const daysAgo = (days: number) => new Date(NOW - days * 86_400_000).toISOString();

const ROWS: Row[] = [
  {
    id: "here",
    botTier: null,
    lastSeenAt: daysAgo(1),
    unclaimableBecause: null,
    profile: { tier: "established" },
  },
  {
    id: "away",
    botTier: null,
    lastSeenAt: daysAgo(AWAY_AFTER_DAYS + 1),
    unclaimableBecause: null,
    profile: { tier: "established" },
  },
  {
    id: "new-here",
    botTier: null,
    lastSeenAt: daysAgo(0),
    unclaimableBecause: null,
    profile: null,
  },
  {
    /* A program: never seen, never away, and gone the moment somebody asks for
       people alone. */
    id: "robot",
    botTier: "kyu",
    lastSeenAt: daysAgo(400),
    unclaimableBecause: "computer",
    profile: { tier: "provisional" },
  },
  {
    /* Somebody remembered here: never seen either, and — unlike a program —
       correctly counted away, because there is no game to be had from them. */
    id: "kept",
    botTier: null,
    lastSeenAt: daysAgo(400),
    unclaimableBecause: "kept-record",
    profile: null,
  },
];

/** Which rows have a settled rating, as the id list the real one builds. */
const SETTLED = ROWS.filter((row) => row.profile?.tier === "established").map((row) => row.id);

/**
 * The subset a Prisma `where` from `directoryWhere` selects.
 *
 * Narrow on purpose, and it throws rather than defaulting: see the head of this
 * file. It reads only the shapes that builder emits — `AND`, `OR`, `NOT`, a
 * `botTier` of null or not-null, a `lastSeenAt` floor, and an id list.
 */
function interpret(where: unknown, rows: readonly Row[]): Row[] {
  return rows.filter((row) => matches(where, row));
}

function matches(where: unknown, row: Row): boolean {
  if (typeof where !== "object" || where === null) {
    throw new Error(`Not a clause this test understands: ${JSON.stringify(where)}`);
  }
  const clause = where as Record<string, unknown>;
  const keys = Object.keys(clause);
  if (keys.length === 0) return true;

  return keys.every((key) => {
    const value = clause[key];
    if (key === "AND") return (value as unknown[]).every((one) => matches(one, row));
    if (key === "OR") return (value as unknown[]).some((one) => matches(one, row));
    if (key === "NOT") {
      /*
       * REFUSED RATHER THAN INTERPRETED, and this is the lesson of the bug this
       * file now guards. `!matches(…)` is JavaScript's two-valued negation, and
       * SQL's is not: `NOT (a OR b)` over a NULL column is UNKNOWN, which a
       * `WHERE` does not select. An interpreter that answers `NOT` with `!`
       * agrees with the reasoning that wrote the clause instead of with
       * Postgres — which is how a `where` that selected nine rows out of six
       * hundred and forty passed here.
       *
       * So a `NOT` in a directory clause is a mistake at the point it is
       * written, and this says so rather than quietly approving of it. Both
       * halves of `NEVER_SEEN`/`EVER_SEEN` are positive for the same reason.
       */
      throw new Error(
        "A directory clause uses NOT. SQL's NOT is three valued over a nullable " +
          "column and this interpreter cannot model it — write both halves positively, " +
          "as NEVER_SEEN and EVER_SEEN do.",
      );
    }
    if (key === "botTier") {
      if (value === null) return row.botTier === null;
      const test = value as { not: null };
      if (test.not === null) return row.botTier !== null;
      throw new Error(`Not a botTier test this test understands: ${JSON.stringify(value)}`);
    }
    if (key === "lastSeenAt") {
      const test = value as { gte?: Date };
      if (test.gte === undefined) {
        throw new Error(`Not a lastSeenAt test this test understands: ${JSON.stringify(value)}`);
      }
      return Date.parse(row.lastSeenAt) >= test.gte.getTime();
    }
    if (key === "unclaimableBecause") {
      if (value === null) return row.unclaimableBecause === null;
      if (typeof value === "string") return row.unclaimableBecause === value;
      const test = value as { notIn?: string[] };
      if (test.notIn === undefined) {
        throw new Error(
          `Not an unclaimableBecause test this test understands: ${JSON.stringify(value)}`,
        );
      }
      /*
       * SQL, NOT JAVASCRIPT. `col NOT IN (…)` is UNKNOWN when `col` is NULL and
       * a `WHERE` does not select an UNKNOWN row — so this returns false for a
       * null, which is what Postgres does and what `!test.notIn.includes(null)`
       * would have got backwards. The whole reason this file models three
       * valued logic is that it did not, once, and agreed with a clause that
       * returned nine rows out of six hundred and forty.
       */
      if (row.unclaimableBecause === null) return false;
      return !test.notIn.includes(row.unclaimableBecause);
    }
    if (key === "id") {
      const test = value as { in?: string[] };
      if (test.in === undefined) {
        throw new Error(`Not an id test this test understands: ${JSON.stringify(value)}`);
      }
      return test.in.includes(row.id);
    }
    throw new Error(`A clause on "${key}" has been added and this test does not read it.`);
  });
}

/** Every narrowing the bar can produce: three whos, times settled, times active. */
const EVERY_FILTER: DirectoryFilter[] = Object.values(DIRECTORY_WHO).flatMap((who) =>
  [false, true].flatMap((settled) =>
    [false, true].map((active) => ({ who, settled, active }) as DirectoryFilter),
  ),
);

describe("the directory's narrowing, in memory and in the database", () => {
  it("picks the same members, for every narrowing the bar can ask for", () => {
    expect(EVERY_FILTER).toHaveLength(12);
    for (const filter of EVERY_FILTER) {
      const inMemory = filterDirectory(ROWS, filter, NOW).map((row) => row.id);
      const inDatabase = interpret(
        directoryWhere(filter, filter.settled ? SETTLED : null, NOW),
        ROWS,
      ).map((row) => row.id);
      expect(inDatabase, `who=${filter.who} settled=${filter.settled} active=${filter.active}`).toEqual(
        inMemory,
      );
    }
  });

  it("really does narrow, so the agreement above is not two empty answers", () => {
    /*
     * The other half. Two filters that both selected everybody, or both nobody,
     * would agree perfectly and say nothing — and every one of these narrowings
     * is invisible on a small directory, which is exactly the condition under
     * which a filter that quietly does nothing goes unnoticed.
     */
    const ids = (filter: DirectoryFilter) =>
      interpret(directoryWhere(filter, filter.settled ? SETTLED : null, NOW), ROWS).map(
        (row) => row.id,
      );
    expect(ids(NO_FILTER)).toEqual(["here", "away", "new-here", "robot", "kept"]);
    expect(ids({ ...NO_FILTER, who: DIRECTORY_WHO.people })).toEqual([
      "here",
      "away",
      "new-here",
      "kept",
    ]);
    expect(ids({ ...NO_FILTER, who: DIRECTORY_WHO.computers })).toEqual(["robot"]);
    // The away test spares a program and does not spare a kept record.
    expect(ids({ ...NO_FILTER, active: true })).toEqual(["here", "new-here", "robot"]);
    expect(ids({ ...NO_FILTER, settled: true })).toEqual(["here", "away"]);
  });

  it("narrows to nothing for an empty settled list, and not at all for no list", () => {
    /*
     * NULL AND `[]` MEAN OPPOSITE THINGS, which is the one place this builder
     * could be catastrophically wrong while type-checking: an empty list is
     * "nobody has a settled rating" and must empty the page, and null is
     * "nobody asked" and must not narrow it at all. A default of `[]` would have
     * shown every reader an empty directory.
     */
    expect(interpret(directoryWhere(NO_FILTER, [], NOW), ROWS)).toEqual([]);
    expect(interpret(directoryWhere(NO_FILTER, null, NOW), ROWS)).toHaveLength(ROWS.length);
    expect(directoryWhere(NO_FILTER, null, NOW)).toEqual(EVERY_MEMBER);
  });

  it("knows when a second count is worth running", () => {
    // `matching` is `total` when nobody narrowed anything, and the page skips a
    // count rather than running one to print a number it already has.
    expect(narrowsAnything(NO_FILTER)).toBe(false);
    expect(narrowsAnything({ ...NO_FILTER, who: DIRECTORY_WHO.people })).toBe(true);
    expect(narrowsAnything({ ...NO_FILTER, settled: true })).toBe(true);
    expect(narrowsAnything({ ...NO_FILTER, active: true })).toBe(true);
  });
});

describe("the rows that are never seen, and the rows that are", () => {
  it("is the programs and the kept records, and nobody else", () => {
    /*
     * The set the directory pins onto its first page and lifts out of the paged
     * read while it does. A `NEVER_SEEN` that caught an ordinary member would
     * pin them to page one AND remove them from the order they belong in, which
     * is a row in two places at once and then in neither.
     */
    expect(interpret(NEVER_SEEN, ROWS).map((row) => row.id)).toEqual(["robot", "kept"]);
  });

  it("is everybody else, written out rather than negated", () => {
    expect(interpret(EVER_SEEN, ROWS).map((row) => row.id)).toEqual(["here", "away", "new-here"]);
  });

  /**
   * THE ASSERTION THAT WOULD HAVE CAUGHT THE BUG, and the reason it is phrased
   * as a partition rather than as two lists.
   *
   * The paged read used to ask for `{ NOT: NEVER_SEEN }`, which is correct
   * boolean logic: not a program and not a kept record. It is wrong SQL. An
   * ordinary member's `unclaimableBecause` is NULL, so `= 'kept-record'` is
   * UNKNOWN, `FALSE OR UNKNOWN` is UNKNOWN, and `NOT UNKNOWN` is UNKNOWN —
   * which a `WHERE` clause does not select. /players came back with nine rows,
   * the pinned ones, and read as a working page with a short list on it.
   *
   * The version of this file that existed then PASSED, because its interpreter
   * used JavaScript's two-valued `!` and therefore agreed with the reasoning
   * rather than with Postgres. So the claim is now one neither half can satisfy
   * alone and which needs no opinion about NULL at all: every member is in
   * exactly one of the two sets. A clause that quietly selected nothing would
   * leave rows in neither, and one that overlapped would put rows in both.
   */
  it("partitions every member: exactly one of the two, never neither and never both", () => {
    const never = new Set(interpret(NEVER_SEEN, ROWS).map((row) => row.id));
    const ever = new Set(interpret(EVER_SEEN, ROWS).map((row) => row.id));
    for (const row of ROWS) {
      const sides = [never.has(row.id), ever.has(row.id)].filter(Boolean).length;
      expect(sides, `${row.id} is in ${sides} of the two halves`).toBe(1);
    }
    // And between them they are the whole directory, which is what makes the
    // pin safe: nobody is dropped by being lifted out of the paged read.
    expect(never.size + ever.size).toBe(ROWS.length);
  });

  it("keeps partitioning when a row carries some other reason it cannot be claimed", () => {
    /*
     * A seeded row: `unclaimableBecause` is set and is NOT "kept-record". It is
     * an ordinary paged member — the old directory listed it too — and it is the
     * case a `notIn` written as `NOT (col IN …)` gets right while getting the
     * NULLs beside it wrong, so it is here to stop the fix being "right" for
     * only the rows that provoked it.
     */
    const seeded: Row = {
      id: "seeded",
      botTier: null,
      lastSeenAt: daysAgo(2),
      unclaimableBecause: "seed",
      profile: null,
    };
    const rows = [...ROWS, seeded];
    const never = interpret(NEVER_SEEN, rows).map((row) => row.id);
    const ever = interpret(EVER_SEEN, rows).map((row) => row.id);
    expect(never).not.toContain("seeded");
    expect(ever).toContain("seeded");
    expect(never.length + ever.length).toBe(rows.length);
  });
});
