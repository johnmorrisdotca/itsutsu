"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import type { CardGameKind } from "@/lib/cardGames/cardGames.constants";
import { CARD_GAME_RULES } from "@/lib/cardGames/cardGameRules";

import { CARD_TABLE_COPY } from "./cardTable.constants";
import { CARD_TABLE_STORES } from "./cardTableStores";

/**
 * THE PLAY BUTTON on a card game's own page and its rules page, under the
 * picture as every game's is: Play, or where this browser holds a game not yet
 * finished, Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function CardGameOffer({ kind, href }: { kind: CardGameKind; href: string }) {
  const [game, keep] = CARD_TABLE_STORES[kind].useKept();
  const going = game !== undefined && game !== null && !CARD_GAME_RULES[kind].over(game as never);
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={CARD_TABLE_COPY.play} />;
}
