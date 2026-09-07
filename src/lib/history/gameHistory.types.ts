import type { Handicap } from "@/lib/gomoku/gomoku.types";
import type {
  GAME_RESULT_FILTERS,
  GAME_RESULTS,
  GAME_SIZE_FILTERS,
  GAME_SORT_BY,
  GAME_SORT_DIR,
  GAME_VARIANT_FILTERS,
} from "./gameHistory.constants";

export type GameResult = (typeof GAME_RESULTS)[number];
export type GameSortBy = (typeof GAME_SORT_BY)[number];
export type GameSortDir = (typeof GAME_SORT_DIR)[number];
export type GameResultFilter = (typeof GAME_RESULT_FILTERS)[number];
export type GameVariantFilter = (typeof GAME_VARIANT_FILTERS)[number];
export type GameSizeFilter = (typeof GAME_SIZE_FILTERS)[number];

/** A parsed, validated listing request. Nulls mean "no filter". */
export type GameHistoryQuery = {
  page: number;
  pageSize: number;
  sortBy: GameSortBy;
  sortDir: GameSortDir;
  search: string | null;
  player: string | null;
  result: GameResultFilter;
  variant: GameVariantFilter;
  size: number | null;
  from: Date | null;
  to: Date | null;
};

/** Everything a listing row shows, without loading the move list. */
export type GameLifecycle = "active" | "finished";

export type GameSummary = {
  id: string;
  playedAt: string;
  status: GameLifecycle;
  blackName: string;
  whiteName: string;
  size: number;
  winLength: number;
  variant: string;
  obstacles: string;
  opener: string;
  opening: string;
  /** The handicap the game was played under; `stone` is null for none. */
  handicap: Handicap;
  result: GameResult;
  winner: string | null;
  moveCount: number;
  durationMs: number | null;
};

export type GameMove = {
  number: number;
  row: number;
  col: number;
  stone: string;
  kind: string;
  /** Where a sliding piece came from, on `move` kinds. */
  from?: { row: number; col: number };
  /** The quarter turn that finished the move, in the twist games. */
  twist?: { quadrant: number; clockwise: boolean };
};

/** An emoji one player sent the other, as the shared game page shows it. */
export type GameReaction = {
  id: string;
  stone: string;
  emoji: string;
  moveNumber: number | null;
  createdAt: string;
};

export type GameDetail = GameSummary & {
  moves: GameMove[];
  /** The most recent reactions, newest last. */
  reactions: GameReaction[];
};

/** The envelope every paged endpoint returns. */
export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type GameHistoryPage = {
  pagination: Pagination;
  items: GameSummary[];
  /** Counts across the whole filtered set, for filter chips that show totals. */
  facets: {
    byResult: Record<GameResult, number>;
    bySize: Record<string, number>;
  };
};

export type GameMovesPage = {
  pagination: Pagination;
  items: GameMove[];
};

/** One row of the player-name autocomplete. */
export type PlayerSuggestion = {
  name: string;
  games: number;
};
