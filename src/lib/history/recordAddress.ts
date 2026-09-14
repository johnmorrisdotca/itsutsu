import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { historyPath, variantFor } from "@/lib/gomoku/slugs";

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
 * `variant` is dropped from `params` and set once from `opts` WHERE THE ADDRESS
 * ITSELF NAMES A GAME, because the game lives in the PATH there
 * (`/games/<slug>/...`) and a stray `?variant=` must not be allowed to argue
 * with the address it is inside.
 *
 * WHERE THE ADDRESS NAMES NO GAME — /history, the whole record — it is not
 * dropped, and that is the fix rather than a relaxation. `/api/games?variant=`
 * honours the filter and /history threw it away without a word, so the same
 * query answered two different questions depending on which door it went
 * through. The page redirects a `?variant=` that names a game to that game's
 * own record (see `recordGameRedirect`, which /history calls first), so the
 * only values that reach the query here are ones no game answers to — and
 * those are refused by the schema, which puts "those filters were not valid"
 * on the page instead of silence.
 */
export function recordAddress(
  params: Record<string, string | string[] | undefined>,
  opts: { variant?: RuleVariant; impliedPlayer?: ImpliedPlayer } = {},
): RecordAddress {
  const query: Record<string, string> = {};
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value !== "string") continue;
    if (key === "variant" && opts.variant !== undefined) continue;
    query[key] = value;
    flat[key] = value;
  }
  if (opts.variant !== undefined) query.variant = opts.variant;
  if (opts.impliedPlayer !== undefined) query.player = opts.impliedPlayer.name;
  return { query, flat };
}

/** The game a `?variant=` names, whether it arrived as a slug or as a key. */
function gameNamed(value: string): RuleVariant | null {
  const bySlug = variantFor(value);
  if (bySlug !== null) return bySlug;
  return (RULE_VARIANT_LIST as readonly string[]).includes(value) ? (value as RuleVariant) : null;
}

/**
 * Where `/history?variant=<game>` should have gone, or null if it names no game.
 *
 * ONE ADDRESS FOR ONE SET OF GAMES, which is the rule this site keeps about
 * every other collection: identity in the path, filters in the query. A game's
 * record is `/games/<slug>/history` — the game is what the record is OF, not a
 * narrowing of it — and the filter bar's own Rules select already navigates
 * there rather than writing `?variant=` (see `chooseGame`). So the query form
 * is not a second supported spelling; it is an address that should not exist.
 *
 * REFUSED OR REDIRECTED, NEVER IGNORED, is the whole of the change. /history
 * used to strip `?variant=` and say nothing, while `/api/games?variant=` honours
 * it — so a reader who built the address from the API's own vocabulary, or from
 * a link somebody wrote by hand, got the WHOLE record with nothing on the page
 * to say their filter had been thrown away. A page that quietly drops a filter
 * is the same fault as one that applies it silently: either way the reader
 * cannot tell what they are looking at.
 *
 * `page` and `cursor` are left behind on purpose. Both are positions in the
 * unfiltered list, and page 4 of the whole record is not page 4 of one game's —
 * the Rules select drops them for the same reason.
 */
export function recordGameRedirect(
  params: Record<string, string | string[] | undefined>,
): string | null {
  const asked = params.variant;
  if (typeof asked !== "string") return null;
  const game = gameNamed(asked);
  if (game === null) return null;
  const rest = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value !== "string") continue;
    if (key === "variant" || key === "page" || key === "cursor") continue;
    rest.set(key, value);
  }
  const search = rest.toString();
  return search === "" ? historyPath(game) : `${historyPath(game)}?${search}`;
}
