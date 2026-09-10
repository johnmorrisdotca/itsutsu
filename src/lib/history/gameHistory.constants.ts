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

/**
 * The same four results read from one player's side of the board.
 *
 * `result` says which colour won, which is what the game knows; it cannot
 * answer "show me their seven losses", because whether black winning was a
 * loss depends on who was sitting there. So an outcome is read against the
 * player named in the address — `player` — and means nothing without one.
 *
 * `decided` is the odd one and earns its place: a player's record counts
 * games that reached a result and leaves abandoned ones out, so the link
 * behind their "played" has to leave them out too. A count that links to a
 * longer list than it counted is the bug this whole idea exists to stop.
 */
export const GAME_OUTCOMES = ["won", "lost", "drawn", "decided"] as const;

export const GAME_OUTCOME_FILTERS = ["all", ...GAME_OUTCOMES] as const;

export const GAME_OUTCOME_DISPLAY: Record<
  (typeof GAME_OUTCOMES)[number],
  { label: string; kanji: string }
> = {
  won: { label: "Won", kanji: "勝" },
  lost: { label: "Lost", kanji: "敗" },
  drawn: { label: "Drawn", kanji: "分" },
  decided: { label: "Won, lost or drawn", kanji: "決着" },
};

/** The same lookup from an address, where the word has not been checked yet. */
export function outcomeLabel(value: string): string {
  return (GAME_OUTCOME_DISPLAY as Record<string, { label: string } | undefined>)[value]?.label ?? value;
}

/**
 * Which ladder a game belongs to, and whether it moved one at all.
 *
 * Both exist so that a count can link to the games it actually counted. The
 * ladder shows a player's RATED record in the people pool; the Computers tab
 * shows their rated record against the programs. Linking either of those to
 * "every game with this name in it" would open a longer list than the number
 * on the page — the same fault as not linking at all, wearing a link.
 *
 * A pool is not stored on a game: it is decided by whether either seat was a
 * program, which is a property of the member sitting in it. So the record
 * reads it from the seats rather than from a column, and `pools.ts` stays the
 * one place that says what a pool is.
 */
export const GAME_POOL_FILTERS = ["all", "people", "computer"] as const;

export const GAME_POOL_DISPLAY: Record<string, { label: string }> = {
  people: { label: "Against people" },
  computer: { label: "Against the computer" },
};

/** Whether the game moved a rating. The address says yes or no, not true or false. */
export const GAME_RATED_FILTERS = ["all", "yes", "no"] as const;

export const GAME_RATED_DISPLAY: Record<string, { label: string }> = {
  yes: { label: "Rated" },
  no: { label: "Friendly" },
};

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

/**
 * How many games the plain-text listing will print at once.
 *
 * The listing is one string held in memory, sent whole and pasted whole, so
 * it needs a ceiling that is not "the table". Two thousand is far above any
 * record this site is likely to hold and still a listing a person can open
 * without their browser stopping to think; past it the text says how many it
 * left out rather than quietly ending.
 */
export const RECORD_TEXT_MAX = 2000;

/** Autocomplete over player names. */
export const PLAYER_SUGGEST_LIMIT_DEFAULT = 10;
export const PLAYER_SUGGEST_LIMIT_MAX = 25;
export const PLAYER_SUGGEST_MIN_QUERY = 1;

/** Free-text search is bounded so a pathological query cannot scan the table. */
export const GAME_SEARCH_MAX = 64;
export const PLAYER_NAME_MAX = 64;
