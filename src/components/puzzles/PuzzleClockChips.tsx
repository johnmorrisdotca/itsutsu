"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { PUZZLE_CLOCK_DISPLAY, PUZZLE_CLOCK_LIST, PUZZLE_DISPLAY, offersClock } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleClock, PuzzleKind } from "@/lib/puzzles/puzzles.types";

/**
 * THE COUNTDOWN, chosen on a puzzle's set-up (`puzzleClock.ts`): no clock, or
 * a Tortoise, Fox or Rabbit counting down from five minutes, three or one.
 * John, 2026-09-26: "as an option it's good because then it can be used on ANY
 * of the games we create."
 *
 * The same row on every puzzle, four chips and a line under them of one height,
 * so choosing another puzzle never moves the page: on a puzzle that keeps its
 * own measure (Tsunagi, Kumimoji: `PuzzleSpec.clock`) the chips are drawn
 * switched off and the line says why, rather than the row coming and going.
 * Not carried into a race, which is a contest of its own.
 */
export function PuzzleClockChips({ kind, chosen, onChoose }: { kind: PuzzleKind; chosen: PuzzleClock; onChoose: (clock: PuzzleClock) => void }) {
  const offered = offersClock(kind);
  const shown = offered ? chosen : "none";
  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Clock" data-testid="puzzle-clock-choice">
        {PUZZLE_CLOCK_LIST.map((each) => {
          const copy = PUZZLE_CLOCK_DISPLAY[each];
          return (
            <button
              key={each}
              type="button"
              role="radio"
              aria-checked={offered && shown === each}
              disabled={!offered}
              className={`${PICK_WORD_CHIP} ${offered && shown === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              onClick={() => onChoose(each)}
              data-testid={`puzzle-clock-${each}`}
            >
              {copy.label} <span className="font-mincho opacity-70">{copy.kanji}</span>
              {copy.ms === null ? null : <span className="ml-1 tabular-nums opacity-70">{copy.time}</span>}
            </button>
          );
        })}
      </div>
      <p className="min-h-8 text-xs text-muted" data-testid="puzzle-clock-blurb">
        {offered
          ? PUZZLE_CLOCK_DISPLAY[shown].blurb
          : `${PUZZLE_DISPLAY[kind].label} keeps its own measure of how you did, so it is played with no clock.`}
      </p>
    </>
  );
}
