"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { completeMove, hasClock, startClock, tick } from "@/lib/clock/clock";
import { CLOCK_TICK_MS } from "@/lib/clock/clock.constants";
import type { SeatClock, TimeControl } from "@/lib/clock/clock.types";
import { SEATS } from "@/lib/gomoku/gomoku.constants";
import type { Seat } from "@/lib/gomoku/gomoku.types";

function freshClocks(control: TimeControl): Record<Seat, SeatClock> {
  return { one: startClock(control), two: startClock(control) };
}

/**
 * Runs a clock for each seat.
 *
 * Time is measured from the wall clock rather than counted in ticks, so a
 * throttled background tab or a slow frame cannot hand a player free thinking
 * time — the interval only decides how often the display catches up.
 */
export function useGameClock({
  control,
  seatToPlay,
  running,
  onFlag,
}: {
  control: TimeControl;
  seatToPlay: Seat;
  running: boolean;
  onFlag: (seat: Seat) => void;
}) {
  const [clocks, setClocks] = useState(() => freshClocks(control));
  const lastTickAt = useRef(0);
  const flagged = useRef(false);

  /*
   * The interval reads these through a ref so it never has to be torn down and
   * rebuilt when the turn changes — restarting it would throw away whatever
   * fraction of a tick had already elapsed.
   */
  const latest = useRef({ control, seatToPlay, onFlag });
  useEffect(() => {
    latest.current = { control, seatToPlay, onFlag };
  });

  useEffect(() => {
    if (!running || !hasClock(control)) return;

    lastTickAt.current = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickAt.current;
      lastTickAt.current = now;

      const { control: live, seatToPlay: seat, onFlag: flag } = latest.current;
      setClocks((current) => {
        const next = tick(current[seat], elapsed, live);
        if (next === current[seat]) return current;
        if (next.flagged && !flagged.current) {
          flagged.current = true;
          // Ending the game is the caller's business, not the clock's.
          queueMicrotask(() => flag(seat));
        }
        return { ...current, [seat]: next };
      });
    }, CLOCK_TICK_MS);

    return () => clearInterval(timer);
  }, [control, running]);

  /** Called once a move lands, which refills the mover's byoyomi period. */
  const onMoveComplete = useCallback((seat: Seat) => {
    lastTickAt.current = Date.now();
    setClocks((current) => ({
      ...current,
      [seat]: completeMove(current[seat], latest.current.control),
    }));
  }, []);

  const reset = useCallback((next: TimeControl) => {
    flagged.current = false;
    lastTickAt.current = Date.now();
    setClocks(freshClocks(next));
  }, []);

  return { clocks, onMoveComplete, reset, seats: SEATS };
}
