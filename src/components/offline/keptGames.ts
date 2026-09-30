"use client";

import { useSyncExternalStore } from "react";

import { keptAddresses, keptGamesFrom } from "@/lib/offline/offlineKeeper";

/*
 * Which games this device holds, read from the keeper's pages once for every
 * list on a page (one read of Cache Storage, however many cards ask), and
 * read again the next time a page asks after every asker has gone.
 */
let kept: Map<string, string> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    void keptAddresses().then((urls) => {
      kept = keptGamesFrom(urls);
      for (const each of listeners) each();
    });
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The games this device can play with no connection, by each game's own
 * address, to the address it is played at; null until read, and always null
 * on the server, which cannot know what a device holds.
 */
export function useKeptGames(): Map<string, string> | null {
  return useSyncExternalStore(
    subscribe,
    () => kept,
    () => null,
  );
}

function subscribeOnline(listener: () => void): () => void {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

/** Whether the browser says it has a connection; the server says yes, so nothing is drawn offline until the browser is asked. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}
