"use client";

import { Paired } from "@/components/i18n/Paired";
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
 * Two repeating gradients rather than a picture or an SVG: no file to fetch,
 * no element per line, and the line count follows the number it is drawn from,
 * so a board size nobody has thought of yet draws itself correctly.
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
  return (
    <fieldset className="flex min-w-0 flex-col gap-2" data-testid="shared-rules-size">
      <legend className="mb-1 text-sm text-ink-soft">Board</legend>
      <div className={PICK_BLOCKS}>
        {sizes.map((size) => {
          const copy = BOARD_SIZE_DISPLAY[size];
          return (
            <label
              key={size}
              className={`${PICK_CARD} min-w-24 flex-1 flex-col justify-center gap-1.5 p-2`}
              data-testid="set-up-size"
              data-size={size}
              data-chosen={size === value ? "true" : "false"}
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
                The board itself, at the density its number means. Decorative:
                the number under it is the same fact in words, and a screen
                reader hearing "grid" and then "nineteen by nineteen" has been
                told one thing twice.
              */}
              <span
                aria-hidden="true"
                className="size-12 shrink-0 rounded-md border border-rule-strong bg-ivory sm:size-14"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, var(--rule-strong) 1px, transparent 1px)," +
                    "linear-gradient(to bottom, var(--rule-strong) 1px, transparent 1px)",
                  backgroundSize: `${100 / size}% ${100 / size}%`,
                }}
              />
              <span className="text-base leading-none font-semibold">
                {size}×{size}
              </span>
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
              <PickMark className="absolute top-1.5 right-1.5" />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
