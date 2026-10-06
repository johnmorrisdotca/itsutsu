/**
 * pieces.*: what the colour choosers say when a colour cannot be taken
 * (`src/lib/pieces/seatColours.ts`, `tableColours.ts`). A colour's own name is the
 * `kanji` beside its English label in `pieceColours.ts`, which a Japanese reader is
 * shown instead.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 */
export const PHRASES_PIECES = {
  "pieces.refusal.free": "{colour} is free.",
  "pieces.seat.same": "The other side already plays in that colour.",
  "pieces.seat.alike": "That colour is too like the other side's pieces to tell apart.",
  "pieces.table.same": "Another player at the table has that colour.",
  "pieces.table.letter": "Another player's marble carries that colour's letter.",
  "pieces.table.alike": "That colour is too like another player's marbles to tell apart.",
} as const;
