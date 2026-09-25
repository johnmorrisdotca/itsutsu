"use client";

import { useCallback, useState } from "react";

import { keepaliveFetch } from "@/lib/api/keepaliveFetch";
import type { Appearance, Felt } from "./board.types";

/**
 * A Reversi board's felt, chosen on its patches (`FeltPatches`) where no game
 * session holds the board's appearance: the set-up screen and a live game.
 * Written to the account once per press, as the account's board with this one
 * change; a reader with no account is refused and keeps it for the page.
 * Nothing is sent but a press.
 */
export function useFeltChoice(appearance: Appearance): { felt: Felt; chooseFelt: (felt: Felt) => void } {
  const [felt, setFelt] = useState(appearance.felt);
  const chooseFelt = useCallback(
    (next: Felt) => {
      setFelt(next);
      void keepaliveFetch("/api/me", "PATCH", { appearance: { ...appearance, felt: next } }).catch(() => undefined);
    },
    [appearance],
  );
  return { felt, chooseFelt };
}
