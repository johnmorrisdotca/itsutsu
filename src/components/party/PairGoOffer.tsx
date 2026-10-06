"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";

import { useKeptPairGo } from "./pairGoStore";
import { pairGoWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * THE WAY TO PAIR GO'S TABLE, on the game's own page: a second way on, beside
 * Play. While this browser holds a game still going it is Continue, with a New
 * game under it that says what it ends (`GameInProgressOffer`).
 */
export function PairGoOffer({ href }: { href: string }) {
  const say = useSpeaker();
  const PAIR_GO_COPY = pairGoWords(say.locale);
  const [game, keep] = useKeptPairGo();
  const going = game !== undefined && game !== null && game.state.status === GAME_STATUS.playing;
  return (
    <GameInProgressOffer
      href={href}
      going={going}
      newGame={{ ends: () => keep(null) }}
      testId="pairgo-offer"
      mainTestId="pairgo-resume"
      idle={
        <Link href={href} className={`${BUTTON_BASE} ${BUTTON_QUIET} w-full`} data-testid="pairgo-play">
          {PAIR_GO_COPY.offer}
        </Link>
      }
    />
  );
}
