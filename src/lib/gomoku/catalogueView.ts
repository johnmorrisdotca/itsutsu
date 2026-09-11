/**
 * How the catalogue of games is laid out, which is a FILTER and not an
 * address.
 *
 * /games is every game there is. Families, cards and a plain list are three
 * ways of looking at that one collection, not three collections — so they live
 * in the query, `/games?view=list`, under John's standing rule for addresses:
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

export const CATALOGUE_VIEW_DISPLAY: Record<CatalogueView, { label: string; kanji: string; blurb: string }> = {
  families: {
    label: "Families",
    kanji: "系統",
    blurb: "Grouped by what they have in common, with a line on each family.",
  },
  cards: {
    label: "Cards",
    kanji: "一覧",
    blurb: "One card each, narrowed by first letter or by what wins.",
  },
  list: {
    label: "Plain list",
    kanji: "全種目",
    blurb: "Every game as text: its names elsewhere, and everywhere it lives here.",
  },
};

/**
 * The view an address asks for.
 *
 * A word nobody recognises falls back to the default rather than showing
 * nothing: a mistyped query is a reader who still wants the games.
 */
export function readCatalogueView(params: Record<string, string | string[] | undefined>): CatalogueView {
  const asked = params.view;
  const word = typeof asked === "string" ? asked : undefined;
  return CATALOGUE_VIEW_LIST.find((view) => view === word) ?? CATALOGUE_VIEW_DEFAULT;
}

/** The address for one view of the catalogue. The default view says nothing at all. */
export function cataloguePath(view: CatalogueView): string {
  return view === CATALOGUE_VIEW_DEFAULT ? "/games" : `/games?view=${view}`;
}
