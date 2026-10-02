"use client";

import { resignRace } from "@/lib/party/resignTables";
import { decodePartyGame, encodePartyGame } from "@/lib/gomoku/party/partyCheckers";
import type { PartyCheckersState } from "@/lib/gomoku/party/partyCheckers.types";

import { keptInBrowser } from "./keptInBrowser";
import { PARTY_STORAGE_KEY } from "./party.constants";
import { PARTY_STATUS } from "@/lib/gomoku/party/partyRace";
import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { tableRecord } from "./keptRules";

/**
 * THE CHINESE CHECKERS TABLE KEPT IN THIS BROWSER: one game at a time, as its
 * seating and its moves (`encodePartyGame`). How it is kept, and why only
 * here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<PartyCheckersState>(
  PARTY_STORAGE_KEY,
  encodePartyGame,
  decodePartyGame,
  tableRecord<PartyCheckersState>(RULE_VARIANTS.chineseCheckers, {
    over: (game) => game.status !== PARTY_STATUS.playing,
    winners: (game) => (game.status === PARTY_STATUS.won && game.winner !== null ? [game.winner] : []),
    names: (game) => game.players.map((player) => player.name),
  }),
  resignRace,
);

/** Write a game down, or forget the kept one; everybody reading it hears. */
export const keepPartyGame = kept.keep;

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptPartyGame = kept.useKept;
export const adoptKeptPartyGame = kept.adopt;
