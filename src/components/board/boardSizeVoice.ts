import { BOARD_SIZE_NUMERAL_SCALE, boardSizeWords } from "./Board.constants";
import type { BoardSizeMarkWords } from "./board.types";

/**
 * What a board-size mark says to somebody who cannot see it.
 *
 * One rule for both forms: SILENT WHERE THE SIZE IS IN TEXT BESIDE IT, NAMED
 * WHERE IT IS NOT. The numbered form exists so the text can be dropped, and a
 * number drawn into a picture reaches nobody who is not looking at it — so
 * wherever the text goes, the words move onto the mark.
 *
 * `role="img"` rather than a bare `aria-label` on a span: a label on an element
 * with no role is not something every screen reader reads, and "image" is what
 * this is. As an image its children are presentational, so the numeral inside
 * is not read a second time after the label.
 */
export function boardSizeMarkVoice(
  size: number,
  words: BoardSizeMarkWords,
): { "aria-hidden": "true" } | { role: "img"; "aria-label": string } {
  return words === "beside" ? { "aria-hidden": "true" } : { role: "img", "aria-label": boardSizeWords(size) };
}

/**
 * The numeral's font size, in pixels, for a mark `px` wide.
 *
 * One scale for every size up to two digits, so a 3 and a 19 drawn side by
 * side are set in the same type. A third digit would not fit that scale, so it
 * shrinks to stay inside the board rather than spill over its edge — no board
 * here has one, and a mark overflowing its own frame is the wrong way for that
 * to be discovered.
 */
export function boardSizeNumeralPx(px: number, size: number): number {
  const digits = String(size).length;
  return Math.round(px * BOARD_SIZE_NUMERAL_SCALE * Math.min(1, 2 / digits) * 10) / 10;
}
