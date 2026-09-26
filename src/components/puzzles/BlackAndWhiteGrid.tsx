"use client";

import { DEFAULT_APPEARANCE, STONE_SETS } from "@/components/board/Board.constants";
import { StoneMark } from "@/components/board/StoneMark";
import type { StoneSetTokens } from "@/components/board/board.types";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import { BLACK, EMPTY, WHITE } from "@/lib/puzzles/blackAndWhite/code";

import { PuzzleBoard } from "./PuzzleBoard";
import { PUZZLE_CELL_WRONG, PUZZLE_GRID, PUZZLE_STONE_BOX, PUZZLE_STONE_CELL, PUZZLE_STONE_PRINTED } from "./puzzles.constants";

const WORDS: Record<number, string> = { [EMPTY]: "empty", [BLACK]: "black", [WHITE]: "white" };

/**
 * The Black and White grid: white paper ruled into cells, and in each cell a
 * black stone, a white one, or nothing — the game boards' own stones
 * (`StoneMark`), in the reader's stone set.
 *
 * A printed stone sits on a shaded cell and cannot be pressed, so what the
 * puzzle gave and what the solver put down read apart at a glance. Buttons,
 * as every puzzle's cells are; the grid knows nothing of the answer and
 * reports a press, and `BlackAndWhiteSolve` decides what it means.
 */
/** No cell marked: the default, one set rather than a new one each render. */
const NO_CELLS: ReadonlySet<number> = new Set();

export function BlackAndWhiteGrid({
  size,
  givens,
  stones,
  done,
  onPress,
  wrong = NO_CELLS,
  set = STONE_SETS[DEFAULT_APPEARANCE.stoneSet],
}: {
  size: number;
  givens: readonly number[];
  stones: readonly number[];
  done: boolean;
  /** The cells Hint marked wrong (`useHints`); none by default. */
  wrong?: ReadonlySet<number>;
  /** The stones to draw with: the reader's own set, as their game boards draw it; the site's by default. */
  set?: StoneSetTokens;
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
                className={`${PUZZLE_STONE_CELL} ${printed ? PUZZLE_STONE_PRINTED : ""} ${col === 0 ? "border-l-0" : ""} ${row === 0 ? "border-t-0" : ""} ${wrong.has(index) ? PUZZLE_CELL_WRONG : ""}`}
                data-wrong={wrong.has(index) ? "true" : undefined}
                onClick={() => onPress(index)}
                disabled={done || printed}
                aria-label={`row ${row + 1}, column ${col + 1}, ${WORDS[stone]}${printed ? ", printed" : ""}`}
                data-testid="puzzle-cell"
                data-index={index}
                data-given={printed ? "true" : "false"}
                data-stone={WORDS[stone]}
              >
                {stone === BLACK || stone === WHITE ? (
                  <span className={PUZZLE_STONE_BOX} aria-hidden="true">
                    <StoneMark stone={stone === BLACK ? STONES.black : STONES.white} stones={set} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </PuzzleBoard>
    </div>
  );
}
