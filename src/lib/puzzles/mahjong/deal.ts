import { seededRandom, shuffled, type Random } from "../random";
import { isFreeAmong } from "./board";
import type { MahjongBonusRule, MahjongCells, MahjongGeometry } from "./mahjong.types";
import { EMPTY_SLOT, matchClass } from "./tiles";

/**
 * DEALS THAT CAN BE FINISHED, BY LAYING PAIRS IN REVERSE.
 *
 * Start from the layout with every slot to be filled and take pairs of slots
 * off it the way a player would take tiles — two slots that are both free
 * among the slots still to fill — and give each pair of slots a matching pair
 * of tiles. The order they came off in is then a way to clear the deal, from
 * the first pair to the last, so every deal made here can be finished. A
 * layout can run out of free slots before it is empty (two slots stacked one
 * on the other, and nothing else); that attempt is dropped and the next
 * random stream tried, and `MOST_ATTEMPTS` is far more than any layout here
 * has needed (`mahjong.test.ts` measures them).
 */

const MOST_ATTEMPTS = 400;

/** A deal laid out and the order it can be cleared in, pair by pair. */
export type Laid = { cells: MahjongCells; order: [number, number][] };

/**
 * Lay these pairs of tiles into the slots `present` names, or null when no
 * attempt reached the end. Higher slots are a little likelier to be taken
 * first, which keeps the stacks coming down together and leaves fewer
 * attempts stuck on a tower of two.
 */
export function layPairs(geometry: MahjongGeometry, present: readonly boolean[], pairs: readonly (readonly [string, string])[], random: Random): Laid | null {
  const count = present.filter(Boolean).length;
  if (count % 2 !== 0 || pairs.length < count / 2) return null;
  const { slots } = geometry.layout;
  for (let attempt = 0; attempt < MOST_ATTEMPTS; attempt += 1) {
    const filled = [...present];
    const cells = new Array<string>(present.length).fill(EMPTY_SLOT);
    const order: [number, number][] = [];
    let left = count;
    let stuck = false;
    while (left > 0) {
      const free: number[] = [];
      for (let slot = 0; slot < filled.length; slot += 1) if (isFreeAmong(geometry, (at) => filled[at]!, slot)) free.push(slot);
      if (free.length < 2) {
        stuck = true;
        break;
      }
      const first = weightedPick(free, slots, random);
      const second = weightedPick(free.filter((slot) => slot !== first), slots, random);
      const [a, b] = pairs[order.length]!;
      const flip = random() < 0.5;
      cells[first] = flip ? b : a;
      cells[second] = flip ? a : b;
      filled[first] = false;
      filled[second] = false;
      order.push([first, second]);
      left -= 2;
    }
    if (!stuck) return { cells: cells.join(""), order };
  }
  return null;
}

function weightedPick(free: readonly number[], slots: readonly { z: number }[], random: Random): number {
  const weights = free.map((slot) => 1 + slots[slot]!.z);
  let roll = random() * weights.reduce((total, weight) => total + weight, 0);
  for (let index = 0; index < free.length; index += 1) {
    roll -= weights[index]!;
    if (roll < 0) return free[index]!;
  }
  return free[free.length - 1]!;
}

/** The tiles left on a layout as pairs that match, each pair's tiles together: what a shuffle lays again. */
export function pairsLeft(cells: MahjongCells, rule: MahjongBonusRule): [string, string][] {
  const byClass = new Map<string, string[]>();
  for (const code of cells) {
    if (code === EMPTY_SLOT) continue;
    const key = matchClass(code, rule);
    byClass.set(key, [...(byClass.get(key) ?? []), code]);
  }
  const pairs: [string, string][] = [];
  for (const key of [...byClass.keys()].sort()) {
    const codes = byClass.get(key)!.sort();
    for (let at = 0; at + 1 < codes.length; at += 2) pairs.push([codes[at]!, codes[at + 1]!]);
  }
  return pairs;
}

/** A 32-bit FNV-1a hash of a string: the seed a shuffle is drawn from, so the same tiles shuffled the same time come out the same. */
export function hashText(text: string): number {
  let hash = 0x811c9dc5;
  for (let at = 0; at < text.length; at += 1) {
    hash ^= text.charCodeAt(at);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * SHUFFLE: the tiles left, laid again in the slots they fill, so that play can
 * go on. Drawn from the tiles themselves and how many shuffles came before
 * (`index`), never from `Math.random`, so a solve replayed on the server — or
 * a kept game opened again — shuffles to exactly the same tiles.
 *
 * Laid in reverse, as a deal is, so what is left can be finished whenever the
 * slots allow it. When they do not (two tiles stacked, nothing beside them),
 * the tiles are laid with one matching pair on two free slots, so the next
 * move exists; and where not even two slots are free, no shuffle can help and
 * this answers null.
 */
export function shuffleTiles(geometry: MahjongGeometry, cells: MahjongCells, rule: MahjongBonusRule, index: number): MahjongCells | null {
  const present = [...cells].map((code) => code !== EMPTY_SLOT);
  const random = seededRandom(hashText(`${cells}:${index}`) || 1);
  const pairs = shuffled(pairsLeft(cells, rule), random);
  if (pairs.length === 0) return null;
  const laid = layPairs(geometry, present, pairs, random);
  if (laid !== null) return laid.cells;
  const free = present.flatMap((filled, slot) => (filled && isFreeAmong(geometry, (at) => present[at]!, slot) ? [slot] : []));
  if (free.length < 2) return null;
  const [first, second] = shuffled(free, random);
  const others = shuffled(
    present.flatMap((filled, slot) => (filled && slot !== first && slot !== second ? [slot] : [])),
    random,
  );
  const next = new Array<string>(cells.length).fill(EMPTY_SLOT);
  next[first!] = pairs[0]![0];
  next[second!] = pairs[0]![1];
  pairs.slice(1).flat().forEach((code, at) => (next[others[at]!] = code));
  return next.join("");
}
