"use client";

import { useSyncExternalStore } from "react";

import { MAHJONG_FREE_STORAGE_KEY } from "./mahjong.constants";

/**
 * WHETHER THE FREE TILES ARE LIT: a way of looking at the board, chosen on the
 * set-up screen or beside the board and remembered in this browser, as the
 * just-the-board choice is (`bare.ts`). It changes no rule and nothing a
 * solve is scored by, so it is kept with the reader's device rather than
 * with the puzzle. Lit unless turned off: on a phone, finding the free tiles
 * among a hundred is the hardest part of the game to see.
 *
 * Every access is wrapped: a browser that refuses site data lights them and
 * forgets the choice.
 */
const EVENT = "itsutsu:mahjong-free";

function read(): boolean {
  try {
    return window.localStorage.getItem(MAHJONG_FREE_STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function writeMahjongFree(lit: boolean): void {
  try {
    if (lit) window.localStorage.removeItem(MAHJONG_FREE_STORAGE_KEY);
    else window.localStorage.setItem(MAHJONG_FREE_STORAGE_KEY, "0");
  } catch {
    // Not remembered past this page.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Whether the free tiles are lit; lit on the server, where there is no browser to ask. */
export function useMahjongFree(): boolean {
  return useSyncExternalStore(subscribe, read, () => true);
}
