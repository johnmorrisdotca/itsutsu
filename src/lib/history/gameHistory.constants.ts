import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";

/**
 * The listing contract for game history. These arrays are the single source of
 * truth for what the API accepts: the Zod schemas read them, and the UI builds
 * its sort and filter controls from the same values.
 */

export const GAME_SORT_BY = [
  "playedAt",
  "moveCount",
  "size",
  "duration",
] as const;

export const GAME_SORT_DIR = ["asc", "desc"] as const;

export const GAME_RESULTS = ["black", "white", "draw", "abandoned"] as const;

export const GAME_RESULT_FILTERS = ["all", ...GAME_RESULTS] as const;

export const GAME_VARIANT_FILTERS = ["all", ...RULE_VARIANT_LIST] as const;

export const GAME_SIZE_FILTERS = ["all", "9", "13", "15", "19"] as const;

export const GAME_SORT_DISPLAY: Record<
  (typeof GAME_SORT_BY)[number],
  { label: string }
> = {
  playedAt: { label: "Date played" },
  moveCount: { label: "Length" },
  size: { label: "Board size" },
  duration: { label: "Time taken" },
};

export const GAME_RESULT_DISPLAY: Record<
  (typeof GAME_RESULTS)[number],
  { label: string; kanji: string }
> = {
  black: { label: "Black won", kanji: "黒勝" },
  white: { label: "White won", kanji: "白勝" },
  draw: { label: "Draw", kanji: "引分" },
  abandoned: { label: "Unfinished", kanji: "中断" },
};

/** Listing defaults and bounds, shared by the schema and the client. */
export const GAME_PAGE_SIZE_DEFAULT = 20;
export const GAME_PAGE_SIZE_MIN = 1;
export const GAME_PAGE_SIZE_MAX = 200;
export const GAME_PAGE_MAX = 100_000;

/** Autocomplete over player names. */
export const PLAYER_SUGGEST_LIMIT_DEFAULT = 10;
export const PLAYER_SUGGEST_LIMIT_MAX = 25;
export const PLAYER_SUGGEST_MIN_QUERY = 1;

/** Free-text search is bounded so a pathological query cannot scan the table. */
export const GAME_SEARCH_MAX = 64;
export const PLAYER_NAME_MAX = 64;
