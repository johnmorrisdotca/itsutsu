"use client";

import { memo, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";

import { clueDepth, crossesPath, metLines, outlines, runBetween, shadedPath, type MetLines } from "@/lib/puzzles/pictureLogic/paint";
import type { CellState, PictureClues } from "@/lib/puzzles/pictureLogic/pictureLogic.types";

import { ClueLine } from "./PictureClue";
import { PuzzleBoard } from "./PuzzleBoard";
import { PICTURE_LOOK } from "./puzzles.constants";

const NO_CELLS: ReadonlySet<number> = new Set();
/** The arrow keys, as the row and column they step. */
const ARROWS: Record<string, readonly [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
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
 *
 * ON A BIG BOARD (50×50 is two and a half thousand cells) a drag is drawn
 * without redrawing the board. The cells, rules and clues are one memoised
 * layer that changes only when the grid does; the tinted run a drag covers is
 * a layer of its own, which is all that moves while the finger does. The
 * buttons are one memoised layer too, one press handler on their parent
 * rather than one a button, and left out of a board that is only drawn.
 */
export function PictureLogicGrid({
  clues,
  cells,
  wrong = NO_CELLS,
  done,
  finished = false,
  readOnly = false,
  met: metOf,
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
  /** Which lines the grid already meets, where the caller has worked it out already to draw the same beside the board (`pinnedClues`). */
  met?: MetLines;
  /** A tap (one cell) or a drag (the run, the cell pressed first). */
  onPaint?: (run: readonly number[]) => void;
}) {
  const { size } = clues;
  const depth = clueDepth(clues);
  const side = size + depth;
  const live = !readOnly && !done;
  const own = useMemo(() => (metOf === undefined ? metLines(clues, cells) : null), [metOf, clues, cells]);
  const met = metOf ?? own!;
  const pressing = useRef<{ pointer: number; cell: number } | null>(null);
  const [aim, setAim] = useState<number[] | null>(null);
  // Of a board's buttons only one is a stop for Tab (the cell last focused), and the arrow keys walk the rest: two and a half thousand tab stops is not a keyboard's way through a board.
  const [stop, setStop] = useState(0);
  const area = useRef<HTMLDivElement>(null);

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
  /* A keyboard's press on a cell's button, heard here once for all of them; a pointer's click is already a press above (its `detail` counts the clicks). */
  const keyed = (event: MouseEvent<HTMLDivElement>) => {
    if (event.detail !== 0 || !live) return;
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-index]");
    if (button !== null) onPaint?.([Number(button.dataset.index)]);
  };

  const walked = (event: KeyboardEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-index]");
    const way = ARROWS[event.key];
    if (button === null || way === undefined || !live) return;
    const from = Number(button.dataset.index);
    const row = Math.floor(from / size) + way[0];
    const col = (from % size) + way[1];
    if (row < 0 || col < 0 || row >= size || col >= size) return;
    event.preventDefault();
    area.current?.querySelector<HTMLElement>(`[data-index="${row * size + col}"]`)?.focus();
  };
  const focused = (event: FocusEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-index]");
    if (button !== null) setStop(Number(button.dataset.index));
  };

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
          onClick={keyed}
          onKeyDown={walked}
          onFocus={focused}
          ref={area}
          data-pin-area
          data-testid="picture-board"
          data-depth={depth}
          data-aim={aim === null ? undefined : aim.length}
        >
          <PaperLayer clues={clues} cells={cells} wrong={wrong} met={met} depth={depth} finished={finished} />
          <svg viewBox={`0 0 ${side} ${side}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            {/* One path whose outline is all that changes while a finger moves: a square added to the page here would restyle the whole of it (see `shadedPath`). */}
            <path d={aim === null ? "" : outlines(aim, size, depth)} fill="none" stroke={PICTURE_LOOK.aim} strokeWidth={0.12} data-testid="picture-aim" />
          </svg>
          {readOnly ? null : <CellButtons cells={cells} wrong={wrong} size={size} depth={depth} stop={stop} live={live} />}
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
 * THE PAPER: the bands the clues stand on, the shaded squares and the ✕s, the
 * marked-wrong outlines, the rules, every clue, and the picture so far in the
 * corner. One layer that is drawn again only when the grid or what it is
 * meeting changes, never while a finger is only moving over it.
 */
const PaperLayer = memo(function PaperLayer({
  clues,
  cells,
  wrong,
  met,
  depth,
  finished,
}: {
  clues: PictureClues;
  cells: readonly CellState[];
  wrong: ReadonlySet<number>;
  met: MetLines;
  depth: number;
  finished: boolean;
}) {
  const { size } = clues;
  const side = size + depth;
  const font = PICTURE_LOOK.clueFont;
  const mini = (depth - 0.4) / size;
  const at = (cell: number) => ({ x: depth + (cell % size), y: depth + Math.floor(cell / size) });
  return (
    <svg viewBox={`0 0 ${side} ${side}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <rect x={depth} y={0} width={size} height={depth} fill={PICTURE_LOOK.band} />
      <rect x={0} y={depth} width={depth} height={size} fill={PICTURE_LOOK.band} />
      <path d={shadedPath(cells, size, depth)} fill={PICTURE_LOOK.ink} data-testid="picture-shaded" />
      {finished ? null : <path d={crossesPath(cells, size, depth)} fill="none" stroke={PICTURE_LOOK.cross} strokeWidth={0.07} strokeLinecap="round" data-testid="picture-crosses" />}
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
      <path d={shadedPath(cells, size, 0.2, mini)} fill={PICTURE_LOOK.ink} data-testid="picture-mini" />
    </svg>
  );
});

/** One button a cell, for a keyboard and a screen reader: drawn again only when a cell's state or a Show mark changes, never for a drag's tint. */
const CellButtons = memo(function CellButtons({ cells, wrong, size, depth, stop, live }: { cells: readonly CellState[]; wrong: ReadonlySet<number>; size: number; depth: number; stop: number; live: boolean }) {
  const side = size + depth;
  return (
    <>
      {cells.map((state, cell) => {
        const row = Math.floor(cell / size);
        const col = cell % size;
        return (
          <button
            key={cell}
            type="button"
            tabIndex={live && cell === stop ? 0 : -1}
            disabled={!live}
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
    </>
  );
});
