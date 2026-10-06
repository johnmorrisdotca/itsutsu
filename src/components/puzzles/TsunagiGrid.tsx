"use client";

import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from "react";

import { hexagonPoints } from "@/components/board/BoardLines";
import type { BoardThemeTokens } from "@/components/board/board.types";
import { CELL_BLOCKED, CELL_BRIDGE, inHex, type LinkLayout } from "@johnmorrisdotca/tsunagi";
import { overBridge, ownersOf, type Lines } from "@johnmorrisdotca/tsunagi";

import { PuzzleBoard } from "./PuzzleBoard";
import { TsunagiCell, TsunagiLine, TsunagiWash, washedBy } from "./TsunagiParts";
import { hexCellAt, tsunagiHexFit } from "./tsunagiHex";
import {
  tsunagiLineColour,
  tsunagiPortalColour,
  tsunagiWash,
  type TsunagiFill,
  type TsunagiMarks,
} from "./puzzles.constants";

/** How long a tapped portal shows its link to the other ring: a finger has no hover. */
const LINK_MS = 1800;

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
 *
 * A PORTAL is two rings alike, in a colour and a letter of their own: the line
 * is drawn stopping just inside the ring it went into and starting again just
 * inside the other, going on the way it went in. A faint link between the two
 * shows while the pointer is over either, and for a moment after either is
 * tapped, which is how a finger asks (`LINK_MS`).
 *
 * A HEXAGON is drawn as Hexversi's board is: the cells sheared into the
 * honeycomb and fitted to the box (`tsunagiHex.ts`), each cell outlined as a
 * hexagon, the square's corners left off, and the marbles stood upright again
 * so they stay round. A finger is on the hexagon nearest it.
 *
 * A BIG BOARD IS REDRAWN ONLY WHERE IT CHANGED. A 30×30 board is nine hundred
 * cells and up to eighty-two lines, and a finger moving through a cell used to
 * redraw all of them. Each cell is its own memoised component (`TsunagiCell`)
 * given only plain values, so a move re-renders the cells whose owner changed,
 * and each pair's line is its own (`TsunagiLine`), kept while its list of cells is.
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
  // A wrapping board is drawn one ghost cell wider all round.
  const ring = layout.wrap ? 1 : 0;
  const span = size + 2 * ring;
  const pressing = useRef<{ pointer: number; cell: number } | null>(null);
  const underBridges = `tsunagi-under-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const bridges = layout.cells.flatMap((cell, at) => (cell === CELL_BRIDGE ? [at] : []));
  const live = !readOnly && !done;
  const fit = layout.hex ? tsunagiHexFit(size) : null;
  // On a hexagon, the corners of the square are off the board: not drawn, not pressed.
  const onBoard = (at: number) => !layout.hex || inHex(size, at);
  // The portal whose link is showing: the pointer is over one of its rings, or one was tapped a moment ago.
  const [linked, setLinked] = useState<number | null>(null);
  const tapped = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(tapped.current), []);
  const portalOf = (cell: number): number => layout.portalPairs.findIndex(([a, b]) => a === cell || b === cell);
  const hover = useCallback((portal: number | null) => setLinked((now) => (portal === null && tapped.current !== 0 ? now : portal)), []);

  const cellAt = (event: PointerEvent<HTMLDivElement>): number | null => {
    const box = event.currentTarget.getBoundingClientRect();
    if (fit !== null) {
      const at = hexCellAt(size, fit, (event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height);
      return at !== null && onBoard(at) ? at : null;
    }
    const across = Math.floor(((event.clientX - box.left) / box.width) * span);
    const down = Math.floor(((event.clientY - box.top) / box.height) * span);
    if (across < 0 || down < 0 || across >= span || down >= span) return null;
    // A ghost cell is the real one it shows.
    const col = (across - ring + size) % size;
    const row = (down - ring + size) % size;
    return row * size + col;
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

  // Past Z the columns are numbered (26 to 30), two digits in a column barely eleven pixels wide on a phone: smaller there, so that no two run together.
  return (
    <div className={`w-full select-none ${size > 26 ? "[&_.board-coordinates]:text-[0.5rem]" : ""}`} data-testid="puzzle-grid" data-size={size} data-done={done ? "true" : "false"} data-marks={marks} data-fill={fill}>
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
          {/* The drawing and the cells, sheared into the honeycomb on a hexagon; as they are on a square. */}
          <div className="absolute inset-0" style={fit === null ? undefined : { transform: fit.transform, transformOrigin: "top left" }}>
          <svg viewBox={`0 0 ${span} ${span}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" data-wrap={layout.wrap ? "true" : undefined}
            // A hexagon's edge cells reach past the square they are sheared from; the board's own clip trims them, as Hexversi's.
            overflow={fit === null ? undefined : "visible"}>
            {layout.wrap ? (
              // Where the edges join: the real board marked off from its ghost.
              <rect x={ring} y={ring} width={size} height={size} fill="none" stroke={theme.line} strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" data-testid="tsunagi-wrap-edge" />
            ) : null}
            <g transform={`translate(${ring} ${ring})`}>
            {fit !== null ? (
              // A HEXAGON: each cell of it outlined, washed in its line's colour, and nothing drawn off it.
              layout.cells.map((cell, at) =>
                onBoard(at) ? (
                  <polygon
                    key={`hex-${at}`}
                    points={hexagonPoints((at % size) + 0.5, Math.floor(at / size) + 0.5)}
                    fill={owners[at]! >= 0 && cell < 0 ? tsunagiWash(owners[at]!, marks) : cell === CELL_BLOCKED ? theme.line : "none"}
                    fillOpacity={cell === CELL_BLOCKED ? 0.55 : 1}
                    stroke={theme.line}
                    strokeWidth={1}
                    strokeOpacity={0.55}
                    vectorEffect="non-scaling-stroke"
                    data-testid="tsunagi-hex-cell"
                  />
                ) : null,
              )
            ) : (
              <>
                {Array.from({ length: layout.ends.length }, (_, pair) => (
                  <TsunagiWash key={`wash-${pair}`} pair={pair} cells={washedBy(layout, owners, pair)} marks={marks} size={size} />
                ))}
                {owners.map((owner, at) =>
                  owner === CELL_BLOCKED ? <rect key={`block-${at}`} x={(at % size) + 0.08} y={Math.floor(at / size) + 0.08} width={0.84} height={0.84} rx={0.08} fill={theme.line} opacity={0.55} /> : null,
                )}
              </>
            )}
            {fit !== null ? null : Array.from({ length: size - 1 }, (_, at) => at + 1).map((at) => (
              <g key={`rule-${at}`} stroke={theme.line} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.55}>
                <line x1={at} y1={0} x2={at} y2={size} vectorEffect="non-scaling-stroke" />
                <line x1={0} y1={at} x2={size} y2={at} vectorEffect="non-scaling-stroke" />
              </g>
            ))}
            {layout.wrap || fit !== null ? null : <rect x={0} y={0} width={size} height={size} fill="none" stroke={theme.line} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />}
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
            {/* The lines, with every bridge's deck cut out of them: the line going down passes UNDER the bridge and is lost beneath it (John: "truly show the line rendering below the bridge"). */}
            {bridges.length === 0 ? null : (
              <mask id={underBridges} maskUnits="userSpaceOnUse" x={-2} y={-2} width={size + 4} height={size + 4}>
                <rect x={-2} y={-2} width={size + 4} height={size + 4} fill="white" />
                {bridges.map((at) => (
                  <rect key={at} x={(at % size) + 0.1} y={Math.floor(at / size) + 0.1} width={0.8} height={0.8} rx={0.14} fill="black" />
                ))}
              </mask>
            )}
            <g mask={bridges.length === 0 ? undefined : `url(#${underBridges})`}>
              {lines.map((line, pair) => (line.length < 2 ? null : <TsunagiLine key={`line-${pair}`} line={line} pair={pair} size={size} wrap={layout.wrap} hex={layout.hex} portals={layout.portals} marks={marks} />))}
            </g>
            {/* Then the bridge on top of the line beneath it, and the line going across drawn over its deck. */}
            {bridges.map((at) => {
              const x = at % size;
              const y = Math.floor(at / size);
              const pair = overBridge(lines, at).across;
              const line = pair < 0 ? null : lines[pair]!;
              const on = line === null ? -1 : line.indexOf(at);
              const ends = line === null ? [] : [line[on - 1], line[on + 1]].filter((cell): cell is number => cell !== undefined);
              return (
                <g key={`bridge-${at}`} data-testid="tsunagi-bridge" data-cell={at} data-across={pair >= 0 ? pair : undefined}>
                  <rect x={x + 0.1} y={y + 0.1} width={0.8} height={0.8} rx={0.14} fill={theme.line} opacity={0.22} />
                  {[0.16, 0.84].map((edge) => (
                    <line key={edge} x1={x + 0.1} y1={y + edge} x2={x + 0.9} y2={y + edge} stroke={theme.line} strokeWidth={0.07} strokeLinecap="round" />
                  ))}
                  {ends.length === 0 ? null : (
                    <polyline
                      // From the edge it came in by, through the middle, out by the edge beyond: the part of the line the deck cut out.
                      points={[ends[0]!, at, ...ends.slice(1)].map((cell) => (cell === at ? `${x + 0.5},${y + 0.5}` : `${x + 0.5 + ((cell % size) - x) / 2},${y + 0.5}`)).join(" ")}
                      fill="none"
                      stroke={tsunagiLineColour(pair, marks)}
                      strokeWidth={0.3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      data-testid="tsunagi-over-bridge"
                    />
                  )}
                </g>
              );
            })}
            {/* A PORTAL's link, a faint bowed dashed line between its two rings: shown while the pointer is over one, or just after one was tapped. */}
            {layout.portalPairs.map(([a, b], index) => {
              const [ax, ay] = [(a % size) + 0.5, Math.floor(a / size) + 0.5];
              const [bx, by] = [(b % size) + 0.5, Math.floor(b / size) + 0.5];
              const bow = [(ax + bx) / 2 + (ay - by) * 0.12, (ay + by) / 2 + (bx - ax) * 0.12];
              return (
                <path
                  key={`portal-link-${index}`}
                  d={`M${ax} ${ay}Q${bow[0]} ${bow[1]} ${bx} ${by}`}
                  fill="none"
                  stroke={tsunagiPortalColour(index)}
                  strokeWidth={0.06}
                  strokeDasharray="0.03 0.16"
                  strokeLinecap="round"
                  opacity={linked === index ? 0.65 : 0}
                  data-testid="tsunagi-portal-link"
                  data-portal={index}
                  data-shown={linked === index ? "true" : "false"}
                />
              );
            })}
            </g>
          </svg>
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${span}, minmax(0, 1fr))` }}>
            {Array.from({ length: span * span }, (_, place) => {
              const across = place % span;
              const down = Math.floor(place / span);
              const at = ((down - ring + size) % size) * size + ((across - ring + size) % size);
              const ghost = across < ring || down < ring || across >= size + ring || down >= size + ring;
              // Off a hexagon's edge: a place in the grid and nothing more.
              if (!ghost && !onBoard(at)) return <div key={at} aria-hidden="true" />;
              const portal = layout.portals.has(at) ? portalOf(at) : -1;
              return (
                <TsunagiCell
                  key={ghost ? `ghost-${place}` : at}
                  at={at}
                  ghost={ghost}
                  cell={layout.cells[at]!}
                  owner={owners[at]!}
                  waypoint={layout.waypoints.get(at) ?? -1}
                  portal={portal}
                  marks={marks}
                  fill={fill}
                  unslant={fit !== null}
                  size={size}
                  blasted={blasted?.has(at) === true}
                  flagged={layout.cells[at]! >= 0 && flagged?.has(layout.cells[at]!) === true}
                  onLink={hover}
                />
              );
            })}
          </div>
          </div>
        </div>
      </PuzzleBoard>
    </div>
  );
}
