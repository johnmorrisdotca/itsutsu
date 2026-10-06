"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import { YACHT_PHASES } from "@/lib/party/yacht/yacht";

import { useKeptYachtGame } from "./yachtStore";
import { yachtWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * THE PLAY BUTTON on Yacht's own page and its rules page, under the picture as
 * every game's is: Play, or where this browser holds a game still going,
 * Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function YachtOffer({ href }: { href: string }) {
  const say = useSpeaker();
  const YACHT_COPY = yachtWords(say.locale);
  const [game, keep] = useKeptYachtGame();
  const going = game !== undefined && game !== null && game.phase !== YACHT_PHASES.finished;
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={YACHT_COPY.play} />;
}
