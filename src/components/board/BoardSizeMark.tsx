import { pictureBox } from "@/components/games/picture";

import { BOARD_SIZE_LATTICE, BOARD_SIZE_MARK_CLASS, BOARD_SIZE_NUMERAL_CLASS } from "./Board.constants";
import type { BoardSizeMarkProps } from "./board.types";
/*
 * Not `./boardSizeMark`: on a case-insensitive disk that name and this file's
 * are one path, and `.ts` resolves before `.tsx` — the component imported
 * itself as the helper and came back undefined.
 */
import { boardSizeMarkVoice, boardSizeNumeralPx } from "./boardSizeVoice";

/**
 * A board size as a picture: the lattice at the density its number means, with
 * the number itself set large in the middle of it.
 *
 * THE ONLY PLACE A BOARD SIZE IS DRAWN, AND IT IS DRAWN ONE WAY. It lived
 * inline in `BoardPicker`; a second drawing beside it would have been a second
 * copy of the gradient to keep in step. `OpeningMark` borrows that gradient to
 * draw an opening on the chosen board, which is a different fact with stones
 * on it rather than a second board-size mark — `boardSizeMark.test.ts` lists
 * it as the one file that may, with the reason.
 *
 * John asked for the number in the picture — "if you don't have the size below
 * it in text it is incorporated directly in the image" — and it shipped as a
 * `form` prop: numbered where a board stood alone, plain among several. That
 * is what he came back to: "I thought I already asked for the 9x9, 15x15 etc
 * board images to also have a set with the Number directly centered in the
 * board… so that it's even more visible from the outside, and also the icon
 * alone tells you the size. I see it's done for some options but not
 * consistently for all."
 *
 * So the choice is gone rather than defaulted. A mark carries its size
 * wherever it is drawn, and no caller can ask for one that does not — which
 * is the only version of "consistently for all" a component can guarantee.
 *
 * What a caller still answers is `words`: whether the size is in TEXT beside
 * the mark. That is a fact about their layout, not about the drawing, and it
 * decides what a screen reader hears — see `boardSizeMarkVoice`.
 *
 * Every board here is square, so density is the only real difference between
 * one size and another, and density is what is drawn behind the number. The
 * frame's border is the last line on the right and at the bottom.
 *
 * `side` is the board; `size` is the picture, one of the site's three — regular
 * in the set-up block, large on the doorstep, twice it. The block's 70px is the
 * size John chose for every picture on the site.
 */
export function BoardSizeMark({ side, size, words, className = "" }: BoardSizeMarkProps) {
  const box = pictureBox(size);
  return (
    <span
      {...boardSizeMarkVoice(side, words)}
      className={className === "" ? BOARD_SIZE_MARK_CLASS : `${BOARD_SIZE_MARK_CLASS} ${className}`}
      style={{
        ...box,
        backgroundImage: BOARD_SIZE_LATTICE,
        backgroundSize: `${100 / side}% ${100 / side}%`,
      }}
      data-testid="board-size-mark"
      data-size={side}
      data-picture={size}
    >
      <span className={BOARD_SIZE_NUMERAL_CLASS} style={{ fontSize: boardSizeNumeralPx(box.width, side) }}>
        {side}
      </span>
    </span>
  );
}
