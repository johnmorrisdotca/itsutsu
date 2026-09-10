import { startingBoard } from "./rules/creation";
import type { GameSettings, Stone } from "./gomoku.types";

/**
 * Which way round a board is drawn for the person looking at it.
 *
 * Every board game a person has played puts their own men nearest them. This
 * site drew every board the same way round for everybody, so in the games
 * that set pieces out before the first move, one of the two players was
 * always looking at it from behind. John found it in Halma, where the camps
 * are corners and being in the far one is obvious the moment the board
 * appears.
 *
 * It is not a Halma rule and not a table of variants. It is one question —
 * does my colour start on the far side of the board — asked of the starting
 * position itself. Nothing here needs to know that checkers puts black on the
 * first three rows or that Halma mirrors its camps; a variant that ever put
 * white at the top would be right on the day it landed, because the answer
 * comes from the position rather than from a list somebody remembered to
 * update.
 *
 * A game that begins with an empty board has no sides, so it has no opinion:
 * Gomoku, Go and Hex are drawn exactly as they were. So is a board seen by
 * somebody in neither seat — a watcher is not sitting anywhere.
 */

/** The middle row of where `stone` begins, or null when it begins nowhere. */
export function homeRowOf(settings: GameSettings, stone: Stone): number | null {
  const board = startingBoard(settings);
  let total = 0;
  let count = 0;
  board.forEach((cell, index) => {
    if (cell !== stone) return;
    total += Math.floor(index / settings.size);
    count += 1;
  });
  return count === 0 ? null : total / count;
}

/**
 * Whether the board should start turned round for `viewer`: true when their
 * colour begins on the far side.
 *
 * Dead centre is not a side, which is what keeps Reversi still. Its four
 * discs sit two apiece either side of the middle, so both colours average the
 * exact centre row and neither is behind the other.
 */
export function boardStartsFlipped(settings: GameSettings, viewer: Stone | null): boolean {
  if (viewer === null) return false;
  const home = homeRowOf(settings, viewer);
  if (home === null) return false;
  return home < (settings.size - 1) / 2;
}
