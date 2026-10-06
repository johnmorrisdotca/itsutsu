"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";

import { useKeptDiceWarGame } from "./diceWarStore";
import { diceWarScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * THE PLAY BUTTON on Dice War's own page and its rules page, under the picture as
 * every game's is: Play, or where this browser holds a game still going,
 * Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function DiceWarOffer({ href }: { href: string }) {
  const say = useSpeaker();
  const DICE_WAR_COPY = diceWarScreenWords(say.locale);
  const [game, keep] = useKeptDiceWarGame();
  const going = game !== undefined && game !== null && game.phase !== "over";
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={DICE_WAR_COPY.play} />;
}
