"use client";

import { useEffect } from "react";

import type { SetUpAgain, SetUpOpponent } from "./setUp.types";
import { forgetRematchHeading, publishRematchHeading } from "./setUpHeadingState";

/**
 * THE HEADING ABOVE THE SET-UP SCREEN, KEPT TRUE WITHOUT A RELOAD.
 *
 * `SetUpHeading` is drawn by the PAGE, from the address the page opened with,
 * so choosing somebody else left it reading "Play them again, you take White"
 * over a notice saying this was now a new game. The screen knows the moment it
 * stops being a rematch — `stillARematch` — and hands that up as it changes.
 *
 * Two effects and not one, because they are two facts: what the heading should
 * say now, and that this screen has gone. Written here rather than in
 * `SetUpGame.tsx`, which passed the File Size Gate when the doorstep's job
 * moved into it.
 */
export function useRematchHeading({
  again,
  repeat,
  opponent,
}: {
  again: SetUpAgain | null;
  /** Whether this is still a repeat of that game, against that player. */
  repeat: boolean;
  /** Who it is against now — null for a seat posted for anyone, or a draw. */
  opponent: SetUpOpponent | null;
}): void {
  const againId = again?.id ?? null;
  const nowName = opponent?.name ?? null;
  useEffect(() => {
    if (againId === null) return;
    publishRematchHeading(againId, { repeat, opponent: nowName === null ? null : { name: nowName } });
  }, [againId, repeat, nowName]);
  useEffect(() => {
    if (againId === null) return;
    return () => forgetRematchHeading(againId);
  }, [againId]);
}
