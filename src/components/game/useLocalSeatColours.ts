"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { PieceColour } from "@/lib/pieces/pieceColours";
import { seatColoursFrom, type SeatColours } from "@/lib/pieces/seatColours";

const PREFIX = "itsutsu.seatColours.";
const EVENT = "itsutsu:seatColours";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function subscribe(changed: () => void): () => void {
  window.addEventListener(EVENT, changed);
  window.addEventListener("storage", changed);
  return () => {
    window.removeEventListener(EVENT, changed);
    window.removeEventListener("storage", changed);
  };
}

/**
 * THE COLOURS OF A BOARD PLAYED AT ONE SCREEN — the practice board, and a
 * hot-seat game two people pass across one device — kept in this browser.
 *
 * Both seats belong to whoever is at the screen, so there is nobody else to
 * share a choice with and nothing for a server to keep: each board's pair is
 * stored under its own key (`practice`, or the match's id), read on arrival
 * and changed at once. A practice board becomes a match on its first stone,
 * so a match with nothing kept of its own shows the practice board's colours
 * (`inherit`) until one of its own is chosen. Storage that is refused simply forgets, and the board
 * is drawn in its ordinary stones.
 */
export function useLocalSeatColours(key: string, inherit?: string): { colours: SeatColours; choose: (side: Stone, colour: PieceColour | null) => void } {
  // A board with nothing kept of its own shows what it grew from: a practice game that became a match keeps its colours.
  const stored = useSyncExternalStore(subscribe, () => read(key) ?? (inherit === undefined ? null : read(inherit)), () => null);
  const colours = useMemo<SeatColours>(() => {
    try {
      const parsed = stored === null ? {} : (JSON.parse(stored) as Record<string, unknown>);
      return seatColoursFrom(parsed.black, parsed.white);
    } catch {
      return {};
    }
  }, [stored]);
  const choose = useCallback(
    (side: Stone, colour: PieceColour | null) => {
      const next = { ...colours, [side]: colour ?? undefined };
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(next));
      } catch {
        // Not remembered, then; the board still changes for as long as the page is open.
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [colours, key],
  );
  return { colours, choose };
}
