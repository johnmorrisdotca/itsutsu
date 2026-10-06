/**
 * readmoves.*: what is said when a pasted list of moves cannot be read (`src/lib/record/readMoves.ts`).
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_READMOVES = {
  "readmoves.unreadable": "Could not read \"{text}\".",
  "readmoves.pass": "That list has a pass in it, which this board cannot take yet.",
  "readmoves.nothing": "Could not read any moves in that. Try a list like H8 K10 J9, or an SGF game.",
  "readmoves.offBoard": "\"{word}\" is not a point on a {size}×{size} board.",
} as const;
