"use client";

import { PlayButton } from "@/components/games/PlayButton";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { HITOTSU_COPY } from "./hitotsu.constants";
import { useKeptHitotsu } from "./hitotsuStore";

/**
 * THE ONE PLAY BUTTON on Hitotsu's own page and its rules page, leading to
 * the table. It reads Continue while this browser holds a game not yet
 * finished, because the table opens on that game rather than a new one.
 */
export function HitotsuOffer({ href }: { href: string }) {
  const hydrated = useHydrated();
  const [game] = useKeptHitotsu();
  const going = game !== undefined && game !== null && game.phase !== "over";
  return (
    <div className="flex flex-col" data-testid="party-kind-offer" data-going={going ? "true" : undefined} {...readyMark(hydrated)}>
      <PlayButton href={href} label={going ? HITOTSU_COPY.continue : HITOTSU_COPY.playButton} />
    </div>
  );
}
