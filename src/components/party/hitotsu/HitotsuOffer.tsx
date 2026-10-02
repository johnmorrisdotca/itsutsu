"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";

import { HITOTSU_COPY } from "./hitotsu.constants";
import { useKeptHitotsu } from "./hitotsuStore";

/**
 * THE PLAY BUTTON on Hitotsu's own page and its rules page, under the picture as
 * every game's is: Play, or where this browser holds a game still going,
 * Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function HitotsuOffer({ href }: { href: string }) {
  const [game, keep] = useKeptHitotsu();
  const going = game !== undefined && game !== null && game.phase !== "over";
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={HITOTSU_COPY.playButton} />;
}
