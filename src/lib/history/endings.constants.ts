import type { Speaker } from "@/lib/i18n/i18n";

/** Which of a player's finished games an end-positions mosaic shows. */
export const ENDINGS_OUTCOMES = {
  won: "won",
  lost: "lost",
  all: "all",
} as const;

export type EndingsOutcome = (typeof ENDINGS_OUTCOMES)[keyof typeof ENDINGS_OUTCOMES];

export const ENDINGS_OUTCOME_LIST = [ENDINGS_OUTCOMES.won, ENDINGS_OUTCOMES.lost, ENDINGS_OUTCOMES.all] as const;

/**
 * The most games one ask brings back: the newest, a picture's worth. The same
 * number as the tiles a move mosaic holds, so one ask is never more than one
 * picture — and the read stays one small query however long somebody has
 * played here.
 */
export const ENDINGS_MOST = 120;

/** The words on the panel, in the reader's language. */
export function endingsCopy(say: Speaker) {
  return {
    heading: say.say("played.endingsHeading"),
    kanji: say.pairsWithKanji ? "終局絵" : "",
    blurb: say.say("played.endingsBlurb"),
    gameLabel: say.say("played.endingsGame"),
    outcomeLabel: say.say("played.endingsWhich"),
    outcomes: {
      won: say.say("played.endingsWon"),
      lost: say.say("played.endingsLost"),
      all: say.say("played.endingsAll"),
    },
    make: say.say("played.endingsMake"),
    making: say.say("played.endingsMaking"),
    download: say.say("played.endingsDownload"),
    none: say.say("played.endingsNone"),
    otherSizes: (count: number) => say.count("played.endingsOtherSizes", count),
    failed: say.say("played.endingsFailed"),
  };
}
