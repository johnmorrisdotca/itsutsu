"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import { gunjinOver } from "@/lib/party/gunjin/gunjin";

import { GUNJIN_COPY } from "./gunjin.constants";
import { useKeptGunjin } from "./gunjinStore";

/**
 * THE PLAY BUTTON on Gunjin's own page and its rules page, under the picture as
 * every game's is: Play, or where this browser holds a game still going,
 * Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function GunjinOffer({ href }: { href: string }) {
  const [game, keep] = useKeptGunjin();
  const going = game !== undefined && game !== null && !gunjinOver(game);
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={GUNJIN_COPY.play} />;
}
