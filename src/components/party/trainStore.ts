"use client";

import { resignTrain } from "@/lib/party/resignTables";
import { decodeTrain, encodeTrain } from "@johnmorrisdotca/domino";
import type { TrainGame } from "@johnmorrisdotca/domino";

import { keptInBrowser } from "./keptInBrowser";
import { TRAIN_STORAGE_KEY } from "./party.constants";
import { MEXICAN_TRAIN_RULES } from "@/lib/party/mexicanTrain/trainRules";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { partyRecord } from "./keptRules";

/**
 * THE GAME OF MEXICAN TRAIN KEPT IN THIS BROWSER: one at a time, as its table,
 * its seed and its moves (`encodeTrain`), written after every move. Hands and
 * trains are never written: a reload deals them again from the seed and
 * replays the moves, so it cannot deal a different hand. How it is kept, and
 * why only here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<TrainGame>(TRAIN_STORAGE_KEY, encodeTrain, decodeTrain, partyRecord(PARTY_KINDS.mexicanTrain, MEXICAN_TRAIN_RULES), resignTrain);

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptTrainGame = kept.useKept;
export const adoptKeptTrainGame = kept.adopt;
