"use client";

import { useCallback, useSyncExternalStore } from "react";

import { CARD_BACK_CHOICES, CARD_BACK_KEY } from "./Cards.constants";
import type { CardBackChoice } from "./cards.types";

/**
 * WHICH BACK THE CARDS WEAR, chosen at a card table (`CardBackPicker`) and
 * read by every face-down card the site draws (`ChosenCardBack`), so a choice
 * made at Hearts is the back at Solitaire too. Kept in this browser; the
 * server and a browser keeping nothing draw the Itsutsu back, so the page
 * never draws one back and then another before it is read. Every access is
 * wrapped, since a browser blocking site data throws.
 */

const listeners = new Set<() => void>();

function readBack(): CardBackChoice {
  try {
    const kept = window.localStorage.getItem(CARD_BACK_KEY);
    return (CARD_BACK_CHOICES as readonly string[]).includes(kept ?? "") ? (kept as CardBackChoice) : "itsutsu";
  } catch {
    return "itsutsu";
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The back the cards wear here, and the way to choose another. */
export function useCardBackChoice(): { back: CardBackChoice; choose: (back: CardBackChoice) => void } {
  const back = useSyncExternalStore(subscribe, readBack, () => "itsutsu" as const);
  const choose = useCallback((next: CardBackChoice) => {
    try {
      window.localStorage.setItem(CARD_BACK_KEY, next);
    } catch {
      /* Not remembered: nothing changes. */
    }
    for (const listener of listeners) listener();
  }, []);
  return { back, choose };
}
