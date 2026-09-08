import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { buildGameOrderBy, buildGameWhere } from "./gameHistoryQuery";
import { GAME_RESULTS } from "./gameHistory.constants";
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
  clockMode: true,
  blackTimeMs: true,
  whiteTimeMs: true,
  deadlineAt: true,
  extraMs: true,
  rated: true,
  openSeat: true,
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

export function toSummary(row: SummaryRow): GameSummary {
  const { blackForfeits, whiteForfeits, ...rest } = row;
  return {
    ...rest,
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

export async function fetchGameHistoryPage(
  query: GameHistoryQuery,
): Promise<GameHistoryPage> {
  const where = buildGameWhere(query);

  const [total, byResult, bySize] = await Promise.all([
    prisma.game.count({ where }),
    prisma.game.groupBy({ by: ["result"], where, _count: { _all: true } }),
    prisma.game.groupBy({ by: ["size"], where, _count: { _all: true } }),
  ]);

  const pagination = paginate(total, query);
  const rows = await prisma.game.findMany({
    where,
    orderBy: buildGameOrderBy(query),
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
    select: SUMMARY_SELECT,
  });

  return {
    pagination,
    items: rows.map(toSummary),
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

export async function fetchGameDetail(id: string): Promise<GameDetail | null> {
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
        take: REACTIONS_KEPT,
        select: { id: true, stone: true, emoji: true, text: true, moveNumber: true, createdAt: true },
      },
    },
  });

  if (game === null) return null;
  const { moves, reactions, ...summary } = game;
  return {
    ...toSummary(summary),
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
