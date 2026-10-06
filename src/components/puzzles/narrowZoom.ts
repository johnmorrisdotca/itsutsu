"use client";

import { useState } from "react";

/** The widest screen, in pixels, that a board too big for a thumb opens zoomed on (Tailwind's `sm` is where a desk starts). */
const NARROW_BELOW = 640;

/**
 * THE ZOOM A BIG BOARD OPENS AT: `zoom` on a phone, whole on anything wider. A 25×25 grid or a 32×32 field fitted to 390
 * pixels has cells about a dozen wide, so on a phone it opens at the zoom a thumb can press and the pad moves it; on a
 * desk the whole board fits with cells of twenty pixels or more and a pointer presses them, so it opens whole and Fit
 * has nothing to do. Read once, as the board is first drawn, which is in the browser only.
 */
export function useNarrowZoom(zoom: number): number {
  const [opens] = useState(() => (typeof window !== "undefined" && window.innerWidth < NARROW_BELOW ? zoom : 1));
  return opens;
}
