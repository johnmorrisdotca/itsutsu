"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { WORD_STYLES, type WordStyle } from "@/lib/puzzles/gomoji/wordStyles";

type WordStyleValue = { style: WordStyle; setStyle: (next: WordStyle) => void };

const WordStyleContext = createContext<WordStyleValue>({ style: WORD_STYLES.othello, setStyle: () => undefined });

/**
 * How a Gomoji grid is drawn, held for the page and kept on the account,
 * the way the record's move format is (`MoveFormatProvider`): read once by the
 * page (`preferencesFor`), drawn at once when changed, and written back with
 * one PATCH. A reader with no account keeps the choice for the page. A race,
 * which has no provider above it, is drawn in Othello.
 */
export function WordStyleProvider({ initial, saves, children }: { initial: WordStyle; saves: boolean; children: ReactNode }) {
  const [style, setState] = useState(initial);
  const setStyle = useCallback(
    (next: WordStyle) => {
      setState(next);
      if (!saves) return;
      void fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { wordStyle: next } }),
      }).catch(() => undefined);
    },
    [saves],
  );
  const value = useMemo(() => ({ style, setStyle }), [style, setStyle]);
  return <WordStyleContext.Provider value={value}>{children}</WordStyleContext.Provider>;
}

/** The grid's style and the way to change it. Othello, where no provider is above. */
export function useWordStyle(): WordStyleValue {
  return useContext(WordStyleContext);
}
