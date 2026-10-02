"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import { MANCALA_STATUS } from "@/lib/party/mancala/mancala";

import { useKeptMancalaGame } from "./mancalaStore";
import { MANCALA_COPY } from "./party.constants";

/**
 * THE PLAY BUTTON on Mancala's own page and its rules page, under the picture as
 * every game's is: Play, or where this browser holds a game still going,
 * Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function MancalaOffer({ href }: { href: string }) {
  const [game, keep] = useKeptMancalaGame();
  const going = game !== undefined && game !== null && game.status === MANCALA_STATUS.playing;
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={MANCALA_COPY.play} />;
}
