"use client";

import { clockText } from "@/lib/puzzles/clockText";
import { countdownSaying, countdownSeconds, isUrgent, timeLeftMs } from "@/lib/puzzles/puzzleClock";
import { PUZZLE_CLOCK_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleClock } from "@/lib/puzzles/puzzles.types";

import { PUZZLE_CLOCK, PUZZLE_COUNTDOWN, PUZZLE_COUNTDOWN_URGENT } from "./puzzles.constants";

/**
 * A COUNTDOWN WHERE THE CLOCK IS, counting down: the animal it is, and the time
 * left. John, 2026-09-26: "a real-time race against a ticking clock".
 *
 * Seen: the last ten seconds are vermilion, bold and ringed, so the hurry is
 * not in the colour alone. Heard: the visible figure is a `timer`, which a
 * screen reader does not read out as it changes, and beside it a polite live
 * line that changes only at the minute marks and at ten seconds
 * (`countdownSaying`) — never every second.
 */
export function SolveCountdown({ clock, elapsedMs }: { clock: Exclude<PuzzleClock, "none">; elapsedMs: number }) {
  const left = timeLeftMs(clock, elapsedMs) ?? 0;
  const urgent = isUrgent(left);
  const seconds = countdownSeconds(left);
  const shown = PUZZLE_CLOCK_DISPLAY[clock];
  return (
    <>
      <span className="font-mincho text-base text-muted" title={shown.label} aria-hidden="true" data-testid="puzzle-clock-animal">
        {shown.kanji}
      </span>
      <p
        className={`${PUZZLE_CLOCK} ${PUZZLE_COUNTDOWN} ${urgent ? PUZZLE_COUNTDOWN_URGENT : ""}`}
        role="timer"
        aria-label={`time left on the ${shown.label}`}
        data-testid="puzzle-clock"
        data-clock={clock}
        data-left={seconds}
        data-urgent={urgent ? "true" : "false"}
      >
        {clockText(seconds * 1000)}
      </p>
      <span className="sr-only" aria-live="polite" data-testid="puzzle-clock-said">
        {countdownSaying(clock, left)}
      </span>
    </>
  );
}
