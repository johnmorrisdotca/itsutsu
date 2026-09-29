"use client";

import { PlayButton } from "@/components/games/PlayButton";
import { TENKA_PHASES } from "@/lib/party/tenka/tenka.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { TENKA_COPY } from "./tenka.constants";
import { useKeptTenkaGame } from "./tenkaStore";

/**
 * THE ONE PLAY BUTTON on Tenka's own page and its rules page, under the
 * picture as every game's is (`PlayButton`), leading to the table. It reads
 * Continue while this browser holds a game still going, because the table
 * opens on that game rather than a new one. The set-up, and New game, are
 * the table's own.
 */
export function TenkaOffer({ href }: { href: string }) {
  const hydrated = useHydrated();
  const [game] = useKeptTenkaGame();
  const going = game !== undefined && game !== null && game.phase !== TENKA_PHASES.over;
  return (
    <div className="flex flex-col" data-testid="party-kind-offer" data-going={going ? "true" : undefined} {...readyMark(hydrated)}>
      <PlayButton href={href} label={going ? TENKA_COPY.continue : TENKA_COPY.play} />
    </div>
  );
}
