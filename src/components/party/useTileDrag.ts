"use client";

import { useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";

import { TRAIN_DOUBLE_TAP_MS, TRAIN_DRAG_PX } from "./party.constants";

/** A finger or a mouse down on a tile: where it went down, whether it has become a drag, and where it is now. */
type Press = { tile: number; pointer: number; fromX: number; fromY: number; dragging: boolean; x: number; y: number };

/** The train under a point on the screen, read off the table's rows (`data-train`), or null over anything else. */
function trainAt(x: number, y: number): number | null {
  for (const element of document.elementsFromPoint(x, y)) {
    const row = element.closest("[data-train]");
    if (row !== null) return Number(row.getAttribute("data-train"));
  }
  return null;
}

/**
 * DRAG AND TAP FOR A HAND OF TILES, with pointer events so a mouse and a
 * finger are one code path. John: "the cards are all draggable".
 *
 *  - A press that moves further than `TRAIN_DRAG_PX` is a drag: the tile
 *    follows the finger (`floating`), the table lights where it may go, and
 *    letting go over a lit train lays it there. Let go anywhere else and it
 *    goes back to the hand.
 *  - A press that does not move is a tap: it chooses the tile, or puts it
 *    down again.
 *  - Two taps on one tile inside `TRAIN_DOUBLE_TAP_MS` lay it on the one
 *    train it fits, when there is exactly one; with more, it stays chosen for
 *    a tap on the train.
 *
 * The pointer is captured on the tile, so a drag keeps coming here however
 * far it goes, and the tile carries `touch-action: none`, so a finger that
 * drags a tile never scrolls the page instead.
 */
export function useTileDrag({
  enabled,
  chosen,
  targetsOf,
  onChoose,
  onLay,
  onDragging,
}: {
  enabled: boolean;
  chosen: number | null;
  /** The trains a tile may be laid on now. */
  targetsOf: (tile: number) => number[];
  onChoose: (tile: number | null) => void;
  onLay: (tile: number, train: number) => void;
  onDragging: (tile: number | null) => void;
}) {
  const [press, setPress] = useState<Press | null>(null);
  const lastTap = useRef<{ tile: number; at: number } | null>(null);

  const tapped = (tile: number) => {
    const now = performance.now();
    const before = lastTap.current;
    lastTap.current = { tile, at: now };
    if (before !== null && before.tile === tile && now - before.at < TRAIN_DOUBLE_TAP_MS) {
      lastTap.current = null;
      const targets = targetsOf(tile);
      if (targets.length === 1) {
        onChoose(null);
        onLay(tile, targets[0]);
        return;
      }
      onChoose(tile);
      return;
    }
    onChoose(chosen === tile ? null : tile);
  };

  const handlers = (tile: number) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      setPress({ tile, pointer: event.pointerId, fromX: event.clientX, fromY: event.clientY, dragging: false, x: event.clientX, y: event.clientY });
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      if (press === null || press.pointer !== event.pointerId) return;
      const far = Math.hypot(event.clientX - press.fromX, event.clientY - press.fromY) > TRAIN_DRAG_PX;
      if (!press.dragging && far) onDragging(tile);
      setPress({ ...press, dragging: press.dragging || far, x: event.clientX, y: event.clientY });
    },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
      if (press === null || press.pointer !== event.pointerId) return;
      setPress(null);
      if (!press.dragging) {
        tapped(tile);
        return;
      }
      onDragging(null);
      const train = trainAt(event.clientX, event.clientY);
      if (train !== null && targetsOf(tile).includes(train)) {
        onChoose(null);
        onLay(tile, train);
      }
    },
    onPointerCancel: () => {
      if (press?.dragging) onDragging(null);
      setPress(null);
    },
    /* A key press (Enter or Space) chooses, as a tap does; a pointer's own click is handled above, on its way up. */
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      if (!enabled || event.detail !== 0) return;
      onChoose(chosen === tile ? null : tile);
    },
  });

  const floating = press !== null && press.dragging ? { tile: press.tile, x: press.x, y: press.y } : null;
  return { handlers, floating };
}
