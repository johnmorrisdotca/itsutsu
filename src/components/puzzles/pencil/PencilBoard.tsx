"use client";

import { useMemo, useRef, type KeyboardEvent, type PointerEvent } from "react";

import { cellAt, edgeAt, type Fraction } from "@/lib/puzzles/pencil/geometry";
import type { PencilPress } from "@/lib/puzzles/pencil/input";
import type { PencilKind } from "@/lib/puzzles/pencil/pencil.types";

import { PuzzleBoard } from "../PuzzleBoard";
import { pencilSvg, type PencilView } from "./pencilDraw";

/** What a press at a point means on a board: a cell, or for Loop, drawn on its edges, the edge nearest; null off the board. */
function pressAt(kind: PencilKind, size: number, point: Fraction): { cell: number } | { edge: number } | null {
  if (kind === "loop") {
    const edge = edgeAt(size, point);
    return edge === null ? null : { edge };
  }
  const cell = cellAt(kind, size, point);
  return cell === null ? null : { cell };
}

/**
 * A PENCIL PUZZLE'S BOARD: Kazu's own drawing (`pencilSvg`) in the wood every
 * board has (`PuzzleBoard`), and a press on it read as a cell or an edge.
 *
 * Kazu draws; this reports. A press is a tap or a click on a cell (an edge, for Loop) and for Shikaku also a drag from one cell to another, which is
 * the rectangle between them. What a press means is `pressed` in
 * `lib/puzzles/pencil/input.ts`, and `PencilSolve` decides what to do with the
 * code it makes. The keyboard works on the board when it has the focus: the
 * arrows move, Enter or Space presses, a digit enters (`onKey`).
 *
 * Nothing on it can be selected or dragged off: the board is a place to press.
 */
export function PencilBoard({
  kind,
  size,
  givens,
  code,
  view,
  readOnly = false,
  label,
  onPress,
  onKey,
}: {
  kind: PencilKind;
  size: number;
  givens: string;
  code: string;
  view?: PencilView;
  /** Drawn only, never pressed: a preview, or a finished puzzle's page. */
  readOnly?: boolean;
  label: string;
  onPress?: (press: PencilPress) => void;
  onKey?: (event: KeyboardEvent<HTMLDivElement>) => void;
}) {
  const svg = useMemo(() => pencilSvg(kind, size, givens, code, view), [kind, size, givens, code, view]);
  const box = useRef<HTMLDivElement>(null);
  // Where a press began, so a drag across Shikaku's cells is told from a tap.
  const began = useRef<{ cell: number; pointer: number } | null>(null);

  const pointOf = (event: PointerEvent<HTMLDivElement>): Fraction | null => {
    const frame = box.current?.querySelector("svg")?.getBoundingClientRect();
    if (frame === undefined || frame.width === 0 || frame.height === 0) return null;
    return { x: (event.clientX - frame.left) / frame.width, y: (event.clientY - frame.top) / frame.height };
  };
  const down = (event: PointerEvent<HTMLDivElement>) => {
    began.current = null;
    if (readOnly || kind !== "shikaku") return;
    const point = pointOf(event);
    const cell = point === null ? null : cellAt(kind, size, point);
    if (cell !== null) began.current = { cell, pointer: event.pointerId };
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    if (readOnly || onPress === undefined) return;
    const point = pointOf(event);
    const press = point === null ? null : pressAt(kind, size, point);
    const start = began.current;
    began.current = null;
    if (press === null) return;
    // A drag from one cell to a different one is a rectangle; anything else is a press where the finger lifted.
    if (start !== null && start.pointer === event.pointerId && "cell" in press && press.cell !== start.cell) onPress({ from: start.cell, to: press.cell });
    else onPress(press);
  };

  return (
    <div className="w-full select-none" data-testid="puzzle-grid" data-kind={kind} data-size={size} data-selected={view?.selected ?? undefined} data-read-only={readOnly ? "true" : "false"}>
      <PuzzleBoard size={size}>
        {svg === null ? null : (
          <div
            ref={box}
            className={`h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-accent ${readOnly ? "" : "cursor-pointer"}`}
            style={{ touchAction: "manipulation" }}
            tabIndex={readOnly ? -1 : 0}
            role={readOnly ? "img" : "application"}
            aria-label={label}
            onPointerDown={down}
            onPointerUp={up}
            onKeyDown={readOnly ? undefined : onKey}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </PuzzleBoard>
    </div>
  );
}

