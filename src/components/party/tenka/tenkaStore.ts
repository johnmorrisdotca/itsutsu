"use client";

import { resignTenka } from "@/lib/party/resignTables";
import { decodeTenka, encodeTenka } from "@/lib/party/tenka/tenkaKeep";
import type { TenkaGame } from "@/lib/party/tenka/tenka.types";

import { keptInBrowser } from "../keptInBrowser";
import { TENKA_STORAGE_KEY } from "./tenka.constants";
import { TENKA_RULES } from "@/lib/party/tenka/tenkaRules";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { partyRecord } from "../keptRules";

/**
 * THE GAME OF TENKA KEPT IN THIS BROWSER: one at a time, as its table, its
 * seed and its moves (`encodeTenka`), written after every move. Read back, the
 * moves are played again from the seed, dice and all, so a reload throws
 * nothing new. How it is kept, and why only here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<TenkaGame>(TENKA_STORAGE_KEY, encodeTenka, decodeTenka, partyRecord(PARTY_KINDS.tenka, TENKA_RULES), resignTenka);

/** Write a game down, or forget the kept one; everybody reading it hears. */
export const keepTenkaGame = kept.keep;

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptTenkaGame = kept.useKept;
export const adoptKeptTenkaGame = kept.adopt;

/** A new seed for a new game, from the browser's own random: every deal and die of the game is drawn from it. */
export function freshTenkaSeed(): number {
  const one = new Uint32Array(1);
  window.crypto.getRandomValues(one);
  return one[0];
}
