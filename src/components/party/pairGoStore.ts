"use client";

import { decodePairGo, encodePairGo } from "@/lib/gomoku/party/pairGo";
import type { PairGoGame } from "@/lib/gomoku/party/pairGo.types";

import { keptInBrowser } from "./keptInBrowser";
import { PAIR_GO_STORAGE_KEY } from "./pairGo.constants";

/**
 * THE PAIR GO GAME KEPT IN THIS BROWSER: one at a time, as its board size,
 * its four names and its moves (`encodePairGo`), under a key of its own.
 *
 * Its own key rather than the practice board's (`gameStorage.ts`), so a
 * table's game and a board for two can both be going in one browser, and
 * neither ever opens as the other: the board for two is read exactly as it
 * always was, and a kept one still opens.
 */
const kept = keptInBrowser<PairGoGame>(PAIR_GO_STORAGE_KEY, encodePairGo, decodePairGo);

/** Write a game down, or forget the kept one; everybody reading it hears. */
export const keepPairGo = kept.keep;

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptPairGo = kept.useKept;
