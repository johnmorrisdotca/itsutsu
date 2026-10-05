"use client";

import { SET_UP_PREVIEW_BOX, SET_UP_PREVIEW_CAPTION } from "@/components/live/live.constants";
import { tobiishiLevelCount } from "@/lib/puzzles/tobiishi/levelCounts";
import { tobiishiCodeOf, tobiishiGoalOf, tobiishiPackOf, tobiishiRefOf } from "@/lib/puzzles/tobiishi/levels";
import { tobiishiJumpsWord } from "@/lib/puzzles/tobiishi/sizes";

import { SolveTime } from "./SolveTime";
import { TobiishiStill } from "./TobiishiStill";

/**
 * THE CHOSEN LEVEL'S OWN BOARD, in the set-up's preview box: the rule every set-up keeps, that a
 * preview is always a live one (`PuzzleBoardPreview`, `BoardPreview`), in the one box
 * (`SET_UP_PREVIEW_BOX`) so the page never moves when a level or a length is chosen.
 *
 * The level is drawn as it will be played: its pegs and its goal hole (`TobiishiStill`, pressing
 * nothing). A level solved shows the board as it ends, one peg in the goal.
 */
export function TobiishiLevelPreview({
  size,
  level,
  best,
  solveId = null,
}: {
  size: number;
  level: number;
  /** Its best time, where solved. */
  best: number | undefined;
  /** The member's best solve of it, which its time opens; null for a solve kept only in this browser. */
  solveId?: string | null;
}) {
  const solved = best !== undefined;
  const ref = tobiishiRefOf(size, level);
  if (ref === null) return null;
  const code = tobiishiCodeOf(ref);
  return (
    <figure className="flex w-full flex-col items-center gap-2" data-testid="tobiishi-preview" data-size={size} data-level={level} data-state={solved ? "solved" : "open"} data-code={code}>
      <div className={`${SET_UP_PREVIEW_BOX} relative`} aria-hidden="true">
        <TobiishiStill key={`${size}-${level}-${solved ? "solved" : "dealt"}`} code={code} solved={solved} testId="tobiishi-preview-board" />
      </div>
      <figcaption className={SET_UP_PREVIEW_CAPTION} data-testid="tobiishi-preview-caption">
        Level {level} of {tobiishiLevelCount(size)} at {tobiishiJumpsWord(size)}: {tobiishiPackOf(ref.pack).title.en}, {tobiishiGoalOf(ref).names.en}
        {solved ? (
          <>
            . Solved, best <SolveTime kind="tobiishi" solveId={solveId} elapsedMs={best} mine testId="tobiishi-preview-best" />.
          </>
        ) : (
          ". Not solved yet."
        )}
      </figcaption>
    </figure>
  );
}
