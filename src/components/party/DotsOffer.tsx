"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import { DOTS_STATUS } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";

import { useKeptDotsGame } from "./dotsStore";
import { DOTS_COPY } from "./party.constants";

/**
 * THE PLAY BUTTON on Dots and Boxes's own page and its rules page, under the picture as
 * every game's is: Play, or where this browser holds a game still going,
 * Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function DotsOffer({ href }: { href: string }) {
  const [game, keep] = useKeptDotsGame();
  const going = game !== undefined && game !== null && game.status === DOTS_STATUS.playing;
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={DOTS_COPY.play} />;
}
