"use client";

import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import { gunjinOver } from "@/lib/party/gunjin/gunjin";

import { useKeptGunjin } from "./gunjinStore";
import { gunjinWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * THE PLAY BUTTON on Gunjin's own page and its rules page, under the picture as
 * every game's is: Play, or where this browser holds a game still going,
 * Continue with a New game beside it that says what it ends
 * (`GameInProgressOffer`).
 */
export function GunjinOffer({ href }: { href: string }) {
  const say = useSpeaker();
  const GUNJIN_COPY = gunjinWords(say.locale);
  const [game, keep] = useKeptGunjin();
  const going = game !== undefined && game !== null && !gunjinOver(game);
  return <GameInProgressOffer href={href} going={going} newGame={{ ends: () => keep(null) }} playLabel={GUNJIN_COPY.play} />;
}
