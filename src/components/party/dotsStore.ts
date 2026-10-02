"use client";

import { resignDots } from "@/lib/party/resignTables";
import { decodeDots, encodeDots } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";
import type { DotsGame } from "@/lib/party/dotsAndBoxes/dotsAndBoxes.types";

import { keptInBrowser } from "./keptInBrowser";
import { DOTS_STORAGE_KEY } from "./party.constants";
import { DOTS_RULES } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { partyRecord } from "./keptRules";

/**
 * THE GAME OF DOTS AND BOXES KEPT IN THIS BROWSER: one at a time, as its table
 * and its lines (`encodeDots`), written after every line. How it is kept, and
 * why only here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<DotsGame>(DOTS_STORAGE_KEY, encodeDots, decodeDots, partyRecord(PARTY_KINDS.dotsAndBoxes, DOTS_RULES), resignDots);

/** Write a game down, or forget the kept one; everybody reading it hears. */
export const keepDotsGame = kept.keep;

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptDotsGame = kept.useKept;
export const adoptKeptDotsGame = kept.adopt;
