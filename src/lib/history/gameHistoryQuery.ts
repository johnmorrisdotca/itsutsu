import { variantFor } from "@/lib/gomoku/slugs";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  GAME_PAGE_MAX,
  GAME_PAGE_SIZE_DEFAULT,
  GAME_PAGE_SIZE_MAX,
  GAME_PAGE_SIZE_MIN,
  GAME_OUTCOME_FILTERS,
  GAME_POOL_FILTERS,
  GAME_RATED_FILTERS,
  GAME_RESULT_FILTERS,
  GAME_SEARCH_MAX,
  GAME_SIZE_FILTERS,
  GAME_SORT_BY,
  GAME_SORT_DIR,
  GAME_VARIANT_FILTERS,
  PLAYER_NAME_MAX,
} from "./gameHistory.constants";
import type { GameHistoryQuery, GameOutcome } from "./gameHistory.types";

/**
 * Reading, filtering and ordering game history.
 *
 * Every bound here is deliberate: `pageSize` is capped so one request cannot
 * pull the whole table, `search` is length-limited so it cannot become a
 * pathological scan, and `page` is accepted optimistically and clamped later
 * against the real total rather than rejected.
 */
const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(GAME_PAGE_MAX).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(GAME_PAGE_SIZE_MIN)
    .max(GAME_PAGE_SIZE_MAX)
    .default(GAME_PAGE_SIZE_DEFAULT),
  sortBy: z.enum(GAME_SORT_BY).default("playedAt"),
  sortDir: z.enum(GAME_SORT_DIR).default("desc"),
  search: z.string().max(GAME_SEARCH_MAX).optional(),
  player: z.string().max(PLAYER_NAME_MAX).optional(),
  result: z.enum(GAME_RESULT_FILTERS).default("all"),
  outcome: z.enum(GAME_OUTCOME_FILTERS).default("all"),
  pool: z.enum(GAME_POOL_FILTERS).default("all"),
  rated: z.enum(GAME_RATED_FILTERS).default("all"),
  variant: z.enum(GAME_VARIANT_FILTERS).default("all"),
  size: z.enum(GAME_SIZE_FILTERS).default("all"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

/**
 * What the address calls a sort, and what the table calls it. Addresses use
 * plain words with no casing — /history?sort=played&order=desc — so that a
 * link reads the same whoever typed it; the columns keep their own names.
 */
export const SORT_WORDS: Record<string, (typeof GAME_SORT_BY)[number]> = {
  played: "playedAt",
  moves: "moveCount",
  size: "size",
  duration: "duration",
};

export function sortWord(field: (typeof GAME_SORT_BY)[number]): string {
  return Object.entries(SORT_WORDS).find(([, value]) => value === field)?.[0] ?? field;
}

function sortField(word: string | undefined): string | undefined {
  if (word === undefined) return undefined;
  return SORT_WORDS[word] ?? word;
}

/** A game in the address is its slug, the same as on /games and /history. */
function variantFilter(value: string | undefined): string | undefined {
  if (value === undefined || value === "all") return value;
  return variantFor(value) ?? value;
}

/** Empty and whitespace-only values are "no filter", not a failed request. */
function trimmed(value: string | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

export function toGameHistoryQuery(url: URL): GameHistoryQuery | null {
  const get = (key: string) => url.searchParams.get(key) ?? undefined;

  const parsed = querySchema.safeParse({
    page: get("page"),
    // The address speaks plain words; the field names inside are the table's.
    pageSize: get("limit"),
    sortBy: sortField(get("sort")),
    sortDir: get("order"),
    search: get("search"),
    player: get("player"),
    result: get("result"),
    outcome: get("outcome"),
    pool: get("pool"),
    rated: get("rated"),
    variant: variantFilter(get("variant")),
    size: get("size"),
    from: get("from"),
    to: get("to"),
  });

  if (!parsed.success) return null;

  const { data } = parsed;
  return {
    page: data.page,
    pageSize: data.pageSize,
    sortBy: data.sortBy,
    sortDir: data.sortDir,
    search: trimmed(data.search),
    player: trimmed(data.player),
    result: data.result,
    outcome: data.outcome,
    pool: data.pool,
    rated: data.rated,
    variant: data.variant,
    size: data.size === "all" ? null : Number(data.size),
    from: data.from ?? null,
    to: data.to ?? null,
  };
}

/**
 * An outcome from one player's side of the board.
 *
 * The stored result names a colour, so "their losses" is two questions at
 * once: which colour won, and which colour they were. Both are asked here, in
 * one place, because a page that worked it out for itself would be a second
 * definition of somebody's record — and the two would disagree the first time
 * one of them forgot that an abandoned game is not a loss.
 *
 * Without a name to read it against, `won` and `lost` are unanswerable rather
 * than empty, so they are dropped: a filter nobody can honour should leave the
 * record as it was, not quietly return nothing.
 */
function outcomeWhere(outcome: GameOutcome, player: string | null): Prisma.GameWhereInput | null {
  if (outcome === "decided") return { result: { not: "abandoned" } };
  if (outcome === "drawn") return { result: "draw" };
  if (player === null) return null;

  const asBlack: Prisma.GameWhereInput = { blackName: { equals: player, mode: "insensitive" } };
  const asWhite: Prisma.GameWhereInput = { whiteName: { equals: player, mode: "insensitive" } };
  const theirs = outcome === "won" ? "black" : "white";
  const others = outcome === "won" ? "white" : "black";
  return {
    OR: [
      { AND: [asBlack, { result: theirs }] },
      { AND: [asWhite, { result: others }] },
    ],
  };
}

/**
 * Which games one of the two ladders was counting.
 *
 * A game is in the computer pool when either seat was a program, so the
 * question is about who sat down rather than about the game. The ids are
 * handed in because they come from the members table and this module is pure;
 * without them the filter is dropped rather than guessed at, which leaves the
 * record as it was instead of quietly answering a different question.
 *
 * The nulls are written out on purpose: a seat nobody holds an account for has
 * no id, and `NOT (id IN (…))` is not true of NULL in SQL — leaving it implied
 * would drop every game played under a typed-in name from the people pool,
 * which is most of the record.
 */
function poolWhere(pool: string, computerSeats: readonly string[]): Prisma.GameWhereInput | null {
  const ids = [...computerSeats];
  if (pool === "computer") {
    if (ids.length === 0) return { id: { in: [] } };
    return { OR: [{ blackMemberId: { in: ids } }, { whiteMemberId: { in: ids } }] };
  }
  if (ids.length === 0) return null;
  return {
    AND: [
      { OR: [{ blackMemberId: null }, { blackMemberId: { notIn: ids } }] },
      { OR: [{ whiteMemberId: null }, { whiteMemberId: { notIn: ids } }] },
    ],
  };
}

export function buildGameWhere(
  query: GameHistoryQuery,
  /** The member ids of the programs, for the pool filter. See `poolWhere`. */
  computerSeats: readonly string[] = [],
): Prisma.GameWhereInput {
  // The record is every finished game; a match still being played is in its players' lists, not here.
  const conditions: Prisma.GameWhereInput[] = [{ status: "finished" }];

  if (query.search !== null) {
    conditions.push({
      OR: [
        { blackName: { contains: query.search, mode: "insensitive" } },
        { whiteName: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }
  if (query.player !== null) {
    conditions.push({
      OR: [
        { blackName: { equals: query.player, mode: "insensitive" } },
        { whiteName: { equals: query.player, mode: "insensitive" } },
      ],
    });
  }
  if (query.result !== "all") conditions.push({ result: query.result });
  if (query.outcome !== "all") {
    const side = outcomeWhere(query.outcome, query.player);
    if (side !== null) conditions.push(side);
  }
  if (query.pool !== "all") {
    const side = poolWhere(query.pool, computerSeats);
    if (side !== null) conditions.push(side);
  }
  if (query.rated !== "all") conditions.push({ rated: query.rated === "yes" });
  if (query.variant !== "all") conditions.push({ variant: query.variant });
  if (query.size !== null) conditions.push({ size: query.size });

  if (query.from !== null || query.to !== null) {
    conditions.push({
      playedAt: {
        ...(query.from !== null ? { gte: query.from } : {}),
        ...(query.to !== null ? { lte: query.to } : {}),
      },
    });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

/**
 * Ordering always ends with `id`, so two games recorded in the same
 * millisecond cannot swap places between page one and page two and hide a row.
 */
export function buildGameOrderBy(
  query: GameHistoryQuery,
): Prisma.GameOrderByWithRelationInput[] {
  const { sortDir: dir } = query;

  switch (query.sortBy) {
    case "moveCount":
      return [{ moveCount: dir }, { id: "asc" }];
    case "size":
      return [{ size: dir }, { id: "asc" }];
    case "duration":
      // Games recorded without a clock sort last either way, never interleaved.
      return [{ durationMs: { sort: dir, nulls: "last" } }, { id: "asc" }];
    default:
      return [{ playedAt: dir }, { id: "asc" }];
  }
}
