import type { MeikyuuSolidKind } from "@/lib/puzzles/meikyuu/sizes";

/**
 * THE OUTLINE OF EACH SOLID a Meikyuu maze can be over, as paths on a 100 by 100 board (`BoardSizeMark` draws the one a size is): a cube seen corner on, a globe with its
 * equator and a meridian, an octahedron's two pyramids, an icosahedron's hexagon round triangles. Hand-drawn, not the package's, so the tile costs the page nothing to draw.
 */
export const SOLID_LINES: Record<MeikyuuSolidKind, { paths: readonly string[]; dashed?: readonly string[] }> = {
  cube: { paths: ["M50 8 L86 28 L86 72 L50 92 L14 72 L14 28 Z", "M14 28 L50 48 L86 28", "M50 48 L50 92"] },
  sphere: { paths: ["M50 8 A42 42 0 1 0 50 92 A42 42 0 1 0 50 8 Z", "M8 50 A42 14 0 0 0 92 50", "M50 8 A14 42 0 0 0 50 92"], dashed: ["M8 50 A42 14 0 0 1 92 50", "M50 8 A14 42 0 0 1 50 92"] },
  octahedron: { paths: ["M50 6 L90 52 L50 94 L10 52 Z", "M10 52 L50 68 L90 52", "M50 6 L50 68 L50 94"] },
  icosahedron: { paths: ["M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z", "M50 6 L72 50 L28 50 Z", "M28 50 L12 72 L50 94 L72 50 L88 72", "M72 50 L88 28 M28 50 L12 28"] },
};
