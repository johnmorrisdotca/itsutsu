"use client";

import { decodeTrain, encodeTrain } from "@/lib/party/mexicanTrain/trainCodec";
import type { TrainGame } from "@/lib/party/mexicanTrain/mexicanTrain.types";

import { keptInBrowser } from "./keptInBrowser";
import { TRAIN_STORAGE_KEY } from "./party.constants";

/**
 * THE GAME OF MEXICAN TRAIN KEPT IN THIS BROWSER: one at a time, as its table,
 * its seed and its moves (`encodeTrain`), written after every move. Hands and
 * trains are never written: a reload deals them again from the seed and
 * replays the moves, so it cannot deal a different hand. How it is kept, and
 * why only here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<TrainGame>(TRAIN_STORAGE_KEY, encodeTrain, decodeTrain);

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptTrainGame = kept.useKept;
