import { TENKA_CHIP, TENKA_ZOOM_MOST } from "./tenka.constants";
import type { MapBox, MapView } from "./tenka.types";

/**
 * HOW THE MAP IS LOOKED AT: a scale (screen pixels to a map unit) and where
 * the map's corner sits in the box. Pure, so the pinch, the wheel, the pad and
 * Fit all move one view by the same few rules, and a test can check them.
 */

/** The whole world in the box, as large as fits, in the middle. */
export function fitView(box: MapBox): MapView {
  const scale = Math.min(box.width / box.mapWidth, box.height / box.mapHeight);
  return { scale, x: (box.width - box.mapWidth * scale) / 2, y: (box.height - box.mapHeight * scale) / 2 };
}

/** One axis kept in reach: centred while the map is narrower than the box, never a gap at an edge once it is wider. */
function keptAxis(at: number, box: number, drawn: number): number {
  if (drawn <= box) return (box - drawn) / 2;
  return Math.min(0, Math.max(box - drawn, at));
}

/** A view kept within its limits: no smaller than the whole world, no larger than `TENKA_ZOOM_MOST` times it, and never looking at empty sea past the map's edge. */
export function keptView(view: MapView, box: MapBox): MapView {
  const least = fitView(box).scale;
  const scale = Math.min(least * TENKA_ZOOM_MOST, Math.max(least, view.scale));
  return { scale, x: keptAxis(view.x, box.width, box.mapWidth * scale), y: keptAxis(view.y, box.height, box.mapHeight * scale) };
}

/** Zoomed by `factor` about the point (px, py) of the box, which stays over the same place on the map. */
export function zoomedAbout(view: MapView, factor: number, px: number, py: number, box: MapBox): MapView {
  const least = fitView(box).scale;
  const scale = Math.min(least * TENKA_ZOOM_MOST, Math.max(least, view.scale * factor));
  const ratio = scale / view.scale;
  return keptView({ scale, x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio }, box);
}

export function pannedBy(view: MapView, dx: number, dy: number, box: MapBox): MapView {
  return keptView({ ...view, x: view.x + dx, y: view.y + dy }, box);
}

/** Whether a view is the whole world, as Fit shows it. */
export function isFitted(view: MapView, box: MapBox): boolean {
  return Math.abs(view.scale - fitView(box).scale) < 1e-6;
}

/** An army counter's radius in map units at this scale: `TENKA_CHIP.screen` pixels, within the map's own limits. */
export function chipRadius(scale: number): number {
  return Math.min(TENKA_CHIP.most, Math.max(TENKA_CHIP.least, TENKA_CHIP.screen / scale));
}
