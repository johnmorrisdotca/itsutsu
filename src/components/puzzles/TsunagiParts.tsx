"use client";

import { memo } from "react";

import { HEX_LATTICE } from "@/components/board/Board.constants";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { cellLabel } from "@/lib/puzzles/cellLabel";
import { CELL_BLOCKED, CELL_BRIDGE, stepBetween, type LinkLayout } from "@johnmorrisdotca/tsunagi";
import {
  TSUNAGI_BEAD,
  TSUNAGI_MARBLE,
  TSUNAGI_MARBLE_ACROSS,
  TSUNAGI_MARBLE_CELL,
  TSUNAGI_PORTAL_RING,
  TSUNAGI_PORTAL_STUB,
  TSUNAGI_WAYPOINT_RING,
  tsunagiBeadLook,
  tsunagiLineColour,
  tsunagiMarbleLook,
  tsunagiNumberType,
  tsunagiPortalColour,
  tsunagiPortalMark,
  tsunagiPortalWash,
  tsunagiWash,
  type TsunagiFill,
  type TsunagiMarks,
} from "./puzzles.constants";

/*
 * THE PIECES OF THE TSUNAGI BOARD THAT ARE KEPT WHILE WHAT THEY DRAW IS: a pair's wash, a pair's line and one cell, each
 * given only plain values so that a finger moving through a cell draws one or two pairs again and not the thousands of
 * elements of a 30×30 board (`TsunagiGrid.tsx` lays them out).
 */

/** The cells of the open (not marble, not bridge) kind a pair's line runs through: what its wash covers. */
export function washedBy(layout: LinkLayout, owners: readonly number[], pair: number): number[] {
  const cells: number[] = [];
  owners.forEach((owner, at) => {
    if (owner === pair && layout.cells[at]! < 0) cells.push(at);
  });
  return cells;
}

/** One pair's wash: a square of its faint colour under every cell its line runs through, kept while those cells are. */
export const TsunagiWash = memo(function TsunagiWash({ pair, cells, marks, size }: { pair: number; cells: readonly number[]; marks: TsunagiMarks; size: number }) {
  if (cells.length === 0) return null;
  return <path d={cells.map((at) => `M${at % size} ${Math.floor(at / size)}h1v1h-1z`).join("")} fill={tsunagiWash(pair, marks)} />;
}, (before, after) => before.pair === after.pair && before.marks === after.marks && before.size === after.size && before.cells.length === after.cells.length && before.cells.every((cell, at) => cell === after.cells[at]));

