"use client";

import { decodeDots, encodeDots } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";
import type { DotsGame } from "@/lib/party/dotsAndBoxes/dotsAndBoxes.types";

import { keptInBrowser } from "./keptInBrowser";
import { DOTS_STORAGE_KEY } from "./party.constants";

/**
 * THE GAME OF DOTS AND BOXES KEPT IN THIS BROWSER: one at a time, as its table
 * and its lines (`encodeDots`), written after every line. How it is kept, and
 * why only here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<DotsGame>(DOTS_STORAGE_KEY, encodeDots, decodeDots);

/** Write a game down, or forget the kept one; everybody reading it hears. */
export const keepDotsGame = kept.keep;

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptDotsGame = kept.useKept;
