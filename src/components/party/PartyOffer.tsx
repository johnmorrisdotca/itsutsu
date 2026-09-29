"use client";

import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { PARTY_STATUS } from "@/lib/gomoku/party/partyCheckers";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PARTY_COPY } from "./party.constants";
import { useKeptPartyGame } from "./partyCheckersStore";

/**
 * THE WAY TO THE TABLE, on the game's own page: a clear second choice beside
 * Play, which sets up a game for two seats. And when this browser holds a
 * game still going, the way back to it first — the reader who put the phone
 * down half way through should not have to know where it was kept.
 */
export function PartyOffer({ href }: { href: string }) {
  const hydrated = useHydrated();
  const [game] = useKeptPartyGame();
  const going = game !== undefined && game !== null && game.status === PARTY_STATUS.playing;
  return (
    <div className="flex flex-col gap-2" data-testid="party-offer" {...readyMark(hydrated)}>
      {going ? (
        <Link href={href} className={`${BUTTON_BASE} ${BUTTON_STRONG} w-full`} data-testid="party-resume">
          {PARTY_COPY.resume} →
        </Link>
      ) : null}
      <Link href={href} className={`${BUTTON_BASE} ${BUTTON_QUIET} w-full`} data-testid="party-play">
        {PARTY_COPY.offer}
      </Link>
    </div>
  );
}
