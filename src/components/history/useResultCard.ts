"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

/** Where this browser remembers a result card was closed, one entry per game. */
const KEY_PREFIX = "itsutsu.result-card.v1:";

/** Nothing to subscribe to: whether a card was closed only changes when this tab closes it. */
const never = () => () => {};

/**
 * Whether this browser has already closed this game's card.
 *
 * A convenience, and nothing depends on it being there: storage that throws (a
 * private window, blocked site data) reads as "not closed", so the card shows
 * again on the next visit rather than breaking the page.
 */
function closedBefore(gameId: string): boolean {
  try {
    return window.localStorage.getItem(`${KEY_PREFIX}${gameId}`) !== null;
  } catch {
    return false;
  }
}

function rememberClosed(gameId: string): void {
  try {
    window.localStorage.setItem(`${KEY_PREFIX}${gameId}`, "closed");
  } catch {
    // Forgetting is survivable: the card shows once more next time.
  }
}

/**
 * THE RESULT CARD'S OPEN, SHUT AND FOCUS, for one finished game and one reader.
 *
 * Shown once per game per browser. Closed by the Close button, by Escape, or by
 * any of its actions — each of those is the reader saying they have seen it —
 * and not shown again for that game here.
 *
 * Nothing is drawn on the server: whether this browser closed the card is a
 * question only the browser can answer, so the server's answer is "closed" and
 * the card appears once the page is the browser's. It sits over the board, so
 * appearing moves nothing else on the page.
 *
 * Focus moves into the card when it opens, so the result is announced, and goes
 * back where it was when it closes — or to the replay's scrubber, when a reader
 * asks to review the moves.
 */
export function useResultCard(
  gameId: string,
  /** The card's dialog, owned by the component that draws it, to take focus when it opens. */
  dialog: RefObject<HTMLDivElement | null>,
) {
  const closedHere = useSyncExternalStore(
    never,
    () => closedBefore(gameId),
    () => true,
  );
  const [closedNow, setClosedNow] = useState(false);
  const open = !closedHere && !closedNow;

  const returnTo = useRef<HTMLElement | null>(null);

  /** Closes the card for good and puts focus where it belongs next. */
  const close = useCallback(
    (focus?: HTMLElement | null) => {
      rememberClosed(gameId);
      setClosedNow(true);
      const next = focus ?? returnTo.current;
      if (next !== null && next !== undefined && typeof next.focus === "function") next.focus();
    },
    [gameId],
  );

  /** Marks the card as seen without taking focus anywhere, for an action that navigates away. */
  const seen = useCallback(() => rememberClosed(gameId), [gameId]);

  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    returnTo.current = active instanceof HTMLElement && active !== document.body ? active : null;
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, dialog]);

  return { open, close, seen };
}
