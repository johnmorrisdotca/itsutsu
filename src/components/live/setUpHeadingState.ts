import { useSyncExternalStore } from "react";

import type { RematchHeadingState } from "./setUp.types";

/**
 * WHERE A REMATCH'S HEADING STANDS, SHARED BETWEEN THE SCREEN AND ITS HEADING.
 *
 * The heading is drawn by the page, above the set-up screen, from the address the
 * page opened with. The screen is where the choices change — so after choosing
 * somebody else on a rematch, the notice under the heading said "a new game" and
 * the heading above it still said "Play them again, you take White" until a
 * reload. The screen now publishes what it has decided (`stillARematch`, and who
 * the game is against), and the heading reads it back.
 *
 * Nothing is fetched and nothing is timed: it is the same decision, handed across
 * the page in memory. Keyed by the game being repeated, so two rematches never
 * share an answer.
 */

const states = new Map<string, RematchHeadingState>();
const listeners = new Set<() => void>();

/** What the set-up screen has decided now. Unchanged answers tell nobody. */
export function publishRematchHeading(id: string, state: RematchHeadingState): void {
  const was = states.get(id);
  const same =
    was !== undefined && was.repeat === state.repeat && (was.opponent?.name ?? null) === (state.opponent?.name ?? null);
  if (same) return;
  states.set(id, state);
  for (const listener of listeners) listener();
}

/**
 * The screen has gone: its answer goes with it, so a later visit to the same
 * rematch starts from what its own address says rather than flashing the last
 * visit's choice for a frame.
 */
export function forgetRematchHeading(id: string): void {
  if (!states.delete(id)) return;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The heading's state: the screen's latest answer, or what the address said until
 * the screen has given one. The server and the first browser render both use the
 * address's answer, so the page draws the same heading either side of hydration.
 */
export function useRematchHeading(id: string, initial: RematchHeadingState): RematchHeadingState {
  return useSyncExternalStore(
    subscribe,
    () => states.get(id) ?? initial,
    () => initial,
  );
}
