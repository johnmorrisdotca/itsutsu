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
  GAME_VERDICT_ANY,
  GAME_VERDICT_FILTERS,
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
  verdict: z.enum(GAME_VERDICT_FILTERS).default("all"),
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
    verdict: get("verdict"),
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
    verdict: data.verdict,
    variant: data.variant,
    size: data.size === "all" ? null : Number(data.size),
    from: data.from ?? null,
    to: data.to ?? null,
  };
}

/**
 * The member ids a filter needs and this module may not look up, because it is
 * pure.
 *
 * Named fields rather than two positional lists. Both are arrays of ids, and a
 * filter that quietly swapped them would answer a plausible, wrong question
 * without failing — which is the one kind of mistake worth designing out rather
 * than remembering.
 */
export type FilterSeats = {
  /** The programs, for the pool filter. See `poolWhere`. */
  computers: readonly string[];
  /** Every member who goes by the asked-for `player` name. See `seatIs`. */
  named: readonly string[];
};

/** Nothing looked up: every id-aware filter falls back to the name alone. */
export const NO_FILTER_SEATS: FilterSeats = { computers: [], named: [] };

/**
 * "This seat is that player" — asked of the NAME and of the member IDS the name
 * belongs to.
 *
 * WHY BOTH, and why the ids are the half that was missing. A game stores the
 * names as they were played, so a filter matching only the name loses every game
 * somebody played before renaming. `fetchPlayerRecord` learned that already and
 * counts a person's games by member id OR folded name; this filter did not, so
 * the two had different ideas of whose games those were. On production today her
 * record counts five games and `/history?player=Hanachan` answers with none of
 * them — the number right, the link it promised empty, which is the fault a count
 * that cannot be opened always is.
 *
 * It is the same disjunction the record uses, so a count and the page it links to
 * are narrowed by one definition of a person rather than two.
 *
 * THE NAME STAYS IN THE OR rather than being replaced by the ids. Most seats here
 * have no account behind them — a name typed in at one screen, a record kept from
 * another site — and those games are found by the only name they have.
 *
 * An empty `named` is a real answer and not "not looked up yet": a name nobody
 * holds an account under resolves to no ids, and the filter is then the name
 * alone, exactly as it has always been.
 */
function seatIs(
  seat: "black" | "white",
  player: string,
  named: readonly string[],
): Prisma.GameWhereInput {
  const byName: Prisma.GameWhereInput =
    seat === "black"
      ? { blackName: { equals: player, mode: "insensitive" } }
      : { whiteName: { equals: player, mode: "insensitive" } };
  if (named.length === 0) return byName;
  const byId: Prisma.GameWhereInput =
    seat === "black"
      ? { blackMemberId: { in: [...named] } }
      : { whiteMemberId: { in: [...named] } };
  return { OR: [byName, byId] };
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
function outcomeWhere(
  outcome: GameOutcome,
  player: string | null,
  named: readonly string[],
): Prisma.GameWhereInput | null {
  if (outcome === "decided") return { result: { not: "abandoned" } };
  if (outcome === "drawn") return { result: "draw" };
  if (player === null) return null;

  const asBlack = seatIs("black", player, named);
  const asWhite = seatIs("white", player, named);
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

/**
 * What one player thought of their own play.
 *
 * Kept per seat, so it is the same two questions at once an outcome is: which
 * seat they were, and what that seat said. Unanswerable without a name, and
 * dropped rather than answered emptily for the same reason.
 *
 * `fetchVerdictTally` counts by member id, and this read by NAME — the seam that
 * comment used to describe, and it has been closed rather than described: `seatIs`
 * asks the ids as well, so a game somebody played under an older name is on both
 * sides of the comparison instead of only the tally's.
 */
function verdictWhere(
  verdict: string,
  player: string | null,
  named: readonly string[],
): Prisma.GameWhereInput | null {
  if (player === null) return null;
  const said = verdict === GAME_VERDICT_ANY ? { not: null } : verdict;
  return {
    OR: [
      { AND: [seatIs("black", player, named), { blackVerdict: said }] },
      { AND: [seatIs("white", player, named), { whiteVerdict: said }] },
    ],
  };
}

export function buildGameWhere(
  query: GameHistoryQuery,
  /** The ids this module cannot look up for itself. See `FilterSeats`. */
  seats: FilterSeats = NO_FILTER_SEATS,
): Prisma.GameWhereInput {
  const { computers: computerSeats, named } = seats;
  // The record is every finished game; a match still being played is in its players' lists, not here.
  const conditions: Prisma.GameWhereInput[] = [{ status: "finished" }];

  /*
   * SEARCH IS ABOUT SPELLINGS and stays that way. It is a substring over the
   * names a game was filed under — somebody half-remembering who they played —
   * and resolving it through the members table would make "type a few letters"
   * mean something else. `player` is the filter that means a person.
   */
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
      OR: [seatIs("black", query.player, named), seatIs("white", query.player, named)],
    });
  }
  if (query.result !== "all") conditions.push({ result: query.result });
  if (query.outcome !== "all") {
    const side = outcomeWhere(query.outcome, query.player, named);
    if (side !== null) conditions.push(side);
  }
  if (query.pool !== "all") {
    const side = poolWhere(query.pool, computerSeats);
    if (side !== null) conditions.push(side);
  }
  if (query.rated !== "all") conditions.push({ rated: query.rated === "yes" });
  if (query.verdict !== "all") {
    const said = verdictWhere(query.verdict, query.player, named);
    if (said !== null) conditions.push(said);
  }
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
