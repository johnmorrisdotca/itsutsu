"use client";

import { PlayButton } from "@/components/games/PlayButton";
import { TRAIN_PHASES } from "@johnmorrisdotca/domino";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { TRAIN_COPY } from "./party.constants";
import { useKeptTrainGame } from "./trainStore";

/**
 * THE ONE PLAY BUTTON on Mexican Train's own page and its rules page, under
 * the picture as every game's is (`PlayButton`), leading to the table. It
 * reads Continue while this browser holds a game not yet finished, because
 * the table opens on that game rather than a new one.
 */
export function TrainOffer({ href }: { href: string }) {
  const hydrated = useHydrated();
  const [game] = useKeptTrainGame();
  const going = game !== undefined && game !== null && game.phase !== TRAIN_PHASES.finished;
  return (
    <div className="flex flex-col" data-testid="party-kind-offer" data-going={going ? "true" : undefined} {...readyMark(hydrated)}>
      <PlayButton href={href} label={going ? TRAIN_COPY.continue : TRAIN_COPY.play} />
    </div>
  );
}
