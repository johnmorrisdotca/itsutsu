import "server-only";

import { Prisma } from "@prisma/client";

import {
  decodeCursor,
  keysetWhere,
  nextCursorFrom,
  takeFor,
} from "@/lib/api/paging.cursor";
import { prisma } from "@/lib/prisma";
import { type CurrentNames, currentNamesFor, seatName } from "./currentNames";
import { GAME_SORT_SPEC, gameSortChoice } from "./gameHistory.sort";
import { type FilterSeats, buildGameOrderBy, buildGameWhere } from "./gameHistoryQuery";
import { GAME_RESULTS, RECORD_TEXT_MAX } from "./gameHistory.constants";
import { parseHandicap, pieceCellsSchema } from "./gameSettingsSchema";
import { REACTIONS_KEPT } from "./reactions.constants";
import type {
  GameDetail,
  GameHistoryPage,
  GameHistoryQuery,
  GameMove,
  GameMovesPage,
  GameResult,
  GameSummary,
  Pagination,
  PlayerSuggestion,
} from "./gameHistory.types";

/** The listing projection: everything a row shows, and no move rows. */
export const SUMMARY_SELECT = {
  id: true,
  playedAt: true,
  status: true,
  blackName: true,
  whiteName: true,
  size: true,
  winLength: true,
  variant: true,
  obstacles: true,
  opener: true,
  opening: true,
  handicap: true,
  seed: true,
  moveTimeMs: true,
  timeoutPenalty: true,
  lastMoveAt: true,
  blackForfeits: true,
  whiteForfeits: true,
  allowResign: true,
  drawLimit: true,
  clockMode: true,
  blackTimeMs: true,
  whiteTimeMs: true,
  deadlineAt: true,
  extraMs: true,
  rated: true,
  openSeat: true,
  blackMemberId: true,
  whiteMemberId: true,
  result: true,
  winner: true,
  moveCount: true,
  durationMs: true,
} as const;

type SummaryRow = Prisma.GameGetPayload<{ select: typeof SUMMARY_SELECT }>;

/** A move row, with the columns a slide or a twist fills in. */
const MOVE_SELECT = {
  number: true,
  row: true,
  col: true,
  stone: true,
  kind: true,
  fromRow: true,
  fromCol: true,
  twistQuadrant: true,
  twistClockwise: true,
  cells: true,
  createdAt: true,
} as const;

type MoveRow = Prisma.MoveGetPayload<{ select: typeof MOVE_SELECT }>;

/** Nullable columns become the optional fields the engine reads. */
export function toGameMove(row: MoveRow): GameMove {
  const move: GameMove = {
    number: row.number,
    row: row.row,
    col: row.col,
    stone: row.stone,
    kind: row.kind,
    createdAt: row.createdAt.toISOString(),
  };
  if (row.fromRow !== null && row.fromCol !== null) {
    move.from = { row: row.fromRow, col: row.fromCol };
  }
  if (row.twistQuadrant !== null && row.twistClockwise !== null) {
    move.twist = { quadrant: row.twistQuadrant, clockwise: row.twistClockwise };
  }
  const cells = pieceCellsSchema.safeParse(row.cells);
  if (cells.success && cells.data !== null) move.cells = cells.data;
  return move;
}

/**
 * A stored row becomes the object every screen reads — and the one place a seat's
 * name stops being the spelling on the row and becomes the person it belongs to.
 *
 * `names` IS REQUIRED, and the compiler is the gate rather than a habit. The
 * resolution has to happen at exactly one seam or it happens at some of them:
 * this is the only row-to-display boundary the listing, the record, a match page
 * and a player's own games all pass through, so resolving here reaches every
 * screen with nothing downstream to remember. An optional argument would have
 * been forgotten at one call site, and a half-applied rename is the bug this is
 * fixing. `NO_CURRENT_NAMES` is how a caller with genuinely nobody to resolve
 * says so out loud.
 */
export function toSummary(row: SummaryRow, names: CurrentNames): GameSummary {
  const { blackForfeits, whiteForfeits, ...rest } = row;
  return {
    ...rest,
    blackName: seatName(row.blackName, row.blackMemberId, names),
    whiteName: seatName(row.whiteName, row.whiteMemberId, names),
    /*
     * The names as they were played, kept beside the names to show, because a
     * rating is earned under the name it was earned under and a screen shows who
     * somebody is now. Two different facts that are the same word today: the
     * rating refusal reads these, every display reads the two above.
     */
    playedAs: { black: row.blackName, white: row.whiteName },
    playedAt: row.playedAt.toISOString(),
    lastMoveAt: row.lastMoveAt === null ? null : row.lastMoveAt.toISOString(),
    deadlineAt: row.deadlineAt === null ? null : row.deadlineAt.toISOString(),
    handicap: parseHandicap(row.handicap),
    forfeits: { black: blackForfeits, white: whiteForfeits },
  };
}

