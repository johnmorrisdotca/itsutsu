"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import { TRAIN_PHASES } from "@johnmorrisdotca/domino";

import { TRAIN_COPY } from "./party.constants";
import { useKeptTrainGame } from "./trainStore";

/**
 * THE PLAY BUTTON on Mexican Train's own page and its rules page, under the picture as
 * every game's is: Play, or where this browser holds a game still going,
 * Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function TrainOffer({ href }: { href: string }) {
  const [game, keep] = useKeptTrainGame();
  const going = game !== undefined && game !== null && game.phase !== TRAIN_PHASES.finished;
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={TRAIN_COPY.play} />;
}
