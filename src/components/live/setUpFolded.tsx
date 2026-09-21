import type { ReactNode } from "react";

import type { RatingRefusal } from "@/lib/rating/rateable.constants";

import { SET_UP_COPY } from "./live.constants";
import { describeSettings } from "./rulesSummary";
import type { RulesDraft } from "./rulesDraft";
import { SettingWords } from "./SettingWords";
import type { SetUpFork, SetUpOpponent } from "./setUp.types";
import { recapWords } from "./setUpWords";

/**
 * WHAT EACH FOLDED GROUP SAYS WHILE IT IS SHUT.
 *
 * These are the very words that used to sit over the Continue button as a
 * recap of the whole screen — the same calls, the same rendering — moved onto
 * the rows they describe.
 *
 * That is the repetition John named on 2026-09-21: "don't repeat info too
 * much". The screen was printing "Free opening · Resigning allowed · No clock
 * · Rated" in a line at the bottom while every one of those controls stood
 * open six inches above it, and then the doorstep said it a third time. Said
 * once, on the row that holds the control, it is a summary rather than an
 * echo — and it is what lets both groups arrive folded without hiding
 * anything, which is the whole of `SetUpFold`'s rule.
 */
export function foldedWords({
  settled,
  refused,
  opponent,
  fork,
  random,
}: {
  settled: RulesDraft;
  refused: RatingRefusal | null;
  opponent: SetUpOpponent | null;
  fork: SetUpFork | null;
  random: boolean;
}): { rules: ReactNode; handicap: ReactNode } {
  /*
   * `recapWords` is asked for the handicap's words rather than a second
   * description of the same two settings — and the opponent word it also
   * returns is dropped, because who the game is against is the chosen tile a
   * few rows above and saying it again here would be the repetition this
   * screen has just stopped doing.
   */
  const handicap = recapWords({
    opponent,
    fork,
    handicap: settled.handicap,
    game: settled,
    random,
  }).slice(1);

  return {
    rules: <SettingWords words={describeSettings(settled, refused)} testId="set-up-rules-words" />,
    handicap: (
      <SettingWords
        words={handicap.length > 0 ? handicap : [{ text: SET_UP_COPY.noHandicap, notable: false }]}
        testId="set-up-handicap-words"
      />
    ),
  };
}
