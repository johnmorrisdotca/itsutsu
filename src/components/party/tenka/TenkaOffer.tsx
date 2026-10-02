"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import { TENKA_PHASES } from "@/lib/party/tenka/tenka.constants";

import { TENKA_COPY } from "./tenka.constants";
import { useKeptTenkaGame } from "./tenkaStore";

/**
 * THE PLAY BUTTON on Tenka's own page and its rules page, under the picture as
 * every game's is: Play, or where this browser holds a game still going,
 * Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function TenkaOffer({ href }: { href: string }) {
  const [game, keep] = useKeptTenkaGame();
  const going = game !== undefined && game !== null && game.phase !== TENKA_PHASES.over;
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={TENKA_COPY.play} />;
}
