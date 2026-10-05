"use client";

import { SUIDO_FIT, type SuidoView, type SuidoViewer } from "@johnmorrisdotca/suido/draw";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

/**
 * THE BUTTONS THAT ZOOM A HUGE BOARD, under it (`SuidoBoard`'s `zoomable`): Zoom out, Zoom in and Whole board. A pinch, a drag and
 * the wheel do the same, but a finger cannot always be told which, so the buttons are always there and never over the board, where
 * they would cover pieces a tap is meant for. Out and Whole board are dim while the whole board is showing.
 */
export function SuidoZoomBar({ viewer, view }: { viewer: SuidoViewer | null; view: SuidoView }) {
  const whole = view.zoom <= SUIDO_FIT.zoom;
  const button = `${BUTTON_BASE} ${BUTTON_QUIET} min-h-11 min-w-11 px-3 py-1 text-sm`;
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5" role="group" aria-label="Zoom the board" data-testid="suido-zoom" data-zoom={view.zoom.toFixed(2)}>
      <button type="button" className={button} onClick={() => viewer?.zoomOut()} disabled={whole || viewer === null} aria-label="Zoom out" data-testid="suido-zoom-out">
        −
      </button>
      <button type="button" className={button} onClick={() => viewer?.zoomIn()} disabled={viewer === null} aria-label="Zoom in" data-testid="suido-zoom-in">
        +
      </button>
      <button type="button" className={button} onClick={() => viewer?.fit()} disabled={whole || viewer === null} aria-pressed={whole} data-testid="suido-fit">
        Whole board <span className="font-mincho opacity-70">全体</span>
      </button>
    </div>
  );
}
