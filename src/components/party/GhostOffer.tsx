"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import { GHOST_PHASE } from "@/lib/party/superghost/superghost";

import { useKeptGhostGame } from "./ghostStore";
import { ghostWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * THE PLAY BUTTON on Superghost's own page and its rules page, under the picture as
 * every game's is: Play, or where this browser holds a game still going,
 * Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function GhostOffer({ href }: { href: string }) {
  const say = useSpeaker();
  const GHOST_COPY = ghostWords(say.locale);
  const [game, keep] = useKeptGhostGame();
  const going = game !== undefined && game !== null && game.phase !== GHOST_PHASE.finished;
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={GHOST_COPY.play} />;
}
