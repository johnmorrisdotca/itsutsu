"use client";

import { useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";

import { EMPTY_CELL, SHADED_CELL } from "@/lib/puzzles/pictureLogic/code";
import { clueDepth, metLines, runBetween } from "@/lib/puzzles/pictureLogic/paint";
import type { CellState, PictureClues } from "@/lib/puzzles/pictureLogic/pictureLogic.types";
import { centredBaseline } from "@/lib/ui/svgText";

import { PuzzleBoard } from "./PuzzleBoard";
import { PICTURE_LOOK } from "./puzzles.constants";

const NO_CELLS: ReadonlySet<number> = new Set();
const WORDS: Record<CellState, string> = { 0: "blank", 1: "shaded", 2: "marked empty" };

/**
 * THE PICTURE LOGIC BOARD: white paper inside the wood every board has
 * (`PuzzleBoard`), the square of cells to shade at its lower right, each
 * row's clue beside it and each column's above it on a warm tint of the same
 * paper, and in the corner the picture as it stands, small.
 *
 * The board is drawn `size + depth` cells a side — the clues' depth is the
 * longest clue's count of numbers — rather than the clues being squeezed into
 * the frame's rim, as Towers draws its ring of clues on a board two wider than
 * its square. No row numbers or column letters: the clues stand where they
 * would.
 *
 * A clue its line already meets is drawn faint and struck through — two cues,
 * never colour alone. When the puzzle is done (`finished`) the ✕s and the
 * rules fade, and what is left on the paper is the picture.
 *
 * A press, a tap or a drag is reported to `PictureLogicSolve`, which decides
 * what it means: a tap is a press and a lift on one cell; a drag is a press
 * and a finger moved along a row or a column, the run it covers drawn tinted
 * while held and reported on the lift. Pointer events captured on the press,
 * a finger and a mouse alike, with `touch-action: none` so a stroke never
 * scrolls the page, as Bridges' and Tsunagi's boards do. Each cell is also a
 * button, so a keyboard reaches it; a pointer's click on one is the press's.
 */
export function PictureLogicGrid({
  clues,
  cells,
  wrong = NO_CELLS,
  done,
  finished = false,
  readOnly = false,
  onPaint,
}: {
  clues: PictureClues;
  cells: readonly CellState[];
  /** The cells Show marked wrong (`useHints`). */
  wrong?: ReadonlySet<number>;
  done: boolean;
  /** Solved: draw the picture alone, the ✕s and the rules faded away. */
  finished?: boolean;
  /** Drawn only, never pressed: a preview, or a solve's page. */
  readOnly?: boolean;
  /** A tap (one cell) or a drag (the run, the cell pressed first). */
  onPaint?: (run: readonly number[]) => void;
}) {
  const { size } = clues;
  const depth = clueDepth(clues);
  const side = size + depth;
  const live = !readOnly && !done;
  const met = useMemo(() => metLines(clues, cells), [clues, cells]);
  const pressing = useRef<{ pointer: number; cell: number } | null>(null);
  const [aim, setAim] = useState<number[] | null>(null);

  const cellUnder = (event: PointerEvent<HTMLDivElement>): number => {
    const box = event.currentTarget.getBoundingClientRect();
    const col = Math.floor(((event.clientX - box.left) / box.width) * side) - depth;
    const row = Math.floor(((event.clientY - box.top) / box.height) * side) - depth;
    if (row < 0 || col < 0 || row >= size || col >= size) return -1;
    return row * size + col;
  };

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (!live || pressing.current !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
    const cell = cellUnder(event);
    if (cell === -1) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pressing.current = { pointer: event.pointerId, cell };
    setAim([cell]);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const held = pressing.current;
    if (held === null || held.pointer !== event.pointerId) return;
    const cell = cellUnder(event);
    if (cell === -1) return;
    const run = runBetween(size, held.cell, cell);
    if (aim === null || run.length !== aim.length || run.at(-1) !== aim.at(-1)) setAim(run);
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    const held = pressing.current;
    if (held === null || held.pointer !== event.pointerId) return;
    pressing.current = null;
    const run = aim ?? [held.cell];
    setAim(null);
    if (event.type === "pointercancel") return;
    onPaint?.(run);
  };
  /* A keyboard's press on a cell's button; a pointer's click is already a press above (its `detail` counts the clicks). */
  const keyed = (event: MouseEvent<HTMLButtonElement>, cell: number) => {
    if (event.detail === 0 && live) onPaint?.([cell]);
  };

  const at = (cell: number) => ({ x: depth + (cell % size), y: depth + Math.floor(cell / size) });
  const font = PICTURE_LOOK.clueFont;
  const mini = (depth - 0.4) / size;

  return (
    <div className="surface-light w-full select-none" data-testid="puzzle-grid" data-size={size} data-done={done ? "true" : "false"} data-finished={finished ? "true" : undefined}>
      <PuzzleBoard size={side} coordinates={false}>
        <div
          className={`relative h-full w-full ${live ? "cursor-pointer" : ""}`}
          style={{ touchAction: "none", background: PICTURE_LOOK.paper }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          data-testid="picture-board"
          data-depth={depth}
          data-aim={aim === null ? undefined : aim.length}
        >
          <svg viewBox={`0 0 ${side} ${side}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <rect x={depth} y={0} width={size} height={depth} fill={PICTURE_LOOK.band} />
            <rect x={0} y={depth} width={depth} height={size} fill={PICTURE_LOOK.band} />
            {cells.map((state, cell) => {
              const { x, y } = at(cell);
              if (state === SHADED_CELL) return <rect key={cell} x={x} y={y} width={1} height={1} fill={PICTURE_LOOK.ink} />;
              if (state === EMPTY_CELL && !finished) {
                return <path key={cell} d={`M ${x + 0.3} ${y + 0.3} L ${x + 0.7} ${y + 0.7} M ${x + 0.7} ${y + 0.3} L ${x + 0.3} ${y + 0.7}`} stroke={PICTURE_LOOK.cross} strokeWidth={0.07} strokeLinecap="round" />;
              }
              return null;
            })}
            {aim === null
              ? null
              : aim.map((cell) => <rect key={`aim${cell}`} x={at(cell).x + 0.06} y={at(cell).y + 0.06} width={0.88} height={0.88} fill="none" stroke={PICTURE_LOOK.aim} strokeWidth={0.12} />)}
            {[...wrong].map((cell) => (
              <rect key={`wrong${cell}`} x={at(cell).x + 0.08} y={at(cell).y + 0.08} width={0.84} height={0.84} fill="none" stroke={PICTURE_LOOK.wrong} strokeWidth={0.1} strokeDasharray="0.2 0.1" data-testid="picture-wrong" />
            ))}
            <g opacity={finished ? 0.25 : 1}>
              {Array.from({ length: size + 1 }, (_, k) => {
                const heavy = k % PICTURE_LOOK.every === 0 || k === size;
                const stroke = heavy ? PICTURE_LOOK.ruleStrong : PICTURE_LOOK.rule;
                const width = heavy ? 0.05 : 0.025;
                return (
                  <g key={k} stroke={stroke} strokeWidth={width}>
                    <line x1={depth + k} y1={k === 0 || k === size ? 0 : depth} x2={depth + k} y2={side} />
                    <line x1={k === 0 || k === size ? 0 : depth} y1={depth + k} x2={side} y2={depth + k} />
                  </g>
                );
              })}
            </g>
            {clues.rows.map((clue, row) => (
              <ClueLine key={`r${row}`} numbers={clue} met={met.rows[row]!} across place={row} depth={depth} font={font} />
            ))}
            {clues.cols.map((clue, col) => (
              <ClueLine key={`c${col}`} numbers={clue} met={met.cols[col]!} across={false} place={col} depth={depth} font={font} />
            ))}
            {/* The picture as it stands, small, in the corner the clues leave. */}
            <g data-testid="picture-mini">
              {cells.map((state, cell) =>
                state === SHADED_CELL ? <rect key={cell} x={0.2 + (cell % size) * mini} y={0.2 + Math.floor(cell / size) * mini} width={mini} height={mini} fill={PICTURE_LOOK.ink} /> : null,
              )}
            </g>
          </svg>
          {cells.map((state, cell) => {
            const row = Math.floor(cell / size);
            const col = cell % size;
            return (
              <button
                key={cell}
                type="button"
                tabIndex={live ? 0 : -1}
                disabled={!live}
                onClick={(event) => keyed(event, cell)}
                className="absolute outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-moss"
                style={{ left: `${((depth + col) / side) * 100}%`, top: `${((depth + row) / side) * 100}%`, width: `${100 / side}%`, height: `${100 / side}%` }}
                aria-label={`row ${row + 1}, column ${col + 1}, ${WORDS[state]}`}
                data-testid="picture-cell"
                data-index={cell}
                data-state={WORDS[state]}
                data-wrong={wrong.has(cell) ? "true" : undefined}
              />
            );
          })}
          <span className="sr-only" data-testid="picture-clues">
            {clues.rows.map((clue, row) => `Row ${row + 1}: ${clue.length === 0 ? 0 : clue.join(" ")}${met.rows[row] ? ", met" : ""}. `).join("")}
            {clues.cols.map((clue, col) => `Column ${col + 1}: ${clue.length === 0 ? 0 : clue.join(" ")}${met.cols[col] ? ", met" : ""}. `).join("")}
          </span>
        </div>
      </PuzzleBoard>
    </div>
  );
}

/**
 * One line's clue on its band: a row's numbers to the left of it, pushed to
 * the grid; a column's above it, pushed down to the grid. Met, it is faint
 * and a stroke runs through it.
 */
function ClueLine({ numbers, met, across, place, depth, font }: { numbers: readonly number[]; met: boolean; across: boolean; place: number; depth: number; font: number }) {
  const shown = numbers.length === 0 ? [0] : numbers;
  const spot = (index: number) => {
    const back = shown.length - index;
    return across ? { x: depth - back + 0.5, y: depth + place + 0.5 } : { x: depth + place + 0.5, y: depth - back + 0.5 };
  };
  const first = spot(0);
  const strike = across
    ? { x1: first.x - 0.4, y1: first.y, x2: depth - 0.1, y2: first.y }
    : { x1: first.x, y1: first.y - 0.4, x2: first.x, y2: depth - 0.1 };
  return (
    <g opacity={met ? PICTURE_LOOK.metOpacity : 1} data-testid="picture-clue" data-line={`${across ? "row" : "col"}-${place}`} data-met={met ? "true" : "false"}>
      {shown.map((value, index) => {
        const { x, y } = spot(index);
        return (
          <text key={index} x={x} y={centredBaseline(y, font)} fontSize={value > 9 ? font * 0.85 : font} fontWeight={600} textAnchor="middle" fill={PICTURE_LOOK.ink}>
            {value}
          </text>
        );
      })}
      {met ? <line {...strike} stroke={PICTURE_LOOK.ink} strokeWidth={0.06} strokeLinecap="round" data-testid="picture-clue-struck" /> : null}
    </g>
  );
}
