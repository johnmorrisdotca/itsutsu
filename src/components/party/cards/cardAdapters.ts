"use client";

import type { CardGameKind } from "@/lib/cardGames/cardGames.constants";

import type { CardAdapter } from "./cardTable.types";
import { BIG_TWO_ADAPTER, PRESIDENT_ADAPTER } from "./climbAdapters";
import { CRAZY_EIGHTS_ADAPTER } from "./crazyEightsAdapter";
import { GO_FISH_ADAPTER } from "./goFishAdapter";
import { HEARTS_ADAPTER } from "./heartsAdapter";
import { SPADES_ADAPTER } from "./spadesAdapter";

/**
 * EACH CARD GAME'S WAY OF BEING PLAYED AT THE TABLE, by kind. The table
 * (`CardPlay`) is one component for every one; what differs is here. Held as
 * unknown games and moves, because the table never looks inside either: it
 * hands them back to the game's own adapter and rules.
 */
export const CARD_ADAPTERS: Record<CardGameKind, CardAdapter<unknown, unknown>> = {
  hearts: HEARTS_ADAPTER as unknown as CardAdapter<unknown, unknown>,
  bigTwo: BIG_TWO_ADAPTER as unknown as CardAdapter<unknown, unknown>,
  president: PRESIDENT_ADAPTER as unknown as CardAdapter<unknown, unknown>,
  goFish: GO_FISH_ADAPTER as unknown as CardAdapter<unknown, unknown>,
  crazyEights: CRAZY_EIGHTS_ADAPTER as unknown as CardAdapter<unknown, unknown>,
  spades: SPADES_ADAPTER as unknown as CardAdapter<unknown, unknown>,
};

/** A seat's name as the table says it: the one typed, or "Computer 3" or "Player 2". */
export function seatName(players: readonly string[], computers: readonly boolean[], seat: number): string {
  const given = players[seat]?.trim() ?? "";
  if (given !== "") return given;
  return computers[seat] === true ? `Computer ${seat + 1}` : `Player ${seat + 1}`;
}
