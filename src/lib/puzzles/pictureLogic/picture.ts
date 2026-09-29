import type { Random } from "../random";
import type { PictureStyle } from "./pictureLogic.types";

/**
 * A PICTURE FROM A SEED: ours, drawn by this code, from no set of pictures.
 *
 * Random noise makes an ugly grid, and an ambiguous one: scattered cells give
 * clues of ones that can be shuffled among themselves. So a picture here is
 * drawn the way a child draws, from a few whole shapes — ellipses, boxes and
 * wedges on a square canvas — in one of three kinds:
 *
 * - A FIGURE: a body on the middle line, with a head, limbs, ears or wings
 *   off it and a hole or two for eyes, mirrored left to right. A mirror is
 *   what makes a handful of shapes read as a creature, a mask, a vase or a
 *   badge.
 * - HILLS: the ground rising and falling across the grid in two or three
 *   long waves, with a sun or a moon over it, and sometimes a tree on a hill.
 * - A CLOUD: circles heaped around the middle into one round shape, sometimes
 *   turned half about itself so it balances.
 *
 * Each cell is shaded when its centre falls inside the drawing, and a lone
 * shaded cell with no neighbour is rubbed out on the bigger grids, where it
 * reads as a speck rather than a detail. The generator (`generate.ts`) then
 * keeps only a picture whose clues have one answer, proved by the solver.
 */

type Shape = (x: number, y: number) => boolean;

const ellipse = (cx: number, cy: number, rx: number, ry: number): Shape => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const box = (x0: number, y0: number, x1: number, y1: number): Shape => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
/** A wedge with its point at (cx, top) and its base on `bottom`, `half` wide each side there; upside down when top is below bottom. */
const wedge = (cx: number, top: number, bottom: number, half: number): Shape => (x, y) => {
  const along = (y - top) / (bottom - top);
  return along >= 0 && along <= 1 && Math.abs(x - cx) <= half * along;
};

/** A number in [from, to). */
const between = (random: Random, from: number, to: number) => from + (to - from) * random();

function figure(random: Random): { draw: Shape[]; cut: Shape[] } {
  const draw: Shape[] = [];
  const cut: Shape[] = [];
  const cy = between(random, 0.5, 0.64);
  const rx = between(random, 0.2, 0.36);
  const ry = between(random, 0.22, 0.32);
  const body = Math.floor(random() * 3);
  draw.push(body === 0 ? ellipse(0.5, cy, rx, ry) : body === 1 ? box(0.5 - rx, cy - ry, 0.5 + rx, cy + ry) : wedge(0.5, cy - ry * 1.4, cy + ry, rx * 1.3));
  // A head on top, most of the time.
  if (random() < 0.75) {
    const hr = between(random, 0.12, 0.2);
    draw.push(ellipse(0.5, cy - ry - hr * 0.7, hr, hr * between(random, 0.85, 1.1)));
    // Eyes, a pair, when there is room for them.
    if (random() < 0.6) cut.push(ellipse(0.5 - hr * 0.45, cy - ry - hr * 0.8, hr * 0.22, hr * 0.26));
  }
  // Limbs, ears or wings: a pair off the middle line, mirrored.
  const limbs = 1 + Math.floor(random() * 2);
  for (let limb = 0; limb < limbs; limb += 1) {
    const lx = between(random, 0.08, 0.5 - rx * 0.6);
    const ly = between(random, 0.15, 0.95);
    draw.push(random() < 0.5 ? ellipse(lx, ly, between(random, 0.05, 0.12), between(random, 0.08, 0.2)) : box(lx - 0.05, ly - between(random, 0.05, 0.2), lx + 0.05, ly + 0.08));
  }
  // A hole in the body now and then: a window, a mouth, a belt.
  if (random() < 0.4) cut.push(box(0.5 - rx * 0.5, cy - 0.03, 0.5 + rx * 0.5, cy + 0.03));
  return { draw, cut };
}

