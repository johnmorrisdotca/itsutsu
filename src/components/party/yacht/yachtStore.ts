"use client";

import { resignYacht } from "@/lib/party/resignTables";
import { decodeYacht, encodeYacht } from "@/lib/party/yacht/yachtCodec";
import type { YachtGame } from "@/lib/party/yacht/yacht.types";

import { PARTY_KINDS } from "@/lib/party/party.constants";
import { YACHT_RULES } from "@/lib/party/yacht/yachtRules";

import { keptInBrowser } from "../keptInBrowser";
import { partyRecord } from "../keptRules";
import { YACHT_STORAGE_KEY } from "./yacht.constants";

/**
 * THE GAME OF YACHT KEPT IN THIS BROWSER: one at a time, as its table, its
 * seed and its moves (`encodeYacht`), written after every move. The dice are
 * never written: a reload throws them again from the seed and replays the
 * moves, so it cannot throw anything new. How it is kept, and why only here,
 * is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<YachtGame>(YACHT_STORAGE_KEY, encodeYacht, decodeYacht, partyRecord(PARTY_KINDS.yacht, YACHT_RULES), resignYacht);

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptYachtGame = kept.useKept;
export const adoptKeptYachtGame = kept.adopt;
