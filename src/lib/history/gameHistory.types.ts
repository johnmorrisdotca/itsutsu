import type { Handicap } from "@/lib/gomoku/gomoku.types";
import type {
  GAME_OUTCOME_FILTERS,
  GAME_OUTCOMES,
  GAME_POOL_FILTERS,
  GAME_RATED_FILTERS,
  GAME_VERDICT_FILTERS,
  GAME_VERDICTS,
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
export type GameOutcome = (typeof GAME_OUTCOMES)[number];
export type GameOutcomeFilter = (typeof GAME_OUTCOME_FILTERS)[number];
export type GamePoolFilter = (typeof GAME_POOL_FILTERS)[number];
export type GameVerdict = (typeof GAME_VERDICTS)[number];
export type GameVerdictFilter = (typeof GAME_VERDICT_FILTERS)[number];
export type GameRatedFilter = (typeof GAME_RATED_FILTERS)[number];
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
  /** How the games went for `player`. Read against that name, and ignored without one. */
  outcome: GameOutcomeFilter;
  /** Which ladder the game belongs to, read from who was sitting in the seats. */
  pool: GamePoolFilter;
  /** Whether the game moved a rating. */
  rated: GameRatedFilter;
  /** What `player` thought of their own play. Read against that name, and ignored without one. */
  verdict: GameVerdictFilter;
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
  /** The length the game was played under, see DrawLimit. */
  drawLimit: string;
  /** "move" or "game": whether the limit is per move or a budget for the whole game. */
  clockMode: string;
  /** Time each side has left under the whole-game clock; null under the per-move clock. */
  blackTimeMs: number | null;
  whiteTimeMs: number | null;
  /** When the colour to move must have moved by, as the server set it. */
  deadlineAt: string | null;
  /** Courtesy time given for the current move. */
  extraMs: number;
  /** Whether the result moves ratings. */
  rated: boolean;
  /** A seat anyone may take, while it waits; null otherwise. */
  openSeat: string | null;
  /** The member holding each seat, when an account holds it rather than a link. */
  blackMemberId: string | null;
  whiteMemberId: string | null;
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
