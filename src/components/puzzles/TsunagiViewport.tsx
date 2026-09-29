"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

import { ViewPad, type PadKey } from "./ViewPad";

/** The smallest board a player is given the pad for: past 9×9 a phone's cells are smaller than a thumb. */
export const TSUNAGI_ZOOM_FROM = 10;

/** How far a board may be zoomed in, as a multiple of the whole board fitted to its box. */
const MOST_ZOOM = 3;

/** How near an edge of the box a line's end must be dragged to move the view, and how far each frame moves it, in pixels. */
const EDGE = 36;
const EDGE_STEP = 6;

type View = { zoom: number; x: number; y: number };
const FITTED: View = { zoom: 1, x: 0, y: 0 };

/** A view kept inside the board: never a gap between the board's edge and the box's. */
function kept(view: View, box: number): View {
  const zoom = Math.min(MOST_ZOOM, Math.max(1, view.zoom));
  const least = box - box * zoom;
  return { zoom, x: Math.min(0, Math.max(least, view.x)), y: Math.min(0, Math.max(least, view.y)) };
}

/** Zoomed by `factor` about the point (px, py) of the box, which stays over the same spot of the board. */
function zoomedAbout(view: View, factor: number, px: number, py: number, box: number): View {
  const zoom = Math.min(MOST_ZOOM, Math.max(1, view.zoom * factor));
  const scale = zoom / view.zoom;
  return kept({ zoom, x: px - (px - view.x) * scale, y: py - (py - view.y) * scale }, box);
}

/**
 * A BIG TSUNAGI BOARD, LOOKED AT THROUGH A BOX. John, 2026-09-26: boards bigger
 * than a phone comfortably shows, "never page scrolling while dragging: use the
 * zoom and pan pad and Fit that Kumimoji has, and nudge the view when a line is
 * dragged near its edge." From `TSUNAGI_ZOOM_FROM` up, the board is drawn up to
 * three times the box's width and looked at through it: Kumimoji's pad and Fit
 * (`ViewPad`), the wheel zooming about the pointer and never the page, and a
 * line dragged to within `EDGE` of the box's side moving the view that way — the
 * line then carries on under the finger, as though the finger had moved. The
 * board is drawn at the size it is shown, not stretched, so its lines stay
 * crisp. Below 10×10 this is the board alone, as it always was.
 *
 * Bridges' two big boards are looked at through the same box (`name`
 * "bridges"), so there is one zoom for a board too big for a thumb, not two.
 */
export function TsunagiViewport({ size, name = "tsunagi", children }: { size: number; /** The game, for its test ids: `<name>-viewport`, `<name>-fit` and the pad's. */ name?: string; children: ReactNode }) {
  const enabled = size >= TSUNAGI_ZOOM_FROM;
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [view, setView] = useState<View>(FITTED);
  const held = useRef<{ pointer: number; x: number; y: number; target: EventTarget | null } | null>(null);

  useEffect(() => {
    const element = box.current;
    if (!enabled || element === null) return;
    const measure = () => setWidth(element.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);

  const change = useCallback((next: (view: View) => View) => setView((now) => kept(next(now), width)), [width]);

  /* The wheel, or a trackpad's pinch, zooms about the pointer; never the page. */
  useEffect(() => {
    const element = box.current;
    if (!enabled || element === null) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.002));
      setView((now) => zoomedAbout(now, factor, event.clientX - rect.left, event.clientY - rect.top, rect.width));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [enabled]);

  /* While a line is dragged near an edge of a zoomed board, the view moves toward it, a little each frame. */
  useEffect(() => {
    if (!enabled || view.zoom <= 1) return;
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const finger = held.current;
      const element = box.current;
      if (finger === null || element === null) return;
      const rect = element.getBoundingClientRect();
      const dx = finger.x - rect.left < EDGE ? EDGE_STEP : rect.right - finger.x < EDGE ? -EDGE_STEP : 0;
      const dy = finger.y - rect.top < EDGE ? EDGE_STEP : rect.bottom - finger.y < EDGE ? -EDGE_STEP : 0;
      if (dx === 0 && dy === 0) return;
      setView((now) => kept({ ...now, x: now.x + dx, y: now.y + dy }, rect.width));
      // The board moved under a finger that did not: tell the board the finger is over another cell now.
      finger.target?.dispatchEvent(new window.PointerEvent("pointermove", { bubbles: true, clientX: finger.x, clientY: finger.y, pointerId: finger.pointer }));
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled, view.zoom]);

  const press = (key: PadKey) => {
    const step = Math.round(width / 4);
    const middle = width / 2;
    const moves: Record<PadKey, (view: View) => View> = {
      in: (now) => zoomedAbout(now, 1.5, middle, middle, width),
      out: (now) => zoomedAbout(now, 1 / 1.5, middle, middle, width),
      up: (now) => ({ ...now, y: now.y + step }),
      down: (now) => ({ ...now, y: now.y - step }),
      left: (now) => ({ ...now, x: now.x + step }),
      right: (now) => ({ ...now, x: now.x - step }),
    };
    change(moves[key]);
  };

  if (!enabled) return <>{children}</>;

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    if (held.current !== null && held.current.pointer === event.pointerId) held.current = { ...held.current, x: event.clientX, y: event.clientY };
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={box}
        className="relative aspect-square w-full overflow-hidden"
        style={{ touchAction: "none" }}
        onPointerDown={(event) => (held.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, target: event.target })}
        onPointerMove={follow}
        onPointerUp={() => (held.current = null)}
        onPointerCancel={() => (held.current = null)}
        data-testid={`${name}-viewport`}
        data-zoom={view.zoom.toFixed(2)}
      >
        <div className="absolute top-0 left-0" style={{ width: width * view.zoom || "100%", transform: `translate(${view.x}px, ${view.y}px)` }}>
          {children}
        </div>
      </div>
      {/* Under the board, never over it: a pad in the corner would cover cells a line must be drawn through. */}
      <ViewPad fitted={view.zoom === 1} onFit={() => setView(FITTED)} onPress={press} label="Move and zoom the board" testId={name} inline />
    </div>
  );
}