function hills(random: Random): { draw: Shape[]; cut: Shape[] } {
  const base = between(random, 0.48, 0.72);
  const waves = Array.from({ length: 2 + Math.floor(random() * 2) }, (_, at) => ({
    height: between(random, 0.05, 0.14) / (at + 1),
    length: between(random, 0.6, 1.4) / (at + 1),
    phase: random() * Math.PI * 2,
  }));
  const ground = (x: number) => base + waves.reduce((sum, wave) => sum + wave.height * Math.sin((x / wave.length) * Math.PI * 2 + wave.phase), 0);
  const draw: Shape[] = [(x, y) => y >= ground(x)];
  const cut: Shape[] = [];
  // A sun or a moon in the sky, on the side the hills leave room.
  const sx = random() < 0.5 ? between(random, 0.15, 0.35) : between(random, 0.65, 0.85);
  const sr = between(random, 0.1, 0.16);
  const sy = Math.max(sr + 0.04, Math.min(ground(sx) - sr - 0.12, between(random, 0.15, 0.3)));
  draw.push(ellipse(sx, sy, sr, sr));
  if (random() < 0.4) cut.push(ellipse(sx + sr * 0.5, sy - sr * 0.2, sr * 0.8, sr * 0.8));
  // A tree on the hills, now and then: a trunk and a round crown.
  if (random() < 0.5) {
    const tx = sx < 0.5 ? between(random, 0.6, 0.85) : between(random, 0.15, 0.4);
    const foot = ground(tx);
    const tall = between(random, 0.15, 0.25);
    draw.push(box(tx - 0.03, foot - tall, tx + 0.03, foot));
    draw.push(ellipse(tx, foot - tall - 0.06, between(random, 0.08, 0.13), between(random, 0.08, 0.12)));
  }
  return { draw, cut };
}

function cloud(random: Random): { draw: Shape[]; cut: Shape[] } {
  const draw: Shape[] = [];
  const cut: Shape[] = [];
  const puffs = 3 + Math.floor(random() * 4);
  for (let puff = 0; puff < puffs; puff += 1) {
    const r = between(random, 0.12, 0.24);
    draw.push(ellipse(between(random, 0.3, 0.7), between(random, 0.32, 0.68), r * between(random, 0.9, 1.3), r));
  }
  if (random() < 0.5) cut.push(ellipse(between(random, 0.35, 0.65), between(random, 0.4, 0.6), between(random, 0.05, 0.1), between(random, 0.05, 0.1)));
  return { draw, cut };
}

const STYLES: Record<PictureStyle, (random: Random) => { draw: Shape[]; cut: Shape[] }> = { figure, hills, cloud };

/**
 * A picture of this style at this size, row by row, true for shaded. The same
 * stream always draws the same picture.
 */
export function drawPicture(size: number, style: PictureStyle, random: Random): boolean[] {
  const { draw, cut } = STYLES[style](random);
  // A figure is mirrored; a cloud is sometimes turned half about its middle.
  const turned = style === "cloud" && random() < 0.35;
  const picture = Array.from({ length: size * size }, (_, cell) => {
    let x = (Math.floor(cell % size) + 0.5) / size;
    const y = (Math.floor(cell / size) + 0.5) / size;
    if (style === "figure") x = Math.min(x, 1 - x);
    const inside = (u: number, v: number) => draw.some((shape) => shape(u, v)) && !cut.some((shape) => shape(u, v));
    return inside(x, y) || (turned && inside(1 - x, 1 - y));
  });
  if (size >= 10) {
    // A lone cell with no shaded neighbour is a speck, not a detail.
    const lone = picture.map((shaded, cell) => {
      if (!shaded) return false;
      const row = Math.floor(cell / size);
      const col = cell % size;
      const near = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ].some(([r, c]) => r! >= 0 && c! >= 0 && r! < size && c! < size && picture[r! * size + c!]);
      return !near;
    });
    lone.forEach((speck, cell) => {
      if (speck) picture[cell] = false;
    });
  }
  return picture;
}
