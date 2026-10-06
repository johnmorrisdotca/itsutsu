"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";

import { useKeptPachisiGame } from "./pachisiStore";
import { pachisiWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * THE PLAY BUTTON on Pachisi's own page and its rules page, under the picture as
 * every game's is: Play, or where this browser holds a game still going,
 * Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function PachisiOffer({ href }: { href: string }) {
  const say = useSpeaker();
  const PACHISI_COPY = pachisiWords(say.locale);
  const [game, keep] = useKeptPachisiGame();
  const going = game !== undefined && game !== null && game.phase !== "finished";
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={PACHISI_COPY.play} />;
}
