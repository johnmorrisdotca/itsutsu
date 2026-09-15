"use client";

import { BoardSizeMark } from "@/components/board/BoardSizeMark";
import { OneName } from "@/components/i18n/OneName";
import { BOARD_SIZE_DISPLAY } from "@/lib/gomoku/gomoku.constants";

import { PickMark } from "./PickMark";
import { PICK_BLOCKS, PICK_CARD } from "./picker.constants";

/**
 * The board, as big blocks in a row. John: "for the board sizes, make it more
 * visual! Big blocks lined up with the numbers."
 *
 * THE BLOCK DRAWS THE BOARD, not only its number. A 9×9 and a 19×19 in
 * identical blocks with different digits teach nothing that the digits did
 * not already say; the same blocks with visibly coarser and finer grids say
 * what the number MEANS, which is how much board there is to play on. Every
 * board here is square, so the proportion is always one to one and density is
 * the only real difference between them — so density is what is drawn.
 *
 * The picture is `BoardSizeMark`, which is the one place a board size is
 * drawn, and it carries the size as a big numeral in every block.
 *
 * The blocks sit in a row and wrap only if they must — there are at most four
 * of them — because a stack of four is a list and John asked for a row.
 */
export function BoardPicker({
  value,
  sizes,
  onChange,
  disabled = false,
}: {
  /** The chosen board, as the length of one side. */
  value: number;
  /**
   * The boards THIS game is played on, not every board the site knows. The
   * caller reads `boardSizesFor`, which is what stopped a Reversi game being
   * offered a 19×19 it cannot be played on.
   */
  sizes: readonly number[];
  onChange: (size: number) => void;
  disabled?: boolean;
}) {
  /*
   * A GAME WITH ONE BOARD IS DRAWN AS A CHOSEN BOARD, because that is what it
   * is. Fourteen of the thirty-nine games have one board, and it is drawn —
   * the same block, the same picture at its own density — because the reader
   * is about to play on it and hiding it told them nothing.
   *
   * It used to be drawn with no pointer and no check mark, on the argument
   * that a radio group of one is inert and should look it. John, with
   * Checkers' single 8×8 beside Go's checked 19×19, read that as a board
   * nobody had chosen: "if there is only one board, it should be checked...
   * like boards with > 1 game type." He is right: the chosen style and the
   * check are what say "this is the one", and a sole board is the one. So a
   * sole option is drawn exactly as a chosen option among several — one
   * design, on this picker, the opening picker and the game picker alike —
   * and its radio is checked, so it is announced as chosen too.
   *
   * Not `disabled`, which would grey it out. Greying says "this is off", and
   * the board is not off — it is the board.
   *
   * `only` decides the block's WIDTH and says `data-only`, and nothing else.
   * What is inside the block is the same for one board and for four — see
   * below, and `boardSizeMark.coverage.test.ts`, which holds it there.
   */
  const only = sizes.length === 1;
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5" data-testid="shared-rules-size">
      <legend className="mb-0.5 text-sm text-ink-soft">Board</legend>
      <div className={PICK_BLOCKS}>
        {sizes.map((size) => {
          const copy = BOARD_SIZE_DISPLAY[size];
          return (
            <label
              key={size}
              /*
               * While there is a choice, the grid's equal columns share the
               * row between two, three or four blocks (`PICK_BLOCKS`). A LONE
               * block does not stretch: filling the panel edge to edge made
               * Reversi's 8×8 read as a banner rather than as one board among
               * the sizes it might have had, and a block four times the width
               * of everybody else's looks like an announcement. A fixed width
               * in its one column keeps it the size of a block.
               */
              className={`${PICK_CARD} min-w-24 cursor-pointer flex-col justify-center gap-1.5 p-2 ${
                only ? "w-40" : ""
              }`}
              data-testid="set-up-size"
              data-size={size}
              data-chosen={size === value ? "true" : "false"}
              data-only={only ? "true" : "false"}
            >
              <input
                type="radio"
                name="set-up-size"
                value={size}
                checked={size === value}
                disabled={disabled}
                onChange={() => onChange(size)}
                className="peer sr-only"
              />
              {/*
                EVERY BLOCK IS DRAWN THE WAY CHECKERS' LONE BLOCK WAS: the
                board with its number set big in the middle of it, then what
                that board is called ("Eight 八路"), then the check. No
                "8×8" line under the picture — in a game with one board or a
                game with four.

                It was two drawings. A lone board got the big numbered mark
                and its name; a board among several got a smaller mark, a
                "13×13" line and its name. John saw the two side by side and
                asked why the size sat under the icon in some places and not
                others; the first answer put the line under every block, and
                he came back: "Remember I don't want the 9x9 size under every
                board... i want consistency. Like checkers, just the big
                number now. easier to read"

                So the number in the picture IS the size, for everyone who can
                see it, and the mark says it in words for everyone who cannot
                (`words="none"`: an image named "8 by 8 board"). That name is
                the first thing in the label, so the radio is announced with
                the size once, then the board's name — and nothing printed
                beside it says the size a second time.

                The regular picture size, so every block is the same height by
                construction and the Start button does not move from one game
                to the next. This block's 70px is the size John chose for every
                picture on the site.
              */}
              <BoardSizeMark side={size} size="regular" words="none" />
              {/*
                What that board is FOR — "Mini", "Tournament size" — which is
                the part a number alone cannot say to somebody meeting these
                games for the first time. Every size a game is played on has
                one; the coverage test says so, so no block quietly goes
                without. One language on one line, as every label under a
                picture is: "Eight", not "Eight 八路".
              */}
              {copy !== undefined ? (
                <span className="text-center text-[0.7rem] leading-none text-muted" data-testid="set-up-size-name">
                  <OneName en={copy.label} kanji={copy.kanji} />
                </span>
              ) : null}
              {/*
                THE CHECK, ALONE OR AMONG SEVERAL. It used to be dropped from a
                lone block, on the argument that a tick on the only thing in
                the row marks it out from nothing — and John, with Checkers'
                one 8×8 beside Go's checked 19×19, read exactly that: a sole
                board that looked unchosen. "if there is only one board, it
                should be checked... like boards with > 1 game type." A sole
                option is drawn as a chosen option is, one design, and its
                radio is checked the same way, so it is announced the same way.
              */}
              <PickMark className="absolute top-1.5 right-1.5 size-6" />
            </label>
          );
        })}
      </div>
      {/*
        NO LINE SAYING "this game is played on one board", and it was written
        and then taken out again for a reason worth keeping.

        It cost twenty pixels, and twenty pixels is what made a one-board game
        taller than a four-board one — so the Start button sat at a different
        height on Reversi than on Gomoku, and the fold was a different number
        for fourteen of the thirty-nine games. Every game now has the same
        panel, which is both a better property and easier to keep.

        What it was explaining is already said by the thing itself: one
        block, checked. The board is the fact; "there is nothing to choose" is
        a remark about the control, and the control is making it.
      */}
    </fieldset>
  );
}
