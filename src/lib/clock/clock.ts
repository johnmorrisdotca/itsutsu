import { TIME_CONTROLS } from "./clock.constants";
import type { SeatClock, TimeControl } from "./clock.types";

/** Whether a control actually runs a clock at all. */
export function hasClock(control: TimeControl): boolean {
  return control.mainMs > 0 || (control.byoyomiMs > 0 && control.periods > 0);
}

export function startClock(control: TimeControl): SeatClock {
  const inByoyomi = control.mainMs === 0;
  return {
    mainMs: control.mainMs,
    periodMs: control.byoyomiMs,
    periodsLeft: control.periods,
    inByoyomi,
    flagged: inByoyomi && control.periods === 0,
  };
}

/**
 * Spends `elapsed` milliseconds off a clock.
 *
 * Main time is used first. When it runs out the remainder carries into the
 * byoyomi periods, and a period that expires is consumed rather than merely
 * emptied — so a long think can burn through several periods in one tick,
 * which is exactly what happens if a player walks away from the board.
 */
export function tick(
  clock: SeatClock,
  elapsedMs: number,
  control: TimeControl,
): SeatClock {
  if (clock.flagged || elapsedMs <= 0 || !hasClock(control)) return clock;

  let remaining = elapsedMs;
  let next: SeatClock = { ...clock };

  if (!next.inByoyomi) {
    const spent = Math.min(next.mainMs, remaining);
    next = { ...next, mainMs: next.mainMs - spent };
    remaining -= spent;
    if (next.mainMs > 0) return next;

    // Main time is gone. Either byoyomi begins, or the flag falls.
    if (control.periods === 0 || control.byoyomiMs === 0) {
      return { ...next, flagged: true };
    }
    next = { ...next, inByoyomi: true, periodMs: control.byoyomiMs };
    if (remaining === 0) return next;
  }

  while (remaining > 0) {
    const spent = Math.min(next.periodMs, remaining);
    next = { ...next, periodMs: next.periodMs - spent };
    remaining -= spent;
    if (next.periodMs > 0) break;

    const periodsLeft = next.periodsLeft - 1;
    if (periodsLeft <= 0) {
      return { ...next, periodsLeft: 0, periodMs: 0, flagged: true };
    }
    next = { ...next, periodsLeft, periodMs: control.byoyomiMs };
  }

  return next;
}

/**
 * Called when a player finishes their move. In byoyomi this refills the
 * current period, which is the whole point of byoyomi: play inside the period
 * and you keep it.
 */
export function completeMove(clock: SeatClock, control: TimeControl): SeatClock {
  if (clock.flagged || !clock.inByoyomi) return clock;
  return { ...clock, periodMs: control.byoyomiMs };
}

/** `12:05`, or `8.4` once a clock is inside its last few seconds. */
export function formatDuration(ms: number): string {
  const safe = Math.max(0, ms);
  if (safe < 10_000) return (safe / 1000).toFixed(1);

  const totalSeconds = Math.ceil(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** What a clock reads right now, and whether it is in byoyomi. */
export function readClock(clock: SeatClock): {
  time: string;
  byoyomi: boolean;
  periodsLeft: number;
} {
  return {
    time: formatDuration(clock.inByoyomi ? clock.periodMs : clock.mainMs),
    byoyomi: clock.inByoyomi,
    periodsLeft: clock.periodsLeft,
  };
}

export const NO_CLOCK: TimeControl = TIME_CONTROLS.none;
