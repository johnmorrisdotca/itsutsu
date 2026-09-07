"use client";

import { useCallback, useEffect, useState } from "react";

const PREFIX = "gomoku.notes.";

/**
 * Private notes on a game. They live in this browser only and are never
 * sent anywhere — not to the server, not to the opponent — which is the
 * whole point of a note. Keyed by game so a shared game keeps its own, and
 * the local board keeps one until a new game starts.
 */
export function useGameNotes(key: string) {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Read once the key is known; storage can be refused or empty.
  useEffect(() => {
    let stored = "";
    try {
      stored = window.localStorage.getItem(PREFIX + key) ?? "";
    } catch {
      stored = "";
    }
    // Set in an effect on purpose: the store is external and read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(stored);
    setLoaded(true);
  }, [key]);

  const update = useCallback(
    (next: string) => {
      setText(next);
      try {
        if (next.trim() === "") window.localStorage.removeItem(PREFIX + key);
        else window.localStorage.setItem(PREFIX + key, next);
      } catch {
        // A full or blocked store is not a reason to lose the note on screen.
      }
    },
    [key],
  );

  return { text, loaded, update };
}