/**
 * Clamped rather than trusted. A caller sitting on page 40 who then narrows a
 * filter would otherwise get an empty page with no way to tell "no results"
 * from "you are past the end".
 */
function paginate(total: number, query: { page: number; pageSize: number }): Pagination {
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  return {
    page: Math.min(query.page, totalPages),
    pageSize: query.pageSize,
    total,
    totalPages,
  };
}

/**
 * The member ids of the programs, for the pool filter.
 *
 * Read once per request rather than joined onto every game: there are eight of
 * them and the list changes when a new opponent is written, which is not often
 * enough to be worth a column on ten thousand games. Nought of them is a real
 * answer — a fresh database has no programs in it — so it is returned rather
 * than treated as "not looked up yet".
 */
async function computerSeatIds(): Promise<string[]> {
  const rows = await prisma.member.findMany({
    where: { botTier: { not: null } },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

/**
 * Every member who goes by this name, so the listing can be filtered by WHO
 * rather than by how their seat was spelled that day. See `seatIs`.
 *
 * EVERY member, not the first one. A display name carries no unique constraint,
 * so two people may hold the same one, and "which of them did you mean" is a
 * question an address with a name in it cannot answer. Picking one would answer
 * it anyway, with somebody else's games; listing both is what the name actually
 * denotes, and is what matching the stored name has always done here.
 *
 * That it is plural is also the honest report of a shortcoming: a link that could
 * not be ambiguous would carry an id.
 */
async function membersNamed(player: string | null): Promise<string[]> {
  const wanted = player?.trim() ?? "";
  if (wanted === "") return [];
  const rows = await prisma.member.findMany({
    where: { name: { equals: wanted, mode: "insensitive" } },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

/** The two lookups a filter needs, together, so neither is forgotten on its own. */
async function filterSeats(query: GameHistoryQuery): Promise<FilterSeats> {
  const [computers, named] = await Promise.all([
    query.pool === "all" ? [] : computerSeatIds(),
    membersNamed(query.player),
  ]);
  return { computers, named };
}

/**
 * ONE PAGE OF THE RECORD, REACHED EITHER WAY.
 *
 * A cursor and a page number both say where to start, and this is the one place
 * that knows which was asked for. When a cursor is present the read is a keyset
 * — "the rows after that one, in this order" — and nothing above the page can
 * move it. When there is none it is the offset read the `Pager` has always used,
 * because the `Pager` needs to say "page 3 of 12" and a position in a list
 * cannot answer that.
 *
 * BOTH PATHS HAND BACK A `next`, which is what lets live scrolling begin from a
 * page a reader arrived at by any route — a bookmark, a count's link, page four
 * of the pager. Without that the enhancement would only work from the top of
 * the list, and the second page of anything would fall back to the pager with
 * nothing saying why.
 *
 * A CURSOR THAT DOES NOT DECODE IS THE FIRST PAGE, not an error: a cursor is
 * something this site handed out, so a stale one means a changed sort or an old
 * link, and starting the record again is exactly right. See `decodeCursor`.
 */
export async function fetchGameHistoryPage(
  query: GameHistoryQuery,
): Promise<GameHistoryPage> {
  const filters = buildGameWhere(query, await filterSeats(query));
  const sort = gameSortChoice(query);
  const after = query.cursor === null ? null : decodeCursor(query.cursor, sort);

  const [total, byResult, bySize] = await Promise.all([
    prisma.game.count({ where: filters }),
    prisma.game.groupBy({ by: ["result"], where: filters, _count: { _all: true } }),
    prisma.game.groupBy({ by: ["size"], where: filters, _count: { _all: true } }),
  ]);

  const pagination = paginate(total, query);
  /*
   * The keyset condition is ANDed with the filters rather than merged into them.
   * `buildGameWhere` already returns an `AND` of its own conditions, and
   * spreading a second `OR` into that object would replace one of them — which
   * is the sort of mistake that produces a page of plausible, wrong rows.
   */
  const where: Prisma.GameWhereInput =
    after === null ? filters : { AND: [filters, keysetWhere(GAME_SORT_SPEC, sort, after)] };

  const read = await prisma.game.findMany({
    where,
    orderBy: buildGameOrderBy(query),
    // An offset page is only skipped into when there is no cursor to start from.
    ...(after === null ? { skip: (pagination.page - 1) * pagination.pageSize } : {}),
    /*
     * One row further than the page, so "is there more" is answered by whether
     * it arrived rather than by comparing a count that may already be stale.
     */
    take: takeFor(pagination.pageSize),
    select: SUMMARY_SELECT,
  });
  const { rows, next } = nextCursorFrom(GAME_SORT_SPEC, sort, read, pagination.pageSize);
  const names = await currentNamesFor(rows);

  return {
    pagination,
    next,
    items: rows.map((row) => toSummary(row, names)),
    facets: {
      byResult: Object.fromEntries(
        GAME_RESULTS.map((result) => [
          result,
          byResult.find((row) => row.result === result)?._count._all ?? 0,
        ]),
      ) as Record<GameResult, number>,
      bySize: Object.fromEntries(
        bySize.map((row) => [String(row.size), row._count._all]),
      ),
    },
  };
}

/**
 * Every game the filters select, not one page of them, for the plain-text
 * listing. Ordered and filtered exactly as the page is, so the text and the
 * page can never disagree about what "the record" means.
 *
 * Capped: the result becomes one string in memory and one string in somebody
 * clipboard, and neither wants the whole table. The count comes back beside
 * the rows so the text can say what it left out rather than just stopping.
 */
export async function fetchWholeRecord(
  query: GameHistoryQuery,
): Promise<{ items: GameSummary[]; total: number }> {
  const where = buildGameWhere(query, await filterSeats(query));
  const [total, rows] = await Promise.all([
    prisma.game.count({ where }),
    prisma.game.findMany({
      where,
      orderBy: buildGameOrderBy(query),
      take: RECORD_TEXT_MAX,
      select: SUMMARY_SELECT,
    }),
  ]);
  const names = await currentNamesFor(rows);
  return { items: rows.map((row) => toSummary(row, names)), total };
}

/**
 * `whole` keeps every word that was said, rather than the last thirty.
 *
 * The cap is right for a board being played: the game is polled, and a long
 * evening's talk on every poll is a payload nobody reads twice. It is wrong
 * for the record, which is read once and is the place the conversation is
 * meant to survive — and it failed silently, showing the end of a
 * conversation with no sign that there had been a beginning. A game of
 * thirty-five remarks kept the last thirty and lost the first five.
 *
 * The quick phrases made this likelier rather than rarer: saying something is
 * one tap now, so thirty is a number a real game reaches.
 */
export async function fetchGameDetail(
  id: string,
  { whole = false }: { whole?: boolean } = {},
): Promise<GameDetail | null> {
  const game = await prisma.game.findUnique({
    where: { id },
    select: {
      ...SUMMARY_SELECT,
      moves: {
        orderBy: { number: "asc" },
        select: MOVE_SELECT,
      },
      reactions: {
        orderBy: { createdAt: "desc" },
        ...(whole ? {} : { take: REACTIONS_KEPT }),
        select: { id: true, stone: true, emoji: true, text: true, moveNumber: true, createdAt: true },
      },
    },
  });

  if (game === null) return null;
  const { moves, reactions, ...summary } = game;
  return {
    ...toSummary(summary, await currentNamesFor([summary])),
    moves: moves.map(toGameMove),
    reactions: reactions
      .map((reaction) => ({ ...reaction, createdAt: reaction.createdAt.toISOString() }))
      .reverse(),
  };
}

export async function fetchGameMovesPage(
  id: string,
  page: number,
  pageSize: number,
): Promise<GameMovesPage | null> {
  const exists = await prisma.game.findUnique({ where: { id }, select: { id: true } });
  if (exists === null) return null;

  const total = await prisma.move.count({ where: { gameId: id } });
  const pagination = paginate(total, { page, pageSize });
  const rows = await prisma.move.findMany({
    where: { gameId: id },
    orderBy: { number: "asc" },
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
    select: MOVE_SELECT,
  });

  return { pagination, items: rows.map(toGameMove) };
}

/** True when a game existed and was removed; false when there was nothing there. */
export async function deleteGame(id: string): Promise<boolean> {
  const deleted = await prisma.game.deleteMany({ where: { id } });
  return deleted.count > 0;
}

/** `%` and `_` are LIKE wildcards, so a name containing them must escape them. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

/**
 * Player-name autocomplete across both seats. Names that start with the query
 * rank above names that merely contain it, and more prolific players rank
 * above rarer ones, which is the order a picker wants.
 */
export async function suggestPlayers(
  query: string,
  limit: number,
): Promise<PlayerSuggestion[]> {
  const term = escapeLike(query.trim());
  if (term.length === 0) return [];

  const prefix = `${term}%`;
  const anywhere = `%${term}%`;

  return prisma.$queryRaw<PlayerSuggestion[]>`
    SELECT name, COUNT(*)::int AS games
    FROM (
      SELECT "blackName" AS name FROM "Game" WHERE "blackName" <> ''
      UNION ALL
      SELECT "whiteName" AS name FROM "Game" WHERE "whiteName" <> ''
    ) AS seats
    WHERE name ILIKE ${anywhere} ESCAPE '\'
    GROUP BY name
    ORDER BY (name ILIKE ${prefix} ESCAPE '\') DESC, games DESC, name ASC
    LIMIT ${limit}
  `;
}
