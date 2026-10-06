import type { GunjinGame } from "@/lib/party/gunjin/gunjin.types";

import type { Speaker } from "@/lib/i18n/i18n";

import { gunjinWords } from "../partyWords";

/**
 * How a seat stands in its row of the table: the pieces it has left on the
 * board, which both sides can count, or that it is still arranging. Apart from
 * `GunjinOnline.tsx` so that the table's list of boards can name it without
 * loading the board, which is the package's drawing (`onlineViews.tsx`).
 */
export function gunjinStanding(game: GunjinGame, seat: number, say: Speaker): string {
  const GUNJIN_COPY = gunjinWords(say.locale);
  if (game.match.phase === "setup") return GUNJIN_COPY.arranging;
  const left = game.match.pieces.filter((piece) => piece.owner === seat).length;
  return GUNJIN_COPY.piecesLeft(left);
}
