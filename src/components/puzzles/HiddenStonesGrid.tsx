"use client";

import { DEFAULT_APPEARANCE, STONE_SETS } from "@/components/board/Board.constants";
// The board's stone, named apart from this grid's own `StoneMark` (what a cell holds).
import { StoneMark as BoardStone } from "@/components/board/StoneMark";
import type { StoneSetTokens } from "@/components/board/board.types";
import { STONES } from "@/lib/gomoku/gomoku.constants";

import { PuzzleBoard } from "./PuzzleBoard";
import {
  PUZZLE_CELL_WRONG,
  PUZZLE_GRID,
  PUZZLE_STONE_BOX,
  REGION_FILLS,
  STONE_LINE_COLOUR,
  STONE_LINE_GAP,
  STONE_LINES,
} from "./puzzles.constants";

/** What a cell holds while solving: nothing, a stone, or a cross marking it ruled out. */
export type StoneMark = "" | "stone" | "cross";

/**
 * The Hidden Stones grid: every cell coloured by its region, the region's
 * edges drawn heavier, and in each cell what the solver has put there — a
 * black stone (the game boards' own, `StoneMark`), a cross, or nothing.
 *
 * Buttons, as the number grid's cells are, so a cell is a thing a finger
 * presses and a screen reader can name. The grid knows nothing of the
 * answer: it draws the regions and the marks it is handed and reports a
 * press; `HiddenStonesSolve` decides what a press means.
 *
 * With `lines`, each stone also draws a line to the board's edge in all four
 * directions (`StoneLines`): a picture over the grid, and nothing a press can
 * reach.
 */
/** No cell marked: the default, one set rather than a new one each render. */
const NO_CELLS: ReadonlySet<number> = new Set();

export function HiddenStonesGrid({
  size,
  regions,
  marks,
  done,
  onPress,
  wrong = NO_CELLS,
  lines = false,
  set = STONE_SETS[DEFAULT_APPEARANCE.stoneSet],
}: {
  size: number;
  regions: readonly number[];
  marks: readonly StoneMark[];
  done: boolean;
  /** The cells Hint marked wrong (`useHints`); none by default. */
  wrong?: ReadonlySet<number>;
  /** Whether each stone draws its row and column (the Lines help); off by default. */
  lines?: boolean;
  /** The stones to draw with: the reader's own set, as their game boards draw it; the site's by default. */
  set?: StoneSetTokens;
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
              className={`relative flex aspect-square items-center justify-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-moss ${edges} ${col === 0 ? "border-l-0" : ""} ${row === 0 ? "border-t-0" : ""} ${wrong.has(index) ? PUZZLE_CELL_WRONG : ""}`}
              data-wrong={wrong.has(index) ? "true" : undefined}
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
                <span className={PUZZLE_STONE_BOX} aria-hidden="true">
                  <BoardStone stone={STONES.black} stones={set} />
                </span>
              ) : mark === "cross" ? (
                <span className="text-2xl leading-none text-ink-soft sm:text-3xl" aria-hidden="true">
                  ×
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {lines ? <StoneLines size={size} marks={marks} /> : null}
      </PuzzleBoard>
    </div>
  );
}

/**
 * LINES, FROM EVERY STONE TO THE EDGE. John, 2026-09-26: "When toggled on, we
 * show lasers (or lines) from each stone in all 4 directions, thus revealing
 * all the places where contact with other tiles will be made." Each line
 * starts just outside its own stone, so the stone stays whole; where it runs
 * over another stone, that stone shares a row or column with it, which is
 * the thing the line is there to show. One unit a cell, and two pixels wide
 * at any size (`non-scaling-stroke`), so a 4×4 and a 12×12 draw the same line.
 */
function StoneLines({ size, marks }: { size: number; marks: readonly StoneMark[] }) {
  const stones = marks.flatMap((mark, index) => (mark === "stone" ? [index] : []));
  return (
    <svg viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="none" className={STONE_LINES} aria-hidden="true" data-testid="stone-lines" data-stones={stones.length}>
      {stones.map((index) => {
        const x = (index % size) + 0.5;
        const y = Math.floor(index / size) + 0.5;
        const reach = [
          { x1: x, y1: y - STONE_LINE_GAP, x2: x, y2: 0 },
          { x1: x, y1: y + STONE_LINE_GAP, x2: x, y2: size },
          { x1: x - STONE_LINE_GAP, y1: y, x2: 0, y2: y },
          { x1: x + STONE_LINE_GAP, y1: y, x2: size, y2: y },
        ];
        return (
          <g key={index} data-testid="stone-line" data-index={index}>
            {reach.map((line, at) => (
              <line key={at} {...line} stroke={STONE_LINE_COLOUR} strokeOpacity={0.8} strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
