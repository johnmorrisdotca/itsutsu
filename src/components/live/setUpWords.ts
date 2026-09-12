import type { Handicap } from "@/lib/gomoku/gomoku.types";
import { shownName } from "@/lib/rating/shownName";

import { describeHandicap, type SettingWord } from "./rulesSummary";
import type { SetUpFork, SetUpOpponent } from "./setUp.types";

/**
 * WHAT THE SETUP SCREEN'S OWN FIELDS SAY WHILE THEY ARE FOLDED AWAY.
 *
 * `describeSettings` in rulesSummary.ts says what the RULES are — the opening,
 * the clock, whether it counts. These are the two settings that belong to the
 * setup screen rather than to the rules: who the game is against, and whether
 * anybody is carrying a handicap. Both live inside the same disclosure, so both
 * have to be sayable without it being opened.
 *
 * Pure, and its own module, for the reason `setUpStart.ts` is: deciding what a
 * line says about a press is a decision, not a rendering, and a decision
 * wants a test beside it. It left `SetUpGame.tsx` when that file reached the
 * 500-line gate — not to make the gate go green, but because the gate was
 * right: choosing the words for a folded control is a different job from
 * drawing the screen.
 */

/**
 * The default opponent, in the words the control uses.
 *
 * Said once because it is said twice — in the select, and in the summary line
 * that stands in for the select while it is folded. Two copies of it would be
 * two things to keep in step, and the one that drifted would be the summary,
 * which is the one that has to be true.
 */
export const POST_FOR_ANYONE = "Post the seat for anyone";

/**
 * The setup screen's own two words, in the order its own fields appear inside
 * the drawer.
 *
 * WHO IT IS AGAINST reads what the Start button will actually DO — `chosen`,
 * the opponent resolved against the players offered at THIS game — rather than
 * the select's raw value, because those can disagree: a specialist chosen at
 * its own game and then left behind by a change of game is no longer among the
 * players offered, and the game posts for anyone instead. A fork is a third
 * case: it names nobody, because the route finds the other player in the game
 * it forks, and says so differently depending on whether there was one.
 *
 * THE HANDICAP is left out entirely where there is none, rather than saying "no
 * handicap": the line is what this game IS, and the ordinary answer to a
 * question nobody asked is not worth a word of it.
 */
export function foldedWords({
  chosen,
  fork,
  handicap,
}: {
  /** The opponent the press will actually name, or null for a posted seat. */
  chosen: SetUpOpponent | null;
  /** The position being carried, where one is. */
  fork: SetUpFork | null;
  handicap: Handicap;
}): SettingWord[] {
  const against: SettingWord =
    fork !== null
      ? {
          text: `Against ${fork.alone ? "whoever you hand the seat to" : "the same opponent"}`,
          notable: true,
        }
      : chosen !== null
        ? { text: `Against ${shownName(chosen.name)}`, notable: true }
        : { text: POST_FOR_ANYONE, notable: false };

  const carried = describeHandicap(handicap);
  return carried === null ? [against] : [against, { text: carried, notable: true }];
}
