"use client";

import type { DiceTableKind } from "@/lib/party/diceTable/diceTable.constants";
import type { DiceTableBase } from "@/lib/party/diceTable/diceTable.types";
import type { KeptRecordRules } from "@/lib/party/kept/kept.types";
import { DICE_TABLE_RULES } from "@/lib/party/diceTable/diceTableRules";
import { resignDiceTable } from "@/lib/party/resignTables";

import { keptInBrowser } from "../keptInBrowser";
import { partyRecord } from "../keptRules";

/** Where this browser keeps each plain dice game: one of each at a time, apart from every other table's. */
export const DICE_TABLE_KEYS: Record<DiceTableKind, string> = {
  pig: "itsutsu.pig",
  tenThousand: "itsutsu.tenThousand",
  liarsDice: "itsutsu.liarsDice",
  sayu: "itsutsu.sayu",
};

type Kept = DiceTableBase<unknown>;

/**
 * EACH PLAIN DICE GAME KEPT IN THIS BROWSER, as its table, its seed and its moves,
 * written after every move. The dice are in the moves and the seed, so reading it
 * back throws nothing new. How it is kept, and why only here, is `keptInBrowser.ts`.
 */
function storeOf(kind: DiceTableKind) {
  const rules = DICE_TABLE_RULES[kind] as unknown as { encode: (game: Kept) => string; decode: (text: string | null) => Kept | null; over: (game: Kept) => boolean; winners: (game: Kept) => readonly number[] };
  return keptInBrowser<Kept>(DICE_TABLE_KEYS[kind], rules.encode, rules.decode, partyRecord<Kept>(kind, rules) as KeptRecordRules<Kept>, resignDiceTable);
}

export const DICE_TABLE_STORES: Record<DiceTableKind, ReturnType<typeof storeOf>> = {
  pig: storeOf("pig"),
  tenThousand: storeOf("tenThousand"),
  liarsDice: storeOf("liarsDice"),
  sayu: storeOf("sayu"),
};
