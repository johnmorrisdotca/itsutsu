"use client";

import { memo } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { cellLabel } from "@/lib/puzzles/cellLabel";
import { CELL_BLOCKED, CELL_BRIDGE } from "@johnmorrisdotca/tsunagi";
import { portalMark } from "@johnmorrisdotca/tsunagi/draw";

/**
 * ONE CELL OF THE TSUNAGI BOARD, OVER THE DRAWING: nothing to see, and what a screen reader reads (the cell, what is on
 * it, in the reader's language) and what a pointer hovers on a portal. The drawing itself is the package's
 * (`TsunagiGrid`). Given only plain values, so it is written again only when something about it changed: a finger
 * moving through a cell changes one or two pairs' cells, and the other nine hundred stay as they were.
 */
export const TsunagiCell = memo(function TsunagiCell({
  at,
  ghost,
  left,
  top,
  share,
  cell,
  owner,
  waypoint,
  portal,
  size,
  onLink,
}: {
  at: number;
  ghost: boolean;
  /** Where its box starts and how much of the board it takes, all in percent of the board. */
  left: number;
  top: number;
  share: number;
  cell: number;
  owner: number;
  /** The pair a waypoint here is for, or -1. */
  waypoint: number;
  /** The portal this cell is a ring of, or -1. */
  portal: number;
  size: number;
  onLink: (portal: number | null) => void;
}) {
  const say = useSpeaker();
  const box = { position: "absolute", left: `${left}%`, top: `${top}%`, width: `${share}%`, height: `${share}%` } as const;
  // A ghost of the far edge is the real cell a finger is on, drawn faded, and nothing to read twice.
  if (ghost) return <div style={box} data-ghost={at} aria-hidden="true" />;
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
    ...(portal < 0 ? [] : [say.say("pmaze.tsunagi.cell.portal", { mark: portalMark(portal) })]),
  );
  return (
    <div
      style={box}
      data-testid="puzzle-cell"
      data-index={at}
      data-owner={owner >= 0 ? owner : undefined}
      data-stone={cell >= 0 ? cell : undefined}
      aria-label={label}
      role="img"
      onPointerEnter={portal < 0 ? undefined : () => onLink(portal)}
      onPointerLeave={portal < 0 ? undefined : () => onLink(null)}
    />
  );
});
