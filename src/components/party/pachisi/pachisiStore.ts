"use client";

import { decodePachisi, encodePachisi } from "@/lib/party/pachisi/pachisiCodec";
import type { PachisiGame } from "@/lib/party/pachisi/pachisi.types";

import { PACHISI_RULES } from "@/lib/party/pachisi/pachisiRules";
import { PARTY_KINDS } from "@/lib/party/party.constants";

import { keptInBrowser } from "../keptInBrowser";
import { partyRecord } from "../keptRules";
import { PACHISI_STORAGE_KEY } from "./pachisi.constants";

/**
 * THE GAME OF PACHISI KEPT IN THIS BROWSER: its table, seed and moves
 * (`encodePachisi`), written after every move; the pawns and dice are made
 * again from them, so a reload cannot throw anything new (`keptInBrowser.ts`).
 */
const kept = keptInBrowser<PachisiGame>(PACHISI_STORAGE_KEY, encodePachisi, decodePachisi, partyRecord(PARTY_KINDS.pachisi, PACHISI_RULES));

export const useKeptPachisiGame = kept.useKept;
export const adoptKeptPachisiGame = kept.adopt;
