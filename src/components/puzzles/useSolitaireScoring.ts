"use client";

import { useCallback, useSyncExternalStore } from "react";

import { SOLITAIRE_SCORING_LIST, type SolitaireScoring } from "@/lib/puzzles/solitaire/scoring";

/**
 * HOW THIS READER KEEPS SCORE AT SOLITAIRE: none, standard or Vegas, chosen on
 * the set-up and changeable beside the table. A per-reader convenience, kept
 * in this browser only: it changes no rule and nothing the site records (a
 * game is timed, and its fastest table read, the same whatever the score), so
 * it is no part of the address, a kept run or a solve. Read in a try, since
 * storage can be refused, and "none" when it is.
 */
const KEY = "itsutsu:solitaire-scoring";
const listeners = new Set<() => void>();
/** The choice made on this page, for a browser that refuses storage. */
let chosenHere: SolitaireScoring | null = null;

function read(): SolitaireScoring {
  try {
    const kept = window.localStorage.getItem(KEY);
    if (SOLITAIRE_SCORING_LIST.includes(kept as SolitaireScoring)) return kept as SolitaireScoring;
  } catch {
    // Refused: what was chosen on this page, below.
  }
  return chosenHere ?? "none";
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSolitaireScoring(): [SolitaireScoring, (scoring: SolitaireScoring) => void] {
  const scoring = useSyncExternalStore(subscribe, read, () => "none" as SolitaireScoring);
  const choose = useCallback((next: SolitaireScoring) => {
    chosenHere = next;
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // Not kept; the choice still holds on this page.
    }
    for (const listener of listeners) listener();
  }, []);
  return [scoring, choose];
}
