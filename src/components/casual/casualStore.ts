"use client";

import { useSyncExternalStore } from "react";

import { CASUAL_STORAGE_KEY, decodeCasual, encodeCasual, type CasualSave } from "@/lib/casual/casualProgress";

/**
 * WHAT THE CASUAL GAMES REMEMBER, kept in this browser: the levels won in each,
 * and the level the player was on (`lib/casual/casualProgress.ts`). One key
 * for all eight, written after every level won or started, and read by the
 * games, their doors, set-up screens and My games.
 *
 * `useSyncExternalStore`, as every kept thing here is (`keptInBrowser.ts`):
 * the server has no browser to ask, so it answers `undefined`, "not read
 * yet", which is not the same as "nothing kept", and a tab of this browser
 * playing on another page is heard too. Every access is wrapped: a browser
 * told to block site data throws rather than answering, and a game that will
 * not start because a convenience failed is worse than one that is not kept.
 */
const listeners = new Set<() => void>();
/** The save as last written, when storage refused to take it: this tab plays on from here, and only the keeping past it is lost. */
let unkept: string | undefined;
let seenText: string | null | undefined;
let seenSave: CasualSave = {};

function readText(): string | null {
  if (unkept !== undefined) return unkept;
  try {
    return window.localStorage.getItem(CASUAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** The save, one object for as long as the text under it is the same, as `useSyncExternalStore` needs. */
function snapshot(): CasualSave {
  const text = readText();
  if (text !== seenText) {
    seenText = text;
    seenSave = decodeCasual(text);
  }
  return seenSave;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const fromElsewhere = (event: StorageEvent) => {
    if (event.key === CASUAL_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", fromElsewhere);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", fromElsewhere);
  };
}

/** Change the save: `change` is given what is kept now and returns what to keep. Everybody reading hears. */
export function keepCasual(change: (save: CasualSave) => CasualSave): void {
  const next = encodeCasual(change(snapshot()));
  // A level's line changes with every move, and most changes leave the save as it was: write and tell nobody then.
  if (next === encodeCasual(snapshot())) return;
  try {
    window.localStorage.setItem(CASUAL_STORAGE_KEY, next);
    unkept = undefined;
  } catch {
    unkept = next;
  }
  for (const listener of listeners) listener();
}

/** Forget everything kept (a test, or a player who wants a clean start). */
export function forgetCasual(): void {
  try {
    window.localStorage.removeItem(CASUAL_STORAGE_KEY);
  } catch {
    /* Nothing was kept, or cannot be got at. */
  }
  unkept = undefined;
  for (const listener of listeners) listener();
}

/** The save (`undefined` until the browser has been asked, `{}` when nothing is kept). */
export function useCasualSave(): CasualSave | undefined {
  return useSyncExternalStore(subscribe, snapshot, () => undefined);
}
