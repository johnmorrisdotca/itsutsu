import { playerKey } from "./playerKey";
import { RATING_REFUSALS, type RatingRefusal } from "./rateable.constants";
import { isReservedKey } from "./reservedKeys";

/**
 * Whether a finished game between these two names moves a rating, and if not,
 * why not.
 *
 * The rule was written out twice — once in `recordResult` for the global
 * ladder and once in `recordVariantResult` for the per-game one — as the same
 * five-clause `if` that returned early. Two copies of a rule is one rule that
 * can drift, and neither copy could be shown to anybody: a condition inside a
 * function that returns `void` has no answer to give a page. Named here, it is
 * one rule, it is tested on its own, and the board and the record can both say
 * what it decided.
 *
 * Names rather than accounts, because that is what the ladder is keyed by: two
 * spellings of one name are one player, which is exactly how somebody ends up
 * on both sides of a game without meaning to.
 */
export function ratingRefusal(blackName: string, whiteName: string): RatingRefusal | null {
  const black = playerKey(blackName);
  const white = playerKey(whiteName);
  if (black === "" || white === "") return RATING_REFUSALS.unnamed;
  // Before the reserved check: two seats under one kept name is still one player.
  if (black === white) return RATING_REFUSALS.onePlayer;
  if (isReservedKey(black) || isReservedKey(white)) return RATING_REFUSALS.keptRecord;
  return null;
}

/** Shorthand for the two recorders, which only need the verdict. */
export function isRateable(blackName: string, whiteName: string): boolean {
  return ratingRefusal(blackName, whiteName) === null;
}
