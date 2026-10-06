import type { VariantCopy } from "../../gomoku/variants.constants";
import type { CopyReview } from "../copyJa.types";
import type { JaOverlay } from "../copyTable";

/**
 * A party, card or casual game's words in Japanese: the sibling of `VariantCopy`
 * for the fields that are sentences, as an overlay of the English row in
 * `PARTY_DISPLAY`, `CASUAL_DISPLAY` and their siblings (`copyTable.ts`). A
 * game's NAME is not here: its Japanese name is the `kanji` on the English row,
 * and `alsoKnownAs`, `country` and `wikipedia` are names and codes. `inspiredBy`
 * is a name (UNO) and stays as it is.
 *
 * `party.coverage.test.ts` and `casual.coverage.test.ts` hold every game to a
 * tagline, an origin, a line for each rule bullet and the board advice, each in
 * Japanese with a back-translation, and to a review stamp.
 */
export type PartyCopyJa = JaOverlay<VariantCopy> & {
  /** Who read it. */
  review: CopyReview;
  /** What a person still has to decide or read, in English. */
  ask?: string;
};
