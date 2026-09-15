"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { boardSleep, type BoardSleep } from "./boardSleep";
import { IDLE_STOP_MS } from "./live.constants";

/**
 * Whether a live board is still asking, and the hand that wakes it.
 *
 * The timing is `boardSleep`'s; this is only where it meets the page. What
 * stirs the board:
 *
 *  - a press or a key anywhere on the page — the reader is there. The whole
 *    page rather than the board alone, because somebody scrolling the move
 *    list or opening the chat is as present as somebody touching a stone;
 *  - the window getting focus, and the tab being shown again;
 *  - a change arriving on the board, which the caller reports with `stir`.
 *
 * When a stir wakes a sleeping board, `onWake` is called at once: a board that
 * has been asleep is out of date, and the reader who just pressed something is
 * about to act on it. SWR's own focus handler may ask in the same moment; its
 * ask is deduplicated against this one, so a return is one request.
 *
 * Passive listeners that write a timestamp and nothing else while the board is
 * awake — nothing re-renders on a keypress unless it wakes something.
 */
export function useBoardAwake(onWake: () => void): { awake: boolean; stir: () => void } {
  const [asleep, setAsleep] = useState(false);
  const watch = useRef<BoardSleep | null>(null);
  const wake = useRef(onWake);
  useEffect(() => {
    wake.current = onWake;
  }, [onWake]);

  const stir = useCallback(() => {
    if (watch.current?.stir() !== true) return;
    setAsleep(false);
    wake.current();
  }, []);

  useEffect(() => {
    watch.current = boardSleep({ idleMs: IDLE_STOP_MS, onSleep: () => setAsleep(true) });
    const shown = () => {
      if (document.visibilityState !== "hidden") stir();
    };
    const quiet: AddEventListenerOptions = { passive: true, capture: true };
    document.addEventListener("pointerdown", stir, quiet);
    document.addEventListener("keydown", stir, quiet);
    document.addEventListener("visibilitychange", shown);
    window.addEventListener("focus", stir);
    return () => {
      watch.current?.stop();
      watch.current = null;
      document.removeEventListener("pointerdown", stir, quiet);
      document.removeEventListener("keydown", stir, quiet);
      document.removeEventListener("visibilitychange", shown);
      window.removeEventListener("focus", stir);
    };
  }, [stir]);

  return { awake: !asleep, stir };
}
