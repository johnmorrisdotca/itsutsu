"use client";

import { BLACK, EMPTY, WHITE } from "@/lib/puzzles/blackAndWhite/code";

import { PuzzleBoard } from "./PuzzleBoard";
import { PUZZLE_GRID, PUZZLE_STONE_BLACK, PUZZLE_STONE_CELL, PUZZLE_STONE_PRINTED, PUZZLE_STONE_WHITE } from "./puzzles.constants";

const WORDS: Record<number, string> = { [EMPTY]: "empty", [BLACK]: "black", [WHITE]: "white" };

/**
 * The Black and White grid: white paper ruled into cells, and in each cell a
 * black stone, a white one, or nothing.
 *
 * A printed stone sits on a shaded cell and cannot be pressed, so what the
 * puzzle gave and what the solver put down read apart at a glance. Buttons,
 * as every puzzle's cells are; the grid knows nothing of the answer and
 * reports a press, and `BlackAndWhiteSolve` decides what it means.
 */
export function BlackAndWhiteGrid({
  size,
  givens,
  stones,
  done,
  onPress,
}: {
  size: number;
  givens: readonly number[];
  stones: readonly number[];
  done: boolean;
  onPress: (index: number) => void;
}) {
  return (
    <div className="w-full" data-testid="puzzle-grid" data-size={size} data-done={done ? "true" : "false"}>
      <PuzzleBoard size={size}>
        <div className={PUZZLE_GRID} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
          {stones.map((stone, index) => {
            const row = Math.floor(index / size);
            const col = index % size;
            const printed = givens[index] !== EMPTY;
            return (
              <button
                key={index}
                type="button"
                className={`${PUZZLE_STONE_CELL} ${printed ? PUZZLE_STONE_PRINTED : ""} ${col === 0 ? "border-l-0" : ""} ${row === 0 ? "border-t-0" : ""}`}
                onClick={() => onPress(index)}
                disabled={done || printed}
                aria-label={`row ${row + 1}, column ${col + 1}, ${WORDS[stone]}${printed ? ", printed" : ""}`}
                data-testid="puzzle-cell"
                data-index={index}
                data-given={printed ? "true" : "false"}
                data-stone={WORDS[stone]}
              >
                {stone === BLACK ? <span className={PUZZLE_STONE_BLACK} aria-hidden="true" /> : null}
                {stone === WHITE ? <span className={PUZZLE_STONE_WHITE} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </PuzzleBoard>
    </div>
  );
}
