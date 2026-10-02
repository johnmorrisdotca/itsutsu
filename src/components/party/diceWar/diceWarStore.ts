"use client";

import { resignDiceWar } from "@/lib/party/resignTables";
import { decodeDiceWar, encodeDiceWar, type DiceWarGame } from "@johnmorrisdotca/korokoro";

import { PARTY_KINDS } from "@/lib/party/party.constants";
import { DICE_WAR_RULES } from "@/lib/party/diceWar/diceWarRules";

import { keptInBrowser } from "../keptInBrowser";
import { partyRecord } from "../keptRules";
import { DICE_WAR_STORAGE_KEY } from "./diceWar.constants";

/**
 * THE GAME OF DICE WAR KEPT IN THIS BROWSER: one at a time, as its table, its
 * seed and its moves (`encodeDiceWar`), written after every throw. The dice are
 * in the moves, so reading it back replays the game exactly and throws nothing
 * new. How it is kept, and why only here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<DiceWarGame>(DICE_WAR_STORAGE_KEY, encodeDiceWar, decodeDiceWar, partyRecord(PARTY_KINDS.diceWar, DICE_WAR_RULES), resignDiceWar);

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptDiceWarGame = kept.useKept;
export const adoptKeptDiceWarGame = kept.adopt;
