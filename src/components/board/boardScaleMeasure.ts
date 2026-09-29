import type { ScaleMeasure } from "@/lib/preferences/boardScaleFit";

/**
 * Reading a play's layout for `BoardScale`, from the page as it is drawn.
 *
 * The play marks the column its board sits in with `data-scale-board` — the
 * one element whose width is the board's to take — and may say on it how much
 * must stay in reach under the board (`data-scale-below`, in pixels) where
 * that is a row that comes and goes during a game and so cannot be measured.
 * Everything else is read.
 */

/** The column the board sits in, inside this play; null where there is no board yet (a set-up, a puzzle still being made). */
export function boardColumnIn(play: HTMLElement): HTMLElement | null {
  return play.querySelector<HTMLElement>("[data-scale-board]");
}

/**
 * THE DRAWING: what grows in proportion when the column does. Every board on
 * the site is a square of wood in `BoardFrame` (`board-surface`), so that is
 * it wherever there is one — the largest, for Futago's two boards side by
 * side. Failing that, the widest picture spanning at least half the column,
 * and otherwise the column itself.
 */
export function drawingIn(column: HTMLElement): DOMRect {
  const whole = column.getBoundingClientRect();
  const widest = (selector: string): DOMRect | null => {
    let found: DOMRect | null = null;
    for (const element of column.querySelectorAll(selector)) {
      const rect = element.getBoundingClientRect();
      if (rect.width >= whole.width / 3 && (found === null || rect.width > found.width)) found = rect;
    }
    return found;
  };
  return widest('[data-testid="board-surface"]') ?? widest("svg") ?? whole;
}

/** The drawing's width as the page draws it at Regular. */
export function regularDrawingIn(column: HTMLElement): number {
  return drawingIn(column).width;
}

/** Everything `scaledPlayWidths` needs, read from a play laid out at Large or Full. */
export function measurePlay(play: HTMLElement, column: HTMLElement, regularDrawing: number): ScaleMeasure {
  const box = play.getBoundingClientRect();
  const holder = column.getBoundingClientRect();
  const drawing = drawingIn(column);
  const declared = Number(column.dataset.scaleBelow);
  return {
    regularDrawing,
    play: box.width,
    column: holder.width,
    drawing: { width: drawing.width, height: drawing.height },
    above: drawing.top - box.top,
    below: Number.isFinite(declared) && column.dataset.scaleBelow !== undefined ? declared : holder.bottom - drawing.bottom,
    window: { width: document.documentElement.clientWidth, height: window.innerHeight },
  };
}

/** Whether what must stay in reach under the board runs past the bottom of the window. */
export function reachRunsOff(column: HTMLElement): boolean {
  const drawing = drawingIn(column);
  const declared = Number(column.dataset.scaleBelow);
  const below = Number.isFinite(declared) && column.dataset.scaleBelow !== undefined ? declared : column.getBoundingClientRect().bottom - drawing.bottom;
  return drawing.bottom + below > window.innerHeight;
}
