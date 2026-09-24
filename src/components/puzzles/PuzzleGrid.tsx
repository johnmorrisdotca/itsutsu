"use client";

import { NUMBER_PLACE_BOXES } from "@/lib/puzzles/numberPlace/boxes";

import { PUZZLE_CELL, PUZZLE_CELL_GIVEN, PUZZLE_CELL_SELECTED, PUZZLE_GRID } from "./puzzles.constants";

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
  size,
  givens,
  entries,
  selected,
  done,
  onSelect,
}: {
  size: number;
  givens: readonly number[];
  entries: readonly number[];
  selected: number | null;
  done: boolean;
  onSelect: (index: number) => void;
}) {
  const boxes = NUMBER_PLACE_BOXES[size];
  return (
    <div className="aspect-square w-full" data-testid="puzzle-grid" data-size={size} data-done={done ? "true" : "false"}>
      <div className={PUZZLE_GRID} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {givens.map((given, index) => {
          const row = Math.floor(index / size);
          const col = index % size;
          const value = given !== 0 ? given : entries[index];
          const isGiven = given !== 0;
          const edges = [
            col % boxes.cols === 0 && col !== 0 ? "border-l-2 border-l-ink" : "",
            row % boxes.rows === 0 && row !== 0 ? "border-t-2 border-t-ink" : "",
          ].join(" ");
          return (
            <button
              key={index}
              type="button"
              className={`${PUZZLE_CELL} ${isGiven ? PUZZLE_CELL_GIVEN : ""} ${selected === index ? PUZZLE_CELL_SELECTED : ""} ${edges}`}
              onClick={() => onSelect(index)}
              disabled={done}
              aria-label={`row ${row + 1}, column ${col + 1}, ${value === 0 ? "empty" : value}${isGiven ? ", given" : ""}`}
              aria-pressed={selected === index}
              data-testid="puzzle-cell"
              data-index={index}
              data-given={isGiven ? "true" : "false"}
              data-value={value === 0 ? "" : String(value)}
            >
              {value === 0 ? "" : value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
