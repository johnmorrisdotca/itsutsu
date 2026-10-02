"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { BLOCKS_STATUS } from "@/lib/gomoku/party/partyBlocks";

import { PARTY_BLOCKS_COPY } from "./partyBlocks.constants";
import { useKeptBlocksParty } from "./partyBlocksStore";

/**
 * THE WAY TO BLOCK FIVE FOR FOUR, on the game's own page: a second way on,
 * beside Play. While this browser holds a game still going it is Continue,
 * with a New game under it that says what it ends (`GameInProgressOffer`).
 */
export function PartyBlocksOffer({ href }: { href: string }) {
  const [game, keep] = useKeptBlocksParty();
  const going = game !== undefined && game !== null && game.status === BLOCKS_STATUS.playing;
  return (
    <GameInProgressOffer
      href={href}
      going={going}
      newGame={{ ends: () => keep(null) }}
      testId="blocks-offer"
      mainTestId="blocks-resume"
      idle={
        <Link href={href} className={`${BUTTON_BASE} ${BUTTON_QUIET} w-full`} data-testid="blocks-play">
          {PARTY_BLOCKS_COPY.offer}
        </Link>
      }
    />
  );
}
