import { historyPath } from "@/lib/gomoku/slugs";
import { readMonth } from "@/lib/history/recordMonth";

import { PUZZLE_SPECS } from "./puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "./puzzles.types";

/**
 * A PUZZLE'S RECORD, AS AN ADDRESS: `/games/<slug>/history?member=…&size=…`.
 *
 * Every solve of one puzzle kept here, by everybody — the puzzle's answer to a
 * game's /history. The puzzle is in the path, because it is identity; who
 * solved it, at which size and level, in which month and in which order are
 * filters, and live in the query (the site's address rules). A member is named
 * by id, never by name, for `gamesHref`'s reason: the screen says "Hanako M.",
 * and an address is not the place for the rest of it.
 *
 * Pure, so a link and the page that answers it read one definition.
 */

export const PUZZLE_RECORD_PARAMS = {
  member: "member",
  size: "size",
  level: "level",
  month: "month",
  sort: "sort",
  page: "page",
} as const;

/** Newest first, or the solved ones fastest first — the fastest board's order. */
export const PUZZLE_RECORD_SORTS = { newest: "newest", fastest: "fastest" } as const;
export type PuzzleRecordSort = (typeof PUZZLE_RECORD_SORTS)[keyof typeof PUZZLE_RECORD_SORTS];

/** What a record's address asks for. Nulls are "no filter". */
export type PuzzleRecordAsked = {
  member: string | null;
  size: number | null;
  level: PuzzleLevel | null;
  /** "2026-09": the solves finished in that month, as the monthly board counts them. */
  month: string | null;
  sort: PuzzleRecordSort;
  page: number;
};

/** The most pages a record reads through; past it a reader narrows rather than pages. */
export const PUZZLE_RECORD_PAGE_MAX = 1000;

/** A member id is opaque and short; anything longer names nobody. */
const MEMBER_MAX = 64;

type Query = Record<string, string | string[] | undefined>;

/**
 * What an address asks for, each filter dropped where it names nothing this
 * puzzle has — a size it is never made at, a level it does not offer, a month
 * that is not one. A dropped filter narrows nothing, so the page never claims
 * a narrowing it did not make.
 */
export function puzzleRecordAsked(kind: PuzzleKind, query: Query): PuzzleRecordAsked {
  const spec = PUZZLE_SPECS[kind];
  const one = (key: string): string => {
    const value = query[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  };
  const member = one(PUZZLE_RECORD_PARAMS.member);
  const size = Number(one(PUZZLE_RECORD_PARAMS.size));
  const level = one(PUZZLE_RECORD_PARAMS.level) as PuzzleLevel;
  const page = Number(one(PUZZLE_RECORD_PARAMS.page));
  return {
    member: member !== "" && member.length <= MEMBER_MAX ? member : null,
    size: spec.sizes.includes(size) ? size : null,
    level: spec.levels.includes(level) ? level : null,
    month: readMonth(one(PUZZLE_RECORD_PARAMS.month)),
    sort: one(PUZZLE_RECORD_PARAMS.sort) === PUZZLE_RECORD_SORTS.fastest ? PUZZLE_RECORD_SORTS.fastest : PUZZLE_RECORD_SORTS.newest,
    page: Number.isInteger(page) && page >= 1 && page <= PUZZLE_RECORD_PAGE_MAX ? page : 1,
  };
}

/** The address of a puzzle's record, narrowed as asked; defaults are left out, so one set has one address. */
export function puzzleRecordHref(kind: PuzzleKind | string, asked: Partial<PuzzleRecordAsked> = {}): string {
  const query = new URLSearchParams();
  if (asked.member) query.set(PUZZLE_RECORD_PARAMS.member, asked.member);
  if (asked.size) query.set(PUZZLE_RECORD_PARAMS.size, String(asked.size));
  if (asked.level) query.set(PUZZLE_RECORD_PARAMS.level, asked.level);
  if (asked.month) query.set(PUZZLE_RECORD_PARAMS.month, asked.month);
  if (asked.sort === PUZZLE_RECORD_SORTS.fastest) query.set(PUZZLE_RECORD_PARAMS.sort, PUZZLE_RECORD_SORTS.fastest);
  if (asked.page !== undefined && asked.page > 1) query.set(PUZZLE_RECORD_PARAMS.page, String(asked.page));
  const search = query.toString();
  return search === "" ? historyPath(kind) : `${historyPath(kind)}?${search}`;
}
