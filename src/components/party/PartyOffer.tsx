"use client";

import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { PARTY_STATUS } from "@/lib/gomoku/party/partyRace";
import type { PartyRaceState } from "@/lib/gomoku/party/partyRace.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PARTY_COPY } from "./party.constants";
import type { PartyRaceKind } from "./party.types";

/**
 * THE WAY TO THE TABLE, on the game's own page: a clear second choice beside
 * Play, which sets up a game for two seats. And when this browser holds a
 * game of this kind still going, the way back to it first — the reader who
 * put the phone down half way through should not have to know where it was
 * kept.
 */
export function PartyOffer<S extends PartyRaceState, C extends number>({ kind, href }: { kind: PartyRaceKind<S, C>; href: string }) {
  const hydrated = useHydrated();
  const [game] = kind.useKept();
  const going = game !== undefined && game !== null && game.status === PARTY_STATUS.playing;
  return (
    <div className="flex flex-col gap-2" data-testid="party-offer" {...readyMark(hydrated)}>
      {going ? (
        <Link href={href} className={`${BUTTON_BASE} ${BUTTON_STRONG} w-full`} data-testid="party-resume">
          {PARTY_COPY.resume} →
        </Link>
      ) : null}
      <Link href={href} className={`${BUTTON_BASE} ${BUTTON_QUIET} w-full`} data-testid="party-play">
        {kind.copy.offer}
      </Link>
    </div>
  );
}
