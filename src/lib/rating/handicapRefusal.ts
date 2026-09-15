import type { HandicapTerms } from "@/lib/gomoku/gomoku.types";
import { handicapKind, hasHandicap } from "@/lib/gomoku/rules/handicap";

import { RATING_REFUSALS, type RatingRefusal } from "./rateable.constants";

/**
 * WHY A HANDICAP GAME MOVES NO RATING, asked in one place.
 *
 * A game with a handicap on either colour was rated like any other, so both
 * players' ratings moved over a game one of them had agreed to play on harder
 * rules. John, asked whether it should: "Fine don't".
 *
 * Asked of `hasHandicap` — the engine's own "is any handicap in force" — and
 * never of `handicap.stone` directly. A head-start handicap joins that function
 * and `HandicapTerms`, and every rating question built on this one refuses it
 * the same day: the writers through `countsOnLadder`, the pages through
 * `gameRatingRefusal`, the set-up screen and the doorstep through
 * `draftRatingRefusal` below.
 *
 * Its own module rather than a line in `rateable.ts`, because the set-up screen
 * is a client component and `rateable.ts` reads the kept names — server-side
 * data, and not worth shipping to a browser to word a notice.
 */
export function handicapRefusal(game: HandicapTerms): RatingRefusal | null {
  if (!hasHandicap(game)) return null;
  // Refused by the one rule, and named for which of the two it is: `handicapKind`.
  return handicapKind(game) === "headStart" ? RATING_REFUSALS.headStart : RATING_REFUSALS.handicap;
}

/**
 * WHY A GAME NOT YET CREATED COULD NEVER COUNT, for the set-up screen and the
 * doorstep — one function, so the two pages cannot disagree about one press.
 *
 * A board at one screen first, as the write path checks it, then a handicap.
 * Null otherwise, and that is not a guess: every other game between two people
 * is one where the rating is a choice, and the draft holds it.
 */
export function draftRatingRefusal(draft: HandicapTerms & { screen: boolean }): RatingRefusal | null {
  if (draft.screen) return RATING_REFUSALS.hotSeat;
  return handicapRefusal(draft);
}
