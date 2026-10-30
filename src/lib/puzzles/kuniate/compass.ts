/**
 * Which way from one place to another, as one of the eight points of the compass:
 * the first step of the shortest route between them on the globe. Pure arithmetic on
 * two points, and null when either is not known, which draws as no arrow at all:
 * a place with no point on the map has no direction, not a wrong one.
 */
export type Point = { lat: number; lon: number };
export type CompassPoint = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

const POINTS: readonly CompassPoint[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

export function compassPoint(from: Point | null | undefined, to: Point | null | undefined): CompassPoint | null {
  if (from === null || from === undefined || to === null || to === undefined) return null;
  const rad = Math.PI / 180;
  const y = Math.sin((to.lon - from.lon) * rad) * Math.cos(to.lat * rad);
  const x = Math.cos(from.lat * rad) * Math.sin(to.lat * rad) - Math.sin(from.lat * rad) * Math.cos(to.lat * rad) * Math.cos((to.lon - from.lon) * rad);
  const degrees = (Math.atan2(y, x) / rad + 360) % 360;
  return POINTS[Math.round(degrees / 45) % 8]!;
}
