/**
 * gomoku.*: the words around a board that come from the rules, not from one game: seats, the obstacle and draw-limit choices, the catalogue's views, and the ways of saying a board's size (`src/lib/gomoku/`). A colour, a size or a family is named by its English label beside its `kanji`.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_GOMOKU = {
  // The two seats, when nobody gave a name
  "gomoku.seatOne": "Player 1",
  "gomoku.seatTwo": "Player 2",
  "gomoku.playerNumber": "Player {number}",
  // The obstacle layouts and the draw limits, with what each does
  "gomoku.obstacleNone": "Every intersection is playable.",
  "gomoku.obstacleHoshi": "The star points are sealed off. Tengen, at the centre, stays open.",
  "gomoku.drawNone": "No limit. The game ends when somebody wins or the board fills.",
  "gomoku.drawHalf": "A draw once half as many moves as the board has points have been played with nobody winning.",
  "gomoku.drawThreeQuarters": "A draw once three quarters as many moves as the board has points have been played with nobody winning.",
  // A hand-picked board, in words
  "gomoku.cells": "{count} cells",
  "gomoku.hexagon": "a hexagon of {count} cells",
  "gomoku.hexagram": "a hexagram of {count} cells",
  "gomoku.squareA": "a {size}×{size} board",
  "gomoku.squareAn": "an {size}×{size} board",
  // How many games a shelf holds, home and guest
  "gomoku.shelfGuests": "{games} from other families",
  "gomoku.shelfBoth": "{games}, and {guests} from other families",
} as const;
