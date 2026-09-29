"use client";

import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { BLOCKS_STATUS } from "@/lib/gomoku/party/partyBlocks";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PARTY_BLOCKS_COPY } from "./partyBlocks.constants";
import { useKeptBlocksParty } from "./partyBlocksStore";

/**
 * THE WAY TO THE TABLE FOR FOUR, on Block Five's own page: beside Play, which
 * sets up the game for two, as every table offers its own (`PartyOffer`,
 * `PairGoOffer`). And when this browser holds a game still going, the way
 * back to it first.
 */
export function PartyBlocksOffer({ href }: { href: string }) {
  const hydrated = useHydrated();
  const [game] = useKeptBlocksParty();
  const going = game !== undefined && game !== null && game.status === BLOCKS_STATUS.playing;
  return (
    <div className="flex flex-col gap-2" data-testid="blocks-offer" {...readyMark(hydrated)}>
      {going ? (
        <Link href={href} className={`${BUTTON_BASE} ${BUTTON_STRONG} w-full`} data-testid="blocks-resume">
          {PARTY_BLOCKS_COPY.resume} →
        </Link>
      ) : null}
      <Link href={href} className={`${BUTTON_BASE} ${BUTTON_QUIET} w-full`} data-testid="blocks-play">
        {PARTY_BLOCKS_COPY.offer}
      </Link>
    </div>
  );
}
