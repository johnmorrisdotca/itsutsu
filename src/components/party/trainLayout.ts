/**
 * WHERE EVERYTHING SITS ON THE MEXICAN TRAIN TABLE, in the table's own units:
 * the table is a square `TABLE_UNITS` across, drawn inside the site's wood
 * (`BoardFrame`), so it scales with its column and a phone draws what a desk
 * draws, only smaller.
 *
 * The hub runs along the top, with the round's engine double in it. Under it
 * every train has a row of its own, the Mexican Train last: its owner's
 * marble and name, their marker when it is out, how many tiles are laid on it
 * before the ones shown, and then the last few tiles, the open end on the
 * right where the next tile goes. The rows share the height under the hub, so
 * a table of two has tall rows and large tiles and a table of eight fits nine
 * rows in the same square.
 */

/** The table's side, in its own units. */
export const TABLE_UNITS = 100;

/** The hub's row along the top. */
export const HUB_HEIGHT = 15;

/** A train's row at most, so a table of two does not draw tiles too big for the row's words. */
const ROW_MOST = 13;

/** The room at a row's left for its marble, its name and its marker; then the count; the tiles take the rest. */
export const ROW_LABEL = 25;
export const ROW_COUNT = 8;
const ROW_RIGHT_PAD = 1.5;

/** A tile's short side as a share of its row's height, and the gap between two tiles in a row. */
const TILE_SHARE = 0.72;
const TILE_GAP = 0.5;

/** One train's row: where it is, how big its tiles are drawn, and how many of them fit. */
export type RowBox = {
  y: number;
  height: number;
  /** A tile's short side: it lies along the row, twice this long. */
  tile: number;
  /** How many tiles fit in the row: the last this many of the train are shown. */
  fits: number;
  /** Where the first shown tile starts. */
  tilesX: number;
};

/** Every train's row, top to bottom, for a table of this many trains (the players' and the Mexican). */
export function rowBoxes(trains: number): RowBox[] {
  const height = Math.min(ROW_MOST, (TABLE_UNITS - HUB_HEIGHT) / trains);
  const tile = height * TILE_SHARE;
  const tilesX = ROW_LABEL + ROW_COUNT;
  const room = TABLE_UNITS - tilesX - ROW_RIGHT_PAD;
  const fits = Math.max(1, Math.floor((room + TILE_GAP) / (tile * 2 + TILE_GAP)));
  // The rows under the hub, centred in the room left when they do not fill it.
  const top = HUB_HEIGHT + (TABLE_UNITS - HUB_HEIGHT - height * trains) / 2;
  return Array.from({ length: trains }, (_, at) => ({ y: top + at * height, height, tile, fits, tilesX }));
}

/** Where the `index`th tile shown in a row starts, left to right. */
export function tileX(row: RowBox, index: number): number {
  return row.tilesX + index * (row.tile * 2 + TILE_GAP);
}

/**
 * WHERE THE PIPS OF A NUMBER SIT on one half of a tile, as fractions of the
 * half's side from its top left. Nought to nine are the familiar faces of a
 * die grown to three rows; ten to fifteen stand in three columns of up to
 * five, as double-twelve and double-fifteen sets print them, so every number
 * is told by the shape of its pips as well as their count and colour.
 */
export function pipSpots(value: number): readonly (readonly [number, number])[] {
  const l = 0.25;
  const c = 0.5;
  const r = 0.75;
  const t = 0.25;
  const m = 0.5;
  const b = 0.75;
  const column = (x: number, count: number): [number, number][] => {
    if (count === 0) return [];
    const top = count >= 5 ? 0.16 : count === 4 ? 0.2 : count === 3 ? 0.27 : 0.36;
    const step = count === 1 ? 0 : (1 - 2 * top) / (count - 1);
    return Array.from({ length: count }, (_, at) => [x, top + at * step] as [number, number]);
  };
  switch (value) {
    case 0:
      return [];
    case 1:
      return [[c, m]];
    case 2:
      return [[l, t], [r, b]];
    case 3:
      return [[l, t], [c, m], [r, b]];
    case 4:
      return [[l, t], [r, t], [l, b], [r, b]];
    case 5:
      return [[l, t], [r, t], [c, m], [l, b], [r, b]];
    case 6:
      return [[l, t], [r, t], [l, m], [r, m], [l, b], [r, b]];
    case 7:
      return [[l, t], [r, t], [l, m], [c, m], [r, m], [l, b], [r, b]];
    case 8:
      return [[l, t], [c, t], [r, t], [l, m], [r, m], [l, b], [c, b], [r, b]];
    case 9:
      return [[l, t], [c, t], [r, t], [l, m], [c, m], [r, m], [l, b], [c, b], [r, b]];
    default: {
      // Ten to fifteen: the two outer columns of four or five, the middle holding what is left.
      const outer = value >= 13 ? 5 : 4;
      const middle = value - 2 * outer;
      return [...column(0.22, outer), ...column(0.5, middle), ...column(0.78, outer)];
    }
  }
}

/** A pip's radius, as a share of the half's side: smaller as a number's pips grow many, so fifteen still stand apart. */
export function pipRadius(value: number): number {
  if (value <= 6) return 0.1;
  if (value <= 9) return 0.085;
  if (value <= 12) return 0.075;
  return 0.066;
}
