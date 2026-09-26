"use client";

import { useRef, useState, type PointerEvent } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE, FELTS } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { LATTICE_CELLS, LATTICE_SIDE, isHole, type LatticeMark } from "@/lib/puzzles/koushi/lattice";

import { PuzzleBoard } from "./PuzzleBoard";
import { KOUSHI_TILE_CHOSEN, KOUSHI_TILE_PLAIN, KOUSHI_TILE_TARGET, WORD_GRID_BOX, WORD_TILE, WORD_TILE_MARK } from "./puzzles.constants";

const MARK_WORDS: Record<LatticeMark, string> = { hit: "in its place", near: "wanted elsewhere in one of its words", miss: "wanted by neither of its words" };

/**
 * THE KOUSHI LATTICE: 21 letter tiles on the board, in Gomoji's Tiles style,
 * the four holes left empty so the board shows through them.
 *
 * On the board every puzzle is drawn on (`PuzzleBoard`, the wood and its
 * coordinates), in the reader's own board colour — the felt or wood they chose,
 * as Gomoji reads it (`feltOrWoodTheme` in `GomojiGrid`) — so the lattice is a
 * board's worth of squares with four of them left bare.
 *
 * Two ways to swap, both ending in `onSwap`: tap a tile and then another
 * (`chosen` is the first, drawn lifted), or press one and drag it onto
 * another, with a mouse or a finger. A drag is followed by where the pointer
 * is let go, read from the page (`elementFromPoint`), since a finger's pointer
 * stays with the tile it started on. A green tile is right and cannot be
 * picked up. Nothing here knows the solution: it draws the letters and marks
 * it is handed.
 */
export function KoushiGrid({
  grid,
  marks,
  chosen = null,
  done,
  onPress,
  onSwap,
  appearance = DEFAULT_APPEARANCE,
}: {
  /** The 25 cells, "." at the holes; a letter "" draws an empty tile, as the set-up's preview does. */
  grid: readonly string[];
  marks: readonly (LatticeMark | null)[];
  /** The tile tapped first, waiting for its partner. */
  chosen?: number | null;
  /** Finished, or only a picture: nothing can be pressed. */
  done: boolean;
  onPress: (cell: number) => void;
  onSwap: (from: number, to: number) => void;
  appearance?: Appearance;
}) {
  const theme = appearance.felt !== "wood" ? FELTS[appearance.felt] : BOARD_THEMES[appearance.boardTheme];
  const dragging = useRef<{ from: number; pointer: number; moved: boolean } | null>(null);
  // A drag that ended in a swap is followed by a click on the tile it started on, which must not also choose it.
  const dragged = useRef(false);
  const [over, setOver] = useState<number | null>(null);

  const movable = (cell: number) => !done && !isHole(cell) && marks[cell] !== "hit";
  const cellAt = (event: PointerEvent): number | null => {
    const found = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-koushi-cell]");
    const cell = found === null || found === undefined ? NaN : Number(found.dataset.koushiCell);
    return Number.isInteger(cell) ? cell : null;
  };

  const down = (cell: number, event: PointerEvent) => {
    // A drag a finger made fires no click after it, so what was swallowed is forgotten at the next press.
    dragged.current = false;
    if (!movable(cell) || (event.pointerType === "mouse" && event.button !== 0)) return;
    dragging.current = { from: cell, pointer: event.pointerId, moved: false };
  };
  const move = (event: PointerEvent) => {
    const drag = dragging.current;
    if (drag === null || drag.pointer !== event.pointerId) return;
    const cell = cellAt(event);
    if (cell !== drag.from) drag.moved = true;
    setOver(cell !== null && cell !== drag.from && movable(cell) ? cell : null);
  };
  const up = (event: PointerEvent) => {
    const drag = dragging.current;
    dragging.current = null;
    setOver(null);
    if (drag === null || drag.pointer !== event.pointerId || !drag.moved) return;
    const cell = cellAt(event);
    if (cell !== null && cell !== drag.from && movable(cell)) {
      dragged.current = true;
      onSwap(drag.from, cell);
    }
  };
  const cancel = () => {
    dragging.current = null;
    setOver(null);
  };

  return (
    <div className={WORD_GRID_BOX} data-testid="puzzle-grid" data-kind="koushi" data-done={done ? "true" : "false"}>
      <PuzzleBoard size={LATTICE_SIDE} theme={theme}>
        <div
          className="relative grid h-full w-full gap-1 p-1"
          style={{ gridTemplateColumns: `repeat(${LATTICE_SIDE}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${LATTICE_SIDE}, minmax(0, 1fr))` }}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={cancel}
        >
          {Array.from({ length: LATTICE_CELLS }, (_, cell) => {
            if (isHole(cell)) return <div key={cell} data-testid="koushi-hole" aria-hidden="true" />;
            const letter = grid[cell] ?? "";
            const mark = marks[cell] ?? null;
            const look = mark === null || mark === "miss" ? KOUSHI_TILE_PLAIN : WORD_TILE_MARK[mark];
            const label = letter === "" ? "empty" : `${letter.toUpperCase()}${mark === null ? "" : `, ${MARK_WORDS[mark]}`}`;
            const picked = chosen === cell;
            const said = {
              "data-testid": "koushi-tile",
              "data-koushi-cell": cell,
              "data-mark": mark ?? "none",
              "data-letter": letter,
              "data-chosen": picked ? "true" : undefined,
            };
            const className = `relative ${WORD_TILE} ${look} transition-transform ${picked ? KOUSHI_TILE_CHOSEN : ""} ${over === cell ? KOUSHI_TILE_TARGET : ""}`;
            return done ? (
              <div key={cell} className={className} aria-label={label} {...said}>
                {letter}
              </div>
            ) : (
              <button
                key={cell}
                type="button"
                className={`${className} touch-none ${movable(cell) ? "cursor-grab" : "cursor-default"}`}
                aria-label={`${label}${picked ? ", chosen" : ""}`}
                aria-pressed={picked}
                disabled={!movable(cell)}
                onPointerDown={(event) => down(cell, event)}
                onClick={() => {
                  if (dragged.current) {
                    dragged.current = false;
                    return;
                  }
                  onPress(cell);
                }}
                {...said}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </PuzzleBoard>
    </div>
  );
}
