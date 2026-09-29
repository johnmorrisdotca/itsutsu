import { TENKA_CHIP, TENKA_FRAME_PAD, TENKA_ZOOM_MOST } from "./tenka.constants";
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

/** An army counter's radius in map units at this scale: always `TENKA_CHIP.screen` pixels on the screen, however far the map is zoomed. */
export function chipRadius(scale: number): number {
  return TENKA_CHIP.screen / scale;
}

/** The scale from which every counter on the map is drawn whole: none covers another. */
export const READABLE_SCALE = TENKA_CHIP.screen / TENKA_CHIP.apart;

/** A counter's width over its radius, for `digits` figures: padding, the owner's letter, a gap, the figures, padding. */
export function chipWidth(digits: number): number {
  return 0.45 + 0.75 + 0.1 + 0.74 * digits + 0.45;
}

/**
 * WHICH COUNTERS ARE DRAWN AS A DOT, at this view: going down `order` (the
 * territories that matter most first), each counter is drawn whole unless it
 * would cover one already drawn, in which case it is a dot with the owner's
 * letter until the map is zoomed far enough for it. From `READABLE_SCALE` up
 * none is.
 */
export function laidOutChips(labels: readonly (readonly number[])[], armies: readonly number[], scale: number, order: readonly number[]): Set<number> {
  const dots = new Set<number>();
  if (scale >= READABLE_SCALE) return dots;
  const r = chipRadius(scale);
  const drawn: { x: number; y: number; half: number }[] = [];
  for (const territory of order) {
    const [x, y] = labels[territory];
    const half = (r * chipWidth(String(armies[territory]).length)) / 2;
    if (drawn.some((other) => Math.abs(other.x - x) < other.half + half && Math.abs(other.y - y) < 2 * r)) dots.add(territory);
    else drawn.push({ x, y, half });
  }
  return dots;
}

/**
 * A view framing an area of the map ([left, top, right, bottom] in map units)
 * with a little sea round it, never further out than `least` pixels to a map
 * unit (nor than the whole world, nor in past the most the map zooms).
 */
export function framedView(area: readonly number[], box: MapBox, least: number): MapView {
  const [left, top, right, bottom] = [area[0] - TENKA_FRAME_PAD, area[1] - TENKA_FRAME_PAD, area[2] + TENKA_FRAME_PAD, area[3] + TENKA_FRAME_PAD];
  const fit = fitView(box).scale;
  const scale = Math.min(fit * TENKA_ZOOM_MOST, Math.max(fit, least, Math.min(box.width / (right - left), box.height / (bottom - top))));
  return keptView({ scale, x: box.width / 2 - ((left + right) / 2) * scale, y: box.height / 2 - ((top + bottom) / 2) * scale }, box);
}

/** The smallest area holding every one of these areas. */
export function areaAround(areas: readonly (readonly number[])[]): number[] {
  return [Math.min(...areas.map((a) => a[0])), Math.min(...areas.map((a) => a[1])), Math.max(...areas.map((a) => a[2])), Math.max(...areas.map((a) => a[3]))];
}

/** The territory whose counter is nearest a point of the map, within `reach` map units of it, or null: a fingertip's miss still lands. */
export function nearestTerritory(labels: readonly (readonly number[])[], x: number, y: number, reach: number): number | null {
  let best: number | null = null;
  let least = reach;
  labels.forEach(([lx, ly], territory) => {
    const distance = Math.hypot(lx - x, ly - y);
    if (distance <= least) {
      least = distance;
      best = territory;
    }
  });
  return best;
}
