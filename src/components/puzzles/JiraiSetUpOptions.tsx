"use client";

import { useState } from "react";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { JIRAI_GRID_DISPLAY, JIRAI_SHAPE_DISPLAY } from "@/lib/puzzles/jirai/jirai.constants";
import { CLASSIC_JIRAI, isJiraiVariant, JIRAI_GRIDS, JIRAI_SHAPE_LEAST, JIRAI_SHAPES, type JiraiGrid, type JiraiShape, type JiraiVariant } from "@/lib/puzzles/jirai/variants";
import type { PuzzleAsked } from "@/lib/puzzles/puzzleAddress";

/**
 * Jirai's own choices, held by the set-up (`PuzzleSetUp`): which squares a number counts, and the shape of the board.
 * What is chosen is the way to play (`JiraiVariant`); a shape the grid cannot take, or the board is too small for,
 * is not the way, so the way is the shape if it can be and a rectangle if not.
 */
export function useJiraiChoice(asked: PuzzleAsked | undefined, size: number): { grid: JiraiGrid; shape: JiraiShape; variant: JiraiVariant; setGrid: (grid: JiraiGrid) => void; setShape: (shape: JiraiShape) => void } {
  const [grid, setGrid] = useState<JiraiGrid>(asked?.jirai?.grid ?? CLASSIC_JIRAI.grid);
  const [shape, setShape] = useState<JiraiShape>(asked?.jirai?.shape ?? CLASSIC_JIRAI.shape);
  const shaped = isJiraiVariant(grid, shape) && size >= JIRAI_SHAPE_LEAST ? shape : "rectangle";
  return { grid, shape: shaped, variant: { grid, shape: shaped }, setGrid, setShape };
}

/**
 * JIRAI'S SET-UP CHOICES, under the options: the neighbours a number counts, and the shape. Two rows of chips,
 * and the line under them keeps the room its longest wording takes, so the screen never changes height as they
 * change. A shape that cannot be (edges that join take none; a board under nine squares each way has too few
 * to cut one from) is a chip that says so rather than one that is not there. The choice travels in the address
 * until a seed is drawn, and the seed says it from then on (`jiraiVariantOfSeed`).
 */
export function JiraiSetUpOptions({ size, ...choice }: { size: number } & ReturnType<typeof useJiraiChoice>) {
  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Neighbours" data-testid="jirai-grid">
        {JIRAI_GRIDS.map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={choice.grid === each}
            className={`${PICK_WORD_CHIP} ${choice.grid === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => choice.setGrid(each)}
            data-testid={`jirai-grid-${each}`}
          >
            {JIRAI_GRID_DISPLAY[each].label} <span className="font-mincho opacity-70">{JIRAI_GRID_DISPLAY[each].kanji}</span>
          </button>
        ))}
      </div>
      <p className="min-h-12 text-xs text-muted" data-testid="jirai-grid-blurb">
        {JIRAI_GRID_DISPLAY[choice.grid].blurb}
      </p>
      <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Shape" data-testid="jirai-shape">
        {JIRAI_SHAPES.map((each) => {
          const possible = isJiraiVariant(choice.grid, each) && (each === "rectangle" || size >= JIRAI_SHAPE_LEAST);
          return (
            <button
              key={each}
              type="button"
              role="radio"
              aria-checked={choice.shape === each}
              disabled={!possible}
              title={possible ? undefined : choice.grid === "wrap" ? "Edges that join take a rectangle only" : `A shape needs a board of at least ${JIRAI_SHAPE_LEAST}×${JIRAI_SHAPE_LEAST}`}
              className={`${PICK_WORD_CHIP} ${choice.shape === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT} disabled:opacity-40`}
              onClick={() => choice.setShape(each)}
              data-testid={`jirai-shape-${each}`}
            >
              {JIRAI_SHAPE_DISPLAY[each].label} <span className="font-mincho opacity-70">{JIRAI_SHAPE_DISPLAY[each].kanji}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
