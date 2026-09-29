"use client";

import { PlayButton } from "@/components/games/PlayButton";
import { GHOST_PHASE } from "@/lib/party/superghost/superghost";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { useKeptGhostGame } from "./ghostStore";
import { GHOST_COPY } from "./party.constants";

/**
 * THE ONE PLAY BUTTON on Superghost's own page and its rules page, under the
 * picture as every game's is (`PlayButton`), leading to the table. It reads
 * Continue while this browser holds a game still going, because the table
 * opens on that game rather than a new one.
 */
export function GhostOffer({ href }: { href: string }) {
  const hydrated = useHydrated();
  const [game] = useKeptGhostGame();
  const going = game !== undefined && game !== null && game.phase !== GHOST_PHASE.finished;
  return (
    <div className="flex flex-col" data-testid="party-kind-offer" data-going={going ? "true" : undefined} {...readyMark(hydrated)}>
      <PlayButton href={href} label={going ? GHOST_COPY.continue : GHOST_COPY.play} />
    </div>
  );
}
