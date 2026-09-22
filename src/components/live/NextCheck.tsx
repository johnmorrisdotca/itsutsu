"use client";

import { useEffect, useRef } from "react";

import { LIVE_PAUSED_COPY } from "./live.constants";

/**
 * WHEN THE BOARD WILL NEXT ASK, so quiet and broken look different.
 *
 * An open board asks the server every fifteen seconds, and stops when the
 * tab is hidden, the game is over, or nothing has happened for a while. None
 * of that was on screen, so a player waiting for a move could not tell a
 * board that was about to check from one that had given up — the row on the
 * board put it exactly so.
 *
 * CLIENT-SIDE ONLY. Nothing here asks the server anything: it is arithmetic
 * on when the last answer came and how often the board asks, redrawn once a
 * second.
 *
 * AND IT WRITES THE DOM DIRECTLY, WITHOUT REACT STATE. The first draft kept
 * the seconds in `useState`, and under the poll-cadence spec's fake clock a
 * React update every second changed how often the board ASKED — 240 requests
 * in the idle window instead of 145. A countdown that alters what it counts
 * down to is worse than none, so this touches one text node and re-renders
 * nothing; the board's own timers are left exactly as they were.
 *
 * A single line, quiet, under the board. Not drawn while the board is not
 * asking — a finished game, a hidden tab, or one that has gone to sleep,
 * which says so itself with its own Check now.
 */
export function NextCheck({ asking, answeredAt, every }: { asking: boolean; answeredAt: () => number; every: number }) {
  const line = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!asking) return;
    const draw = () => {
      const node = line.current;
      if (node === null) return;
      const left = Math.max(0, Math.ceil((answeredAt() + every - Date.now()) / 1000));
      node.dataset.seconds = String(left);
      node.textContent = left === 0 ? LIVE_PAUSED_COPY.checking : LIVE_PAUSED_COPY.nextIn(left);
    };
    draw();
    const tick = setInterval(draw, 1000);
    return () => clearInterval(tick);
  }, [asking, answeredAt, every]);
  if (!asking) return null;
  return <p ref={line} className="text-xs text-muted" data-testid="next-check" />;
}
