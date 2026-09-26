"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/** Where a dragged tile came from: a place in the hand, or a square on the table. */
export type DragSource = { from: "hand"; at: number } | { from: "table"; square: string };

/** Where it was let go: a square on the table, the tray, or somewhere that is neither. */
export type DropTarget = { square: string } | { tray: true } | null;

/** The tile under the finger while it is dragged, drawn over everything at the pointer. */
export type Ghost = { letter: string; x: number; y: number };

/** How far a press must move before it is a drag rather than a tap. */
const DRAG_FROM_PX = 6;

/** What is under a point: a square (`data-square`), the tray (`data-tray`), or neither. */
function targetAt(x: number, y: number): DropTarget {
  const under = typeof document === "undefined" ? null : document.elementFromPoint(x, y);
  const square = under?.closest("[data-square]")?.getAttribute("data-square");
  if (square !== null && square !== undefined) return { square };
  if (under?.closest("[data-tray]") !== null && under?.closest("[data-tray]") !== undefined) return { tray: true };
  return null;
}

/**
 * DRAGGING A TILE, by mouse, pen or finger alike (pointer events: HTML drag and
 * drop does nothing on a phone). A press that moves a few pixels becomes a
 * drag: the tile follows the pointer, the table pans while it is held near an
 * edge (`nudge`, every frame), and letting go drops it on the square or the
 * tray under it. A press that does not move is left to be a tap, which every
 * tile also answers, so a keyboard and a thumb play the same game.
 *
 * The click a browser sends after a drag is swallowed (`clickWanted`), once:
 * the drop has already done what the drag meant.
 */
export function useTileDrag({ onDrop, nudge, disabled }: { onDrop: (source: DragSource, target: DropTarget) => void; nudge: (x: number, y: number) => void; disabled: boolean }) {
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const swallow = useRef(false);
  const stop = useRef<(() => void) | null>(null);
  const latest = useRef({ onDrop, nudge });
  useEffect(() => {
    latest.current = { onDrop, nudge };
  });
  useEffect(() => () => stop.current?.(), []);

  const start = useCallback(
    (source: DragSource, letter: string, event: ReactPointerEvent) => {
      if (disabled || event.button !== 0 || stop.current !== null) return;
      const id = event.pointerId;
      const from = { x: event.clientX, y: event.clientY };
      let at = from;
      let dragging = false;
      let frame = 0;
      const loop = () => {
        latest.current.nudge(at.x, at.y);
        frame = requestAnimationFrame(loop);
      };
      const move = (e: PointerEvent) => {
        if (e.pointerId !== id) return;
        at = { x: e.clientX, y: e.clientY };
        if (!dragging && Math.hypot(at.x - from.x, at.y - from.y) > DRAG_FROM_PX) {
          dragging = true;
          frame = requestAnimationFrame(loop);
        }
        if (dragging) {
          e.preventDefault();
          setGhost({ letter, x: at.x, y: at.y });
        }
      };
      const end = (e: PointerEvent, dropped: boolean) => {
        if (e.pointerId !== id) return;
        stop.current?.();
        if (!dragging) return;
        setGhost(null);
        swallow.current = true;
        window.setTimeout(() => (swallow.current = false), 0);
        if (dropped) latest.current.onDrop(source, targetAt(e.clientX, e.clientY));
      };
      const up = (e: PointerEvent) => end(e, true);
      const cancel = (e: PointerEvent) => end(e, false);
      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
      stop.current = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", cancel);
        stop.current = null;
      };
    },
    [disabled],
  );

  /** Whether a click is a tap to act on, rather than the one a browser sends after a drag. */
  const clickWanted = useCallback(() => !swallow.current, []);

  return { ghost, start, clickWanted };
}
