"use client";

import { PlayButton } from "@/components/games/PlayButton";
import { YACHT_PHASES } from "@/lib/party/yacht/yacht";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { YACHT_COPY } from "./yacht.constants";
import { useKeptYachtGame } from "./yachtStore";

/**
 * THE PLAY BUTTON on Yacht's own page and its rules page, under the picture
 * as every game's is (`PlayButton`), leading to the table. It reads Continue
 * while this browser holds a game not yet finished, because the table opens
 * on that game rather than a new one.
 */
export function YachtOffer({ href }: { href: string }) {
  const hydrated = useHydrated();
  const [game] = useKeptYachtGame();
  const going = game !== undefined && game !== null && game.phase !== YACHT_PHASES.finished;
  return (
    <div className="flex flex-col" data-testid="party-kind-offer" data-going={going ? "true" : undefined} {...readyMark(hydrated)}>
      <PlayButton href={href} label={going ? YACHT_COPY.continue : YACHT_COPY.play} />
    </div>
  );
}
