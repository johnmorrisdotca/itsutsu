"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";

import type { BoardThemeTokens } from "@/components/board/board.types";
import { ownersOf, type Lines, type LinkLayout } from "@johnmorrisdotca/tsunagi";
import { cellAtPoint, TSUNAGI_STYLE, tsunagiDrawing, tsunagiGeometry, type TsunagiPiece } from "@johnmorrisdotca/tsunagi/draw";

import { PuzzleBoard } from "./PuzzleBoard";
import { TsunagiCell } from "./TsunagiCell";
import { tsunagiBoardLook, tsunagiLargestNumber, type TsunagiFill, type TsunagiMarks } from "./puzzles.constants";

/** How long a tapped portal shows its link to the other ring: a finger has no hover. */
const LINK_MS = 1800;

/** One group of the package's drawing. React writes its text only when that text has changed, so a move redraws one or two pairs. */
function Piece({ piece }: { piece: TsunagiPiece }) {
  const { class: className, ...attributes } = piece.attributes;
  if (piece.pieces !== undefined) {
    return (
      <g className={className} {...attributes}>
        {piece.pieces.map((each) => (
          <Piece key={each.key} piece={each} />
        ))}
      </g>
    );
  }
  return <g className={className} {...attributes} dangerouslySetInnerHTML={{ __html: piece.html ?? "" }} />;
}

/**
 * THE TSUNAGI BOARD: Tsunagi's own drawing (`tsunagiDrawing`, the package's, the same one its demo and embed show)
 * laid on the wood every board has here (`PuzzleBoard`), in the player's board colour. Marbles, beads, lines, the wash
 * under a line, walls, bridges with the line going down lost under the deck, waypoints, portals, the ghosts of a board
 * that wraps and a hexagon's cells are all drawn there, and never here: John, 2026-10-01, "bridges for Tsunagi don't
 * look like the ones in Itsutsu... are bridges rendered differently per consumer?" The site brings the wood, its
 * coordinates, its colours for that wood (`tsunagiBoardLook`) and the words.
 *
 * It knows nothing of the rules. A press, each cell the pointer enters and the letting go are reported (`onPress`,
 * `onDrag`, `onLift`), by mouse, pen or finger alike: pointer events, captured on the press so a drag that leaves the
 * board still ends, and `touch-action: none` so a finger drawing a line never scrolls the page. Which cell a point is
 * over is the package's arithmetic too (`cellAtPoint`), so a press and a drawing cannot disagree; a ghost of a board
 * that wraps is the real cell it shows, and a finger is on the hexagon nearest it. `TsunagiSolve` decides what each
 * report means.
 *
 * Over the drawing lies one invisible `TsunagiCell` a cell, which is what a screen reader reads and what a pointer
 * hovers on a portal. A faint link between a portal's two rings shows while the pointer is over either, and for a
 * moment after either is tapped, which is how a finger asks (`LINK_MS`).
 *
 * A BIG BOARD IS REDRAWN ONLY WHERE IT CHANGED. A 30×30 board is nine hundred cells and up to eighty-two lines, and a
 * finger moving through a cell used to redraw all of them. The drawing comes as groups (`Piece`), one a pair for what a
 * line changes, and each cell is memoised, given only plain values.
 */
