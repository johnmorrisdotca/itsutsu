"use client";

import { BOARD_FRAME, LABEL_GUTTER } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { WORDS_A_BOARD } from "@/lib/puzzles/gomoji/layout";
import type { TypingRow } from "@/lib/puzzles/gomoji/typingRow";
import { asWordCount } from "@/lib/puzzles/gomoji/wordsSeed";
import type { WordStyle } from "@/lib/puzzles/gomoji/wordStyles";

import type { WordBoard } from "./gomojiGrid.types";
import { GomojiGrid } from "./GomojiGrid";

/**
 * SEVERAL WORDS, TWO TO A BOARD: a Futago's two on one board (`futago.ts`), a
 * Yotsugo's four on two, one over the other (`yotsugo.ts`), the first and
 * second words on the upper board and the third and fourth on the lower. Each
 * board is the same `GomojiGrid` one word is drawn on, exactly as wide as its
 * two words with no wood either side, each word in a play area of its own and
 * the play areas' heavy borders dividing them, as a Twist Five board's
 * heavier lines divide its quarters.
 *
 * A Futago used to draw two whole boards side by side, each eight or more
 * squares wide for a five-letter word, so on a phone its squares were fifteen
 * pixels and its letters spilled out of them. John, 2026-09-28: "our [two-word
 * Gomoji] is bad. So small. It's hard to see". On one board of the words'
 * own width its squares are twice the size, and both words are in view.
 *
 * Every guess is written on every word's part until its word is found; that
 * part then keeps the guesses that found it, stops taking the row being typed,
 * and says it is found beneath, while the others play on.
 */
export function WordBoards({
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
  /** Every row a word has: the guesses, and the kana version's free grey word. */
  rows: number;
  /** The words' boards, in the order they are drawn. */
  boards: readonly WordBoard[];
  free?: number;
  typing: TypingRow;
  /** Whether the puzzle is over, so no word takes the row being typed. */
  done: boolean;
  style: WordStyle;
  onChoose: (place: number) => void;
  appearance: Appearance;
}) {
  const words = asWordCount(boards.length);
  const firsts = Array.from({ length: Math.ceil(boards.length / WORDS_A_BOARD) }, (_, pair) => pair * WORDS_A_BOARD);
  return (
    <div className="flex flex-col gap-1" data-testid="word-boards" data-words={words}>
      {firsts.map((first) => {
        const two = boards.slice(first, first + WORDS_A_BOARD);
        return (
          <div key={first} className="flex flex-col gap-0.5" data-testid="word-board-pair">
            <GomojiGrid
              size={size}
              rows={rows}
              words={words}
              parts={two.map((board, at) => ({ at: first + at, guesses: board.rows, marks: board.marks, arrows: board.arrows, done: done || board.found, found: board.found, reveal: board.reveal }))}
              free={free}
              typing={typing}
              done={done}
              style={style}
              onChoose={onChoose}
              appearance={appearance}
            />
            {/* Under each word, level with it: past the row numbers on the left, short of the frame on the right. */}
            <div className="grid grid-cols-2" style={{ paddingLeft: LABEL_GUTTER, paddingRight: BOARD_FRAME }}>
              {two.map((board, at) => (
                <p
                  key={first + at}
                  className="min-h-4 text-center text-xs text-muted"
                  aria-live="polite"
                  data-testid="word-part-state"
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
