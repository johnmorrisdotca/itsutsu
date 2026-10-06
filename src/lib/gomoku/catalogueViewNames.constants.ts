import type { CatalogueView } from "./catalogueView";

/**
 * The names of the catalogue's three views: each an English label beside its own
 * kanji, which a Japanese reader is shown instead (`Speaker.pairName`). Apart from `catalogueView.ts` so the names are one
 * pure table the i18n gate allows and the reading of the address is not.
 */

export const CATALOGUE_VIEW_DISPLAY: Record<CatalogueView, { label: string; kanji: string }> = {
  families: {
    label: "Families",
    kanji: "系統",
  },
  cards: {
    label: "Cards",
    kanji: "一覧",
  },
  list: {
    label: "List",
    kanji: "全種目",
  },
};
