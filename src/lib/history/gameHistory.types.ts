import type { Handicap } from "@/lib/gomoku/gomoku.types";
import type { Cursor, SortDirection } from "@/lib/api/paging.types";
import type { GameSortField } from "./gameHistory.sort";
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
  GAME_VARIANT_FILTERS,
} from "./gameHistory.constants";

export type GameResult = (typeof GAME_RESULTS)[number];
/** The record's sortable columns, declared once in `GAME_SORT_SPEC`. */
export type GameSortBy = GameSortField;
export type GameSortDir = SortDirection;
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
  /**
   * Which offset page, for the `Pager` — which works with no JavaScript and
   * stays. Ignored entirely when a `cursor` is present: the two are different
   * ways of saying where to start, and honouring both at once would be two
   * answers to one question.
   */
  page: number;
  pageSize: number;
  /**
   * Where the last page ended, for live scrolling. Null for the first page.
   *
   * A cursor and a page number are not interchangeable and the difference is
   * the point: a page number is a promise about a list that has not changed,
   * and this site inserts a finished game at the top of the record every few
   * hours. See the head of `paging.cursor.ts`.
   */
  cursor: Cursor | null;
  sortBy: GameSortBy;
  sortDir: GameSortDir;
  /**
   * Whether the READER asked for this order or it is the record's own default.
   *
   * Not decoration: it decides which way a heading's next press goes. /history
   * is sorted by date descending without anybody asking, so treating that as
   * "already sorted by date" would answer the first press on that heading with
   * ascending — showing the oldest games to somebody who just asked for the
   * newest. "Nobody asked" and "somebody asked for exactly this" are two
   * states, and a boolean is how they stop looking alike.
   */
  sortAsked: boolean;
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
  /**
   * The names to SHOW, resolved through the seats' member ids by `toSummary`, so
   * a game played before somebody renamed still names them the way they are
   * named now. A seat with no account behind it keeps exactly what was stored.
   */
  blackName: string;
  whiteName: string;
  /**
   * The names as they were PLAYED, straight off the row.
   *
   * Not the same question as the two above, and the difference is the whole
   * point: identity is an id, and a rating is a name it was earned under.
   * Anything reasoning about the RATING reads these — `ratingRefusal` asks
   * whether one person held both seats, and it has to ask about the names the
   * ladder was keyed by. Anything a reader looks at reads the two above.
   */
  playedAs: { black: string; white: string };
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
  /**
   * Where this page ended, for the reader who scrolls past it — null when it
   * was the last.
   *
   * Beside `pagination` rather than instead of it, because the two serve two
   * readers. Somebody with no JavaScript gets the `Pager`, which needs to know
   * it is page 3 of 12; somebody scrolling gets this, which needs to know which
   * row to carry on after. Offsets cannot do the second honestly — a game
   * finishing mid-read repeats a row or hides one — and a cursor cannot do the
   * first at all, because "how many pages" is not a question a position in a
   * list can answer. So both are here, and the page shows one or the other,
   * never both at once.
   */
  next: Cursor | null;
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
