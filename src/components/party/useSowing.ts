"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { sowingFrames } from "@/lib/party/mancala/mancala";
import type { MancalaGame } from "@/lib/party/mancala/mancala.types";

import { MANCALA_SOW_STEP_MS, MANCALA_SOW_TOTAL_MS } from "./party.constants";
import type { SowingShown } from "./party.types";

/**
 * A SOWING DRAWN AS IT HAPPENS: the pit lifted, then a seed falling in each
 * hole in turn, then the board as the rules leave it — about half a second
 * whatever its length, and never slower than a tenth of a second a seed.
 *
 * The game itself is already kept before the first seed is drawn, so a tab
 * closed half way through a sowing has lost nothing; this only decides what
 * the board shows meanwhile (`holes`, and the hole a seed has just fallen
 * into, `landing`), and the board takes no tap while it runs (`sowing`).
 *
 * Under `prefers-reduced-motion: reduce` nothing is drawn in between: the
 * board goes straight to where the sowing left it. That is asked in the tap's
 * own handler, where the browser is the only one who can answer it.
 */
export function useSowing(game: MancalaGame | null | undefined): {
  holes: readonly number[] | null;
  landing: number | null;
  sowing: boolean;
  start: (before: MancalaGame, after: MancalaGame) => void;
} {
  const [shown, setShown] = useState<SowingShown | null>(null);
  const timer = useRef<number | null>(null);

  // A table left mid-sowing leaves no timer running behind it.
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const start = useCallback((before: MancalaGame, after: MancalaGame) => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    const frames = sowingFrames(before, after);
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (frames.length === 0 || still || after.last === null) {
      setShown(null);
      return;
    }
    const path = after.last.path;
    // The last frame is the game itself, drawn once the sowing is over; every one before it is a step.
    const steps = frames.length - 1;
    const step = Math.min(MANCALA_SOW_STEP_MS, MANCALA_SOW_TOTAL_MS / steps);
    const show = (index: number) => {
      if (index >= steps) {
        timer.current = null;
        setShown(null);
        return;
      }
      setShown({ frames, index, path, moves: after.moves.length });
      timer.current = window.setTimeout(() => show(index + 1), step);
    };
    show(0);
  }, []);

  // Only over the game it was started for: a new game, or one from another tab, is drawn as it is at once.
  const drawing = shown !== null && game !== null && game !== undefined && game.moves.length === shown.moves ? shown : null;
  return {
    holes: drawing === null ? null : drawing.frames[drawing.index],
    landing: drawing === null || drawing.index === 0 ? null : (drawing.path[drawing.index - 1] ?? null),
    sowing: drawing !== null,
    start,
  };
}
