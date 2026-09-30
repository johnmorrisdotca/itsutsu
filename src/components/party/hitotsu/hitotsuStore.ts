"use client";

import { decodeHitotsu, encodeHitotsu } from "@/lib/party/hitotsu/hitotsuRules";
import type { HitotsuGame } from "@/lib/party/hitotsu/hitotsu.types";

import { keptInBrowser } from "../keptInBrowser";
import { HITOTSU_STORAGE_KEY } from "./hitotsu.constants";

/**
 * THE GAME OF HITOTSU KEPT IN THIS BROWSER: one at a time, as its table, its
 * seed and its moves (`encodeHitotsu`), written after every move. Hands are
 * never written: a reload deals them again from the seed and replays the
 * moves, so it cannot deal a different hand. How it is kept, and why only
 * here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<HitotsuGame>(HITOTSU_STORAGE_KEY, encodeHitotsu, decodeHitotsu);

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptHitotsu = kept.useKept;
