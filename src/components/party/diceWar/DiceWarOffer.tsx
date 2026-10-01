"use client";

import { PlayButton } from "@/components/games/PlayButton";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { DICE_WAR_COPY } from "./diceWar.constants";
import { useKeptDiceWarGame } from "./diceWarStore";

/**
 * THE PLAY BUTTON on Dice War's own page and its rules page, under the picture
 * as every game's is (`PlayButton`), leading to the table. It reads Continue
 * while this browser holds a game not yet finished, because the table opens on
 * that game rather than a new one.
 */
export function DiceWarOffer({ href }: { href: string }) {
  const hydrated = useHydrated();
  const [game] = useKeptDiceWarGame();
  const going = game !== undefined && game !== null && game.phase !== "over";
  return (
    <div className="flex flex-col" data-testid="party-kind-offer" data-going={going ? "true" : undefined} {...readyMark(hydrated)}>
      <PlayButton href={href} label={going ? DICE_WAR_COPY.continue : DICE_WAR_COPY.play} />
    </div>
  );
}
