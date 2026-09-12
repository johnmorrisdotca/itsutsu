import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * Somebody a page's own address already names, rather than somebody a query
 * string typed in. /games/<slug>/me is the only caller today: it already
 * knows who "me" is before any filter runs, and that fact belongs to the
 * address, not to the record's usual list of things a reader asked for.
 */
export type ImpliedPlayer = { name: string; memberId: string | null };

export type RecordAddress = {
  /** Every filter to hand `toGameHistoryQuery`, including what the address implies. */
  query: Record<string, string>;
  /**
   * Every filter a page of this record puts in ITS OWN address — a reader's
   * page, sort, board size, search, and so on, but never something that was
   * only implied.
   *
   * `Pager.tsx` builds every page's link from this, and it is also what
   * `toGameHistoryQuery` falls back to when the reader's own filters do not
   * parse — so an implied filter can never end up in a URL a reader could
   * bookmark, share, or leave sitting in a server log.
   *
   * /games/<slug>/me carries a member's whole name into `query`, because the
   * database still needs a name to filter by, and never into `flat`, for the
   * same reason `playerPath` never builds a link from a name when it has an
   * id instead: an address is a more permanent, more sharable thing than a
   * screen, and this site does not put a full name where "Hanako M." is shown
   * everywhere else.
   */
  flat: Record<string, string>;
};

/**
 * Splits a record's params into what its query needs and what its own
 * address should show — see `RecordAddress`.
 *
 * `variant` is excluded from both loops and set once from `opts`, because a
 * game already lives in the PATH (`/games/<slug>/...`) rather than the query,
 * and restating it from `params` would let a stray `?variant=` argue with the
 * address it is inside.
 */
export function recordAddress(
  params: Record<string, string | string[] | undefined>,
  opts: { variant?: RuleVariant; impliedPlayer?: ImpliedPlayer } = {},
): RecordAddress {
  const query: Record<string, string> = {};
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value !== "string" || key === "variant") continue;
    query[key] = value;
    flat[key] = value;
  }
  if (opts.variant !== undefined) query.variant = opts.variant;
  if (opts.impliedPlayer !== undefined) query.player = opts.impliedPlayer.name;
  return { query, flat };
}
