"use client";

import { useRef, type PointerEvent } from "react";

import type { BoardThemeTokens } from "@/components/board/board.types";
import { CELL_BLOCKED, CELL_BRIDGE, stepBetween, type LinkLayout } from "@/lib/puzzles/tsunagi/code";
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
 *
 * A WAYPOINT is drawn as a ring of its line's colour. A board that WRAPS is
 * drawn with a ghost of the far edge all round it, faded (John: "a ghost of the
 * far edge"): the cell beyond the right edge shows the left edge's, and so on.
 * A finger dragged onto a ghost cell is on the real one it shows, and a line
 * across the join is drawn out through one edge into the ghost and in through
 * the other.
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
  onPress?: (cell: number) => void;
  onDrag?: (cell: number) => void;
  onLift?: () => void;
}) {
  const { size } = layout;
  const owners = ownersOf(layout, lines);
  // A wrapping board is drawn one ghost cell wider all round.
  const ring = layout.wrap ? 1 : 0;
  const span = size + 2 * ring;
  const pressing = useRef<{ pointer: number; cell: number } | null>(null);
  const live = !readOnly && !done;

  const cellAt = (event: PointerEvent<HTMLDivElement>): number | null => {
    const box = event.currentTarget.getBoundingClientRect();
    const across = Math.floor(((event.clientX - box.left) / box.width) * span);
    const down = Math.floor(((event.clientY - box.top) / box.height) * span);
    if (across < 0 || down < 0 || across >= span || down >= span) return null;
    // A ghost cell is the real one it shows.
    const col = (across - ring + size) % size;
    const row = (down - ring + size) % size;
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
      <PuzzleBoard size={span} theme={theme} coordinates={!layout.wrap}>
        <div
          className={`relative h-full w-full ${live ? "cursor-pointer" : ""}`}
          style={{ touchAction: "none" }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          data-testid="tsunagi-board"
        >
          <svg viewBox={`0 0 ${span} ${span}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" data-wrap={layout.wrap ? "true" : undefined}>
            {layout.wrap ? (
              // Where the edges join: the real board marked off from its ghost.
              <rect x={ring} y={ring} width={size} height={size} fill="none" stroke={theme.line} strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" data-testid="tsunagi-wrap-edge" />
            ) : null}
            <g transform={`translate(${ring} ${ring})`}>
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
            {layout.wrap ? null : <rect x={0} y={0} width={size} height={size} fill="none" stroke={theme.line} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />}
            {/* A BRIDGE: a deck with a rail each side, the way across it; one line goes over it across and another down (`steps.ts`). */}
            {layout.cells.map((cell, at) =>
              cell === CELL_BRIDGE ? (
                <g key={`bridge-${at}`} data-testid="tsunagi-bridge" data-cell={at}>
                  <rect x={(at % size) + 0.1} y={Math.floor(at / size) + 0.1} width={0.8} height={0.8} rx={0.14} fill={theme.line} opacity={0.22} />
                  {[0.16, 0.84].map((edge) => (
                    <line key={edge} x1={(at % size) + 0.1} y1={Math.floor(at / size) + edge} x2={(at % size) + 0.9} y2={Math.floor(at / size) + edge} stroke={theme.line} strokeWidth={0.07} strokeLinecap="round" />
                  ))}
                </g>
              ) : null,
            )}
            {/* A WALL: a thick bar on the edge between two cells, which no line crosses. */}
            {[...layout.walls].map((wall) => {
              const [a, b] = wall.split("-").map(Number) as [number, number];
              const row = Math.floor(a / size);
              const col = a % size;
              const across = b === a + 1;
              return (
                <line
                  key={`wall-${wall}`}
                  x1={across ? col + 1 : col}
                  y1={across ? row : row + 1}
                  x2={across ? col + 1 : col + 1}
                  y2={across ? row + 1 : row + 1}
                  stroke={theme.line}
                  strokeWidth={0.14}
                  strokeLinecap="round"
                  data-testid="tsunagi-wall"
                  data-edge={wall}
                />
              );
            })}
            {lines.map((line, pair) =>
              line.length < 2 ? null : (
                <g key={`line-${pair}`} data-testid="tsunagi-line" data-pair={pair} data-cells={line.length}>
                  {runsOf(line, size, layout.wrap).map((points, at) => (
                    <polyline
                      key={at}
                      points={points.map(([x, y]) => `${x + 0.5},${y + 0.5}`).join(" ")}
                      fill="none"
                      stroke={tsunagiLineColour(pair, marks)}
                      strokeWidth={0.3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </g>
              ),
            )}
            </g>
          </svg>
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${span}, minmax(0, 1fr))` }}>
            {Array.from({ length: span * span }, (_, place) => {
              const across = place % span;
              const down = Math.floor(place / span);
              const at = ((down - ring + size) % size) * size + ((across - ring + size) % size);
              const ghost = across < ring || down < ring || across >= size + ring || down >= size + ring;
              const cell = layout.cells[at]!;
              const owner = owners[at]!;
              const waypoint = layout.waypoints.get(at);
              if (ghost) {
                // A ghost of the far edge: what is there, faded, and nothing to find in a test's count.
                return (
                  <div key={`ghost-${place}`} className="relative flex items-center justify-center opacity-35" data-ghost={at} aria-hidden="true">
                    {cell >= 0 ? (
                      <span className={`${TSUNAGI_MARBLE} ${size >= 8 ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`} style={tsunagiMarbleLook(cell, marks)}>
                        {marks === "numbers" ? cell + 1 : null}
                      </span>
                    ) : fill === "marbles" && owner >= 0 ? (
                      <span className={TSUNAGI_BEAD} style={tsunagiBeadLook(owner, marks)} />
                    ) : null}
                  </div>
                );
              }
              const label = `row ${Math.floor(at / size) + 1}, column ${(at % size) + 1}${cell >= 0 ? `, marble ${cell + 1}` : owner >= 0 ? `, line ${owner + 1}` : cell === CELL_BLOCKED ? ", blocked" : cell === CELL_BRIDGE ? ", bridge" : ", empty"}${waypoint === undefined ? "" : `, waypoint for line ${waypoint + 1}`}`;
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
                  {waypoint === undefined ? null : (
                    // A WAYPOINT: a ring of its line's colour on a cell only that line may pass.
                    <span
                      className="pointer-events-none absolute inset-[18%] flex items-center justify-center rounded-full border-[3px] text-[0.6rem] font-bold"
                      style={{ borderColor: tsunagiLineColour(waypoint, marks), color: tsunagiLineColour(waypoint, marks) }}
                      data-testid="tsunagi-waypoint"
                      data-pair={waypoint}
                    >
                      {marks === "numbers" && owner < 0 ? waypoint + 1 : null}
                    </span>
                  )}
                  {cell >= 0 && flagged?.has(cell) ? (
                    <span
                      className="pointer-events-none absolute inset-[8%] animate-ping rounded-full border-4"
                      style={{ borderColor: tsunagiLineColour(cell, marks) }}
                      data-testid="tsunagi-flag"
                      data-pair={cell}
                    />
                  ) : null}
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

/**
 * A line as the runs it is drawn in, each a list of [column, row] points. On a
 * board that wraps, a step across the join ends one run a cell out beyond the
 * edge (in the ghost) and starts the next a cell out beyond the other edge, so
 * the line is seen to leave and come back.
 */
function runsOf(line: readonly number[], size: number, wrap: boolean): [number, number][][] {
  const point = (cell: number): [number, number] => [cell % size, Math.floor(cell / size)];
  const runs: [number, number][][] = [[point(line[0]!)]];
  for (let at = 1; at < line.length; at += 1) {
    const from = line[at - 1]!;
    const to = line[at]!;
    const plain = stepBetween(size, from, to, false) !== 0 || Math.abs(to - from) === 2 || Math.abs(to - from) === 2 * size;
    if (plain || !wrap) {
      runs[runs.length - 1]!.push(point(to));
      continue;
    }
    const by = stepBetween(size, from, to, true);
    const [dx, dy] = Math.abs(by) === 1 ? [Math.sign(by), 0] : [0, Math.sign(by)];
    const [fx, fy] = point(from);
    const [tx, ty] = point(to);
    runs[runs.length - 1]!.push([fx + dx, fy + dy]);
    runs.push([[tx - dx, ty - dy], [tx, ty]]);
  }
  return runs;
}
