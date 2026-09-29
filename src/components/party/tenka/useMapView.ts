"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

import type { PadKey } from "@/components/puzzles/ViewPad";

import { TENKA_TAP_SLOP } from "./tenka.constants";
import type { MapBox, MapView } from "./tenka.types";
import { fitView, framedView, isFitted, keptView, pannedBy, zoomedAbout } from "./tenkaView";

/**
 * PINCH, DRAG, WHEEL AND THE PAD, for the map's box — Kumimoji's table's way
 * of looking (`KumimojiTable`), for a map: a finger dragged pans, two
 * pinched zoom about their middle, the wheel (or a trackpad's pinch) zooms
 * about the pointer and never the page, and `touch-action: none` on the box
 * alone keeps the page itself from zooming. A drag that ends over a territory
 * is not a tap on it. Fit shows the whole world again.
 */
export function useMapView(box: RefObject<HTMLDivElement | null>, mapWidth: number, mapHeight: number, readOnly: boolean) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [free, setFree] = useState<MapView | null>(null);

  useEffect(() => {
    const element = box.current;
    if (element === null) return;
    const measure = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const watcher = new ResizeObserver(measure);
    watcher.observe(element);
    return () => watcher.disconnect();
  }, [box]);

  const frame: MapBox = useMemo(() => ({ width: size.width, height: size.height, mapWidth, mapHeight }), [size, mapWidth, mapHeight]);
  const view = useMemo(() => (size.width === 0 ? null : free === null ? fitView(frame) : keptView(free, frame)), [free, frame, size.width]);
  const shown = useRef(view);
  useEffect(() => {
    shown.current = view;
  });

  const change = useCallback(
    (next: (view: MapView) => MapView) => {
      const now = shown.current;
      if (now !== null) setFree(next(now));
    },
    [],
  );

  /* The wheel zooms about the pointer, never the page. */
  useEffect(() => {
    const element = box.current;
    if (element === null || readOnly) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015));
      change((now) => zoomedAbout(now, factor, event.clientX - rect.left, event.clientY - rect.top, frame));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [box, readOnly, change, frame]);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(false);
  const travel = useRef(0);
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointers.current.size === 0) {
      moved.current = false;
      travel.current = 0;
    }
    if (readOnly || (event.target instanceof Element && event.target.closest("button, [data-pad]") !== null)) return;
    const rect = box.current!.getBoundingClientRect();
    const at = (e: PointerEvent | ReactPointerEvent) => ({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    const id = event.pointerId;
    pointers.current.set(id, at(event));
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id || !pointers.current.has(id)) return;
      const before = [...pointers.current.values()];
      const was = pointers.current.get(id)!;
      const now = at(e);
      pointers.current.set(id, now);
      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()];
        const [a0, b0] = before;
        const span = Math.hypot(a.x - b.x, a.y - b.y);
        const span0 = Math.hypot(a0.x - b0.x, a0.y - b0.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const mid0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
        moved.current = true;
        change((view) => pannedBy(zoomedAbout(view, span0 > 0 ? span / span0 : 1, mid.x, mid.y, frame), mid.x - mid0.x, mid.y - mid0.y, frame));
        return;
      }
      travel.current += Math.hypot(now.x - was.x, now.y - was.y);
      if (travel.current < TENKA_TAP_SLOP) return;
      moved.current = true;
      change((view) => pannedBy(view, now.x - was.x, now.y - was.y, frame));
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      pointers.current.delete(id);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  /** A drag that ends over a territory is not a tap on it. */
  const onClickCapture = (event: { stopPropagation: () => void; target: EventTarget }) => {
    if (moved.current && pointers.current.size === 0 && !(event.target instanceof Element && event.target.closest("button, [data-pad]"))) {
      moved.current = false;
      event.stopPropagation();
    }
  };

  const press = (key: PadKey) => {
    const step = Math.round(Math.min(size.width, size.height) / 4);
    const [mx, my] = [size.width / 2, size.height / 2];
    const moves: Record<PadKey, (view: MapView) => MapView> = {
      in: (view) => zoomedAbout(view, 1.5, mx, my, frame),
      out: (view) => zoomedAbout(view, 1 / 1.5, mx, my, frame),
      up: (view) => pannedBy(view, 0, step, frame),
      down: (view) => pannedBy(view, 0, -step, frame),
      left: (view) => pannedBy(view, step, 0, frame),
      right: (view) => pannedBy(view, -step, 0, frame),
    };
    change(moves[key]);
  };

  return {
    view,
    /** The box looked through, and the map's size. */
    frame,
    fitted: view === null || isFitted(view, frame),
    fit: () => setFree(null),
    /** Look at an area of the map ([left, top, right, bottom]), never further out than `least` pixels to a map unit. */
    frameTo: (area: readonly number[], least: number) => {
      if (size.width > 0) setFree(framedView(area, frame, least));
    },
    press,
    onPointerDown,
    onClickCapture,
  };
}
