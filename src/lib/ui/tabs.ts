/**
 * Tabs, as an address.
 *
 * A page that gathers several distinct sections shows one at a time. A tab is
 * a view of one page rather than a page of its own, so which one is open
 * belongs in the query rather than in the path — identity stays in the path
 * everywhere on this site, and the person is the identity here, not the
 * chapter of them being read.
 *
 * It has to be in the address at all, though, or somebody's GoldToken record
 * cannot be linked to and a reload loses the reader's place. The first tab is
 * the page's plain address with nothing appended, so the ordinary link to a
 * player is still the ordinary link to a player.
 */

/** The query key that names the open tab. One word, so an address stays readable. */
export const TAB_PARAM = "view";

export type Tab = {
  /** Kebab, and stable: it goes in an address people share. */
  key: string;
  label: string;
  /** The Japanese name, where the section has one. Shown small beside the label. */
  kanji?: string;
};

/**
 * Which tab a request is asking for.
 *
 * Anything unrecognised falls back to the first rather than showing an empty
 * page: an address someone typed, or one kept from before a tab was renamed,
 * should still land on the person it names.
 */
export function activeTab(tabs: readonly Tab[], asked: string | string[] | undefined): string {
  if (tabs.length === 0) return "";
  const wanted = Array.isArray(asked) ? asked[0] : asked;
  return tabs.some((tab) => tab.key === wanted) ? (wanted as string) : tabs[0].key;
}

/**
 * The address of one tab. The first tab is the bare page, so a player's
 * address does not grow a query string just by being looked at.
 */
export function tabHref(base: string, tabs: readonly Tab[], key: string): string {
  if (tabs.length === 0 || key === tabs[0].key) return base;
  return `${base}?${TAB_PARAM}=${encodeURIComponent(key)}`;
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
