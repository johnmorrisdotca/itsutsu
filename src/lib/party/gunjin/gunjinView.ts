// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { PlayerView } from "@johnmorrisdotca/gunjin";
import { legalMovesForCurrentPlayer, viewForPlayer } from "@johnmorrisdotca/gunjin/views";

import { gunjinOver } from "./gunjin";
import type { GunjinGame, GunjinSquare } from "./gunjin.types";

/**
 * WHAT A PLAYER MAY SEE OF A GAME: the engine's own redacted view, and nothing
 * else a table draws from. It shows the player their own ranks and the other
 * side as backs, and during a hand-over, no board at all. It is the only way
 * from a game to a screen, so a table that draws from it cannot show a rank
 * it should not.
 */
export type GunjinSeatView = {
  view: PlayerView;
  /** Every move the viewer may make now, for the squares to light: none unless it is their turn and the board is up. */
  legal: readonly { from: GunjinSquare; to: GunjinSquare }[];
};

/** One seat's view of a game. */
export function gunjinSeatView(game: GunjinGame, seat: 0 | 1): GunjinSeatView {
  const { match } = game;
  return { view: viewForPlayer(match, seat), legal: gunjinOver(game) ? [] : legalMovesForCurrentPlayer(match, seat) };
}

/**
 * THE FINISHED BOARD WITH EVERY PIECE SHOWN, for the end of a game: nothing is
 * hidden once it is over, and a player wants to see how the other side was
 * set out. Refuses (null) a game still going, so it cannot be used to look.
 */
export function gunjinFinalView(game: GunjinGame): PlayerView | null {
  if (!gunjinOver(game)) return null;
  const own = viewForPlayer(game.match, 0);
  return { ...own, pieces: game.match.pieces.map((piece) => ({ x: piece.x, y: piece.y, owner: piece.owner, kind: piece.kind, hidden: false, id: piece.id })) };
}
