import { pitOwner, storeOf } from "@/lib/party/mancala/sowing";

/**
 * WHERE EVERYTHING ON MANCALA'S BOARD SITS, in the board's own units: a
 * square 100 across, the same square of wood `BoardFrame` draws for every
 * board on the site.
 *
 * The first player's row runs along the bottom, left to right (holes 0–5),
 * their store at the right end; the second's along the top, right to left
 * (7–12), their store at the left — so a sowing goes round counter-clockwise
 * as it is drawn, and each pit faces the pit it captures from. Each player's
 * name is on their own edge. A pit is a tall cup the width of a column,
 * about forty pixels on a 390-pixel phone, and the whole column is its tap
 * target.
 */

/** A box on the board: left, top, width and height. */
export type LayoutBox = { x: number; y: number; w: number; h: number };

export const BOARD_UNITS = 100;
/** The strip along each edge that carries a player's name. */
export const NAME_TOP = 9;
export const NAME_BOTTOM = 94;
/** The board proper, between the two names. */
const TOP = 16;
const BOTTOM = 84;
const MIDDLE = 50;
const STORE_WIDTH = 10.5;
const EDGE = 1.5;
const COLUMNS = 6;
const COLUMN_LEFT = EDGE + STORE_WIDTH + 1;
const COLUMN_WIDTH = (BOARD_UNITS - 2 * COLUMN_LEFT) / COLUMNS;
/** The gap left between two pits, and between the rows. */
const GAP = 1.2;

/** The column a pit stands in, 0 at the left. */
function columnOf(hole: number): number {
  return hole <= 5 ? hole : 12 - hole;
}

/** The whole column-cell a pit stands in: its tap target. */
export function pitCell(hole: number): LayoutBox {
  const top = hole <= 5 ? MIDDLE : TOP;
  return { x: COLUMN_LEFT + columnOf(hole) * COLUMN_WIDTH, y: top, w: COLUMN_WIDTH, h: MIDDLE - TOP };
}

/** The cup itself, a little inside its cell. */
export function pitBox(hole: number): LayoutBox {
  const cell = pitCell(hole);
  return { x: cell.x + GAP / 2, y: cell.y + GAP / 2, w: cell.w - GAP, h: cell.h - GAP };
}

/** A store: the full height of the board at its player's right-hand end. */
export function storeBox(hole: number): LayoutBox {
  const x = hole === storeOf(0) ? BOARD_UNITS - EDGE - STORE_WIDTH : EDGE;
  return { x, y: TOP + GAP / 2, w: STORE_WIDTH, h: BOTTOM - TOP - GAP };
}

export function holeBox(hole: number): LayoutBox {
  return pitOwner(hole) === null ? storeBox(hole) : pitBox(hole);
}

/** How tall a hole's count is drawn, and where: at the end of the hole nearer its owner, so the seeds keep the rest. */
export const COUNT_SIZE = 6.2;
export function countAt(hole: number): { x: number; y: number } {
  const box = holeBox(hole);
  // The first player's holes carry their count at the bottom, the second's at the top: each reads it from their own side.
  const near = hole <= storeOf(0);
  return { x: box.x + box.w / 2, y: near ? box.y + box.h - COUNT_SIZE * 0.85 : box.y + COUNT_SIZE * 0.85 };
}

/** The room left for seeds in a hole: all of it but the end the count is drawn in. */
function seedRoom(hole: number): LayoutBox {
  const box = holeBox(hole);
  const count = COUNT_SIZE * 1.7;
  const near = hole <= storeOf(0);
  return { x: box.x + 1, y: near ? box.y + 1 : box.y + count, w: box.w - 2, h: box.h - count - 1 };
}

export const SEED_RADIUS = 1.95;
const SEED_STEP = SEED_RADIUS * 2.1;

/** Every place a seed may lie in a hole, closest to the middle of its room first, so a few seeds gather in the middle. */
function spotsIn(room: LayoutBox): { x: number; y: number }[] {
  const spots: { x: number; y: number }[] = [];
  const rowStep = SEED_STEP * 0.87;
  for (let row = 0, y = room.y + SEED_RADIUS; y <= room.y + room.h - SEED_RADIUS; row += 1, y += rowStep) {
    for (let x = room.x + SEED_RADIUS + (row % 2 === 1 ? SEED_STEP / 2 : 0); x <= room.x + room.w - SEED_RADIUS; x += SEED_STEP) spots.push({ x, y });
  }
  const middle = { x: room.x + room.w / 2, y: room.y + room.h / 2 };
  return spots.sort((a, b) => Math.hypot(a.x - middle.x, a.y - middle.y) - Math.hypot(b.x - middle.x, b.y - middle.y));
}

const SPOTS = new Map<number, { x: number; y: number }[]>();

/**
 * Where each of `count` seeds lies in a hole. Past what one layer holds they
 * pile a little up and across the first, as a full store does — the count
 * beside them is what says how many, so no reader ever has to count them.
 */
export function seedSpots(hole: number, count: number): { x: number; y: number }[] {
  let spots = SPOTS.get(hole);
  if (spots === undefined) {
    spots = spotsIn(seedRoom(hole));
    SPOTS.set(hole, spots);
  }
  const layer = spots.length;
  return Array.from({ length: count }, (_, seed) => {
    const spot = spots[seed % layer];
    const up = Math.floor(seed / layer) * (SEED_RADIUS * 0.8);
    return { x: spot.x + up * 0.6, y: spot.y - up };
  });
}
