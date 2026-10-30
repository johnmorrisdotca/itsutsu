"use client";

import { useMemo, useRef, type KeyboardEvent, type PointerEvent } from "react";

import { decodeLine, decodeNumbers } from "@/lib/puzzles/ichifude/code";
import { centredBaseline } from "@/lib/ui/svgText";

import { PuzzleBoard } from "../PuzzleBoard";

/** One square, in the units the board is drawn in. */
const CELL = 100;
const NUMBER_RADIUS = 31;
const NUMBER_TEXT = 40;
const LINE_WIDTH = 44;
const HEAD_RADIUS = 9;

/** The paper and the ink, as every puzzle's paper is white whichever way the page is lit. */
const PAPER = "#ffffff";
const RULE = "#d6d3d1";
const INK = "#1c1917";
const LINE = "#c2452d";
const SOLVED_LINE = "#2f7d4f";
const WRONG = "#fecaca";

const centre = (index: number) => index * CELL + CELL / 2;

/**
 * ICHIFUDE'S BOARD: white paper in the wood every board has (`PuzzleBoard`), the
 * numbers in black discs, and the one line drawn thick through the squares it has
 * reached, under the numbers. A number the line has passed takes the line's colour.
 *
 * It draws and reports: a press on a square, and each square a drag enters. What that
 * does to the line is `lineAfter` (`lib/puzzles/ichifude/draw.ts`), and `IchifudeSolve`
 * holds the line. Nothing on it can be selected or dragged off: the board is a place
 * to draw, so a finger on it draws rather than scrolling the page.
 */
export function IchifudeBoard({
  size,
  givens,
  code,
  wrong,
  solved = false,
  readOnly = false,
  label,
  onSquare,
  onKey,
}: {
  size: number;
  givens: string;
  /** The line, as a run keeps it (`ichifude/code.ts`). */
  code: string;
  /** The squares Show marked as off the answer. */
  wrong?: ReadonlySet<number>;
  solved?: boolean;
  /** Drawn only, never pressed: a preview, or a finished puzzle's page. */
  readOnly?: boolean;
  label: string;
  /** A square pressed (`begins`), or entered while the press is held. */
  onSquare?: (square: number, begins: boolean) => void;
  onKey?: (event: KeyboardEvent<HTMLDivElement>) => void;
}) {
  const numbers = useMemo(() => decodeNumbers(givens, size) ?? [], [givens, size]);
  const line = useMemo(() => decodeLine(code, size) ?? [], [code, size]);
  const placeOf = useMemo(() => {
    const places = new Map<number, number>();
    line.forEach((square, place) => places.set(square, place));
    return places;
  }, [line]);
  const box = useRef<HTMLDivElement>(null);
  const held = useRef<{ pointer: number; square: number } | null>(null);

  const squareAt = (event: PointerEvent<HTMLDivElement>): number | null => {
    const frame = box.current?.getBoundingClientRect();
    if (frame === undefined || frame.width === 0 || frame.height === 0) return null;
    const column = Math.floor(((event.clientX - frame.left) / frame.width) * size);
    const row = Math.floor(((event.clientY - frame.top) / frame.height) * size);
    return column < 0 || row < 0 || column >= size || row >= size ? null : row * size + column;
  };
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (readOnly || onSquare === undefined) return;
    const square = squareAt(event);
    if (square === null) return;
    box.current?.setPointerCapture?.(event.pointerId);
    held.current = { pointer: event.pointerId, square };
    onSquare(square, true);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const now = held.current;
    if (now === null || now.pointer !== event.pointerId || onSquare === undefined) return;
    const square = squareAt(event);
    if (square === null || square === now.square) return;
    held.current = { pointer: event.pointerId, square };
    onSquare(square, false);
  };
  const up = () => {
    held.current = null;
  };

  const head = line.at(-1);
  const points = line.map((square) => `${centre(square % size)},${centre(Math.floor(square / size))}`).join(" ");
  const inked = solved ? SOLVED_LINE : LINE;

  return (
    <div className="w-full select-none" data-testid="puzzle-grid" data-kind="ichifude" data-size={size} data-read-only={readOnly ? "true" : "false"} data-solved={solved ? "true" : "false"}>
      <PuzzleBoard size={size}>
        <div
          ref={box}
          className={`h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-accent ${readOnly ? "" : "cursor-pointer"}`}
          style={readOnly ? undefined : { touchAction: "none" }}
          tabIndex={readOnly ? -1 : 0}
          role={readOnly ? "img" : "application"}
          aria-label={label}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onKeyDown={readOnly ? undefined : onKey}
          data-testid="ichifude-board"
        >
          <svg viewBox={`0 0 ${size * CELL} ${size * CELL}`} className="block h-full w-full" aria-hidden="true">
            <rect width={size * CELL} height={size * CELL} fill={PAPER} />
            {numbers.map((_, square) => (
              <rect
                key={square}
                x={(square % size) * CELL}
                y={Math.floor(square / size) * CELL}
                width={CELL}
                height={CELL}
                fill={wrong?.has(square) === true ? WRONG : "transparent"}
                stroke={RULE}
                strokeWidth={2}
                data-testid="ichifude-square"
                data-square={square}
                data-number={numbers[square] === 0 ? undefined : numbers[square]}
                data-place={placeOf.get(square) ?? undefined}
                data-wrong={wrong?.has(square) === true ? "true" : undefined}
              />
            ))}
            {line.length > 1 ? <polyline points={points} fill="none" stroke={inked} strokeWidth={LINE_WIDTH} strokeLinecap="round" strokeLinejoin="round" data-testid="ichifude-line" /> : null}
            {head !== undefined && numbers[head] === 0 ? <circle cx={centre(head % size)} cy={centre(Math.floor(head / size))} r={HEAD_RADIUS} fill={PAPER} data-testid="ichifude-head" /> : null}
            {numbers.map((number, square) =>
              number === 0 ? null : (
                <g key={square}>
                  <circle cx={centre(square % size)} cy={centre(Math.floor(square / size))} r={NUMBER_RADIUS} fill={placeOf.has(square) ? inked : INK} />
                  <text x={centre(square % size)} y={centredBaseline(centre(Math.floor(square / size)), NUMBER_TEXT)} fontSize={NUMBER_TEXT} fontWeight={700} textAnchor="middle" fill={PAPER} style={{ fontFeatureSettings: '"tnum"' }}>
                    {number}
                  </text>
                </g>
              ),
            )}
          </svg>
        </div>
      </PuzzleBoard>
    </div>
  );
}
