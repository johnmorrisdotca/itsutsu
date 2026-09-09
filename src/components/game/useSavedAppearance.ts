"use client";

import { useEffect, useRef } from "react";

import { sameAppearance } from "@/components/board/appearance";
import type { Appearance } from "@/components/board/board.types";

/**
 * Keeps a member's board on their account.
 *
 * A player dresses the board where they use it — in the game, not on a
 * settings page — so the choice is made there and kept here. Signed in, it
 * follows them to a phone; signed out, this does nothing at all and the
 * browser's own copy is the only one, as it always was.
 *
 * Writes only on a real change. A board is redrawn constantly, and saying
 * the same thing to the server on every render is the shape of thing that
 * has already cost this site a day.
 */
export function useSavedAppearance(appearance: Appearance, signedIn: boolean): void {
  const last = useRef<Appearance | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    /*
     * The first appearance seen is what the account already holds — it came
     * from there — so it is remembered rather than written back.
     */
    if (last.current === null) {
      last.current = appearance;
      return;
    }
    if (sameAppearance(last.current, appearance)) return;
    last.current = appearance;

    const timer = setTimeout(() => {
      // A board that could not be saved is not worth interrupting a game for;
      // it stays right in this browser and follows on the next change.
      void fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appearance }),
      }).catch(() => undefined);
    }, 500);
    return () => clearTimeout(timer);
  }, [appearance, signedIn]);
}
