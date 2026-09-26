"use client";

import { useRef, type PointerEvent } from "react";

import type { BoardThemeTokens } from "@/components/board/board.types";
import { CELL_BLOCKED, type LinkLayout } from "@/lib/puzzles/tsunagi/code";
import { ownersOf, type Lines } from "@/lib/puzzles/tsunagi/lines";

import { PuzzleBoard } from "./PuzzleBoard";
import { TSUNAGI_BEAD, TSUNAGI_MARBLE, tsunagiBeadLook, tsunagiLineColour, tsunagiMarbleLook, tsunagiWash, type TsunagiFill, type TsunagiMarks } from "./puzzles.constants";

/**
 * THE TSUNAGI BOARD: marbles on the board itself, in the player's board
 * colour (`PuzzleBoard`, the frame and coordinates every board has), the
 * lines drawn between them as thick rounded strokes through the cells'
 * centres, and every cell a line passes through washed faintly in its colour
 * — and, with Marbles (`fill`), holding a marble of that colour too, so a
 * finished board is a board of marbles joined by their lines. They appear as
 * the line is dragged, since they are read from the lines as they stand.
 *
 * It knows nothing of the rules. A press, each cell the pointer enters and the
 * letting go are reported (`onPress`, `onDrag`, `onLift`), by mouse, pen or
 * finger alike: pointer events, captured on the press so a drag that leaves
 * the board still ends, and `touch-action: none` so a finger drawing a line
 * never scrolls the page. `TsunagiSolve` decides what each report means.
 */
export function TsunagiGrid({
  layout,
  lines,
  marks,
  fill = "marbles",
  theme,
  done = false,
  readOnly = false,
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
  onPress?: (cell: number) => void;
  onDrag?: (cell: number) => void;
  onLift?: () => void;
}) {
  const { size } = layout;
  const owners = ownersOf(layout, lines);
  const pressing = useRef<{ pointer: number; cell: number } | null>(null);
  const live = !readOnly && !done;

  const cellAt = (event: PointerEvent<HTMLDivElement>): number | null => {
    const box = event.currentTarget.getBoundingClientRect();
    const col = Math.floor(((event.clientX - box.left) / box.width) * size);
    const row = Math.floor(((event.clientY - box.top) / box.height) * size);
    if (col < 0 || row < 0 || col >= size || row >= size) return null;
    return row * size + col;
  };

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (!live || pressing.current !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
    const cell = cellAt(event);
    if (cell === null) return;
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

  return (
    <div className="w-full select-none" data-testid="puzzle-grid" data-size={size} data-done={done ? "true" : "false"} data-marks={marks} data-fill={fill}>
      <PuzzleBoard size={size} theme={theme}>
        <div
          className={`relative h-full w-full ${live ? "cursor-pointer" : ""}`}
          style={{ touchAction: "none" }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          data-testid="tsunagi-board"
        >
          <svg viewBox={`0 0 ${size} ${size}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            {owners.map((owner, at) =>
              owner >= 0 && layout.cells[at]! < 0 ? (
                <rect key={`wash-${at}`} x={at % size} y={Math.floor(at / size)} width={1} height={1} fill={tsunagiWash(owner, marks)} />
              ) : owner === CELL_BLOCKED ? (
                <rect key={`block-${at}`} x={(at % size) + 0.08} y={Math.floor(at / size) + 0.08} width={0.84} height={0.84} rx={0.08} fill={theme.line} opacity={0.55} />
              ) : null,
            )}
            {Array.from({ length: size - 1 }, (_, at) => at + 1).map((at) => (
              <g key={`rule-${at}`} stroke={theme.line} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.55}>
                <line x1={at} y1={0} x2={at} y2={size} vectorEffect="non-scaling-stroke" />
                <line x1={0} y1={at} x2={size} y2={at} vectorEffect="non-scaling-stroke" />
              </g>
            ))}
            <rect x={0} y={0} width={size} height={size} fill="none" stroke={theme.line} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
            {lines.map((line, pair) =>
              line.length < 2 ? null : (
                <polyline
                  key={`line-${pair}`}
                  points={line.map((cell) => `${(cell % size) + 0.5},${Math.floor(cell / size) + 0.5}`).join(" ")}
                  fill="none"
                  stroke={tsunagiLineColour(pair, marks)}
                  strokeWidth={0.3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  data-testid="tsunagi-line"
                  data-pair={pair}
                  data-cells={line.length}
                />
              ),
            )}
          </svg>
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${size}, minmax(0, 1fr))` }}>
            {layout.cells.map((cell, at) => {
              const owner = owners[at]!;
              const label = `row ${Math.floor(at / size) + 1}, column ${(at % size) + 1}${cell >= 0 ? `, marble ${cell + 1}` : owner >= 0 ? `, line ${owner + 1}` : cell === CELL_BLOCKED ? ", blocked" : ", empty"}`;
              return (
                <div
                  key={at}
                  className="relative flex items-center justify-center"
                  data-testid="puzzle-cell"
                  data-index={at}
                  data-owner={owner >= 0 ? owner : undefined}
                  data-stone={cell >= 0 ? cell : undefined}
                  aria-label={label}
                  role="img"
                >
                  {cell >= 0 ? (
                    <span className={`${TSUNAGI_MARBLE} ${size >= 8 ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`} style={tsunagiMarbleLook(cell, marks)} data-testid="tsunagi-marble" data-pair={cell}>
                      {marks === "numbers" ? cell + 1 : null}
                    </span>
                  ) : fill === "marbles" && owner >= 0 ? (
                    <span className={TSUNAGI_BEAD} style={tsunagiBeadLook(owner, marks)} data-testid="tsunagi-bead" data-pair={owner} />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </PuzzleBoard>
    </div>
  );
}
