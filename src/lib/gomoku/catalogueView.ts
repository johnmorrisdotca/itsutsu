/**
 * How the catalogue of games is laid out, which is a FILTER and not an
 * address.
 *
 * /games is every game there is. Families, cards and a plain list are three
 * ways of looking at that one collection, not three collections — so they live
 * in the query, `/games/list`, under John's standing rule for addresses:
 * identity in the path, filters in the query. It was two pages before this,
 * /games and /games/all, which made "the plain list" a different resource from
 * "the games" and gave the site two indexes to keep in step.
 *
 * Pure, and tested without a page: a view is a word, read the same way the
 * seat and directory filters read theirs.
 */

export const CATALOGUE_VIEWS = {
  families: "families",
  cards: "cards",
  list: "list",
} as const;

export type CatalogueView = (typeof CATALOGUE_VIEWS)[keyof typeof CATALOGUE_VIEWS];

/**
 * Families first, because it is the one that teaches. A newcomer meeting forty
 * games needs them grouped and described before an A–Z is any use at all.
 */
export const CATALOGUE_VIEW_DEFAULT: CatalogueView = CATALOGUE_VIEWS.families;

export const CATALOGUE_VIEW_LIST: readonly CatalogueView[] = [
  CATALOGUE_VIEWS.families,
  CATALOGUE_VIEWS.cards,
  CATALOGUE_VIEWS.list,
];

export { CATALOGUE_VIEW_DISPLAY } from "./catalogueViewNames.constants";

/**
 * The view an address asks for: a tab, so a segment of the path (/games/cards,
 * /games/list; `tabs.ts`), the segment its folder hands the page. Families, the default, is
 * the bare /games; anything else is not found (null), never a quiet default.
 */
export function readCatalogueView(asked: string | string[] | undefined): CatalogueView | null {
  if (asked === undefined) return CATALOGUE_VIEW_DEFAULT;
  const word = typeof asked === "string" ? asked : undefined;
  if (word === CATALOGUE_VIEW_DEFAULT) return null;
  return CATALOGUE_VIEW_LIST.find((view) => view === word) ?? null;
}

/** The address for one view of the catalogue. The default view says nothing at all. */
export function cataloguePath(view: CatalogueView): string {
  return view === CATALOGUE_VIEW_DEFAULT ? "/games" : `/games/${view}`;
}
