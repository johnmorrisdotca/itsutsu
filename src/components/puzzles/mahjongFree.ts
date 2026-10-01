"use client";

import { useSyncExternalStore } from "react";

import { MAHJONG_FIND_STORAGE_KEY, MAHJONG_FREE_STORAGE_KEY } from "./mahjong.constants";

/**
 * A WAY OF LOOKING AT THE BOARD, remembered in this browser, as the
 * just-the-board choice is (`bare.ts`). Two of them: whether the free tiles
 * are lit, and Find. Neither changes a rule or anything a solve is scored by,
 * so each is kept with the reader's device rather than with the puzzle.
 *
 * Every access is wrapped: a browser that refuses site data keeps the
 * default and forgets the choice.
 */
function deviceChoice(key: string, event: string, fallback: boolean) {
  // Only the choice that differs from the default is stored.
  const stored = fallback ? "0" : "1";
  const read = (): boolean => {
    try {
      return window.localStorage.getItem(key) === stored ? !fallback : fallback;
    } catch {
      return fallback;
    }
  };
  const subscribe = (onChange: () => void): (() => void) => {
    window.addEventListener(event, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(event, onChange);
      window.removeEventListener("storage", onChange);
    };
  };
  const write = (on: boolean): void => {
    try {
      if (on === fallback) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, stored);
    } catch {
      // Not remembered past this page.
    }
    window.dispatchEvent(new Event(event));
  };
  // The default on the server, where there is no browser to ask.
  const use = (): boolean => useSyncExternalStore(subscribe, read, () => fallback);
  return { use, write };
}

/**
 * WHETHER THE FREE TILES ARE LIT. Lit unless turned off: on a phone, finding
 * the free tiles among a hundred is the hardest part of the game to see.
 */
const free = deviceChoice(MAHJONG_FREE_STORAGE_KEY, "itsutsu:mahjong-free", true);
export const useMahjongFree = free.use;
export const writeMahjongFree = free.write;

/**
 * FIND: pointing at or choosing a tile lights every tile that matches it.
 * John, 2026-10-01: "Add Find mode... when on, anything you highlight/select
 * will help find and highlight (in a slightly different colour right?) the
 * matching pair, if valid." Off unless turned on, since it gives away what
 * the game asks a player to look for.
 */
const find = deviceChoice(MAHJONG_FIND_STORAGE_KEY, "itsutsu:mahjong-find", false);
export const useMahjongFind = find.use;
export const writeMahjongFind = find.write;
