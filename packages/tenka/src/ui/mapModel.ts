import { TENKA_CONTINENTS, TENKA_TERRITORIES } from "../tenkaMap.ts";
import { TENKA_SHAPES } from "../tenkaShapes.data.ts";
import type { TenkaContinentKey, TenkaGame, TenkaMapMarks } from "../tenka.types.ts";
import { ownerColour } from "./colours.ts";

/** How a territory is ringed: the one chosen, one it can reach, or the target. */
export type TenkaRing = "chosen" | "reach" | "target" | null;

export type TenkaLand = {
  territory: number;
  key: string;
  name: string;
  /** Its outline, one SVG path in map units. */
  outline: string;
  fill: string;
  ring: TenkaRing;
  /** Where its counter stands, in map units. */
  at: readonly [number, number];
  armies: number;
  owner: number;
};

export type TenkaMapModel = {
  width: number;
  height: number;
  lands: readonly TenkaLand[];
  seaLines: readonly (readonly number[])[];
  continentBorders: string;
};

export const NO_MARKS: TenkaMapMarks = { chosen: null, reach: [], target: null };

/**
 * EVERYTHING A DRAWING OF THE WORLD NEEDS, for one game: each territory's
 * outline in its owner's colour, its counter's place and armies, and its
 * ring. Shared by the plain-DOM table and the React map, so both draw the
 * same world from the same few rules.
 */
export function tenkaMapModel(game: Pick<TenkaGame, "owners" | "armies">, marks: TenkaMapMarks = NO_MARKS, colours?: readonly string[]): TenkaMapModel {
  const reach = new Set(marks.reach);
  const lands = TENKA_SHAPES.outlines.map((outline, territory): TenkaLand => {
    const owner = game.owners[territory] ?? -1;
    const ring: TenkaRing = marks.target === territory ? "target" : marks.chosen === territory ? "chosen" : reach.has(territory) ? "reach" : null;
    const label = TENKA_SHAPES.labels[territory]!;
    return {
      territory,
      key: TENKA_TERRITORIES[territory]!.key,
      name: TENKA_TERRITORIES[territory]!.name,
      outline,
      fill: ownerColour(owner, colours),
      ring,
      at: [label[0]!, label[1]!],
      armies: game.armies[territory] ?? 0,
      owner,
    };
  });
  return { width: TENKA_SHAPES.width, height: TENKA_SHAPES.height, lands, seaLines: TENKA_SHAPES.seaLines, continentBorders: TENKA_SHAPES.continentBorders };
}

/** The territory whose counter is nearest a point of the map, within `reach` map units, or null. */
export function nearestLand(x: number, y: number, reach: number): number | null {
  let best: number | null = null;
  let bestDistance = reach;
  TENKA_SHAPES.labels.forEach(([lx, ly], territory) => {
    const distance = Math.hypot(lx! - x, ly! - y);
    if (distance <= bestDistance) {
      best = territory;
      bestDistance = distance;
    }
  });
  return best;
}

/** A part of the map to show, in map units: left, top, width, height (an SVG viewBox). */
export type TenkaView = readonly [number, number, number, number];

/**
 * The part of the map that frames a continent, with a margin, widened to the
 * map's own shape so it fills the same box; the whole world for null.
 */
export function continentView(key: TenkaContinentKey | null): TenkaView {
  const { width, height, boxes } = TENKA_SHAPES;
  if (key === null) return [0, 0, width, height];
  const continent = TENKA_CONTINENTS.find((one) => one.key === key);
  if (continent === undefined) return [0, 0, width, height];
  // A territory whose extent crosses the map's seam (an island far out, the east of Russia) is framed by its counter instead.
  const areas = continent.territories.map((territory) => {
    const box = boxes[territory]!;
    if (box[2]! - box[0]! <= width / 2) return box;
    const [x, y] = TENKA_SHAPES.labels[territory]!;
    return [x! - 60, y! - 60, x! + 60, y! + 60];
  });
  const left = Math.min(...areas.map((area) => area[0]!));
  const top = Math.min(...areas.map((area) => area[1]!));
  const right = Math.max(...areas.map((area) => area[2]!));
  const bottom = Math.max(...areas.map((area) => area[3]!));
  const pad = 40;
  let w = right - left + pad * 2;
  let h = bottom - top + pad * 2;
  if (w / h < width / height) w = h * (width / height);
  else h = w / (width / height);
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  return [cx - w / 2, cy - h / 2, w, h];
}
