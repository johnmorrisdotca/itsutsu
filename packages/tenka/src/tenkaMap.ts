import type { TenkaContinent, TenkaContinentKey, TenkaOwner } from "./tenka.types.ts";
import { TENKA_TERRITORY_DATA } from "./tenkaWorld.data.ts";

/**
 * TENKA'S WORLD, as the rules read it: forty-two territories, their
 * neighbours by land and by sea, and six continents with what holding each
 * is worth. The territories, their names and their neighbours are written by
 * `scripts/map.mjs` from Natural Earth (`tenkaWorld.data.ts`); the
 * continents' bonuses are decided here, by hand, sized to how many
 * territories a continent has and how many ways in it has to be held
 * against:
 *
 *   North America   8 territories, 3 ways in   5
 *   South America   4 territories, 2 ways in   2
 *   Europe          7 territories, 4 ways in   5
 *   Africa          7 territories, 4 ways in   4
 *   Asia           11 territories, 6 ways in   7
 *   Oceania         5 territories, 1 way in    2
 *
 * (`tenkaMap.test.ts` counts the ways in, so a map that changes them fails
 * until this table is looked at again.)
 */
export const TENKA_TERRITORIES = TENKA_TERRITORY_DATA;

export const TENKA_TERRITORY_COUNT = TENKA_TERRITORIES.length;

const CONTINENT_ROWS: readonly Omit<TenkaContinent, "territories">[] = [
  { key: "northAmerica", name: "North America", kanji: "北米", bonus: 5 },
  { key: "southAmerica", name: "South America", kanji: "南米", bonus: 2 },
  { key: "europe", name: "Europe", kanji: "欧州", bonus: 5 },
  { key: "africa", name: "Africa", kanji: "阿州", bonus: 4 },
  { key: "asia", name: "Asia", kanji: "亜州", bonus: 7 },
  { key: "oceania", name: "Oceania", kanji: "大洋州", bonus: 2 },
];

export const TENKA_CONTINENTS: readonly TenkaContinent[] = CONTINENT_ROWS.map((row) => ({
  ...row,
  territories: TENKA_TERRITORIES.flatMap((territory, at) => (territory.continent === row.key ? [at] : [])),
}));

const CONTINENT_BY_KEY = new Map<TenkaContinentKey, TenkaContinent>(TENKA_CONTINENTS.map((continent) => [continent.key, continent]));

/** A continent by its key. */
export function tenkaContinent(key: TenkaContinentKey): TenkaContinent {
  return CONTINENT_BY_KEY.get(key)!;
}

/** Every territory an army may move to from this one: its neighbours by land, then by sea. */
const NEIGHBOURS: readonly (readonly number[])[] = TENKA_TERRITORIES.map((territory) => [...territory.land, ...territory.sea]);

export function tenkaNeighbours(territory: number): readonly number[] {
  return NEIGHBOURS[territory] ?? [];
}

export function areNeighbours(a: number, b: number): boolean {
  return tenkaNeighbours(a).includes(b);
}

export function isTerritory(territory: number): boolean {
  return Number.isInteger(territory) && territory >= 0 && territory < TENKA_TERRITORY_COUNT;
}

/** The continents a player holds every territory of. */
export function continentsHeld(owners: readonly TenkaOwner[], seat: TenkaOwner): TenkaContinent[] {
  return TENKA_CONTINENTS.filter((continent) => continent.territories.every((territory) => owners[territory] === seat));
}

/**
 * Every territory of `seat`'s that armies at `from` could march to through
 * their own territories alone: where one fortifying move may take them.
 */
export function connectedOwn(owners: readonly TenkaOwner[], from: number): number[] {
  const seat = owners[from];
  const seen = new Set<number>([from]);
  const queue = [from];
  while (queue.length > 0) {
    const at = queue.shift()!;
    for (const next of tenkaNeighbours(at)) {
      if (!seen.has(next) && owners[next] === seat) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  seen.delete(from);
  return [...seen].sort((a, b) => a - b);
}
