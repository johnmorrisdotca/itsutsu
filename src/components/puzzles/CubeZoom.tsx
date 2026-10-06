"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

import { cubeCopy } from "./mazeWords";
import { CUBE_ZOOM, CUBE_ZOOM_KEPT } from "./cube.constants";

const listeners = new Set<() => void>();
/** The answer for a browser whose storage refuses, kept for as long as the page is open. */
let zoomHere: number = CUBE_ZOOM.start;

const clamp = (zoom: number) => Math.round(Math.max(CUBE_ZOOM.min, Math.min(CUBE_ZOOM.max, zoom)) * 100) / 100;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function kept(): number {
  try {
    const value = Number(window.localStorage.getItem(CUBE_ZOOM_KEPT));
    return Number.isFinite(value) && value > 0 ? clamp(value) : zoomHere;
  } catch {
    return zoomHere;
  }
}

function keep(zoom: number): void {
  zoomHere = clamp(zoom);
  try {
    window.localStorage.setItem(CUBE_ZOOM_KEPT, String(zoomHere));
  } catch {
    // Not kept past this page: `zoomHere` answers until it is left.
  }
  for (const listener of listeners) listener();
}

/** This device's zoom of the cube, read so the server's answer (the first size) and the browser's can differ without an effect. */
export function useCubeZoom(): { zoom: number; set: (zoom: number) => void } {
  const zoom = useSyncExternalStore(subscribe, kept, () => CUBE_ZOOM.start);
  return { zoom, set: keep };
}

/**
 * THE CUBE, ZOOMED INSIDE ITS BOARD. John, 2026-10-01: the cube is drawn at
 * one size, so let the player zoom it in and out, on the solve and the replay
 * alike. The board box keeps its size and the page does not move: the cube is
 * scaled inside the box and clipped by it. Pinch on a phone, Alt and the wheel
 * on a desk (a plain wheel and Ctrl turn rows and columns on the solve), and
 * + / − / reset buttons in the board's corner, which a keyboard reaches too.
 * Remembered per device in this browser.
 */
export function CubeZoom({ children }: { children: ReactNode }) {
  const CUBE_COPY = cubeCopy(useSpeaker().locale);
  const { zoom, set } = useCubeZoom();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    // Alt and the wheel zoom the cube and never the page; Ctrl (a trackpad's pinch) too where it is not over a sticker, which it would turn a column of.
    const wheel = (event: WheelEvent) => {
      const onSticker = event.target instanceof Element && event.target.closest("[data-slot]") !== null;
      if (!(event.altKey || ((event.ctrlKey || event.metaKey) && !onSticker))) return;
      event.preventDefault();
      event.stopPropagation();
      keep(kept() * (event.deltaY < 0 ? 1.1 : 1 / 1.1));
    };
    // Two fingers: held back from the cube so they do not turn it, and their spread is the zoom.
    const fingers = new Map<number, { x: number; y: number }>();
    let from: { distance: number; zoom: number } | null = null;
    const spread = () => {
      const [a, b] = [...fingers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const down = (event: PointerEvent) => {
      fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (fingers.size === 2) {
        from = { distance: spread(), zoom: kept() };
        event.stopPropagation();
      }
    };
    const move = (event: PointerEvent) => {
      if (!fingers.has(event.pointerId)) return;
      fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (fingers.size >= 2 && from && from.distance > 0) {
        event.stopPropagation();
        event.preventDefault();
        keep(from.zoom * (spread() / from.distance));
      }
    };
    const up = (event: PointerEvent) => {
      fingers.delete(event.pointerId);
      if (fingers.size < 2) from = null;
    };
    element.addEventListener("wheel", wheel, { passive: false, capture: true });
    element.addEventListener("pointerdown", down, { capture: true });
    element.addEventListener("pointermove", move, { capture: true });
    element.addEventListener("pointerup", up, { capture: true });
    element.addEventListener("pointercancel", up, { capture: true });
    return () => {
      element.removeEventListener("wheel", wheel, { capture: true });
      element.removeEventListener("pointerdown", down, { capture: true });
      element.removeEventListener("pointermove", move, { capture: true });
      element.removeEventListener("pointerup", up, { capture: true });
      element.removeEventListener("pointercancel", up, { capture: true });
    };
  }, []);

  const button = `${BUTTON_BASE} ${BUTTON_QUIET} min-h-9 min-w-9 px-2 py-1 text-sm shadow-sm`;
  return (
    <>
      <div ref={box} className="absolute inset-0 touch-none overflow-hidden" data-testid="cube-zoomed" data-zoom={zoom}>
        <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: "50% 50%" }}>
          {children}
        </div>
      </div>
      <div className="absolute right-2 bottom-2 z-10 flex gap-1" role="group" aria-label={CUBE_COPY.zoomGroup} title={CUBE_COPY.zoomHow}>
        <button type="button" className={button} onClick={() => set(zoom - CUBE_ZOOM.step)} disabled={zoom <= CUBE_ZOOM.min} aria-label={CUBE_COPY.zoomOut} data-testid="cube-zoom-out">
          −
        </button>
        <button type="button" className={button} onClick={() => set(CUBE_ZOOM.start)} disabled={zoom === CUBE_ZOOM.start} aria-label={CUBE_COPY.zoomReset} data-testid="cube-zoom-reset">
          1×
        </button>
        <button type="button" className={button} onClick={() => set(zoom + CUBE_ZOOM.step)} disabled={zoom >= CUBE_ZOOM.max} aria-label={CUBE_COPY.zoomIn} data-testid="cube-zoom-in">
          +
        </button>
      </div>
    </>
  );
}
