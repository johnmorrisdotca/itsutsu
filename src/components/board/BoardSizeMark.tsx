import { BOARD_SIZE_LATTICE, BOARD_SIZE_MARK_CLASS, BOARD_SIZE_NUMERAL_CLASS } from "./Board.constants";
import type { BoardSizeMarkProps } from "./board.types";
/*
 * Not `./boardSizeMark`: on a case-insensitive disk that name and this file's
 * are one path, and `.ts` resolves before `.tsx` — the component imported
 * itself as the helper and came back undefined.
 */
import { boardSizeMarkVoice, boardSizeNumeralPx } from "./boardSizeVoice";

/**
 * A board size as a picture: the lattice at the density its number means, and
 * — in the numbered form — the number itself, large, in the middle of it.
 *
 * THE ONLY PLACE THE LATTICE IS DRAWN. It lived inline in `BoardPicker`; a
 * second form beside it would have been a second copy of the gradient to keep
 * in step, so both forms are one component and differ by the numeral alone.
 *
 * John: "we need a second set of images where we actually put in the number
 * of the size in the middle of that image in a large font… that way if you
 * don't have the size below it in text it is incorporated directly in the
 * image." The last clause is the accessibility rule as well as the design
 * one — see `boardSizeMarkVoice`, and `words`, which the caller must answer.
 *
 * Every board here is square, so density is the only real difference between
 * one size and another, and density is what is drawn. The frame's border is
 * the last line on the right and at the bottom.
 */
export function BoardSizeMark({ size, form, px, words, className = "" }: BoardSizeMarkProps) {
  return (
    <span
      {...boardSizeMarkVoice(size, words)}
      className={className === "" ? BOARD_SIZE_MARK_CLASS : `${BOARD_SIZE_MARK_CLASS} ${className}`}
      style={{
        width: px,
        height: px,
        backgroundImage: BOARD_SIZE_LATTICE,
        backgroundSize: `${100 / size}% ${100 / size}%`,
      }}
      data-testid="board-size-mark"
      data-form={form}
      data-size={size}
    >
      {form === "numbered" ? (
        <span className={BOARD_SIZE_NUMERAL_CLASS} style={{ fontSize: boardSizeNumeralPx(px, size) }}>
          {size}
        </span>
      ) : null}
    </span>
  );
}
