import type { MahjongBonusRule, MahjongCells, MahjongGeometry, MahjongLayout } from "./mahjong.types";
import { EMPTY_SLOT, matchClass } from "./tiles";

/**
 * WHAT MAKES A TILE FREE, and the moves that follow from it. Pure: every
 * function takes the tiles as they lie and returns new ones.
 *
 * A tile is free when nothing lies on it — no tile on any higher layer
 * overlapping it, even by half — and at least one of its long sides, left or
 * right, has no tile touching it on its own layer. Only a free tile can be
 * taken, and only with a free tile that matches it.
 */

const GEOMETRIES = new WeakMap<MahjongLayout, MahjongGeometry>();

/** What lies on and beside each slot, worked out once for a layout and kept. */
export function geometryOf(layout: MahjongLayout): MahjongGeometry {
  const known = GEOMETRIES.get(layout);
  if (known !== undefined) return known;
  const { slots } = layout;
  const above: number[][] = slots.map(() => []);
  const left: number[][] = slots.map(() => []);
  const right: number[][] = slots.map(() => []);
  slots.forEach((slot, index) => {
    slots.forEach((other, near) => {
      if (near === index) return;
      const overlapsDown = Math.abs(other.y - slot.y) < 2;
      if (other.z > slot.z && overlapsDown && Math.abs(other.x - slot.x) < 2) above[index]!.push(near);
      if (other.z === slot.z && overlapsDown && other.x === slot.x - 2) left[index]!.push(near);
      if (other.z === slot.z && overlapsDown && other.x === slot.x + 2) right[index]!.push(near);
    });
  });
  const geometry = { layout, above, left, right };
  GEOMETRIES.set(layout, geometry);
  return geometry;
}

/** Whether two slots of one layer overlap, which no layout may have: a tile cannot share a place. */
export function overlapsOnLayer(layout: MahjongLayout): boolean {
  const { slots } = layout;
  return slots.some((slot, index) =>
    slots.some((other, near) => near > index && other.z === slot.z && Math.abs(other.x - slot.x) < 2 && Math.abs(other.y - slot.y) < 2),
  );
}

/** Whether a slot's tile could be taken now, among the slots `present` says are still filled. */
export function isFreeAmong(geometry: MahjongGeometry, present: (slot: number) => boolean, slot: number): boolean {
  if (!present(slot)) return false;
  if (geometry.above[slot]!.some(present)) return false;
  return !geometry.left[slot]!.some(present) || !geometry.right[slot]!.some(present);
}

/** Whether the tile in this slot is free. */
export function isFree(geometry: MahjongGeometry, cells: MahjongCells, slot: number): boolean {
  if (cells[slot] === EMPTY_SLOT) return false;
  // Loops rather than `isFreeAmong`'s closures: this runs for every slot of every step of every playout a deal is graded by.
  for (const over of geometry.above[slot]!) if (cells[over] !== EMPTY_SLOT) return false;
  let leftOpen = true;
  for (const side of geometry.left[slot]!) if (cells[side] !== EMPTY_SLOT) leftOpen = false;
  if (leftOpen) return true;
  for (const side of geometry.right[slot]!) if (cells[side] !== EMPTY_SLOT) return false;
  return true;
}

/** Every free tile, by slot. */
export function freeSlots(geometry: MahjongGeometry, cells: MahjongCells): number[] {
  const free: number[] = [];
  for (let slot = 0; slot < cells.length; slot += 1) if (isFree(geometry, cells, slot)) free.push(slot);
  return free;
}

/** Why a tile cannot be taken now: covered by a tile on it, or held on both sides. Null for a free tile or an empty slot. */
export function blockedBy(geometry: MahjongGeometry, cells: MahjongCells, slot: number): "covered" | "sides" | null {
  const present = (at: number) => cells[at] !== EMPTY_SLOT;
  if (!present(slot)) return null;
  if (geometry.above[slot]!.some(present)) return "covered";
  if (geometry.left[slot]!.some(present) && geometry.right[slot]!.some(present)) return "sides";
  return null;
}

/** Every pair that could be taken now, each once, lower slot first, in slot order. */
export function freePairs(geometry: MahjongGeometry, cells: MahjongCells, rule: MahjongBonusRule): [number, number][] {
  const free = freeSlots(geometry, cells);
  const pairs: [number, number][] = [];
  for (let i = 0; i < free.length; i += 1) {
    for (let j = i + 1; j < free.length; j += 1) {
      if (matchClass(cells[free[i]!]!, rule) === matchClass(cells[free[j]!]!, rule)) pairs.push([free[i]!, free[j]!]);
    }
  }
  return pairs;
}

/** Whether these two slots are a pair that may be taken now. */
export function canTake(geometry: MahjongGeometry, cells: MahjongCells, rule: MahjongBonusRule, a: number, b: number): boolean {
  if (a === b || a < 0 || b < 0 || a >= cells.length || b >= cells.length) return false;
  if (!isFree(geometry, cells, a) || !isFree(geometry, cells, b)) return false;
  return matchClass(cells[a]!, rule) === matchClass(cells[b]!, rule);
}

/** The tiles with a pair taken. The caller has asked `canTake`. */
export function takePair(cells: MahjongCells, a: number, b: number): MahjongCells {
  const next = [...cells];
  next[a] = EMPTY_SLOT;
  next[b] = EMPTY_SLOT;
  return next.join("");
}

/** How many tiles are still on the layout. */
export function tilesLeft(cells: MahjongCells): number {
  let count = 0;
  for (const code of cells) if (code !== EMPTY_SLOT) count += 1;
  return count;
}

/** Whether every tile has been taken. */
export function isCleared(cells: MahjongCells): boolean {
  return tilesLeft(cells) === 0;
}
