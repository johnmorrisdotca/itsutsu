import { keysetOrderBy } from "@/lib/api/paging.cursor";
import { isRefusal } from "@/lib/api/paging";
import type { PagingRefusal } from "@/lib/api/paging.types";
import { variantFor } from "@/lib/gomoku/slugs";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  GAME_PAGE_MAX,
  GAME_OUTCOME_FILTERS,
  GAME_POOL_FILTERS,
  GAME_RATED_FILTERS,
  GAME_VERDICT_FILTERS,
  GAME_RESULT_FILTERS,
  GAME_SEARCH_MAX,
  MEMBER_ID_MAX,
  GAME_SIZE_FILTERS,
  GAME_VARIANT_FILTERS,
  PLAYER_NAME_MAX,
} from "./gameHistory.constants";
import {
  outcomeWhere,
  pairOutcomeWhere,
  pairWhere,
  poolWhere,
  seatIs,
  verdictWhere,
} from "./gameHistoryClauses";
import { NOT_A_REFUSED_OFFER } from "./offers";
import { GAME_SORT_SPEC, gameSortChoice, readGamePaging } from "./gameHistory.sort";
import type { GameHistoryQuery } from "./gameHistory.types";

/**
 * Reading, filtering and ordering game history.
 *
 * THE FILTERS ARE HERE; SORTING AND PAGING ARE `gameHistory.sort.ts` AND
 * `lib/api/paging.ts`. That split is the whole point of the convention: a filter
 * is particular to what a game is, and "which column, which way, how many and
 * from where" is the same question on every list this site has. This module
 * never decides a bound on a page size or a sort direction any more.
 *
 * Every bound that is still here is deliberate: `search` is length-limited so it
 * cannot become a pathological scan, and `page` is accepted optimistically and
 * clamped later against the real total rather than rejected.
 */
const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(GAME_PAGE_MAX).default(1),
  search: z.string().max(GAME_SEARCH_MAX).optional(),
  player: z.string().max(PLAYER_NAME_MAX).optional(),
  member: z.string().max(MEMBER_ID_MAX).optional(),
  against: z.string().max(MEMBER_ID_MAX).optional(),
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

/**
 * A listing request, or a refusal saying which parameter could not be honoured.
 *
 * THREE OUTCOMES BECAME TWO. It used to answer `null` for anything it could not
 * parse, and the route turned that into "Invalid listing parameters." — a 400
 * that names nothing, so a caller who mistyped one filter had to guess which of
 * fifteen it was. A refusal carries the name, because a refusal a caller cannot
 * act on is barely better than a wrong answer.
 */
export function toGameHistoryQuery(url: URL): GameHistoryQuery | PagingRefusal {
  const get = (key: string) => url.searchParams.get(key) ?? undefined;

  const paging = readGamePaging(url);
  if (isRefusal(paging)) return paging;

  const parsed = querySchema.safeParse({
    page: get("page"),
    search: get("search"),
    player: get("player"),
    member: get("member"),
    against: get("against"),
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

  if (!parsed.success) {
    /*
     * Named, and de-duplicated: Zod reports one issue per failing field and a
     * caller wants the fields, not the count. `page` has no path when the whole
     * object fails, which is why the fallback is there rather than assumed away.
     */
    const named = [
      ...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "the query"))),
    ];
    return { error: `These listing filters are not valid: ${named.join(", ")}.` };
  }

  const { data } = parsed;
  return {
    page: data.page,
    pageSize: paging.limit,
    cursor: paging.cursor,
    sortBy: paging.sort.column.field,
    sortDir: paging.sort.direction,
    /** Whether the reader asked for this order, which decides how a heading flips. */
    sortAsked: paging.sort.asked,
    search: trimmed(data.search),
    player: trimmed(data.player),
    member: trimmed(data.member),
    against: trimmed(data.against),
    // Only `resolveMember` may say a pair names two real people. See `between`.
    between: null,
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
  /** The programs, for the pool filter. See `poolWhere` in `gameHistoryClauses.ts`. */
  computers: readonly string[];
  /** Every member who goes by the asked-for `player` name. See `seatIs` in `gameHistoryClauses.ts`. */
  named: readonly string[];
};

/** Nothing looked up: every id-aware filter falls back to the name alone. */
export const NO_FILTER_SEATS: FilterSeats = { computers: [], named: [] };


export function buildGameWhere(
  query: GameHistoryQuery,
  /** The ids this module cannot look up for itself. See `FilterSeats`. */
  seats: FilterSeats = NO_FILTER_SEATS,
): Prisma.GameWhereInput {
  const { computers: computerSeats, named } = seats;
  /*
   * The record is every finished game; a match still being played is in its
   * players' lists, not here.
   *
   * AND A REFUSED OFFER IS NOT A FINISHED GAME, which is the one place on this
   * site where that distinction has to be made in SQL. A declined or withdrawn
   * offer is filed `status: finished, result: abandoned` — the same filing a
   * board called off before the first stone gets, because it is the only thing
   * the stored result can honestly say — so without this line it would appear
   * on /history, and on every per-game and per-player narrowing of it, beside
   * real games with both names on it. Nobody played it and nobody agreed to.
   *
   * Most of the other finished-game queries are already safe, because they ask
   * `result: { not: "abandoned" }` for their own reasons; this one deliberately
   * does not, since an unfinished game is part of the record. Which queries are
   * covered by which is checked in `offers.coverage.test.ts`.
   */
  const conditions: Prisma.GameWhereInput[] = [{ status: "finished" }, NOT_A_REFUSED_OFFER];

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
  /*
   * A PAIR REPLACES THE PLAYER CLAUSE rather than joining it. The pair is read
   * by member id on both seats and already says whose games these are; adding
   * the name clause on top would be a second, looser definition of the same
   * person ANDed onto the first — and the first time the two disagreed (a name
   * `nameForMember` resolves differently from the member row), the list would
   * be shorter than the rivalry count that links to it.
   */
  if (query.between !== null) {
    conditions.push(pairWhere(query.between));
  } else if (query.player !== null) {
    conditions.push({
      OR: [seatIs("black", query.player, named), seatIs("white", query.player, named)],
    });
  }
  if (query.result !== "all") conditions.push({ result: query.result });
  if (query.outcome !== "all") {
    const side =
      query.between !== null
        ? pairOutcomeWhere(query.outcome, query.between)
        : outcomeWhere(query.outcome, query.player, named);
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
 *
 * READ OFF THE SORT DECLARATION rather than switched on here, and that is a
 * correctness property and not tidiness. The order and the cursor's keyset
 * comparison are two halves of one claim: a cursor built for `(playedAt, id)`
 * handed to a read ordered any other way skips rows and repeats rows. This used
 * to be a `switch` that agreed with the cursor by coincidence, and the
 * coincidence would have ended the first time somebody added a third tiebreaker
 * to one of them. `keysetOrderBy` is now the only thing that decides an order,
 * so they cannot disagree.
 */
export function buildGameOrderBy(
  query: GameHistoryQuery,
): Prisma.GameOrderByWithRelationInput[] {
  return keysetOrderBy(
    GAME_SORT_SPEC,
    gameSortChoice(query),
  ) as Prisma.GameOrderByWithRelationInput[];
}
