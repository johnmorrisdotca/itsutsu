"use client";

import { PlayButton } from "@/components/games/PlayButton";
import { DOTS_STATUS } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { useKeptDotsGame } from "./dotsStore";
import { DOTS_COPY } from "./party.constants";

/**
 * THE ONE PLAY BUTTON on Dots and Boxes' own page and its rules page, under
 * the picture as every game's is (`PlayButton`), leading to the table. It
 * reads Continue while this browser holds a game still going, because the
 * table opens on that game rather than a new one — the button says where it
 * leads. The set-up, and New game, are the table's own.
 */
export function DotsOffer({ href }: { href: string }) {
  const hydrated = useHydrated();
  const [game] = useKeptDotsGame();
  const going = game !== undefined && game !== null && game.status === DOTS_STATUS.playing;
  return (
    <div className="flex flex-col" data-testid="party-kind-offer" data-going={going ? "true" : undefined} {...readyMark(hydrated)}>
      <PlayButton href={href} label={going ? DOTS_COPY.continue : DOTS_COPY.play} />
    </div>
  );
}
