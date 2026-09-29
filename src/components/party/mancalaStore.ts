"use client";

import { decodeMancala, encodeMancala } from "@/lib/party/mancala/mancala";
import type { MancalaGame } from "@/lib/party/mancala/mancala.types";

import { keptInBrowser } from "./keptInBrowser";
import { MANCALA_STORAGE_KEY } from "./party.constants";

/**
 * THE GAME OF MANCALA KEPT IN THIS BROWSER: one at a time, as its table and
 * its sowings (`encodeMancala`), written after every sowing. How it is kept,
 * and why only here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<MancalaGame>(MANCALA_STORAGE_KEY, encodeMancala, decodeMancala);

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptMancalaGame = kept.useKept;
