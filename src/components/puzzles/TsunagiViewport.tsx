"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

import { ViewPad, type PadKey } from "./ViewPad";

/** The smallest board a player is given the pad for: past 9×9 a phone's cells are smaller than a thumb. */
export const TSUNAGI_ZOOM_FROM = 10;

/** How far a board may be zoomed in, as a multiple of the whole board fitted to its box, unless the board asks for more (`mostZoom`). */
const MOST_ZOOM = 3;

/** How near an edge of the box a line's end must be dragged to move the view, and how far each frame moves it, in pixels. */
const EDGE = 36;
const EDGE_STEP = 6;

type View = { zoom: number; x: number; y: number };
/** The box looked through, and how tall the board is when it fills the box's width (the whole board fitted), which can be less than the box. */
type Box = { width: number; height: number; content: number };
const FITTED: View = { zoom: 1, x: 0, y: 0 };

/**
 * A view kept inside the board: never a gap between the board's edge and the box's. The box is its width and its
 * height, which differ for a board that is not square (a Mahjong layout is wider than it is tall), and the board
 * itself may be a little shorter than its box (a frame's slack), so a view can be moved no further down than the
 * board's own foot.
 */
function kept(view: View, box: Box, most: number): View {
  const zoom = Math.min(most, Math.max(1, view.zoom));
  const tall = box.content > 0 ? box.content : box.height;
  return { zoom, x: Math.min(0, Math.max(box.width - box.width * zoom, view.x)), y: Math.min(0, Math.max(Math.min(0, box.height - tall * zoom), view.y)) };
}

/** Zoomed by `factor` about the point (px, py) of the box, which stays over the same spot of the board. */
function zoomedAbout(view: View, factor: number, px: number, py: number, box: Box, most: number): View {
  const zoom = Math.min(most, Math.max(1, view.zoom * factor));
  const scale = zoom / view.zoom;
  return kept({ zoom, x: px - (px - view.x) * scale, y: py - (py - view.y) * scale }, box, most);
}

/**
 * WHERE THE PLAYING AREA IS IN THE BOX, in pixels from the box's top left: its
 * left and top edges (negative once the view has moved past them) and its side.
 * Measured from the element a board marks `data-pin-area`, because the wood
 * around it is a rim of its own width. What a board pins (`Pinned`) is placed from this.
 */
export type PinFrame = { left: number; top: number; side: number; width: number; height: number };

/**
 * A BOARD'S CLUES KEPT IN SIGHT WHILE IT IS MOVED. A big picture-logic board
 * zoomed in on its far corner has its clues miles off; the numbers a row and a
 * column are read from have to stay at the box's top and left however the view
 * moves. `inset` is the depth of that band as a share of the playing area's
 * side; `render` draws what is pinned from where the area is now (`PinFrame`),
 * and is given only while the view is zoomed, since fitted, the clues are where
 * they were drawn.
 */
export type Pinned = { inset: number; render: (frame: PinFrame) => ReactNode };

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
 * TWO FINGERS MOVE THE VIEW (2026-10-05, the 20×20 to 30×30 boards): a second finger down on a touch screen
 * ends any line being drawn, as a lift does, and the two fingers together pinch the board's zoom and drag it,
 * so a phone's reader moves about a 30×30 as a map and never needs the pad. The pad, the wheel and the edge
 * nudge stay as they were; one finger still draws.
 *
 * Bridges' big boards are looked at through the same box (`name`
 * "bridges"), so there is one zoom for a board too big for a thumb, not two.
 *
 * A BOARD WITH A HUNDRED CLUES (Picture logic at 40×40 and 50×50) asks three
 * things more of it. `mostZoom` lets it come nearer than three times, to
 * squares a thumb can press; `startZoom` opens it there, since the whole board
 * is a screen of six-pixel squares; and `pinned` keeps its clues at the box's
 * top and left as the view moves along the lines they number (`Pinned`).
 */
