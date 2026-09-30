"use client";

import type { CardGameKind } from "@/lib/cardGames/cardGames.constants";
import { CARD_GAME_RULES } from "@/lib/cardGames/cardGameRules";

import { keptInBrowser } from "../keptInBrowser";
import { CARD_TABLE_KEYS } from "./cardTable.constants";
import type { KeptRecordRules } from "@/lib/party/kept/kept.types";
import { partyRecord } from "../keptRules";

/**
 * EACH CARD GAME KEPT IN THIS BROWSER, one of each at a time, as its table,
 * its seed and its moves (`cardGameCodec`), written after every move. Read
 * back, the moves are played again from the seed, so a reload deals nothing
 * new and shows nobody a hand they had not seen. How, and why only here, is
 * `keptInBrowser.ts`.
 */
function storeOf<K extends CardGameKind>(kind: K) {
  const rules = CARD_GAME_RULES[kind];
  const kept = partyRecord(kind, rules as unknown as { over: (game: { players: readonly string[] }) => boolean; winners: (game: { players: readonly string[] }) => readonly number[] });
  return keptInBrowser(
    CARD_TABLE_KEYS[kind],
    rules.encode as (game: unknown) => string,
    rules.decode as (text: string | null) => unknown,
    // Every card game's state carries its seats (`CardSeats`): the names and which a computer plays.
    kept as unknown as KeptRecordRules<unknown>,
  );
}

export const CARD_TABLE_STORES: Record<CardGameKind, ReturnType<typeof storeOf>> = {
  hearts: storeOf("hearts"),
  bigTwo: storeOf("bigTwo"),
  president: storeOf("president"),
  goFish: storeOf("goFish"),
  crazyEights: storeOf("crazyEights"),
  spades: storeOf("spades"),
  ginRummy: storeOf("ginRummy"),
  euchre: storeOf("euchre"),
};

/** A new seed for a new game, from the browser's own random: every deal of the game is shuffled from it. */
export function freshCardSeed(): number {
  const one = new Uint32Array(1);
  window.crypto.getRandomValues(one);
  return one[0] % 2_147_483_647;
}
