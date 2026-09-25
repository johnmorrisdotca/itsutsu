"use client";

import type { LetterMark } from "@/lib/puzzles/wordDrop/code";

import { PuzzleBoard } from "./PuzzleBoard";
import { WORD_GRID_BOX, WORD_TILE, WORD_TILE_EMPTY, WORD_TILE_MARK, WORD_TILE_TYPED } from "./puzzles.constants";

const MARK_WORDS: Record<LetterMark, string> = { hit: "in its place", near: "in the word elsewhere", miss: "not in the word" };

/**
 * THE WORDDROP GRID: a row of letter tiles for every guess the word allows,
 * on the wood every puzzle is drawn on (`PuzzleBoard`). Rows already guessed
 * show their marks; the row being typed shows its letters; the rest are empty.
 *
 * The board is square and the grid is not — six rows of five — so the board
 * is drawn at the number of rows and the tiles sit centred across it. Nothing
 * here knows the word: it draws the rows and the marks it is handed.
 */
export function WordDropGrid({
  size,
  rows,
  guesses,
  marks,
  typing,
  done,
}: {
  size: number;
  rows: number;
  guesses: readonly string[];
  marks: readonly (readonly LetterMark[])[];
  typing: string;
  done: boolean;
}) {
  return (
    <div className={WORD_GRID_BOX} data-testid="puzzle-grid" data-size={size} data-done={done ? "true" : "false"}>
      <PuzzleBoard size={rows}>
        <div className="flex h-full w-full items-center justify-center bg-white">
          <div
            className="grid h-full gap-1 p-1"
            style={{ width: `${(size / rows) * 100}%`, gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: rows }, (_, row) => {
              const guessed = guesses[row];
              const letters = guessed ?? (row === guesses.length && !done ? typing : "");
              return Array.from({ length: size }, (_, at) => {
                const letter = letters[at] ?? "";
                const mark = guessed === undefined ? null : marks[row]![at]!;
                const look = mark !== null ? WORD_TILE_MARK[mark] : letter !== "" ? WORD_TILE_TYPED : WORD_TILE_EMPTY;
                return (
                  <div
                    key={`${row}-${at}`}
                    className={`${WORD_TILE} ${look}`}
                    data-testid="word-tile"
                    data-row={row}
                    data-mark={mark ?? (letter === "" ? "empty" : "typed")}
                    aria-label={letter === "" ? "empty" : `${letter.toUpperCase()}${mark === null ? "" : `, ${MARK_WORDS[mark]}`}`}
                  >
                    {letter}
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
