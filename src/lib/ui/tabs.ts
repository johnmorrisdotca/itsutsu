/**
 * Tabs, as an address.
 *
 * A page that gathers several distinct sections shows one at a time, and each
 * section is a page of its own: so its tab is a PATH segment, never a query.
 * John, 2026-09-26: "Should we be using paths or query strings?… Yes sweep to
 * make Paths. No backwards compatibility needed." — his standing rule, identity
 * in the path and filters in the query. /admin/settings, /me/profile,
 * /players/bots, /players/<name>/goldtoken. What narrows one list (who, show,
 * month, sort) stays in the query.
 *
 * The first tab is the page's plain address with nothing appended, so the
 * ordinary link to a player is still the ordinary link to a player; its own
 * key as a segment is not an address, since one page has one address.
 *
 * HOW A SEGMENT REACHES THE PAGE. Each tabbed page keeps one body, in its
 * `page.tsx`; a `[view]/page.tsx` beside it (or a folder per key, where the
 * level already holds a `[slug]`) passes the segment in as `TAB_FROM_PATH`
 * through `withTabFromPath`, and the body reads it with `openTabOf`. An address
 * naming no tab of that page is not found: no quiet fallback to the first,
 * which would give one page two addresses and keep dead links looking alive.
 */

/** The key a path's tab segment is handed to the page's body under. Not a query anybody types. */
export const TAB_FROM_PATH = "__tab";

export type Tab = {
  /** Kebab, and stable: it is a segment of an address people share. */
  key: string;
  label: string;
  /** The Japanese name, where the section has one. Shown small beside the label. */
  kanji?: string;
  /**
   * How many things are behind the tab, drawn as a badge, where that is worth
   * knowing before opening it: My games' Going, Completed, Pass and play and
   * Puzzles (John, 2026-09-25: "the counts are too subtle").
   */
  count?: number;
  /**
   * An address of its own, for a tab that is a page elsewhere: Players'
   * Champions tab is /champions, which draws the same strip with itself open,
   * so it reads as part of Players without being a second copy of the page.
   */
  href?: string;
};

type Query = Record<string, string | string[] | undefined>;

/**
 * Which tab a request is for: the first when the path names none, the one it
 * names when that is a tab of this page (other than the first, whose address
 * is the bare page), and null for anything else — which the page answers with
 * `notFound()`.
 */
export function openTabOf(tabs: readonly Tab[], asked: Query): string | null {
  if (tabs.length === 0) return "";
  const raw = asked[TAB_FROM_PATH];
  const named = Array.isArray(raw) ? raw[0] : raw;
  if (named === undefined) return tabs[0]!.key;
  if (named === tabs[0]!.key) return null;
  return tabs.some((tab) => tab.key === named && tab.href === undefined) ? named : null;
}

/**
 * The query a `[view]` route hands its page's body: what the reader asked in
 * the query, and the segment under `TAB_FROM_PATH`, which only a path can set.
 */
export async function withTabFromPath(view: string, searchParams: Promise<Query>): Promise<Query> {
  const asked = { ...(await searchParams) };
  asked[TAB_FROM_PATH] = view;
  return asked;
}

/**
 * The address of one tab: its own `href` where it has one, the bare page for
 * the first, and the page with the tab's key as a segment for the rest.
 */
export function tabHref(base: string, tabs: readonly Tab[], key: string): string {
  const own = tabs.find((tab) => tab.key === key)?.href;
  if (own !== undefined) return own;
  if (tabs.length === 0 || key === tabs[0]!.key) return base;
  return `${base}/${encodeURIComponent(key)}`;
}

/**
 * A source site's key for an address: "ItsYourTurn.com" is `itsyourturn`.
 *
 * The trailing domain goes because it says nothing — every one of these sites
 * is a .com — and what is left is folded to the kebab every address here uses.
 */
export function siteKey(site: string): string {
  return site
    .toLowerCase()
    .replace(/\.(com|net|org|co\.uk)$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
