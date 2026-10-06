import type { CopyReview, JaLine } from "../copyJa.types";

/**
 * A game's words in Japanese: the sibling of `VariantCopy` (`variants.constants.ts`)
 * for the fields that are sentences. The fields that are names stay on the
 * English row and are read from there: `label`, `kanji` (the game's own name in
 * its own script, which is what a Japanese reader sees), `country`, `wikipedia`
 * and `inspiredBy`; so do `alsoKnownAs`, the names the game is sold and played
 * under in other places, which are names and not copy.
 *
 * `variants.ja.constants.ts` holds one per game, typed `Record<RuleVariant, …>`
 * so a game with no Japanese does not compile, and `variants.coverage.test.ts`
 * holds what the type cannot: the same number of rule bullets as the English
 * and a review stamp on every entry.
 */
export type VariantCopyJa = {
  tagline: JaLine;
  origin: JaLine;
  /** One line for each bullet of the English `rules`, in the same order. */
  rules: readonly JaLine[];
  board: JaLine;
  /** Who read it. Left out while the entry is only drafted. */
  review?: CopyReview;
  /** What a person still has to decide or read, in English. */
  ask?: string;
};
