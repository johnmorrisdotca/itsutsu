import type { MahjongLayout, MahjongSlot } from "./mahjong.types";

/**
 * THE LAYOUTS. A slot is a tile's top-left corner in HALF-tile units — a tile
 * covers two across and two down — so a tile can sit half over the two below
 * it, as the top of the Turtle does. Written here as rows of tiles, layer by
 * layer, and read in one order (layer, then row, then column): the order a
 * deal is written in, so a slot's number is the same in every browser and on
 * the server.
 *
 * A layout's `size` is its width in tiles, which is what the set-up's board
 * tiles draw as their big number: 8, 9, 10 and 15 across. Three are drawn to
 * fit a phone's width with tiles a finger can find (about 40 pixels across at
 * 390); the Turtle is the classic 144, fifteen tiles wide, and on a phone its
 * board zooms (`MahjongViewport`).
 */

/** Tiles along one row: `from` to `to` inclusive, in whole tiles (two half units apart). */
function row(z: number, y: number, from: number, to: number): MahjongSlot[] {
  const slots: MahjongSlot[] = [];
  for (let x = from; x <= to; x += 2) slots.push({ x, y, z });
  return slots;
}

/** Single tiles at these half-unit columns. */
function at(z: number, y: number, ...xs: number[]): MahjongSlot[] {
  return xs.map((x) => ({ x, y, z }));
}

/** A block of whole rows. */
function block(z: number, y0: number, y1: number, from: number, to: number): MahjongSlot[] {
  const slots: MahjongSlot[] = [];
  for (let y = y0; y <= y1; y += 2) slots.push(...row(z, y, from, to));
  return slots;
}

function inOrder(slots: MahjongSlot[]): MahjongSlot[] {
  return [...slots].sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);
}

/**
 * TORII 鳥居, 64 tiles, eight across: the gate before a shrine — the curved top
 * beam and the one under it, the tie beam, the plaque between, and the two
 * pillars down to their feet.
 */
const TORII: MahjongSlot[] = [
  ...row(0, 0, 0, 14),
  ...row(0, 2, 2, 12),
  ...at(0, 4, 2, 6, 8, 12),
  ...row(0, 6, 0, 14),
  ...at(0, 8, 2, 12),
  ...at(0, 10, 2, 12),
  ...at(0, 12, 2, 12),
  ...at(0, 14, 2, 12),
  ...at(0, 16, 0, 2, 4, 10, 12, 14),
  ...row(1, 0, 0, 14),
  ...row(1, 6, 2, 12),
  ...at(1, 3, 7),
  ...at(1, 10, 2, 12),
  ...at(1, 14, 2, 12),
  ...at(2, 0, 0, 6, 8, 14),
  ...at(2, 3, 7),
];

/**
 * FUJI 富士, 100 tiles, nine across: the mountain, broad at its foot and climbing
 * in five layers to a cap of snow.
 */
const FUJI: MahjongSlot[] = [
  ...row(0, 0, 6, 10),
  ...row(0, 2, 4, 12),
  ...row(0, 4, 2, 14),
  ...block(0, 6, 12, 0, 16),
  ...row(1, 2, 6, 10),
  ...row(1, 4, 4, 12),
  ...block(1, 6, 10, 2, 14),
  ...row(2, 4, 6, 10),
  ...block(2, 6, 8, 4, 12),
  ...block(3, 6, 8, 6, 10),
  ...at(4, 7, 8),
];

/**
 * CASTLE 城, 120 tiles, ten across: a keep on its stone base, corner turrets
 * standing out at the top, and the tiers stepping up to the roof.
 */
const CASTLE: MahjongSlot[] = [
  ...at(0, 0, 0, 2, 8, 10, 16, 18),
  ...block(0, 2, 10, 0, 18),
  ...row(0, 12, 2, 16),
  ...at(1, 0, 0, 18),
  ...block(1, 2, 8, 2, 16),
  ...block(2, 4, 6, 4, 14),
  ...block(3, 4, 6, 6, 12),
  ...at(4, 5, 8, 10),
];

/**
 * TURTLE 亀, the classic 144, fifteen across: the layout the solitaire has been
 * played on since it was first published, its shell in five layers, a head at
 * one end and a tail of two at the other.
 */
const TURTLE: MahjongSlot[] = [
  ...row(0, 0, 2, 24),
  ...row(0, 2, 6, 20),
  ...row(0, 4, 4, 22),
  ...row(0, 6, 2, 24),
  ...row(0, 8, 2, 24),
  ...row(0, 10, 4, 22),
  ...row(0, 12, 6, 20),
  ...row(0, 14, 2, 24),
  ...at(0, 7, 0, 26, 28),
  ...block(1, 2, 12, 8, 18),
  ...block(2, 4, 10, 10, 16),
  ...block(3, 6, 8, 12, 14),
  ...at(4, 7, 13),
];

/**
 * A SQUARE OF EIGHT, four across: never offered, for the browser tests, which
 * clear it in four pairs. Made and checked like any other.
 */
const TINY: MahjongSlot[] = [...row(0, 0, 0, 6), ...row(1, 0, 1, 5), ...at(2, 0, 3)];

export const MAHJONG_LAYOUTS: readonly MahjongLayout[] = [
  { size: 4, key: "tiny", slots: inOrder(TINY) },
  { size: 8, key: "torii", slots: inOrder(TORII) },
  { size: 9, key: "fuji", slots: inOrder(FUJI) },
  { size: 10, key: "castle", slots: inOrder(CASTLE) },
  { size: 15, key: "turtle", slots: inOrder(TURTLE) },
];

/** The layout a size names, or null for one there is not. */
export function layoutFor(size: number): MahjongLayout | null {
  return MAHJONG_LAYOUTS.find((layout) => layout.size === size) ?? null;
}

/** The layout's extent in half units: how far right and down its tiles reach, and how many layers. */
export function layoutExtent(layout: MahjongLayout): { width: number; height: number; layers: number } {
  let width = 0;
  let height = 0;
  let layers = 0;
  for (const slot of layout.slots) {
    width = Math.max(width, slot.x + 2);
    height = Math.max(height, slot.y + 2);
    layers = Math.max(layers, slot.z + 1);
  }
  return { width, height, layers };
}
