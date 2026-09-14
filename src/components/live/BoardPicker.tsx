"use client";

import { BoardSizeMark } from "@/components/board/BoardSizeMark";
import { Paired } from "@/components/i18n/Paired";
import { BOARD_SIZE_DISPLAY } from "@/lib/gomoku/gomoku.constants";

import { PickMark } from "./PickMark";
import { BOARD_BLOCK_MARK_PX, BOARD_ONLY_MARK_PX, PICK_BLOCKS, PICK_CARD } from "./picker.constants";

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
 * drawn, and it carries the size as a numeral in every block — among several
 * boards and on a board that stands alone alike.
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
   * A game with one board is a STATEMENT, not a choice.
   *
   * It is still drawn — the same block, the same number, the same picture of
   * the board at its own density — because the reader is about to play on it
   * and hiding it told them nothing. Fourteen of the thirty-nine games have
   * one board, so this was better than a third of the catalogue saying
   * nothing at all about what it would be played on.
   *
   * What changes is that it stops pretending to be pressable: no pointer and
   * no check mark. A radio group of one cannot be unchecked anyway, so the
   * control was already inert; this only makes it look as inert as it is.
   *
   * Not `disabled`, which would grey it out. Greying says "this is off", and
   * the board is not off — it is the board.
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
               * `flex-1` while there is a choice, so two, three or four
               * blocks share the row evenly. A LONE block does not stretch:
               * filling the panel edge to edge made Reversi's 8×8 read as a
               * banner rather than as one board among the sizes it might
               * have had, and a block four times the width of everybody
               * else's looks like an announcement.
               */
              className={`${PICK_CARD} min-w-24 flex-col justify-center gap-1.5 p-2 ${
                only ? "w-40 cursor-default" : "flex-1 cursor-pointer"
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
                The board itself, at the density its number means, WITH ITS
                NUMBER IN IT — in every block, whether the game offers one
                board or four.

                It used to be drawn into the lone block only, on the argument
                that a number in the picture and the same number printed under
                it says one thing twice. John read the row and did not agree:
                "so the 9x9 board has a white 9 in the middle of the board, so
                that it's even more visible from the outside, and also the icon
                alone tells you the size. I see it's done for some options but
                not consistently for all." The picture is what the eye lands on
                from across the room; the line under it is for reading. So the
                number is in both, and no block is drawn a second way.

                What still differs between the two blocks is the TEXT, and with
                it what a screen reader hears. AMONG SEVERAL, "13×13" sits
                under the picture and names the radio, so the mark is
                decoration (`words="beside"`, aria-hidden) and its numeral is
                not read out a second time. ALONE, the block drops that line,
                so the mark says the size in words itself (`words="none"`) and
                the radio is named by it. John, earlier and still true: "if you
                don't have the size below it in text it is incorporated
                directly in the image."

                The lone mark is bigger by exactly the line it replaces
                (`BOARD_ONLY_MARK_PX`), so a one-board game's panel stays the
                height of a four-board one's and the Start button does not move
                between them.
              */}
              {only ? (
                <BoardSizeMark size={size} px={BOARD_ONLY_MARK_PX} words="none" />
              ) : (
                <>
                  <BoardSizeMark size={size} px={BOARD_BLOCK_MARK_PX} words="beside" />
                  <span className="text-base leading-none font-semibold">
                    {size}×{size}
                  </span>
                </>
              )}
              {/*
                What that board is FOR — "Mini", "Tournament size" — which is
                the part a number alone cannot say to somebody meeting these
                games for the first time.
              */}
              {copy !== undefined ? (
                <span className="text-center text-[0.7rem] leading-none text-muted">
                  <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="opacity-70" />
                </span>
              ) : null}
              {/*
                The check is what says "this one", among several. With one
                block there is no among, so a tick on the only thing in the
                row marks it out from nothing.
              */}
              {only ? null : <PickMark className="absolute top-1.5 right-1.5 size-6" />}
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

        What it was explaining is already said by the thing itself: one block,
        no check mark, no pointer. The board is the fact; "there is nothing to
        choose" is a remark about the control, and the control is making it.
      */}
    </fieldset>
  );
}
