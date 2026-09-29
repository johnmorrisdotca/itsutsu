"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import type { PartyLanguage } from "@/lib/party/party.types";
import { ghostWordsReady, loadGhostWords } from "@/lib/party/superghost/ghostWords";

/** Everybody waiting on a list, told when one arrives. */
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * SUPERGHOST'S WORD LIST FOR A TABLE: fetched the first time a game in that
 * language is open in this tab (`loadGhostWords`, a dynamic import of
 * Kumimoji's list), and read at once every time after. "loading" until then,
 * "failed" when the fetch did not come back — never "ready" without the list,
 * because a table that cannot read the list must not judge a word.
 */
export function useGhostWords(language: PartyLanguage | null): "loading" | "ready" | "failed" {
  const [failed, setFailed] = useState<PartyLanguage | null>(null);
  const ready = useSyncExternalStore(
    subscribe,
    () => language !== null && ghostWordsReady(language),
    () => false,
  );
  useEffect(() => {
    if (language === null || ghostWordsReady(language)) return;
    let live = true;
    loadGhostWords(language).then(
      () => {
        for (const listener of listeners) listener();
      },
      () => {
        if (live) setFailed(language);
      },
    );
    return () => {
      live = false;
    };
  }, [language]);
  return ready ? "ready" : failed !== null && failed === language ? "failed" : "loading";
}
