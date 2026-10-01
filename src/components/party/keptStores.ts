"use client";

import { CARD_GAME_LIST, type CardGameKind } from "@/lib/cardGames/cardGames.constants";

/**
 * EVERY STORE ON ONE DEVICE, by the game it keeps, as the page that opens a
 * game from the history asks for it (`KeptOpen`): the way to make a filed game
 * this browser's game again. Each is loaded only when asked, so opening one
 * game from the history does not bring every game's rules into the page.
 */
type Adopt = (text: string, id: string) => boolean;

const STORES: Record<string, () => Promise<Adopt>> = {
  dotsAndBoxes: async () => (await import("./dotsStore")).adoptKeptDotsGame,
  superghost: async () => (await import("./ghostStore")).adoptKeptGhostGame,
  mancala: async () => (await import("./mancalaStore")).adoptKeptMancalaGame,
  tenka: async () => (await import("./tenka/tenkaStore")).adoptKeptTenkaGame,
  mexicanTrain: async () => (await import("./trainStore")).adoptKeptTrainGame,
  yacht: async () => (await import("./yacht/yachtStore")).adoptKeptYachtGame,
  pachisi: async () => (await import("./pachisi/pachisiStore")).adoptKeptPachisiGame,
  // Korokoro's rules are fetched by a browser only (`typeof window`), the way a word list is: a kept game is opened in the browser, and the pages' server function does not carry the dice package for it.
  diceWar: async () => {
    if (typeof window !== "undefined") {
      return (await import("./diceWar/diceWarStore")).adoptKeptDiceWarGame;
    }
    throw new Error("A kept game is opened in the browser");
  },
  chineseCheckers: async () => (await import("./partyCheckersStore")).adoptKeptPartyGame,
  halma: async () => (await import("./partyHalmaStore")).adoptKeptHalmaParty,
  blockFive: async () => (await import("./partyBlocksStore")).adoptKeptBlocksParty,
  go: async () => (await import("./pairGoStore")).adoptKeptPairGo,
  ...Object.fromEntries(
    CARD_GAME_LIST.map((kind: CardGameKind) => [kind, async () => (await import("./cards/cardTableStores")).CARD_TABLE_STORES[kind].adopt] as const),
  ),
};

/** The way to open a filed game of this kind in this browser, or null for a game no store here keeps. */
export async function adopterFor(game: string): Promise<Adopt | null> {
  const load = STORES[game];
  return load === undefined ? null : load();
}
