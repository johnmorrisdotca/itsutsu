import { statSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { TENKA_CONTINENTS, TENKA_TERRITORIES, TENKA_TERRITORY_COUNT, connectedOwn, continentsHeld, tenkaNeighbours } from "./tenkaMap";
import { TENKA_SHAPES } from "./tenkaShapes.data";
import type { TenkaContinentKey } from "./tenka.types";

/**
 * Tenka's world, as the map script wrote it and the rules read it: every
 * territory reachable, every border seen from both sides, every continent
 * worth what the rules page says — and small enough to send to a phone.
 */

/** Every territory reachable from `start` over neighbours, land and sea. */
function reachable(start: number): Set<number> {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length > 0) {
    for (const next of tenkaNeighbours(queue.shift()!)) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

describe("Tenka's world", () => {
  it("has forty-two territories, each named once, in six continents", () => {
    expect(TENKA_TERRITORY_COUNT).toBe(42);
    expect(new Set(TENKA_TERRITORIES.map((territory) => territory.key)).size).toBe(42);
    expect(new Set(TENKA_TERRITORIES.map((territory) => territory.name)).size).toBe(42);
    expect(TENKA_CONTINENTS.map((continent) => continent.key)).toEqual(["northAmerica", "southAmerica", "europe", "africa", "asia", "oceania"]);
    expect(TENKA_CONTINENTS.reduce((sum, continent) => sum + continent.territories.length, 0)).toBe(42);
  });

  it("reaches every territory from every other, by land or sea", () => {
    for (let start = 0; start < TENKA_TERRITORY_COUNT; start += 1) expect(reachable(start).size).toBe(TENKA_TERRITORY_COUNT);
  });

  it("sees every border from both sides, never a territory beside itself, never a border twice", () => {
    TENKA_TERRITORIES.forEach((territory, at) => {
      for (const other of territory.land) expect(TENKA_TERRITORIES[other].land, `${territory.key} and ${TENKA_TERRITORIES[other].key} by land`).toContain(at);
      for (const other of territory.sea) expect(TENKA_TERRITORIES[other].sea, `${territory.key} and ${TENKA_TERRITORIES[other].key} by sea`).toContain(at);
      const all = tenkaNeighbours(at);
      expect(all).not.toContain(at);
      expect(new Set(all).size).toBe(all.length);
      expect(all.length, `${territory.key} has no neighbour`).toBeGreaterThan(0);
    });
  });

  it("has twenty-two sea links, the Bering Strait among them", () => {
    const links = TENKA_TERRITORIES.reduce((sum, territory) => sum + territory.sea.length, 0) / 2;
    expect(links).toBe(22);
    const alaska = TENKA_TERRITORIES.findIndex((territory) => territory.key === "alaska");
    const farEast = TENKA_TERRITORIES.findIndex((territory) => territory.key === "farEast");
    expect(TENKA_TERRITORIES[alaska].sea).toContain(farEast);
  });

  it("borders the way the world does: a few real land borders", () => {
    const at = (key: string) => TENKA_TERRITORIES.findIndex((territory) => territory.key === key);
    const borders = (a: string, b: string) => TENKA_TERRITORIES[at(a)].land.includes(at(b));
    expect(borders("mexico", "colombia")).toBe(true); // Panama and Colombia
    expect(borders("egypt", "middleEast")).toBe(true); // Sinai
    expect(borders("westernRussia", "middleEast")).toBe(true); // the Caucasus
    expect(borders("southeastAsia", "indonesia")).toBe(true); // Borneo
    expect(borders("westernCanada", "usEast")).toBe(true); // the 49th parallel, between the two cuts
    expect(borders("britain", "westernEurope")).toBe(false); // the Channel is a sea link
  });

  /*
   * THE CONTINENT TABLE ON THE RULES PAGE: bonuses sized by territories and
   * the ways in. A map that changes how many ways a continent has in fails
   * here, so the bonus is looked at again rather than left to drift.
   */
  it.each<[TenkaContinentKey, number, number, number]>([
    ["northAmerica", 8, 3, 5],
    ["southAmerica", 4, 2, 2],
    ["europe", 7, 4, 5],
    ["africa", 7, 4, 4],
    ["asia", 11, 6, 7],
    ["oceania", 5, 1, 2],
  ])("%s: %i territories, %i ways in, worth %i", (key, territories, waysIn, bonus) => {
    const continent = TENKA_CONTINENTS.find((one) => one.key === key)!;
    expect(continent.territories.length).toBe(territories);
    const borders = continent.territories.filter((territory) => tenkaNeighbours(territory).some((next) => TENKA_TERRITORIES[next].continent !== key));
    expect(borders.length).toBe(waysIn);
    expect(continent.bonus).toBe(bonus);
  });

  it("counts a continent held only when every territory of it is", () => {
    const oceania = TENKA_CONTINENTS.find((one) => one.key === "oceania")!;
    const owners = new Array<number>(TENKA_TERRITORY_COUNT).fill(1);
    for (const territory of oceania.territories) owners[territory] = 0;
    expect(continentsHeld(owners, 0).map((one) => one.key)).toEqual(["oceania"]);
    owners[oceania.territories[0]] = 1;
    expect(continentsHeld(owners, 0)).toEqual([]);
  });

  it("fortifies only through a player's own territories", () => {
    const at = (key: string) => TENKA_TERRITORIES.findIndex((territory) => territory.key === key);
    const owners = new Array<number>(TENKA_TERRITORY_COUNT).fill(1);
    for (const key of ["usWest", "usEast", "mexico", "colombia"]) owners[at(key)] = 0;
    expect(connectedOwn(owners, at("usWest")).sort()).toEqual([at("usEast"), at("mexico"), at("colombia")].sort());
    // Brazil is theirs too, but only through somebody else's Andes — still joined through Colombia.
    owners[at("brazil")] = 0;
    expect(connectedOwn(owners, at("usWest"))).toContain(at("brazil"));
    // Cut Mexico, and the south is out of reach.
    owners[at("mexico")] = 1;
    expect(connectedOwn(owners, at("usWest"))).toEqual([at("usEast")]);
  });

  it("draws every territory, with a counter inside the map, and weighs well under 150 KB", () => {
    expect(TENKA_SHAPES.outlines.length).toBe(TENKA_TERRITORY_COUNT);
    expect(TENKA_SHAPES.labels.length).toBe(TENKA_TERRITORY_COUNT);
    for (const [x, y] of TENKA_SHAPES.labels) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(TENKA_SHAPES.width);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(TENKA_SHAPES.height);
    }
    for (const outline of TENKA_SHAPES.outlines) expect(outline).toMatch(/^M-?\d+ -?\d+l/);
    const bytes = statSync("src/lib/party/tenka/tenkaShapes.data.ts").size + statSync("src/lib/party/tenka/tenkaWorld.data.ts").size;
    expect(bytes).toBeLessThan(150_000);
  });
});
