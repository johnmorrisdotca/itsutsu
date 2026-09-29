"use client";

import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PAIR_GO_COPY } from "./pairGo.constants";
import { useKeptPairGo } from "./pairGoStore";

/**
 * THE WAY TO PAIR GO, on Go's own page: beside Play, which sets up a game
 * between two seats, and the practice board. And when this browser holds a
 * Pair Go game still going, the way back to it first, as Chinese Checkers'
 * table offers its own (`PartyOffer`).
 */
export function PairGoOffer({ href }: { href: string }) {
  const hydrated = useHydrated();
  const [game] = useKeptPairGo();
  const going = game !== undefined && game !== null && game.state.status === GAME_STATUS.playing;
  return (
    <div className="flex flex-col gap-2" data-testid="pairgo-offer" {...readyMark(hydrated)}>
      {going ? (
        <Link href={href} className={`${BUTTON_BASE} ${BUTTON_STRONG} w-full`} data-testid="pairgo-resume">
          {PAIR_GO_COPY.resume} →
        </Link>
      ) : null}
      <Link href={href} className={`${BUTTON_BASE} ${BUTTON_QUIET} w-full`} data-testid="pairgo-play">
        {PAIR_GO_COPY.offer}
      </Link>
    </div>
  );
}
