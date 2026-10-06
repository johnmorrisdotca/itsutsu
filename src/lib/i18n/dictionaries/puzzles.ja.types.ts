import type { VariantCopy } from "../../gomoku/variants.constants";
import type { CopyReview } from "../copyJa.types";
import type { JaOverlay } from "../copyTable";

/**
 * A puzzle's words in Japanese: the sibling of `VariantCopy` for the fields that
 * are sentences, as an overlay of the English row in `PUZZLE_DISPLAY`
 * (`copyTable.ts`). A puzzle's NAME is not here: its Japanese name is the `kanji`
 * on the English row, and `alsoKnownAs`, `country` and `wikipedia` are names and
 * codes. `inspiredBy` is here only where the English one is a description and not
 * a name (Sudoku, Wordle and Futoshiki are names and stay as they are).
 *
 * `puzzles.coverage.test.ts` holds every puzzle to a tagline, an origin, a line for
 * each rule bullet and the board advice, each in Japanese with a back-translation,
 * and to a review stamp.
 */
export type PuzzleCopyJa = JaOverlay<VariantCopy> & {
  /** Who read it. */
  review: CopyReview;
  /** What a person still has to decide or read, in English. */
  ask?: string;
};
