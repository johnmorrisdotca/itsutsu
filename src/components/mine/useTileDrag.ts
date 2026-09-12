"use client";

import { useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Carrying a word from one box to another with a finger, or a mouse.
 *
 * POINTER EVENTS, TOUCH FIRST. The iPad is the device this screen is for, so
 * the drag is the plain one: touch a word, slide it onto another box, lift.
 * No long press to "pick it up" — a child does not know that convention and
 * should not need to. The tile that starts a drag carries `touch-none`, which
 * is what stops Safari deciding the finger meant to scroll and cancelling the
 * pointer on the second move; the rest of the page scrolls as it always did.
 * Pointer capture keeps the stream coming to the tile it began on however far
 * the finger wanders, which is also what makes the release point knowable.
 *
 * A TAP IS STILL A TAP. Tapping a kept word takes it back out, and that has to
 * survive: a press that travels less than `DRAG_SLOP_PX` is a tap, and the
 * click the browser fires after it goes through as before. A press that
 * travels further is a drag, and the click that follows the release is
 * swallowed — otherwise dropping a word onto its new box would also delete it,
 * which is a spectacular way to lose the word you just arranged.
 *
 * WHICH BOX IS UNDER THE FINGER is read from the boxes' rectangles, measured
 * once when the drag begins. Nothing on the page moves during a drag (that is
 * what `touch-none` buys), so the measurement stays true, and it is cheaper
 * and more honest than `elementFromPoint`, which would find the tile being
 * carried rather than the box beneath it.
 */

/** How far a press travels before it is a drag rather than a tap: a fingertip wobbles. */
export const DRAG_SLOP_PX = 8;

export type TileDrag = {
  /** The box the word is being carried from. */
  from: number;
  /** How far it has been carried, so the tile can follow the finger. */
  dx: number;
  dy: number;
  /** The box under the finger now, or null when it is over none. */
  over: number | null;
};

type Press = {
  pointerId: number;
  from: number;
  x: number;
  y: number;
  boxes: DOMRect[];
  dragging: boolean;
};

function boxAt(boxes: readonly DOMRect[], x: number, y: number): number | null {
  const found = boxes.findIndex((box) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom);
  return found === -1 ? null : found;
}

export function useTileDrag(count: number, onMove: ((from: number, to: number) => void) | undefined) {
  const [drag, setDrag] = useState<TileDrag | null>(null);
  const press = useRef<Press | null>(null);
  const boxes = useRef<(HTMLElement | null)[]>([]);
  const justDragged = useRef(false);

  /** For each box, so its rectangle can be read when a drag begins. */
  const boxRef = (index: number) => (node: HTMLElement | null) => {
    boxes.current[index] = node;
  };

  function measure(): DOMRect[] {
    return Array.from({ length: count }, (_, index) => boxes.current[index]?.getBoundingClientRect() ?? new DOMRect());
  }

  function onPointerDown(index: number) {
    return (event: ReactPointerEvent<HTMLElement>) => {
      if (onMove === undefined) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      press.current = {
        pointerId: event.pointerId,
        from: index,
        x: event.clientX,
        y: event.clientY,
        boxes: measure(),
        dragging: false,
      };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // A pointer that has already gone cannot be captured; the press just ends.
        press.current = null;
      }
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const held = press.current;
    if (held === null || held.pointerId !== event.pointerId) return;
    const dx = event.clientX - held.x;
    const dy = event.clientY - held.y;
    if (!held.dragging) {
      if (Math.hypot(dx, dy) < DRAG_SLOP_PX) return;
      held.dragging = true;
    }
    setDrag({ from: held.from, dx, dy, over: boxAt(held.boxes, event.clientX, event.clientY) });
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const held = press.current;
    if (held === null || held.pointerId !== event.pointerId) return;
    press.current = null;
    if (held.dragging) {
      // The click the browser fires next is the release of this drag, not a tap.
      justDragged.current = true;
      setTimeout(() => {
        justDragged.current = false;
      }, 0);
      const to = boxAt(held.boxes, event.clientX, event.clientY);
      if (to !== null && to !== held.from) onMove?.(held.from, to);
    }
    setDrag(null);
  }

  function onPointerCancel(event: ReactPointerEvent<HTMLElement>) {
    const held = press.current;
    if (held === null || held.pointerId !== event.pointerId) return;
    press.current = null;
    setDrag(null);
  }

  /** On the list around the tiles: swallows the one click that is a drag ending. */
  function onClickCapture(event: ReactMouseEvent<HTMLElement>) {
    if (!justDragged.current) return;
    justDragged.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  /** The handlers one tile spreads onto itself. */
  function tileHandlers(index: number) {
    return { onPointerDown: onPointerDown(index), onPointerMove, onPointerUp, onPointerCancel };
  }

  return { drag, boxRef, onClickCapture, tileHandlers };
}
