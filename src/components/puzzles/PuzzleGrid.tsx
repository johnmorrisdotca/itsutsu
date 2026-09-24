"use client";

import { PuzzleBoard } from "./PuzzleBoard";
import type { Mark } from "@/lib/puzzles/moreOrLess/code";
import { boxedLayout } from "@/lib/puzzles/numberPlace/layout";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import {
  PUZZLE_CELL,
  PUZZLE_CELL_DIAGONAL,
  PUZZLE_CELL_GIVEN,
  PUZZLE_CELL_SELECTED,
  PUZZLE_GRID,
  PUZZLE_MARK_BELOW,
  PUZZLE_MARK_RIGHT,
} from "./puzzles.constants";

/**
 * The Number Place grid: a square of cells, the boxes drawn in heavier rules.
 *
 * Buttons rather than a table, so a cell is a thing a finger presses and a
 * screen reader can name ("row 3, column 5, 7"). A given is set in the face
 * the printed grid would use and cannot be pressed into; an entry is lighter
 * and can. Nothing here knows the answer: the grid draws what it is handed
 * and reports a press, and `PuzzlePlay` decides what a press means.
 *
 * The cells sit inside an `aspect-square` frame, which is what the phone
 * spec reads as "a board": nine cells across 390 pixels cannot each be a
 * fingertip, and the number keys under the grid are what a finger presses
 * to fill one.
 */
export function PuzzleGrid({
  kind,
  size,
  givens,
  entries,
  marks = [],
  regions = null,
  selected,
  done,
  onSelect,
}: {
  kind: PuzzleKind;
  size: number;
  givens: readonly number[];
  entries: readonly number[];
  /** More or Less: which of two neighbouring cells is bigger, drawn between them. */
  marks?: readonly Mark[];
  /** Jigsaw: the region of every cell, which the heavy rules are drawn around. */
  regions?: readonly number[] | null;
  selected: number | null;
  done: boolean;
  onSelect: (index: number) => void;
}) {
  /*
   * Where the heavy rules go: between two cells of different regions — a
   * Number Place or Diagonal box, or a Jigsaw's own shapes. One rule draws
   * both, so a box and an irregular region look alike. More or Less is a
   * plain square with marks between its cells, and Diagonal shades its two
   * diagonals.
   */
  const region = regions ?? (kind === "numberPlace" || kind === "diagonal" ? boxedLayout(size).region : null);
  const shadeDiagonals = kind === "diagonal";
  /* A mark sits on the edge after its lower-indexed cell: to the right for a
     horizontal one, below for a vertical one, pointing at the smaller number. */
  const rightOf = new Map<number, string>();
  const below = new Map<number, string>();
  for (const mark of marks) {
    const low = Math.min(mark.less, mark.more);
    if (Math.max(mark.less, mark.more) === low + 1) rightOf.set(low, mark.less === low ? "<" : ">");
    else below.set(low, mark.less === low ? "∧" : "∨");
  }
  return (
    <div className="w-full" data-testid="puzzle-grid" data-size={size} data-done={done ? "true" : "false"}>
      <PuzzleBoard size={size}>
      <div className={PUZZLE_GRID} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {givens.map((given, index) => {
          const row = Math.floor(index / size);
          const col = index % size;
          const value = given !== 0 ? given : entries[index];
          const isGiven = given !== 0;
          const edges =
            region === null
              ? ""
              : [
                  col !== 0 && region[index] !== region[index - 1] ? "border-l-2 border-l-ink" : "",
                  row !== 0 && region[index] !== region[index - size] ? "border-t-2 border-t-ink" : "",
                ].join(" ");
          const onDiagonal = shadeDiagonals && (row === col || row + col === size - 1);
          return (
            <button
              key={index}
              type="button"
              className={`relative ${PUZZLE_CELL} ${isGiven ? PUZZLE_CELL_GIVEN : ""} ${onDiagonal ? PUZZLE_CELL_DIAGONAL : ""} ${selected === index ? PUZZLE_CELL_SELECTED : ""} ${edges}`}
              onClick={() => onSelect(index)}
              disabled={done}
              aria-label={`row ${row + 1}, column ${col + 1}, ${value === 0 ? "empty" : value}${isGiven ? ", given" : ""}`}
              aria-pressed={selected === index}
              data-testid="puzzle-cell"
              data-index={index}
              data-given={isGiven ? "true" : "false"}
              data-value={value === 0 ? "" : String(value)}
              data-region={region === null ? undefined : region[index]}
              data-diagonal={onDiagonal ? "true" : undefined}
            >
              {value === 0 ? "" : value}
              {rightOf.has(index) ? (
                <span className={PUZZLE_MARK_RIGHT} aria-hidden="true" data-testid="puzzle-mark">
                  {rightOf.get(index)}
                </span>
              ) : null}
              {below.has(index) ? (
                <span className={PUZZLE_MARK_BELOW} aria-hidden="true" data-testid="puzzle-mark">
                  {below.get(index)}
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
