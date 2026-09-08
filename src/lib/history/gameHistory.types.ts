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
  /** The random seed, for the variants that scatter squares or draw pieces. */
  seed: number;
  /** Per-move time limit in milliseconds, or null for none. Shared games only. */
  moveTimeMs: number | null;
  /** What a missed deadline costs: "turn" or "game". */
  timeoutPenalty: string;
  /** When the last move landed, as an ISO string, or null before the first. */
  lastMoveAt: string | null;
  /** Consecutive forfeits each colour has run up. */
  forfeits: { black: number; white: number };
  /** Whether a seat may give the game up. */
  allowResign: boolean;
  /** A seat anyone may take, while it waits; null otherwise. */
  openSeat: string | null;
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
  /** When the move landed, as an ISO string. Moves recorded before this column existed all carry the moment it was added. */
  createdAt: string;
  /** Where a sliding piece came from, on `move` kinds. */
  from?: { row: number; col: number };
  /** The quarter turn that finished the move, in the twist games. */
  twist?: { quadrant: number; clockwise: boolean };
  /** The cells a piece covered, with their colours, in the piece games. */
  cells?: { row: number; col: number; stone: "black" | "white" }[];
};

/** An emoji one player sent the other, as the shared game page shows it. */
export type GameReaction = {
  id: string;
  stone: string;
  emoji: string;
  /** A short message sent with it, or null. */
  text: string | null;
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
