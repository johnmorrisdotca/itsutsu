"use client";

import { BOARD_FRAME, LABEL_GUTTER } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import type { TypingRow } from "@/lib/puzzles/gomoji/typingRow";
import type { WordStyle } from "@/lib/puzzles/gomoji/wordStyles";
import { YOTSUGO_ACROSS } from "@/lib/puzzles/gomoji/layout";

import type { FutagoBoard } from "./FutagoBoards";
import { GomojiGrid } from "./GomojiGrid";

/**
 * A YOTSUGO'S FOUR QUARTERS (`yotsugo.ts`): two Gomoji boards, one over the
 * other, each holding two words side by side, the first and second words on
 * the upper board and the third and fourth on the lower. Each board is the
 * same `GomojiGrid` one word is drawn on, square as every board is, with a
 * play area for each of its two words and the play area's heavy border
 * dividing them, as a Twist Five board's heavier lines divide its quarters.
 *
 * Every guess is written in every quarter until the quarter's word is found;
 * that quarter then keeps the guesses that found it, stops taking the row
 * being typed, and says it is found beneath, while the others play on. All
 * four have every row the level gives, so they stand level throughout.
 */
export function YotsugoBoards({
  size,
  rows,
  boards,
  free = 0,
  typing,
  done,
  style,
  onChoose,
  appearance,
}: {
  size: number;
  /** Every row a quarter has: the guesses, and the kana version's free grey word. */
  rows: number;
  /** The four words' boards, in the order they are drawn. */
  boards: readonly FutagoBoard[];
  free?: number;
  typing: TypingRow;
  /** Whether the puzzle is over, so no quarter takes the row being typed. */
  done: boolean;
  style: WordStyle;
  onChoose: (place: number) => void;
  appearance: Appearance;
}) {
  const pairs = Array.from({ length: Math.ceil(boards.length / YOTSUGO_ACROSS) }, (_, pair) => pair * YOTSUGO_ACROSS);
  return (
    <div className="flex flex-col gap-1" data-testid="yotsugo-boards">
      {pairs.map((first) => {
        const two = boards.slice(first, first + YOTSUGO_ACROSS);
        return (
          <div key={first} className="flex flex-col gap-0.5" data-testid="yotsugo-pair">
            <GomojiGrid
              size={size}
              rows={rows}
              parts={two.map((board, at) => ({ at: first + at, guesses: board.rows, marks: board.marks, arrows: board.arrows, done: done || board.found, found: board.found }))}
              free={free}
              typing={typing}
              done={done}
              style={style}
              onChoose={onChoose}
              appearance={appearance}
            />
            {/* Under each quarter, level with it: past the row numbers on the left, short of the frame on the right. */}
            <div className="grid grid-cols-2" style={{ paddingLeft: LABEL_GUTTER, paddingRight: BOARD_FRAME }}>
              {two.map((board, at) => (
                <p
                  key={first + at}
                  className="min-h-4 text-center text-xs text-muted"
                  aria-live="polite"
                  data-testid="yotsugo-quarter-state"
                  data-part={first + at}
                  data-found={board.found ? "true" : "false"}
                >
                  {board.found ? `✓ Found in ${board.rows.length - free}` : " "}
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
