import { describe, expect, it } from "vitest";

import { TENKA_TERRITORIES, tenkaNeighbours } from "./tenkaMap";
import { TENKA_SHAPES } from "./tenkaShapes.data";

/**
 * EVERY WAY BETWEEN CONTINENTS THE CLASSIC GAME HAS, on this map. Our map
 * cuts the world differently (Iceland is inside the Nordic Countries, the
 * Ukraine inside Western Russia), so each classic link is pinned here by the
 * territories that hold those places, with how it is crossed. John,
 * 2026-09-29: "there are greenland connections to many".
 */

const at = (key: string) => TENKA_TERRITORIES.findIndex((territory) => territory.key === key);
const byLand = (a: string, b: string) => TENKA_TERRITORIES[at(a)].land.includes(at(b));
const bySea = (a: string, b: string) => TENKA_TERRITORIES[at(a)].sea.includes(at(b));

const BETWEEN_CONTINENTS: readonly [string, string, string, "land" | "sea"][] = [
  ["Alaska–Kamchatka", "alaska", "farEast", "sea"],
  ["Greenland–Iceland", "greenland", "nordic", "sea"],
  ["Central America–Venezuela", "mexico", "colombia", "land"],
  ["Brazil–North Africa", "brazil", "westAfrica", "sea"],
  ["Western Europe–North Africa", "westernEurope", "northAfrica", "sea"],
  ["Southern Europe–North Africa", "southernEurope", "northAfrica", "sea"],
  ["Southern Europe–Egypt", "southernEurope", "egypt", "sea"],
  ["Southern Europe–Middle East", "southernEurope", "middleEast", "land"],
  ["Ukraine–Middle East", "westernRussia", "middleEast", "land"],
  ["Ukraine–Afghanistan", "westernRussia", "centralAsia", "land"],
  ["Ukraine–Ural", "westernRussia", "siberia", "land"],
  ["Egypt–Middle East", "egypt", "middleEast", "land"],
  ["East Africa–Middle East", "eastAfrica", "arabia", "sea"],
  ["Siam–Indonesia", "southeastAsia", "indonesia", "land"],
];

const WITHIN_CONTINENTS: readonly [string, string, string][] = [
  ["Greenland–Northwest Territory", "greenland", "arcticIslands"],
  ["Greenland–Quebec", "greenland", "easternCanada"],
  ["Great Britain–Scandinavia", "britain", "nordic"],
  ["Great Britain–Northern Europe", "britain", "centralEurope"],
  ["Great Britain–Western Europe", "britain", "westernEurope"],
];

describe("Tenka's links between continents", () => {
  it.each(BETWEEN_CONTINENTS)("%s: %s and %s by %s", (_, a, b, how) => {
    expect(TENKA_TERRITORIES[at(a)].continent).not.toBe(TENKA_TERRITORIES[at(b)].continent);
    expect(how === "land" ? byLand(a, b) : bySea(a, b)).toBe(true);
    expect(how === "land" ? byLand(b, a) : bySea(b, a)).toBe(true);
  });

  it.each(WITHIN_CONTINENTS)("%s: %s and %s by sea", (_, a, b) => {
    expect(bySea(a, b) && bySea(b, a)).toBe(true);
  });

  it("gives Greenland three ways out, to both sides of the Atlantic", () => {
    expect(tenkaNeighbours(at("greenland")).map((one) => TENKA_TERRITORIES[one].key).sort()).toEqual(["arcticIslands", "easternCanada", "nordic"]);
  });

  it("draws every sea link as a line long enough to read as a crossing, and the Bering Strait off both edges", () => {
    const links = TENKA_TERRITORIES.reduce((sum, territory) => sum + territory.sea.length, 0) / 2;
    // One line for each link, and one more for the link that goes off one edge and on at the other.
    expect(TENKA_SHAPES.seaLines.length).toBe(links + TENKA_SHAPES.wraps.length);
    const [west, east] = [TENKA_SHAPES.seaLines.filter(([, , x2]) => x2 === 0), TENKA_SHAPES.seaLines.filter(([x1]) => x1 === TENKA_SHAPES.width)];
    expect(west.length).toBe(1);
    expect(east.length).toBe(1);
    for (const [x1, y1, x2, y2] of TENKA_SHAPES.seaLines) {
      if (x2 === 0 || x1 === TENKA_SHAPES.width) continue;
      expect(Math.hypot(x2 - x1, y2 - y1)).toBeGreaterThanOrEqual(62);
    }
  });

  it("tags the wrap with Alaska at the west edge and the Russian Far East at the east, on the same row as the lines", () => {
    expect(TENKA_SHAPES.wraps.map(([west, east]) => [TENKA_TERRITORIES[west].key, TENKA_TERRITORIES[east].key])).toEqual([["alaska", "farEast"]]);
    const [, , row] = TENKA_SHAPES.wraps[0];
    expect(row).toBeGreaterThan(0);
    expect(row).toBeLessThan(TENKA_SHAPES.height);
    expect(TENKA_SHAPES.seaLines.some(([, , x2, y2]) => x2 === 0 && y2 === row)).toBe(true);
    expect(TENKA_SHAPES.seaLines.some(([x1, y1]) => x1 === TENKA_SHAPES.width && y1 === row)).toBe(true);
  });

  it("frames no territory wider than half the map: nothing lies on the wrong side of the seam", () => {
    TENKA_SHAPES.boxes.forEach(([left, , right], territory) => {
      expect(right - left, TENKA_TERRITORIES[territory].key).toBeLessThanOrEqual(TENKA_SHAPES.width / 2);
    });
  });
});
