"use client";

import { decodeHalmaParty, encodeHalmaParty } from "@/lib/gomoku/party/partyHalma";
import type { PartyHalmaState } from "@/lib/gomoku/party/partyHalma.types";

import { keptInBrowser } from "./keptInBrowser";
import { PARTY_HALMA_STORAGE_KEY } from "./party.constants";
import { PARTY_STATUS } from "@/lib/gomoku/party/partyRace";
import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { tableRecord } from "./keptRules";

/**
 * THE HALMA TABLE KEPT IN THIS BROWSER: one game at a time, as its seating by
 * corner and its moves (`encodeHalmaParty`), under a key of its own, so a
 * Halma table and a Chinese Checkers table can both be going in one browser.
 * How it is kept, and why only here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<PartyHalmaState>(
  PARTY_HALMA_STORAGE_KEY,
  encodeHalmaParty,
  decodeHalmaParty,
  tableRecord<PartyHalmaState>(RULE_VARIANTS.halma, {
    over: (game) => game.status !== PARTY_STATUS.playing,
    winners: (game) => (game.status === PARTY_STATUS.won && game.winner !== null ? [game.winner] : []),
    names: (game) => game.players.map((player) => player.name),
  }),
);

/** Write a game down, or forget the kept one; everybody reading it hears. */
export const keepHalmaParty = kept.keep;

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptHalmaParty = kept.useKept;
export const adoptKeptHalmaParty = kept.adopt;
