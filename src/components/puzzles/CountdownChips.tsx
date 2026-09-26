"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { COUNTDOWN_LIST, COUNTDOWNS, countdownBlurb, type CountdownKey } from "@/lib/puzzles/countdown";

/**
 * A COUNTDOWN OR NONE, chosen on every puzzle's set-up screen (`countdown.ts`):
 * None, the Tortoise, the Fox or the Rabbit, None first and chosen until
 * another is. Four chips in one row at every width, and the line under them
 * always the same room, so choosing one never moves what is under it.
 */
export function CountdownChips({ chosen, onChoose }: { chosen: CountdownKey | null; onChoose: (chosen: CountdownKey | null) => void }) {
  const choices: readonly (CountdownKey | null)[] = [null, ...COUNTDOWN_LIST];
  return (
    <>
      <div className="grid grid-cols-4 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Countdown" data-testid="puzzle-countdown-choice">
        {choices.map((each) => (
          <button
            key={each ?? "none"}
            type="button"
            role="radio"
            aria-checked={chosen === each}
            className={`${PICK_WORD_CHIP} ${chosen === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => onChoose(each)}
            data-testid={`puzzle-countdown-${each ?? "none"}`}
            title={each === null ? "No countdown" : `${COUNTDOWNS[each].minutes} ${COUNTDOWNS[each].minutes === 1 ? "minute" : "minutes"}`}
          >
            {each === null ? "No clock" : `${COUNTDOWNS[each].label} ${COUNTDOWNS[each].minutes}′`}{" "}
            <span className="font-mincho opacity-70">{each === null ? "無" : COUNTDOWNS[each].kanji}</span>
          </button>
        ))}
      </div>
      <p className="min-h-8 text-xs text-muted" data-testid="puzzle-countdown-blurb">
        {countdownBlurb(chosen)}
      </p>
    </>
  );
}
