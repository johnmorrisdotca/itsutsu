"use client";

import { PuzzleBoard } from "./PuzzleBoard";
import { PUZZLE_GRID, REGION_FILLS } from "./puzzles.constants";

/** What a cell holds while solving: nothing, a stone, or a cross marking it ruled out. */
export type StoneMark = "" | "stone" | "cross";

/**
 * The Hidden Stones grid: every cell coloured by its region, the region's
 * edges drawn heavier, and in each cell what the solver has put there — a
 * black stone, a cross, or nothing.
 *
 * Buttons, as the number grid's cells are, so a cell is a thing a finger
 * presses and a screen reader can name. The grid knows nothing of the
 * answer: it draws the regions and the marks it is handed and reports a
 * press; `HiddenStonesSolve` decides what a press means.
 */
export function HiddenStonesGrid({
  size,
  regions,
  marks,
  done,
  onPress,
}: {
  size: number;
  regions: readonly number[];
  marks: readonly StoneMark[];
  done: boolean;
  onPress: (index: number) => void;
}) {
  return (
    <div className="w-full" data-testid="puzzle-grid" data-size={size} data-done={done ? "true" : "false"}>
      <PuzzleBoard size={size}>
      <div className={PUZZLE_GRID} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {regions.map((region, index) => {
          const row = Math.floor(index / size);
          const col = index % size;
          const mark = marks[index];
          // A heavier rule where the region changes: on the left and the top, so every edge is drawn once.
          const edges = [
            col > 0 && regions[index - 1] !== region ? "border-l-2 border-l-ink" : "border-l border-l-rule",
            row > 0 && regions[index - size] !== region ? "border-t-2 border-t-ink" : "border-t border-t-rule",
          ].join(" ");
          return (
            <button
              key={index}
              type="button"
              className={`relative flex aspect-square items-center justify-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-moss ${edges} ${col === 0 ? "border-l-0" : ""} ${row === 0 ? "border-t-0" : ""}`}
              style={{ backgroundColor: REGION_FILLS[region % REGION_FILLS.length] }}
              onClick={() => onPress(index)}
              disabled={done}
              aria-label={`row ${row + 1}, column ${col + 1}, region ${region + 1}${mark === "" ? "" : `, ${mark}`}`}
              data-testid="puzzle-cell"
              data-index={index}
              data-region={region}
              data-mark={mark}
            >
              {mark === "stone" ? (
                <span className="block size-[62%] rounded-full bg-ink shadow-[inset_0_-2px_3px_rgba(255,255,255,0.18)]" aria-hidden="true" />
              ) : mark === "cross" ? (
                <span className="text-2xl leading-none text-ink-soft sm:text-3xl" aria-hidden="true">
                  ×
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
