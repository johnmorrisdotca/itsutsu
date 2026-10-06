import type { PhraseKey } from "@/lib/i18n/i18n.constants";

import type { RatingTier } from "./elo";
import type { RatingPool } from "./pools";

/**
 * The names of the rating's tiers and pools: each an English label beside its
 * own kanji, which a Japanese reader is shown instead (`Speaker.pairName`), and
 * a note or blurb that is a phrase. Apart from `elo.ts` and `pools.ts` so the
 * names are one pure table the i18n gate allows and the arithmetic is not.
 */

export const TIER_DISPLAY: Record<RatingTier, { label: string; kanji: string; note: PhraseKey }> = {
  unrated: { label: "Unrated", kanji: "未定", note: "rating.tierUnratedNote" },
  provisional: { label: "Provisional", kanji: "仮", note: "rating.tierProvisionalNote" },
  established: { label: "Established", kanji: "確定", note: "rating.tierEstablishedNote" },
};

export const RATING_POOL_DISPLAY: Record<
  RatingPool,
  { label: string; kanji: string }
> = {
  people: {
    label: "Against people",
    kanji: "対人",
  },
  computer: {
    label: "Against bots",
    kanji: "対コンピュータ",
  },
};

/** The overall figure, which is both pools read together. */
export const OVERALL_DISPLAY: { label: string; kanji: string } = {
  label: "Overall",
  kanji: "総合",
};

