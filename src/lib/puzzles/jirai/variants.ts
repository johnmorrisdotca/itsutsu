import { freshSeed, JIRAI_SEED_BLOCK, type Random } from "../random";

/**
 * THE WAYS TO PLAY JIRAI, SAID BY THE SEED. John, 2026-09-28: "just have 1 and
 * allow language selection" — a variant of a game's rules that is the same game
 * is a setting on its set-up, never a card of its own. Jirai (Minesweeper)
 * counts mines round a square under four sets of neighbours, on a rectangle or a
 * shape cut from it; those are its settings, and they are fixed for a puzzle by
 * its seed, because a kept run, a race and an address carry a puzzle's kind,
 * size, level and seed and nothing else (the same reason a Suido network's seeds
 * sit in a block, `suido/seed.ts`).
 *
 * The classic board (eight neighbours, a rectangle) is every ordinary seed. Each
 * other way to play has a block of a million seeds of its own
 * (`JIRAI_SEED_BLOCK`), which `freshSeed` never lands in.
 *
 * Kept apart from the board's code so that an address, which reads the way to
 * play from a seed on every page that has one, does not reach the package.
 */
export type JiraiGrid = "square" | "orthogonal" | "hex" | "wrap";
export type JiraiShape = "rectangle" | "heart" | "star" | "hexagon";
export type JiraiVariant = { grid: JiraiGrid; shape: JiraiShape };

export const JIRAI_GRIDS: readonly JiraiGrid[] = ["square", "orthogonal", "hex", "wrap"];
export const JIRAI_SHAPES: readonly JiraiShape[] = ["rectangle", "heart", "star", "hexagon"];

/** The classic board: eight neighbours, a rectangle. */
export const CLASSIC_JIRAI: JiraiVariant = { grid: "square", shape: "rectangle" };

/** The side below which a shape has too few cells to be one (Jirai's own rule: nine each way). */
export const JIRAI_SHAPE_LEAST = 9;

/** Whether this way to play exists: a shape cut from the grid needs a flat board, so not edges that join. */
export function isJiraiVariant(grid: string, shape: string): boolean {
  return (JIRAI_GRIDS as readonly string[]).includes(grid) && (JIRAI_SHAPES as readonly string[]).includes(shape) && !(grid === "wrap" && shape !== "rectangle");
}

/** Every way to play but the classic one, the order their blocks are laid in: the other grids as rectangles, then the shapes on the three grids that take one. */
export const JIRAI_OTHER_VARIANTS: readonly JiraiVariant[] = [
  { grid: "orthogonal", shape: "rectangle" },
  { grid: "hex", shape: "rectangle" },
  { grid: "wrap", shape: "rectangle" },
  ...(["square", "orthogonal", "hex"] as const).flatMap((grid) => (["heart", "star", "hexagon"] as const).map((shape) => ({ grid, shape }))),
];

/** How many seeds each other way to play has. */
const BLOCK = JIRAI_SEED_BLOCK.size / JIRAI_OTHER_VARIANTS.length;

/** The way to play a seed says. Any seed outside the blocks is the classic board. */
export function jiraiVariantOfSeed(seed: number): JiraiVariant {
  if (!Number.isInteger(seed) || seed < JIRAI_SEED_BLOCK.from || seed >= JIRAI_SEED_BLOCK.from + JIRAI_SEED_BLOCK.size) return CLASSIC_JIRAI;
  return JIRAI_OTHER_VARIANTS[Math.floor((seed - JIRAI_SEED_BLOCK.from) / BLOCK)]!;
}

/** A new seed for a puzzle of this way to play, for a puzzle nobody asked for by number. */
export function freshJiraiSeed(variant: JiraiVariant, random: Random = Math.random): number {
  const at = JIRAI_OTHER_VARIANTS.findIndex((each) => each.grid === variant.grid && each.shape === variant.shape);
  return at === -1 ? freshSeed() : JIRAI_SEED_BLOCK.from + at * BLOCK + Math.floor(random() * BLOCK);
}

/** The seed a set-up's preview is dealt from: the same on the server and in the browser, which a drawn seed would not be. */
export function previewJiraiSeed(variant: JiraiVariant): number {
  return variant.grid === CLASSIC_JIRAI.grid && variant.shape === CLASSIC_JIRAI.shape ? 7 : freshJiraiSeed(variant, () => 0.5);
}

/** The side a way to play can be made at: a shape needs at least nine each way, so a smaller side asks for nine. */
export function jiraiSideFor(variant: JiraiVariant, size: number): number {
  return variant.shape === "rectangle" ? size : Math.max(size, JIRAI_SHAPE_LEAST);
}
