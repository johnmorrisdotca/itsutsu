import type { ReactNode } from "react";

import { TOWER_SIDES, type TowerClues, type TowerSide } from "@/lib/puzzles/towers/code";

import { PUZZLE_TOWER_CLUE, PUZZLE_TOWER_SQUARE } from "./puzzles.constants";

/** Where a clue sits in the ring, as a row and column of a grid one cell wider on every side than the square. */
function placeOf(side: TowerSide, at: number, span: number): { row: number; col: number } {
  if (side === "top") return { row: 1, col: at + 2 };
  if (side === "bottom") return { row: span, col: at + 2 };
  if (side === "left") return { row: at + 2, col: 1 };
  return { row: at + 2, col: span };
}

const SIDE_WORDS: Record<TowerSide, (at: number) => string> = {
  top: (at) => `from the top of column ${at + 1}`,
  bottom: (at) => `from the bottom of column ${at + 1}`,
  left: (at) => `from the left of row ${at + 1}`,
  right: (at) => `from the right of row ${at + 1}`,
};

/**
 * A TOWERS SQUARE WITH ITS CLUES AROUND IT: a ring one cell deep on the wood,
 * each clue beside the row or column it looks along, and the square of cells
 * (`children`) in the middle on its white paper.
 *
 * The board is drawn two cells wider than the square (`PuzzleBoard` at
 * `size + 2`) rather than squeezing the clues into the frame's rim, which is a
 * sliver meant to show wood and not to hold a number a person reads. A place
 * with no clue is left empty wood.
 */
export function TowerRing({ size, clues, children }: { size: number; clues: TowerClues; children: ReactNode }) {
  const span = size + 2;
  return (
    <div
      className="grid h-full w-full"
      style={{ gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${span}, minmax(0, 1fr))` }}
      data-testid="puzzle-tower-ring"
    >
      {TOWER_SIDES.flatMap((side) =>
        clues[side].map((clue, at) => {
          if (clue === 0) return null;
          const { row, col } = placeOf(side, at, span);
          return (
            <span
              key={`${side}-${at}`}
              className={PUZZLE_TOWER_CLUE}
              style={{ gridRow: row, gridColumn: col }}
              data-testid="puzzle-tower-clue"
              data-side={side}
              data-at={at}
            >
              <span className="sr-only">{`Towers seen ${SIDE_WORDS[side](at)}: `}</span>
              {clue}
            </span>
          );
        }),
      )}
      <div className={PUZZLE_TOWER_SQUARE} style={{ gridRow: `2 / ${span}`, gridColumn: `2 / ${span}` }}>
        {children}
      </div>
    </div>
  );
}
