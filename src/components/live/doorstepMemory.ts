"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * THE GAME THIS DOORSTEP HAS ALREADY MADE, IF IT HAS.
 *
 * Pressing Begin writes a game and lands on its board. Pressing BACK then
 * returns to the doorstep, and the page has to know that the thing it is
 * offering to do has already been done — or a second press buys a second game,
 * which is the oldest bug a confirmation screen has.
 *
 * WHY IT IS REMEMBERED IN THE BROWSER AND NOT ASKED OF THE SERVER. "Is there
 * already a game like this one" has no honest answer: two identical games
 * against the same program are a thing somebody may legitimately want, so any
 * query would be guessing, and a guess here either blocks a real second game or
 * silently makes one. What CAN be known exactly is "this tab has already pressed
 * Begin on this address", and that is what this holds.
 *
 * `sessionStorage`, keyed by the whole address, so it is per tab and per
 * doorstep and goes away with the tab — the same scope as "I just pressed this".
 * Every access is wrapped: a browser told to block site data throws rather than
 * answering, and a confirmation page that will not render because a convenience
 * failed is worse than one that forgets.
 *
 * `useSyncExternalStore` rather than an effect that sets state, for the reason
 * `useHydrated` gives: one answer on the server and another in the browser is
 * what its third argument is for, and setting state in an effect is a lint error
 * here, correctly.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function announce(): void {
  for (const listener of listeners) listener();
}

function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Nothing is remembered on the server, which has no tab to remember it in. */
const onTheServer = () => null;

/**
 * The game begun from this address in this tab, and the way to say one has been
 * begun — or to forget it, so that a deliberate second game of exactly this is
 * still possible. Nothing here is a dead end.
 */
export function useGameBegunHere(key: string): [string | null, (path: string | null) => void] {
  const snapshot = useCallback(() => read(key), [key]);
  const begun = useSyncExternalStore(subscribe, snapshot, onTheServer);
  const remember = useCallback(
    (path: string | null) => {
      try {
        if (path === null) window.sessionStorage.removeItem(key);
        else window.sessionStorage.setItem(key, path);
      } catch {
        /*
         * Storage refused. The press still worked and the navigation still
         * happens; all that is lost is the page's memory of it, which is a
         * convenience rather than a rule.
         */
      }
      announce();
    },
    [key],
  );
  return [begun, remember];
}
