"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { MoveFormatChoice } from "@/lib/record/moveFormats";

type MoveFormatValue = { format: MoveFormatChoice; setFormat: (next: MoveFormatChoice) => void };

const MoveFormat = createContext<MoveFormatValue>({ format: "itsutsu", setFormat: () => undefined });

/**
 * How the record writes its moves, held for the board and kept on the account.
 *
 * The page reads the member's choice once (`preferencesFor`) and hands it in;
 * a change is drawn at once and written back with one PATCH, the way the board
 * size and the confirm-moves switch are. A reader with no account keeps the
 * choice for the page, and gets ours next time: a preference that lived in one
 * browser would be a different feature wearing the same name (the registry's
 * rule, `preferences.constants.ts`).
 */
export function MoveFormatProvider({
  initial,
  saves,
  children,
}: {
  initial: MoveFormatChoice;
  /** Whether there is an account to keep it on. */
  saves: boolean;
  children: ReactNode;
}) {
  const [format, setState] = useState(initial);
  const setFormat = useCallback(
    (next: MoveFormatChoice) => {
      setState(next);
      if (!saves) return;
      void fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { moveFormat: next } }),
      }).catch(() => undefined);
    },
    [saves],
  );
  const value = useMemo(() => ({ format, setFormat }), [format, setFormat]);
  return <MoveFormat.Provider value={value}>{children}</MoveFormat.Provider>;
}

/** The record's format and the way to change it. Ours, where no provider is above. */
export function useMoveFormat(): MoveFormatValue {
  return useContext(MoveFormat);
}
