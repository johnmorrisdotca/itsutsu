"use client";

import { SUGOROKU_KIND_LIST, sugorokuStorageKey, type SugorokuKind } from "@/lib/party/sugoroku/sugoroku.constants";
import { SUGOROKU_RULES } from "@/lib/party/sugoroku/sugorokuRules";
import type { SugorokuTable } from "@/lib/party/sugoroku/sugoroku.types";
import { decodeSugoroku, encodeSugoroku } from "@/lib/party/sugoroku/sugorokuTable";

import { keptInBrowser } from "../keptInBrowser";
import { partyRecord } from "../keptRules";

/**
 * THE GAME OF EACH OF THE SEVEN KEPT IN THIS BROWSER: one at a time per game,
 * as its seats and its record (`encodeSugoroku`), written after every move.
 * The dice are the record's seed, so reading it back throws nothing again.
 * How it is kept, and why only here, is `keptInBrowser.ts`.
 */
const STORES = Object.fromEntries(
  SUGOROKU_KIND_LIST.map((kind) => [kind, keptInBrowser<SugorokuTable>(sugorokuStorageKey(kind), encodeSugoroku, decodeSugoroku, partyRecord(kind, SUGOROKU_RULES[kind]))]),
) as Record<SugorokuKind, ReturnType<typeof keptInBrowser<SugorokuTable>>>;

/** The kept game of this kind (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export function useKeptSugoroku(kind: SugorokuKind) {
  return STORES[kind].useKept();
}

/** Every store's way of opening a filed game in this browser, for My games' history. */
export const adoptKeptSugoroku = Object.fromEntries(SUGOROKU_KIND_LIST.map((kind) => [kind, STORES[kind].adopt])) as Record<SugorokuKind, (text: string, id: string) => boolean>;