/** One pair's line, drawn as its runs of points, kept for as long as its list of cells is the same list. */
export const TsunagiLine = memo(function TsunagiLine({ line, pair, size, wrap, hex, portals, marks }: { line: readonly number[]; pair: number; size: number; wrap: boolean; hex: boolean; portals: ReadonlyMap<number, number>; marks: TsunagiMarks }) {
  return (
    <g data-testid="tsunagi-line" data-pair={pair} data-cells={line.length}>
      {runsOf(line, size, wrap, hex, portals).map((points, at) => (
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
  );
});

/**
 * ONE CELL OF THE BOARD, given only plain values so that it is drawn again only when something about it changed:
 * what is on it (a marble, a line's owner, a waypoint, a portal), and the look. A finger moving through a cell
 * changes one or two pairs' cells; the other nine hundred stay as they were.
 */
export const TsunagiCell = memo(function TsunagiCell({
  at,
  ghost,
  cell,
  owner,
  waypoint,
  portal,
  marks,
  fill,
  unslant,
  size,
  blasted,
  flagged,
  onLink,
}: {
  at: number;
  ghost: boolean;
  cell: number;
  owner: number;
  /** The pair a waypoint here is for, or -1. */
  waypoint: number;
  /** The portal this cell is a ring of, or -1. */
  portal: number;
  marks: TsunagiMarks;
  fill: TsunagiFill;
  /** On a hexagon the cell stands upright again inside the sheared lattice. */
  unslant: boolean;
  size: number;
  blasted: boolean;
  /** A marble here whose pair Check found not joined: it flashes. */
  flagged: boolean;
  onLink: (portal: number | null) => void;
}) {
  const say = useSpeaker();
  if (ghost) {
    // A ghost of the far edge: what is there, faded, and nothing to find in a test's count.
    return (
      <div className={`${TSUNAGI_MARBLE_CELL} relative flex items-center justify-center opacity-35`} data-ghost={at} aria-hidden="true">
        {cell >= 0 ? (
          <span className={TSUNAGI_MARBLE} style={{ ...tsunagiMarbleLook(cell, marks), ...tsunagiNumberType(cell + 1, TSUNAGI_MARBLE_ACROSS) }}>
            {marks === "numbers" ? cell + 1 : null}
          </span>
        ) : fill === "marbles" && owner >= 0 && portal < 0 ? (
          <span className={TSUNAGI_BEAD} style={tsunagiBeadLook(owner, marks)} />
        ) : null}
      </div>
    );
  }
  const what =
    cell >= 0
      ? say.say("pmaze.tsunagi.cell.marble", { n: String(cell + 1) })
      : owner >= 0
        ? say.say("pmaze.tsunagi.cell.line", { n: String(owner + 1) })
        : cell === CELL_BLOCKED
          ? say.say("pmaze.tsunagi.cell.blocked")
          : cell === CELL_BRIDGE
            ? say.say("pmaze.tsunagi.cell.bridge")
            : say.say("pmaze.tsunagi.cell.empty");
  const label = cellLabel(
    say,
    Math.floor(at / size),
    at % size,
    what,
    ...(waypoint < 0 ? [] : [say.say("pmaze.tsunagi.cell.waypoint", { n: String(waypoint + 1) })]),
    ...(portal < 0 ? [] : [say.say("pmaze.tsunagi.cell.portal", { mark: tsunagiPortalMark(portal) })]),
  );
  return (
    <div
      className={`${TSUNAGI_MARBLE_CELL} relative flex items-center justify-center`}
      data-testid="puzzle-cell"
      data-index={at}
      data-owner={owner >= 0 ? owner : undefined}
      data-stone={cell >= 0 ? cell : undefined}
      aria-label={label}
      role="img"
      // On a hexagon the cell stands upright again inside the sheared lattice, so its marble stays round.
      style={unslant ? { transform: HEX_LATTICE.unslant } : undefined}
      onPointerEnter={portal < 0 ? undefined : () => onLink(portal)}
      onPointerLeave={portal < 0 ? undefined : () => onLink(null)}
    >
      {waypoint < 0 ? null : (
        // A WAYPOINT: a ring of its line's colour on a cell only that line may pass.
        <span
          className="pointer-events-none absolute inset-[18%] flex items-center justify-center rounded-full font-bold leading-none tabular-nums"
          // The ring thins on a small cell, and its number is sized to what is left inside it, as a marble's is.
          style={{ borderStyle: "solid", borderWidth: TSUNAGI_WAYPOINT_RING, borderColor: tsunagiLineColour(waypoint, marks), color: tsunagiLineColour(waypoint, marks), ...tsunagiNumberType(waypoint + 1, `(64cqw - 2 * ${TSUNAGI_WAYPOINT_RING})`, "0.6rem") }}
          data-testid="tsunagi-waypoint"
          data-pair={waypoint}
        >
          {marks === "numbers" && owner < 0 ? waypoint + 1 : null}
        </span>
      )}
      {portal < 0 ? null : (
        // A PORTAL's ring: two alike are one portal, in a colour and a Greek letter of their own; a line goes into one and comes out of the other.
        <span
          className="absolute inset-[10%] flex items-center justify-center rounded-full font-bold leading-none"
          style={{ borderStyle: "solid", borderWidth: TSUNAGI_PORTAL_RING, borderColor: tsunagiPortalColour(portal), backgroundColor: tsunagiPortalWash(tsunagiPortalColour(portal)), color: tsunagiPortalColour(portal), fontSize: "min(55cqw, 1.5rem)" }}
          data-testid="tsunagi-portal"
          data-portal={portal}
        >
          {tsunagiPortalMark(portal)}
        </span>
      )}
      {blasted ? (
        // AN EXPLOSION: where a line was, a burst that spreads and fades; held still for a reader who asked for less motion.
        <span className="pointer-events-none absolute inset-[12%] rounded-full border-4 border-shu bg-shu/40 motion-safe:animate-ping" data-testid="tsunagi-blast" data-cell={at} />
      ) : null}
      {flagged ? (
        <span className="pointer-events-none absolute inset-[8%] animate-ping rounded-full border-4" style={{ borderColor: tsunagiLineColour(cell, marks) }} data-testid="tsunagi-flag" data-pair={cell} />
      ) : null}
      {cell >= 0 ? (
        <span className={TSUNAGI_MARBLE} style={{ ...tsunagiMarbleLook(cell, marks), ...tsunagiNumberType(cell + 1, TSUNAGI_MARBLE_ACROSS) }} data-testid="tsunagi-marble" data-pair={cell}>
          {marks === "numbers" ? cell + 1 : null}
        </span>
      ) : fill === "marbles" && owner >= 0 && portal < 0 ? (
        <span className={TSUNAGI_BEAD} style={tsunagiBeadLook(owner, marks)} data-testid="tsunagi-bead" data-pair={owner} />
      ) : null}
    </div>
  );
});

/**
 * A line as the runs it is drawn in, each a list of [column, row] points. On a
 * board that wraps, a step across the join ends one run a cell out beyond the
 * edge (in the ghost) and starts the next a cell out beyond the other edge, so
 * the line is seen to leave and come back. Through a portal the line is two runs:
 * it stops just inside the ring it went into (`TSUNAGI_PORTAL_STUB` from its middle,
 * on the side it came in by) and the next starts just inside the other, going on the
 * way it went in.
 */
function runsOf(line: readonly number[], size: number, wrap: boolean, hex = false, portals: ReadonlyMap<number, number> = new Map()): [number, number][][] {
  const point = (cell: number): [number, number] => [cell % size, Math.floor(cell / size)];
  /** Which way a step goes, as a unit step across and down. */
  const heading = (from: number, to: number): [number, number] => {
    const by = stepBetween(size, from, to, wrap);
    return Math.abs(by) === 1 ? [Math.sign(by), 0] : [0, Math.sign(by)];
  };
  const runs: [number, number][][] = [[point(line[0]!)]];
  for (let at = 1; at < line.length; at += 1) {
    const from = line[at - 1]!;
    const to = line[at]!;
    // Out of a portal's first cell into its other: the line has been through, and comes out going the way it went in.
    if (portals.get(from) === to && at >= 2) {
      const [dx, dy] = heading(line[at - 2]!, from);
      const [tx, ty] = point(to);
      runs.push([[tx + dx * TSUNAGI_PORTAL_STUB, ty + dy * TSUNAGI_PORTAL_STUB]]);
      continue;
    }
    // Into a portal's first cell: it stops just inside the ring, on the side it came in by.
    const entering = portals.get(to) === line[at + 1];
    const plain = hex || stepBetween(size, from, to, false) !== 0 || Math.abs(to - from) === 2 || Math.abs(to - from) === 2 * size;
    if (plain || !wrap) {
      const [x, y] = point(to);
      const [dx, dy] = entering ? heading(from, to) : [0, 0];
      runs[runs.length - 1]!.push([x - dx * TSUNAGI_PORTAL_STUB, y - dy * TSUNAGI_PORTAL_STUB]);
      continue;
    }
    const by = stepBetween(size, from, to, true);
    const [dx, dy] = Math.abs(by) === 1 ? [Math.sign(by), 0] : [0, Math.sign(by)];
    const [fx, fy] = point(from);
    const [tx, ty] = point(to);
    runs[runs.length - 1]!.push([fx + dx, fy + dy]);
    runs.push([[tx - dx, ty - dy], entering ? [tx - dx * TSUNAGI_PORTAL_STUB, ty - dy * TSUNAGI_PORTAL_STUB] : [tx, ty]]);
  }
  return runs;
}
