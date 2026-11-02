"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * BRINGS A RESULT INTO VIEW THE MOMENT IT APPEARS. A game's ending is drawn
 * under its board, and on a phone (390 by 844) the board and its presses fill the
 * screen, so a level won or a puzzle lost was said below the fold and the player
 * was looking at a board that had stopped for no visible reason (looked at on
 * 2026-11-02: Tsumiki's win and Kuniate's six wrong guesses). The element is
 * scrolled to by the least that shows it all, and not at all where it is already
 * in view; a reader who asks for less motion is jumped there, not slid.
 *
 * Put it on a result that mounts only when the game ends here, never on a
 * finished game opened again, or the page would scroll on arrival.
 *
 * @param enabled false where something else already shows the ending (a win's cover over the board).
 */
export function useRevealOnMount<T extends HTMLElement>(enabled = true): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!enabled || element === null) return;
    const box = element.getBoundingClientRect();
    if (box.top >= 0 && box.bottom <= window.innerHeight) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" });
  }, [enabled]);
  return ref;
}
