"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

import { isLocked, shapeOf, SIDES, type Layout } from "@johnmorrisdotca/suido";
import { drawSuido, paintSuido, SUIDO_STYLE } from "@johnmorrisdotca/suido/draw";

import { PuzzleBoard } from "./PuzzleBoard";

const SIDE_WORDS = ["north", "east", "south", "west"] as const;

/** What a screen reader hears for one cell: where it is, what piece it holds, which sides it opens on, and whether it is a pump or a drain. */
function cellLabel(layout: Layout, masks: readonly number[], cell: number): string {
  const mask = masks[cell] ?? 0;
  const shape = shapeOf(mask);
  const where = `row ${Math.floor(cell / layout.width) + 1}, column ${(cell % layout.width) + 1}`;
  if (shape === "blank") return `${where}: bare ground`;
  const opens = SIDES.map((bit, side) => ((mask & bit) !== 0 ? SIDE_WORDS[side] : null)).filter((word) => word !== null);
  const role = layout.sources.includes(cell) ? ", pump" : layout.drains.includes(cell) ? ", drain" : "";
  // A level's locked piece cannot be turned: said, so a reader's tools do not offer a press that does nothing.
  const lock = isLocked(layout, cell) ? ", locked" : "";
  return `${where}: ${shape === "tee" ? "T" : shape} piece${role}${lock}, open ${opens.join(" and ")}`;
}

/** The cell an arrow key moves to from `cell`, staying on the board. */
function neighbour(layout: Layout, cell: number, key: string): number {
  const col = cell % layout.width;
  const row = Math.floor(cell / layout.width);
  if (key === "ArrowLeft" && col > 0) return cell - 1;
  if (key === "ArrowRight" && col < layout.width - 1) return cell + 1;
  if (key === "ArrowUp" && row > 0) return cell - layout.width;
  if (key === "ArrowDown" && row < layout.height - 1) return cell + layout.width;
  return cell;
}

/**
 * THE SUIDO BOARD: the package's own drawing, in the wood every board has
 * (`PuzzleBoard`), with the water running along it.
 *
 * The drawing is made once, as SVG text, and then never redrawn: after each
 * turn `paintSuido` writes onto it how the pieces face and where the water has
 * got to, which is what lets the pipes be seen to turn and the water to run on
 * from the pump, and back out of a pipe turned away. Redrawing the board with
 * the new state would put every piece where it was going in the same instant,
 * with nothing to see move. So the text is held in state and never changes,
 * and React is told so (`dangerouslySetInnerHTML` of a string that is the same
 * every render leaves the element alone).
 *
 * A tap on a piece turns it a quarter: clockwise, or anticlockwise where
 * Shift is held, a right click is made, or the way is chosen under the board
 * (`anticlockwise`). The keyboard has one piece at a time (the arrows move,
 * Enter or Space turns it). Nothing on it can be selected or dragged: the
 * package's style sees to that.
 */
export function SuidoBoard({
  layout,
  masks,
  quarters,
  hint = null,
  readOnly = false,
  done = false,
  anticlockwise = false,
  onTurn,
}: {
  /** The board as it was dealt: every piece, pump and drain where they are. */
  layout: Layout;
  /** How every piece faces now, and how far each has been turned in all (`Game`). */
  masks: readonly number[];
  quarters: readonly number[];
  /** The piece a Hint turned, lit until the next turn. */
  hint?: number | null;
  /** Drawn only, never pressed: a preview, or a finished puzzle's page. */
  readOnly?: boolean;
  done?: boolean;
  /** Which way a plain tap turns a piece. */
  anticlockwise?: boolean;
  onTurn?: (cell: number, by: 1 | -1) => void;
}) {
  const live = !readOnly && !done;
  const box = useRef<HTMLDivElement>(null);
  const cursor = useRef(0);
  // Made once, from where the board stood when it was first drawn, so the picture is never replaced under the water.
  const [drawn] = useState(() => drawSuido(layout, { masks, quarters, label: `Suido board, ${layout.width} by ${layout.height}` }));

  /* What changed: the water and the turns painted on, and what a reader's tools are told about each piece. */
  useEffect(() => {
    const svg = box.current?.querySelector("svg");
    if (svg === null || svg === undefined) return;
    paintSuido(svg, layout, masks, quarters);
    svg.querySelectorAll<SVGGElement>(".sd-cell").forEach((cell, at) => {
      cell.setAttribute("data-testid", "suido-cell");
      cell.setAttribute("data-mask", String(masks[at] ?? 0));
      cell.setAttribute("aria-label", cellLabel(layout, masks, at));
      if (live) cell.setAttribute("role", "button");
      else cell.removeAttribute("role");
      cell.setAttribute("tabindex", live && at === cursor.current ? "0" : "-1");
      if (hint === at) cell.setAttribute("data-hint", "true");
      else cell.removeAttribute("data-hint");
    });
  }, [layout, masks, quarters, hint, live]);

  const cellOf = (target: EventTarget | null): number | null => {
    const found = target instanceof Element ? target.closest(".sd-cell") : null;
    const at = found === null ? NaN : Number(found.getAttribute("data-cell"));
    return Number.isInteger(at) ? at : null;
  };
  const press = (event: MouseEvent<HTMLDivElement>) => {
    const cell = cellOf(event.target);
    if (!live || cell === null) return;
    cursor.current = cell;
    onTurn?.(cell, event.shiftKey !== anticlockwise ? -1 : 1);
  };
  const aside = (event: MouseEvent<HTMLDivElement>) => {
    const cell = cellOf(event.target);
    if (!live || cell === null) return;
    event.preventDefault();
    cursor.current = cell;
    onTurn?.(cell, -1);
  };
  const keyed = (event: KeyboardEvent<HTMLDivElement>) => {
    const cell = cellOf(event.target);
    if (!live || cell === null) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      cursor.current = cell;
      onTurn?.(cell, event.shiftKey !== anticlockwise ? -1 : 1);
      return;
    }
    const next = neighbour(layout, cell, event.key);
    if (!event.key.startsWith("Arrow")) return;
    event.preventDefault();
    if (next === cell) return;
    cursor.current = next;
    const cells = box.current?.querySelectorAll<SVGGElement>(".sd-cell");
    cells?.forEach((each, at) => each.setAttribute("tabindex", at === next ? "0" : "-1"));
    cells?.[next]?.focus();
  };

  return (
    <div className="w-full select-none" data-testid="puzzle-grid" data-size={layout.width} data-rows={layout.height} data-done={done ? "true" : "false"}>
      {/* A long board (a level's 5×7, 6×10 or 8×14) is the wood it is: squares still square, taller than it is wide (`PuzzleBoard`'s rows). */}
      <PuzzleBoard size={layout.width} rows={layout.height === layout.width ? undefined : layout.height}>
        {/* The package's style, once for the board it draws: its colours follow the device's light or dark. */}
        <style>{SUIDO_STYLE}</style>
        <div
          ref={box}
          className={`h-full w-full ${live ? "cursor-pointer" : ""}`}
          style={{ touchAction: "manipulation" }}
          onClick={press}
          onContextMenu={aside}
          onKeyDown={keyed}
          data-testid="suido-board"
          dangerouslySetInnerHTML={{ __html: drawn }}
        />
      </PuzzleBoard>
    </div>
  );
}
