"use client";

import { ReplayButtons } from "./ReplayButtons";

/**
 * THE SCRUBBER UNDER A RECORD: a slider from the empty board to the last move,
 * and Start, Back, Play, Forward and End under it, on one line (`ReplayButtons`). One
 * component, so a finished game's replay (`GameReplay`) and a famous game's
 * (`FamousReplay`) step through a record the same way, with the same keys and
 * the same look — a second slider written for the second page is how two
 * replays drift apart.
 *
 * `index` and `last` are positions on the caller's timeline, 0 being the empty
 * board; `onGo` is the one door both the slider and the buttons move through.
 */
export function ReplayScrubber({
  index,
  last,
  onGo,
  testId,
}: {
  index: number;
  last: number;
  onGo: (index: number) => void;
  /** The slider is `${testId}-scrubber` and the buttons carry `testId` as their prefix, as `ReplayButtons` does. */
  testId: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <input
        type="range"
        min={0}
        max={last}
        value={index}
        onChange={(event) => onGo(Number(event.target.value))}
        className="w-full accent-ink"
        aria-label="Move"
        data-testid={`${testId}-scrubber`}
      />
      <ReplayButtons index={index} last={last} onGo={onGo} testId={testId} />
    </div>
  );
}
