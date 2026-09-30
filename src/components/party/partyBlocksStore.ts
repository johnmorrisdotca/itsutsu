"use client";

import { BLOCKS_STATUS, blocksLeaders, decodeBlocksParty, encodeBlocksParty } from "@/lib/gomoku/party/partyBlocks";
import type { PartyBlocksState } from "@/lib/gomoku/party/partyBlocks.types";

import { keptInBrowser } from "./keptInBrowser";
import { PARTY_BLOCKS_STORAGE_KEY } from "./partyBlocks.constants";
import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { tableRecord } from "./keptRules";

/**
 * THE BLOCK FIVE TABLE FOR FOUR KEPT IN THIS BROWSER: one game at a time, as
 * its seating by corner and the pieces laid (`encodeBlocksParty`), under a key
 * of its own, so it and every other table can be going in one browser. How it
 * is kept, and why only here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<PartyBlocksState>(
  PARTY_BLOCKS_STORAGE_KEY,
  encodeBlocksParty,
  decodeBlocksParty,
  tableRecord<PartyBlocksState>(RULE_VARIANTS.blockFive, {
    over: (game) => game.status === BLOCKS_STATUS.over,
    winners: (game) => (game.status === BLOCKS_STATUS.over ? blocksLeaders(game) : []),
    names: (game) => game.players.map((player) => player.name),
  }),
);

/** Write a game down, or forget the kept one; everybody reading it hears. */
export const keepBlocksParty = kept.keep;

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptBlocksParty = kept.useKept;
export const adoptKeptBlocksParty = kept.adopt;
