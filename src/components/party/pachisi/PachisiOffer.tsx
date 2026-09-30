"use client";

import { PlayButton } from "@/components/games/PlayButton";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PACHISI_COPY } from "./pachisi.constants";
import { useKeptPachisiGame } from "./pachisiStore";

/**
 * THE PLAY BUTTON on Pachisi's own page and its rules page, under the picture
 * as every game's is (`PlayButton`), leading to the table. It reads Continue
 * while this browser holds a game not yet finished, because the table opens
 * on that game rather than a new one.
 */
export function PachisiOffer({ href }: { href: string }) {
  const hydrated = useHydrated();
  const [game] = useKeptPachisiGame();
  const going = game !== undefined && game !== null && game.phase !== "finished";
  return (
    <div className="flex flex-col" data-testid="party-kind-offer" data-going={going ? "true" : undefined} {...readyMark(hydrated)}>
      <PlayButton href={href} label={going ? PACHISI_COPY.continue : PACHISI_COPY.play} />
    </div>
  );
}
