"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";

import { DICE_WAR_COPY } from "./diceWar.constants";
import { useKeptDiceWarGame } from "./diceWarStore";

/**
 * THE PLAY BUTTON on Dice War's own page and its rules page, under the picture as
 * every game's is: Play, or where this browser holds a game still going,
 * Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function DiceWarOffer({ href }: { href: string }) {
  const [game, keep] = useKeptDiceWarGame();
  const going = game !== undefined && game !== null && game.phase !== "over";
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={DICE_WAR_COPY.play} />;
}
