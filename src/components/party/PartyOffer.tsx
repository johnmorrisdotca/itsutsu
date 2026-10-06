"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { PARTY_STATUS } from "@/lib/gomoku/party/partyRace";
import type { PartyRaceState } from "@/lib/gomoku/party/partyRace.types";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { RaceVariant } from "@/lib/gomoku/party/partyRace.types";

import type { PartyRaceKind } from "./party.types";
import { raceWords } from "./partyWords";

/**
 * THE WAY TO THE TABLE, on the game's own page: a clear second choice beside
 * Play, which sets up a game for two seats. And when this browser holds a
 * game of this kind still going, the way back to it first — Continue, with a
 * New game under it that says what it ends (`GameInProgressOffer`) — in place
 * of the link, which would only have led back to the same game.
 */
export function PartyOffer<S extends PartyRaceState, C extends number>({ kind, href }: { kind: PartyRaceKind<S, C>; href: string }) {
  const say = useSpeaker();
  const [game, keep] = kind.useKept();
  const going = game !== undefined && game !== null && game.status === PARTY_STATUS.playing;
  return (
    <GameInProgressOffer
      href={href}
      going={going}
      newGame={{ ends: () => keep(null) }}
      testId="party-offer"
      mainTestId="party-resume"
      idle={
        <Link href={href} className={`${BUTTON_BASE} ${BUTTON_QUIET} w-full`} data-testid="party-play">
          {raceWords(say.locale)[kind.variant as RaceVariant].offer}
        </Link>
      }
    />
  );
}