export function TsunagiGrid({
  layout,
  lines,
  marks,
  fill = "marbles",
  theme,
  done = false,
  readOnly = false,
  flagged = null,
  blasted = null,
  onPress,
  onDrag,
  onLift,
}: {
  layout: LinkLayout;
  lines: Lines;
  marks: TsunagiMarks;
  /** Marbles in every cell of a line, or the line alone. */
  fill?: TsunagiFill;
  theme: BoardThemeTokens;
  done?: boolean;
  /** Drawn only, never pressed: a picture of a level. */
  readOnly?: boolean;
  /** The pairs Check found not joined: their two marbles flash, and nothing else is said about them. */
  flagged?: ReadonlySet<number> | null;
  /** The cells an explosion has just taken a line out of: each bursts a moment, in vermilion. */
  blasted?: ReadonlySet<number> | null;
  onPress?: (cell: number) => void;
  onDrag?: (cell: number) => void;
  onLift?: () => void;
}) {
  const { size } = layout;
  const owners = ownersOf(layout, lines);
  const geometry = useMemo(() => tsunagiGeometry(layout, { surface: true }), [layout]);
  // A wrapping board is drawn one ghost cell wider all round.
  const span = size + 2 * geometry.ring;
  const pressing = useRef<{ pointer: number; cell: number } | null>(null);
  const id = `tsunagi-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const live = !readOnly && !done;
  // The portal whose link is showing: the pointer is over one of its rings, or one was tapped a moment ago.
  const [linked, setLinked] = useState<number | null>(null);
  const tapped = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(tapped.current), []);
  const portalOf = (cell: number): number => layout.portalPairs.findIndex(([a, b]) => a === cell || b === cell);
  const hover = useCallback((portal: number | null) => setLinked((now) => (portal === null && tapped.current !== 0 ? now : portal)), []);

  const drawing = useMemo(
    () =>
      tsunagiDrawing(layout, {
        lines,
        marks,
        fill,
        board: tsunagiBoardLook(theme),
        surface: true,
        id,
        flagged: flagged ?? undefined,
        blasted: blasted ?? undefined,
        linked,
        largestNumber: tsunagiLargestNumber(geometry.side),
      }),
    [layout, lines, marks, fill, theme, id, flagged, blasted, linked, geometry.side],
  );
  const { class: drawingClass, ...drawingAttributes } = drawing.attributes;

  const cellAt = (event: PointerEvent<HTMLDivElement>): number | null => {
    const box = event.currentTarget.getBoundingClientRect();
    return cellAtPoint(geometry, ((event.clientX - box.left) / box.width) * geometry.side, ((event.clientY - box.top) / box.height) * geometry.side);
  };

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (pressing.current !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
    const cell = cellAt(event);
    if (cell === null) return;
    // A tap on a portal shows where it goes, whether or not a line can be drawn from it.
    if (layout.portals.has(cell)) {
      window.clearTimeout(tapped.current);
      setLinked(portalOf(cell));
      tapped.current = window.setTimeout(() => {
        tapped.current = 0;
        setLinked(null);
      }, LINK_MS);
    }
    if (!live) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pressing.current = { pointer: event.pointerId, cell };
    onPress?.(cell);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const held = pressing.current;
    if (held === null || held.pointer !== event.pointerId) return;
    const cell = cellAt(event);
    if (cell === null || cell === held.cell) return;
    held.cell = cell;
    onDrag?.(cell);
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    const held = pressing.current;
    if (held === null || held.pointer !== event.pointerId) return;
    pressing.current = null;
    onLift?.();
  };

  /** Where a cell's box is, as percentages of the board: a ghost by its place in the ring, a real cell by the package's own arithmetic. */
  const boxAt = (x: number, y: number) => ({ left: (x / geometry.side) * 100, top: (y / geometry.side) * 100 });
  const share = (100 * 100) / geometry.side;

  // Past Z the columns are numbered (26 to 30), two digits in a column barely eleven pixels wide on a phone: smaller there, so that no two run together.
  return (
    <div className={`w-full select-none ${size > 26 ? "[&_.board-coordinates]:text-[0.5rem]" : ""}`} data-testid="puzzle-grid" data-size={size} data-done={done ? "true" : "false"} data-marks={marks} data-fill={fill}>
      <style href="tsunagi-drawing" precedence="default">
        {TSUNAGI_STYLE}
      </style>
      <PuzzleBoard size={span} theme={theme} coordinates={!layout.wrap && !layout.hex}>
        <div
          className={`relative h-full w-full ${live ? "cursor-pointer" : ""}`}
          style={{ touchAction: "none" }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          data-testid="tsunagi-board"
          data-hex={layout.hex ? "true" : undefined}
        >
          <svg
            className={`${drawingClass} pointer-events-none`}
            {...drawingAttributes}
            // The drawing is what is seen; `TsunagiCell` is what a screen reader hears, in the reader's language.
            role={undefined}
            aria-label={undefined}
            aria-hidden="true"
            style={{ ...(drawing.variables as CSSProperties), "--tsu-font": "var(--font-sans)", position: "absolute", inset: 0, width: "100%", height: "100%" } as CSSProperties}
          >
            {drawing.pieces.map((piece) => (
              <Piece key={piece.key} piece={piece} />
            ))}
          </svg>
          {Array.from({ length: span * span }, (_, place) => {
            const across = place % span;
            const down = Math.floor(place / span);
            const { ring } = geometry;
            const at = ((down - ring + size) % size) * size + ((across - ring + size) % size);
            const ghost = across < ring || down < ring || across >= size + ring || down >= size + ring;
            // Off a hexagon's edge: not a place at all.
            if (!ghost && !geometry.onBoard(at)) return null;
            const middle = geometry.centre(at);
            const { left, top } = ghost ? boxAt(across * 100, down * 100) : boxAt(middle.x - 50, middle.y - 50);
            return (
              <TsunagiCell
                key={ghost ? `ghost-${place}` : at}
                at={at}
                ghost={ghost}
                left={left}
                top={top}
                share={share}
                cell={layout.cells[at]!}
                owner={owners[at]!}
                waypoint={layout.waypoints.get(at) ?? -1}
                portal={layout.portals.has(at) ? portalOf(at) : -1}
                size={size}
                onLink={hover}
              />
            );
          })}
        </div>
      </PuzzleBoard>
    </div>
  );
}