export function TsunagiViewport({
  size,
  name = "tsunagi",
  zoomFrom = TSUNAGI_ZOOM_FROM,
  aspect = "1 / 1",
  maxWidth,
  mostZoom = MOST_ZOOM,
  startZoom = 1,
  startAt,
  pinned,
  children,
}: {
  size: number;
  /** The game, for its test ids: `<name>-viewport`, `<name>-fit` and the pad's. */
  name?: string;
  /** The smallest size looked at through the box: Mahjong's Turtle alone, fifteen tiles across (`MahjongSolve`). */
  zoomFrom?: number;
  /** The box's width to height, where the board is not square: a Mahjong layout is wider than it is tall. */
  aspect?: string;
  /** The widest the box is, where the board is not to be taller than the window (Mahjong's): it is centred when narrower than its column. */
  maxWidth?: string;
  /** How far the board may be zoomed, where a cell of the whole board is too small for far more than three times (a 50×50 picture). */
  mostZoom?: number;
  /** The zoom the board opens at: a board with a hundred lines is not read whole, so it opens near. Fit still shows the whole. */
  startZoom?: number;
  /** Where in the board the zoomed view opens, as shares of its width and height (0 to 1): a Jirai field opens on the middle it was opened at. Left out, the top left. */
  startAt?: { x: number; y: number };
  /** Clues kept at the box's top and left while the view moves (`Pinned`). */
  pinned?: Pinned;
  children: ReactNode;
}) {
  const enabled = size >= zoomFrom;
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [measured, setBox] = useState<Box>({ width: 0, height: 0, content: 0 });
  const measuredNow = useRef(measured);
  const width = measured.width;
  const [view, setView] = useState<View>(FITTED);
  const [frame, setFrame] = useState<PinFrame | null>(null);
  const opened = useRef(false);
  /** Where the view opens, held as first given: it is used once, as the box first has its width. */
  const openAt = useRef(startAt);
  /** The side of the playing area as last measured, which the edge nudge reads without a render. */
  const areaSide = useRef(0);
  const held = useRef<{ pointer: number; x: number; y: number; target: EventTarget | null } | null>(null);
  // Fingers on a touch screen, and the two that are moving the view: while there are two, the board is not drawn on, and the finger left after one lifts is let go of until it lifts too.
  const fingers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; distance: number } | null>(null);
  const ignored = useRef(new Set<number>());

  useEffect(() => {
    const element = box.current;
    if (!enabled || element === null) return;
    const measure = () => {
      const { width: side, height } = element.getBoundingClientRect();
      // The board's height at the box's width: its own height over its own width, whatever the zoom is now.
      const board = inner.current;
      const content = board !== null && board.offsetWidth > 0 ? Math.round(((board.offsetHeight * side) / board.offsetWidth) * 100) / 100 : height;
      measuredNow.current = { width: side, height, content };
      setBox((now) => (now.width === side && now.height === height && now.content === content ? now : { width: side, height, content }));
      // A board that opens zoomed does so once, as the box first has its width.
      if (!opened.current && side > 0) {
        opened.current = true;
        if (startZoom > 1) {
          const zoom = Math.min(mostZoom, Math.max(1, startZoom));
          // The point asked for in the middle of the box, when the board is big enough to put it there (`kept` holds the edges).
          setView(kept({ zoom, x: openAt.current === undefined ? 0 : side / 2 - openAt.current.x * side * zoom, y: openAt.current === undefined ? 0 : side / 2 - openAt.current.y * side * zoom }, measuredNow.current, mostZoom));
        }
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (inner.current !== null) observer.observe(inner.current);
    return () => observer.disconnect();
  }, [enabled, startZoom, mostZoom]);

  const change = useCallback((next: (view: View) => View) => setView((now) => kept(next(now), measured, mostZoom)), [measured, mostZoom]);

  /* The wheel, or a trackpad's pinch, zooms about the pointer; never the page. */
  useEffect(() => {
    const element = box.current;
    if (!enabled || element === null) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.002));
      setView((now) => zoomedAbout(now, factor, event.clientX - rect.left, event.clientY - rect.top, { ...measuredNow.current, width: rect.width, height: rect.height }, mostZoom));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [enabled, mostZoom]);

  /* While a line is dragged near an edge of a zoomed board, the view moves toward it, a little each frame. */
  useEffect(() => {
    if (!enabled || view.zoom <= 1) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const finger = held.current;
      const element = box.current;
      if (finger === null || element === null) return;
      const rect = element.getBoundingClientRect();
      // Clues pinned at the top and left cover the first cells there: the edge a line is nearing is where they end.
      const band = pinned === undefined ? 0 : pinned.inset * areaSide.current;
      const dx = finger.x - rect.left < EDGE + band ? EDGE_STEP : rect.right - finger.x < EDGE ? -EDGE_STEP : 0;
      const dy = finger.y - rect.top < EDGE + band ? EDGE_STEP : rect.bottom - finger.y < EDGE ? -EDGE_STEP : 0;
      if (dx === 0 && dy === 0) return;
      setView((now) => kept({ ...now, x: now.x + dx, y: now.y + dy }, { ...measuredNow.current, width: rect.width, height: rect.height }, mostZoom));
      // The board moved under a finger that did not: tell the board the finger is over another cell now.
      finger.target?.dispatchEvent(new window.PointerEvent("pointermove", { bubbles: true, clientX: finger.x, clientY: finger.y, pointerId: finger.pointer }));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, view.zoom, pinned, mostZoom]);

  /* Where the playing area is now, for what is pinned: read after every move of the view, before it is painted. */
  useLayoutEffect(() => {
    const element = box.current;
    if (!enabled || pinned === undefined || element === null) return;
    const area = element.querySelector("[data-pin-area]");
    if (area === null) return;
    const edge = element.getBoundingClientRect();
    const at = area.getBoundingClientRect();
    areaSide.current = at.width;
    setFrame((now) => {
      const next = { left: at.left - edge.left, top: at.top - edge.top, side: at.width, width: edge.width, height: edge.height };
      return now !== null && now.left === next.left && now.top === next.top && now.side === next.side && now.width === next.width && now.height === next.height ? now : next;
    });
  }, [enabled, pinned, view, width]);

  const press = (key: PadKey) => {
    const step = Math.round(width / 4);
    const stepDown = Math.round(measured.height / 4);
    const moves: Record<PadKey, (view: View) => View> = {
      in: (now) => zoomedAbout(now, 1.5, width / 2, measured.height / 2, measured, mostZoom),
      out: (now) => zoomedAbout(now, 1 / 1.5, width / 2, measured.height / 2, measured, mostZoom),
      up: (now) => ({ ...now, y: now.y + stepDown }),
      down: (now) => ({ ...now, y: now.y - stepDown }),
      left: (now) => ({ ...now, x: now.x + step }),
      right: (now) => ({ ...now, x: now.x - step }),
    };
    change(moves[key]);
  };

  if (!enabled) return <>{children}</>;

  /** The middle of the two fingers and how far apart they are. */
  const between = () => {
    const [a, b] = [...fingers.current.values()];
    return { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2, distance: Math.hypot(a!.x - b!.x, a!.y - b!.y) };
  };
  const touchDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    fingers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (fingers.current.size === 2) {
      // The first finger may be drawing a line: it is let go, as a lift lets go, and the board takes no more from either finger.
      const first = held.current;
      if (first !== null) first.target?.dispatchEvent(new window.PointerEvent("pointercancel", { bubbles: true, pointerId: first.pointer }));
      held.current = null;
      gesture.current = between();
      for (const pointer of fingers.current.keys()) ignored.current.add(pointer);
    }
    if (ignored.current.has(event.pointerId)) event.stopPropagation();
  };
  const touchMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch" || !fingers.current.has(event.pointerId)) return;
    fingers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (!ignored.current.has(event.pointerId)) return;
    event.stopPropagation();
    const before = gesture.current;
    if (before === null || fingers.current.size !== 2) return;
    const now = between();
    const rect = event.currentTarget.getBoundingClientRect();
    gesture.current = now;
    // Pinched about the middle between them, and carried along as the middle moves.
    setView((each) => {
      const zoomed = before.distance > 0 && now.distance > 0 ? zoomedAbout(each, now.distance / before.distance, before.x - rect.left, before.y - rect.top, { ...measuredNow.current, width: rect.width, height: rect.height }, mostZoom) : each;
      return kept({ ...zoomed, x: zoomed.x + (now.x - before.x), y: zoomed.y + (now.y - before.y) }, { ...measuredNow.current, width: rect.width, height: rect.height }, mostZoom);
    });
  };
  const touchUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    const was = ignored.current.has(event.pointerId);
    fingers.current.delete(event.pointerId);
    if (fingers.current.size < 2) gesture.current = null;
    if (was) {
      event.stopPropagation();
      ignored.current.delete(event.pointerId);
    }
  };

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    if (held.current !== null && held.current.pointer === event.pointerId) held.current = { ...held.current, x: event.clientX, y: event.clientY };
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={box}
        className="relative mx-auto w-full overflow-hidden"
        style={{ touchAction: "none", aspectRatio: aspect, maxWidth }}
        onPointerDownCapture={touchDown}
        onPointerMoveCapture={touchMove}
        onPointerUpCapture={touchUp}
        onPointerCancelCapture={touchUp}
        onPointerDown={(event) => (held.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, target: event.target })}
        onPointerMove={follow}
        onPointerUp={() => (held.current = null)}
        onPointerCancel={() => (held.current = null)}
        data-testid={`${name}-viewport`}
        data-zoom={view.zoom.toFixed(2)}
        // The board as it is framed, without the pad under it, is what a finished game's wallpaper is taken of (`BoardWallpaper`).
        data-wallpaper-focus
      >
        <div ref={inner} className="absolute top-0 left-0" style={{ width: width * view.zoom || "100%", transform: `translate(${view.x}px, ${view.y}px)` }}>
          {children}
        </div>
        {pinned !== undefined && view.zoom > 1 && frame !== null ? (
          // Over the board, and out of the way of a press: a press on a pinned clue does nothing, and is never a press on the cell under it.
          <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: "none" }} data-testid={`${name}-pinned`}>
            {pinned.render(frame)}
          </div>
        ) : null}
      </div>
      {/* Under the board, never over it: a pad in the corner would cover cells a line must be drawn through. */}
      <ViewPad fitted={view.zoom === 1} onFit={() => setView(FITTED)} onPress={press} label="Move and zoom the board" testId={name} inline />
    </div>
  );
}
