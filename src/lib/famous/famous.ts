import { canPass, createGame, mustPass, passTurn, playMove } from "@/lib/gomoku/engine";
import type { GameState, Point } from "@/lib/gomoku/gomoku.types";
import { framesOf } from "@/lib/record/mosaic";
import type { MosaicFrame } from "@/lib/record/mosaic.types";

import { FAMOUS_NOTATIONS } from "./famous.constants";
import type { FamousGame } from "./famous.types";

/**
 * A FAMOUS GAME, REPLAYED BY THIS SITE'S OWN RULES: every position it passed
 * through, from the empty board to the last stone.
 *
 * The record is only trusted this far: every move has to be one the engine
 * accepts, or the whole game is refused with the move that failed. A famous
 * game drawn wrongly would be worse than one not drawn, and a source's typo is
 * exactly the kind of thing that would otherwise reach a picture unnoticed.
 */
export function famousTimeline(game: FamousGame): GameState[] {
  let state = createGame({ variant: game.variant, size: game.size });
  const timeline = [state];
  const tokens = game.moves.split(" ").filter((token) => token !== "");
  tokens.forEach((token, i) => {
    if (token === "--") {
      if (!canPass(state)) throw new Error(`${game.id}: move ${i + 1} is a pass nobody may make`);
      state = passTurn(state);
      timeline.push(state);
      return;
    }
    // Othello records leave a forced pass out: the side with no move simply does not appear.
    if (game.notation === FAMOUS_NOTATIONS.othello && mustPass(state)) {
      state = passTurn(state);
      timeline.push(state);
    }
    const next = playMove(state, pointOf(game, token));
    if (next === state) throw new Error(`${game.id}: move ${i + 1} (${token}) is refused by the rules`);
    state = next;
    timeline.push(state);
  });
  return timeline;
}

/** One move's point, from the family's notation. */
function pointOf(game: FamousGame, token: string): Point {
  const letter = (at: number) => token.charCodeAt(at) - "a".charCodeAt(0);
  if (game.notation === FAMOUS_NOTATIONS.othello) return { row: Number(token.slice(1)) - 1, col: letter(0) };
  return { row: letter(1), col: letter(0) };
}

/**
 * The game's positions as mosaic tiles, each named the way its own record and
 * its own players name it.
 *
 * Go's names already are: this site names a point "Q16", as every Go record
 * does. Othello's are not — Othello counts its rows from the TOP, so the
 * opening move the world knows as f5 is F4 here, and a famous game labelled
 * with names nobody who played it would recognise is the wrong picture. So an
 * Othello tile carries its record's own square. A pass changes no board and
 * gives no tile, so tiles and the record's moves line up one for one.
 */
export function famousFrames(game: FamousGame): MosaicFrame[] {
  const frames = framesOf(famousTimeline(game));
  if (game.notation !== FAMOUS_NOTATIONS.othello) return frames;
  const squares = game.moves.split(" ").filter((token) => token !== "" && token !== "--");
  if (squares.length !== frames.length) return frames;
  return frames.map((frame, i) => ({ ...frame, name: squares[i] }));
}
