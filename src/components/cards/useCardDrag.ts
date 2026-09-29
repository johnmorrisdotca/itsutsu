"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import type { Card } from "@/lib/cards/cards.types";

import { DOUBLE_TAP_MS, DRAG_FROM_PX } from "./Cards.constants";
import type { CardGhost, CardSpot } from "./cards.types";

/** The pile a drop lands on: the one under the pointer, or failing that the one the carried card overlaps most. */
export function dropPileAt(x: number, y: number, carried: { left: number; top: number; width: number; height: number } | null): string | null {
  if (typeof document === "undefined") return null;
  const under = document.elementFromPoint(x, y)?.closest("[data-card-drop]")?.getAttribute("data-card-pile");
  if (under !== null && under !== undefined) return under;
  if (carried === null) return null;
  let best: { pile: string; area: number } | null = null;
  for (const place of document.querySelectorAll("[data-card-drop]")) {
    const box = place.getBoundingClientRect();
    const wide = Math.min(box.right, carried.left + carried.width) - Math.max(box.left, carried.left);
    const tall = Math.min(box.bottom, carried.top + carried.height) - Math.max(box.top, carried.top);
    const pile = place.getAttribute("data-card-pile");
    if (wide > 0 && tall > 0 && pile !== null && (best === null || wide * tall > best.area)) best = { pile, area: wide * tall };
  }
  return best?.pile ?? null;
}

/**
 * DRAGGING CARDS, by mouse, pen or finger alike: pointer events, because HTML
 * drag and drop does nothing on a phone. For any card game on the site.
 *
 * A press that moves a few pixels becomes a drag. The cards follow the pointer
 * exactly where they were taken hold of (`CardDragGhost` draws them), the ones
 * left behind are drawn faint (`lifted`), and letting go drops them on the pile
 * under the pointer — or, if the pointer is over none, the pile the carried
 * card overlaps most, so a card let go a little wide still lands. A press
 * that does not move stays a tap, which every card also answers (the game's
 * `onPress`), so a thumb, a mouse and a keyboard play the same game.
 *
 * The click a browser sends after a drag is swallowed (`clickWanted`), once:
 * the drop has already done what the drag meant. `doubleTap` says whether a
 * tap is the second of two on one card, which is how a game sends a card to
 * its home on a phone, where a double click is not a thing a finger sends.
 */
export function useCardDrag({ onDrop, disabled = false }: { onDrop: (from: CardSpot, to: string | null) => void; disabled?: boolean }) {
  const [ghost, setGhost] = useState<CardGhost | null>(null);
  const [lifted, setLifted] = useState<CardSpot | null>(null);
  /** The ghost's own element: moved straight through its style, so a drag re-renders nothing but the pick-up and the drop. */
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const swallow = useRef(false);
  const stop = useRef<(() => void) | null>(null);
  const lastTap = useRef<{ key: string; at: number } | null>(null);
  const latest = useRef(onDrop);
  useEffect(() => {
    latest.current = onDrop;
  });
  useEffect(() => () => stop.current?.(), []);

  /**
   * Take hold of `cards` (the one pressed and every card on top of it) at `from`.
   * `step` is how far apart they are drawn under the finger, as a share of a card's height.
   */
  const start = useCallback(
    (from: CardSpot, cards: readonly Card[], event: ReactPointerEvent<HTMLElement>, step = 0.28) => {
      if (disabled || event.button !== 0 || stop.current !== null || cards.length === 0) return;
      const id = event.pointerId;
      const box = event.currentTarget.getBoundingClientRect();
      const origin = { x: event.clientX, y: event.clientY };
      const grab = { x: origin.x - box.left, y: origin.y - box.top };
      let dragging = false;
      let at = origin;
      const carried = () => ({ left: at.x - grab.x, top: at.y - grab.y, width: box.width, height: box.height * (1 + step * (cards.length - 1)) });
      const move = (e: PointerEvent) => {
        if (e.pointerId !== id) return;
        at = { x: e.clientX, y: e.clientY };
        if (!dragging && Math.hypot(at.x - origin.x, at.y - origin.y) > DRAG_FROM_PX) {
          dragging = true;
          setLifted(from);
          setGhost({ cards, x: at.x, y: at.y, grabX: grab.x, grabY: grab.y, width: box.width, step });
        }
        if (dragging) {
          e.preventDefault();
          const element = ghostRef.current;
          if (element !== null) element.style.transform = `translate(${at.x - grab.x}px, ${at.y - grab.y}px)`;
        }
      };
      const end = (e: PointerEvent, dropped: boolean) => {
        if (e.pointerId !== id) return;
        stop.current?.();
        if (!dragging) return;
        setGhost(null);
        setLifted(null);
        swallow.current = true;
        window.setTimeout(() => (swallow.current = false), 0);
        if (dropped) latest.current(from, dropPileAt(e.clientX, e.clientY, carried()));
      };
      const up = (e: PointerEvent) => end(e, true);
      const cancel = (e: PointerEvent) => end(e, false);
      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
      stop.current = () => {
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

  /** Whether this tap is the second on the same card (`key`) within `DOUBLE_TAP_MS`; a double clears the memory. */
  const doubleTap = useCallback((key: string) => {
    const now = performance.now();
    const before = lastTap.current;
    const double = before !== null && before.key === key && now - before.at <= DOUBLE_TAP_MS;
    lastTap.current = double ? null : { key, at: now };
    return double;
  }, []);

  return { ghost, ghostRef, lifted, start, clickWanted, doubleTap };
}
