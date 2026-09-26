"use client";

import { useCallback, useState } from "react";

import { keepAttemptHere, keptAttempts } from "./tsunagiKept";

/**
 * HOW MANY TIMES A TSUNAGI LEVEL HAS BEEN STARTED, and one more. John,
 * 2026-09-26: "Keep a count of the player's attempts at each level and show it
 * beside the level." An attempt is a board started from empty: the first line
 * drawn on a fresh board, and again after each Restart (`TsunagiSolve` decides
 * when). A member's count is on the account (`TsunagiAttempt`, one write a
 * start, never while playing); anybody else's is in this browser.
 *
 * The page is drawn in the browser only (`PuzzlePlayClient`), so a visitor's
 * count is read at once rather than after hydrating.
 */
export function useTsunagiAttempts(size: number, level: number, hasAccount: boolean, onAccount: number): { attempts: number; countOne: () => void } {
  const [attempts, setAttempts] = useState(() => (hasAccount ? onAccount : (keptAttempts(size)[level] ?? 0)));

  const countOne = useCallback(() => {
    if (!hasAccount) {
      setAttempts(keepAttemptHere(size, level));
      return;
    }
    setAttempts((now) => now + 1);
    void fetch("/api/puzzles/tsunagi/attempts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ size, level }),
    })
      .then(async (response) => {
        if (!response.ok) return;
        const { count } = (await response.json()) as { count: number };
        // The account's figure is the true one: another tab may have counted too.
        setAttempts((now) => Math.max(now, count));
      })
      .catch(() => undefined);
  }, [hasAccount, size, level]);

  return { attempts, countOne };
}
