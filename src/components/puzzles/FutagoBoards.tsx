"use client";

import type { Appearance } from "@/components/board/board.types";
import type { TypingRow } from "@/lib/puzzles/gomoji/typingRow";
import type { WordStyle } from "@/lib/puzzles/gomoji/wordStyles";

import { GomojiGrid, type CellArrow, type CellMark } from "./GomojiGrid";

/** One of a Futago's boards: the rows it shows, their marks and arrows, and whether its word is found. */
export type FutagoBoard = {
  rows: readonly string[];
  marks: readonly (readonly CellMark[])[];
  arrows?: readonly (readonly CellArrow[])[];
  found: boolean;
};

/**
 * A FUTAGO'S TWO BOARDS, SIDE BY SIDE (`futago.ts`): the same Gomoji grid
 * twice, each half the column's width, as Dordle draws its two. Every guess
 * is written on both until a board's word is found; that board then keeps the
 * guesses that found it, stops taking the row being typed, and says it is
 * found beneath, while the other plays on. Both have every row the level
 * gives, so the two stand level with each other throughout.
 *
 * A YOTSUGO'S FOUR (`yotsugo.ts`) are the same boards two over two, the four
 * quarters of one square, as Quordle draws its four; its keys are split into
 * the same quarters (`FutagoKey`).
 */
export function FutagoBoards({
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
  /** Every row a board has: the guesses, and the kana version's free grey word. */
  rows: number;
  boards: readonly FutagoBoard[];
  free?: number;
  typing: TypingRow;
  /** Whether the puzzle is over, so neither board takes the row being typed. */
  done: boolean;
  style: WordStyle;
  onChoose: (place: number) => void;
  appearance: Appearance;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:gap-3" data-testid="futago-boards" data-boards={boards.length}>
      {boards.map((board, at) => (
        <div key={at} className="flex min-w-0 flex-col gap-1" data-testid="futago-board" data-board={at} data-found={board.found ? "true" : "false"}>
          <GomojiGrid
            size={size}
            rows={rows}
            guesses={board.rows}
            marks={board.marks}
            arrows={board.arrows}
            free={free}
            typing={typing}
            done={done || board.found}
            style={style}
            onChoose={onChoose}
            appearance={appearance}
          />
          <p className="min-h-4 text-center text-xs text-muted" aria-live="polite" data-testid="futago-board-state">
            {board.found ? `✓ Found in ${board.rows.length - free}` : " "}
          </p>
        </div>
      ))}
    </div>
  );
}
