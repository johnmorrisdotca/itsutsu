"use client";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { LetterMark } from "@/lib/puzzles/wordDrop/code";
import { WORD_STYLES, type WordStyle } from "@/lib/puzzles/wordDrop/wordStyles";

import { PuzzleBoard } from "./PuzzleBoard";
import {
  WORD_GRID_BOX,
  WORD_STONE,
  WORD_STONE_LOOK,
  WORD_STONE_SIZE,
  WORD_TILE,
  WORD_TILE_EMPTY,
  WORD_TILE_MARK,
  WORD_TILE_TYPED,
} from "./puzzles.constants";

const MARK_WORDS: Record<LetterMark, string> = { hit: "in its place", near: "in the word elsewhere", miss: "not in the word" };

/**
 * THE WORDDROP GRID: a row for every guess the word allows, on the wood every
 * puzzle is drawn on (`PuzzleBoard`). Rows already guessed show their marks;
 * the row being typed shows its letters; the rest are empty.
 *
 * Drawn in the style the player chose (`wordStyles.ts`): Othello discs in
 * squares ruled on the wood, Gomoku stones on the crossings, or letter tiles
 * on white paper. Every style carries the same letters, marks and words.
 *
 * The board is square and the grid is not — six rows of five — so the board
 * is drawn at the number of rows and the grid sits centred across it. Nothing
 * here knows the word: it draws the rows and the marks it is handed.
 */
export function WordDropGrid({
  size,
  rows,
  guesses,
  marks,
  typing,
  done,
  style,
}: {
  size: number;
  rows: number;
  guesses: readonly string[];
  marks: readonly (readonly LetterMark[])[];
  typing: string;
  done: boolean;
  style: WordStyle;
}) {
  const tiles = style === WORD_STYLES.tiles;
  return (
    <div className={WORD_GRID_BOX} data-testid="puzzle-grid" data-size={size} data-style={style} data-done={done ? "true" : "false"}>
      <PuzzleBoard size={rows}>
        <div className={`flex h-full w-full items-center justify-center ${tiles ? "bg-white" : ""}`}>
          <div
            className={`relative grid h-full ${tiles ? "gap-1 p-1" : ""}`}
            style={{ width: `${(size / rows) * 100}%`, gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
          >
            {tiles ? null : <GridLines size={size} rows={rows} style={style} />}
            {Array.from({ length: rows }, (_, row) => {
              const guessed = guesses[row];
              const letters = guessed ?? (row === guesses.length && !done ? typing : "");
              return Array.from({ length: size }, (_, at) => {
                const letter = letters[at] ?? "";
                const mark = guessed === undefined ? null : marks[row]![at]!;
                const label = letter === "" ? "empty" : `${letter.toUpperCase()}${mark === null ? "" : `, ${MARK_WORDS[mark]}`}`;
                const said = { "data-testid": "word-tile", "data-row": row, "data-mark": mark ?? (letter === "" ? "empty" : "typed"), "aria-label": label };
                if (tiles) {
                  const look = mark !== null ? WORD_TILE_MARK[mark] : letter !== "" ? WORD_TILE_TYPED : WORD_TILE_EMPTY;
                  return (
                    <div key={`${row}-${at}`} className={`${WORD_TILE} ${look}`} {...said}>
                      {letter}
                    </div>
                  );
                }
                return (
                  <div key={`${row}-${at}`} className="relative flex items-center justify-center" {...said}>
                    {letter === "" ? null : (
                      <span className={`${WORD_STONE} ${WORD_STONE_SIZE[style]}`} style={WORD_STONE_LOOK[mark ?? "typed"]} aria-hidden="true">
                        {letter}
                      </span>
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      </PuzzleBoard>
    </div>
  );
}

/**
 * The lines on the wood, in the board's own ink: an Othello board's squares
 * (every cell ruled, the edge included), or a Gomoku board's lines through the
 * middle of every cell, where its stones sit on the crossings.
 */
function GridLines({ size, rows, style }: { size: number; rows: number; style: WordStyle }) {
  const ink = BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme].line;
  const othello = style === WORD_STYLES.othello;
  const at = othello ? 0 : 0.5;
  const across = Array.from({ length: othello ? rows + 1 : rows }, (_, row) => row + at);
  const down = Array.from({ length: othello ? size + 1 : size }, (_, col) => col + at);
  return (
    <svg viewBox={`0 0 ${size} ${rows}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" data-testid="word-lines">
      {across.map((y) => (
        <line key={`y${y}`} x1={at} y1={y} x2={size - at} y2={y} stroke={ink} strokeWidth={othello ? 2 : 1.25} vectorEffect="non-scaling-stroke" />
      ))}
      {down.map((x) => (
        <line key={`x${x}`} x1={x} y1={at} x2={x} y2={rows - at} stroke={ink} strokeWidth={othello ? 2 : 1.25} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
