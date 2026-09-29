"use client";

import { useSyncExternalStore } from "react";

import type { PartyGame } from "@/lib/puzzles/kumimoji/party.types";
import { decodeParty, encodeParty } from "@/lib/puzzles/kumimoji/partyKept";

/**
 * THE PASS-AND-PLAY GAME THIS BROWSER IS KEEPING, AND THE NAMES LAST PLAYED.
 *
 * AGENTS.md, "Anything a person plays is kept until it is finished": a local
 * game meets that rule here, in this browser, rather than on the server. Every
 * move writes the whole game to `localStorage` (`encodeParty`), so leaving
 * half way and coming back — a reload, another page, the phone locked —
 * opens it again on the cover of the player whose turn it was, and Kumimoji's
 * set-up screen offers "Continue the pass-and-play game" while one is kept. A
 * finished game is forgotten from storage, and so is one its players end.
 * Nothing of it, names included, is ever sent to the site: a game with no
 * points and no record has nothing to hand in, and it costs no request.
 *
 * Read through `useSyncExternalStore`, as `ViewPad`'s arrows are, so the
 * server's answer (nothing kept) and the browser's can differ without an
 * effect setting state. Every access is wrapped: a browser that blocks site
 * data plays the game all the same, from `here`, and simply does not keep it
 * past the page.
 */
const KEPT = "itsutsu:kumimoji-party";
const NAMES = "itsutsu:kumimoji-party-names";
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

function stored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Not kept past this page: what this page holds answers until it is left.
  }
}

/**
 * THE GAME THIS PAGE IS PLAYING, as the object itself once a move has been
 * made here: the tables keep the squares their tiles were laid on, as the
 * solo game's do, rather than being read back from their code (which starts
 * every grid at its own top-left) after every move. Before that, what storage
 * holds, read once per string. A finished game stays here after storage has
 * forgotten it, and a browser whose storage refuses still plays.
 */
let here: { game: PartyGame | null } | undefined;
let read: { raw: string | null; game: PartyGame | null } = { raw: null, game: null };

function keptGame(): PartyGame | null {
  if (here !== undefined) return here.game;
  const raw = stored(KEPT);
  if (raw !== read.raw) read = { raw, game: decodeParty(raw) };
  return read.game;
}

const nothingOnTheServer = () => null;

/** The kept game (its shape checked; `holdsItsBag` is the page's to ask, with the word list loaded), or null. */
export function useKeptParty(): PartyGame | null {
  return useSyncExternalStore(subscribe, keptGame, nothingOnTheServer);
}

/** Keep the game after a move; a finished one stays on this page and leaves storage, and null forgets it everywhere. */
export function keepParty(game: PartyGame | null): void {
  here = { game };
  store(KEPT, game === null || game.ending !== null ? null : encodeParty(game));
  announce();
}

let namesRead: { raw: string | null; names: readonly string[] } = { raw: null, names: [] };

function keptNames(): readonly string[] {
  const raw = stored(NAMES);
  if (raw === namesRead.raw) return namesRead.names;
  let names: readonly string[] = [];
  try {
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((name) => typeof name === "string")) names = parsed as string[];
  } catch {
    names = [];
  }
  namesRead = { raw, names };
  return names;
}

const NO_NAMES: readonly string[] = [];

/** The names last played with, to fill the names screen: a convenience only. */
export function useRememberedNames(): readonly string[] {
  return useSyncExternalStore(subscribe, keptNames, () => NO_NAMES);
}

export function rememberNames(names: readonly string[]): void {
  store(NAMES, JSON.stringify(names));
  announce();
}
