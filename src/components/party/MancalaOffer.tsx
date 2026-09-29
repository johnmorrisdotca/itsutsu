"use client";

import { PlayButton } from "@/components/games/PlayButton";
import { MANCALA_STATUS } from "@/lib/party/mancala/mancala";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { useKeptMancalaGame } from "./mancalaStore";
import { MANCALA_COPY } from "./party.constants";

/**
 * THE ONE PLAY BUTTON on Mancala's own page and its rules page, under the
 * picture as every game's is (`PlayButton`), leading to the table. It reads
 * Continue while this browser holds a game still going, because the table
 * opens on that game rather than a new one. The set-up, and New game, are the
 * table's own.
 */
export function MancalaOffer({ href }: { href: string }) {
  const hydrated = useHydrated();
  const [game] = useKeptMancalaGame();
  const going = game !== undefined && game !== null && game.status === MANCALA_STATUS.playing;
  return (
    <div className="flex flex-col" data-testid="party-kind-offer" data-going={going ? "true" : undefined} {...readyMark(hydrated)}>
      <PlayButton href={href} label={going ? MANCALA_COPY.continue : MANCALA_COPY.play} />
    </div>
  );
}
