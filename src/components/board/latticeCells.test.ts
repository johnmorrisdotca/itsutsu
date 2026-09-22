import { describe, expect, it } from "vitest";

import { HEXAGON_VERTICES } from "./BoardLines";
import { HEX_LATTICE } from "./Board.constants";

/**
 * A HEXAGON CELL IS A HEXAGON ON THE SCREEN.
 *
 * John, 2026-09-22: "HEXAGONS are slightly tilted in all our hex using
 * boards!" They were, on every one of them — the star, the honeycomb,
 * Hexversi, Hex — and had been since the cells were drawn, because the
 * polygon undoes the lattice's shear by hand and undid it with the wrong y.
 * See the note above `HEXAGON_VERTICES`.
 *
 * WHY NOTHING CAUGHT IT. `hexagonFit.test.ts` is thorough about this lattice
 * and asks a different question: where the shape sits in its frame, and how
 * much of the wood it fills. Both were right the whole time. Nothing anywhere
 * asked what the cells LOOKED like, so a five-degree skew on every cell of
 * four games was invisible to a green suite and obvious to the first person
 * who looked at the board.
 *
 * So this test is written from the other end, and that is the point of it: it
 * takes the vertices the component hands the browser, puts them through the
 * very transform string the browser is given, and asks of the result the only
 * thing a reader of the board is asking — is that a regular hexagon. It knows
 * nothing about how the vertices were worked out, so it cannot be satisfied by
 * a second copy of the same arithmetic.
 */

/** The 2×2 matrix an SVG transform list of skews and scales comes to, read off the string itself. */
function matrixOf(transform: string): [number, number, number, number] {
  // Identity, then each step applied on the LEFT: a transform list composes so
  // that the rightmost is applied to the point first.
  let [a, b, c, d] = [1, 0, 0, 1];
  const steps = [...transform.matchAll(/(skewX|skewY|scaleX|scaleY|scale)\(([-0-9.]+)(?:deg)?\)/g)];
  expect(steps.length, `nothing recognised in "${transform}"`).toBeGreaterThan(0);
  for (const [, kind, raw] of steps) {
    const value = Number(raw);
    const step: [number, number, number, number] =
      kind === "skewX"
        ? [1, Math.tan((value * Math.PI) / 180), 0, 1]
        : kind === "skewY"
          ? [1, 0, Math.tan((value * Math.PI) / 180), 1]
          : kind === "scaleX"
            ? [value, 0, 0, 1]
            : kind === "scaleY"
              ? [1, 0, 0, value]
              : [value, 0, 0, value];
    // Multiplied on the RIGHT, so the list reads left to right and the last
    // step named is the one a point meets first. Doing it the other way round
    // made the identity below fail, which is what that check is there for.
    [a, b, c, d] = [
      a * step[0] + b * step[2],
      a * step[1] + b * step[3],
      c * step[0] + d * step[2],
      c * step[1] + d * step[3],
    ];
  }
  return [a, b, c, d];
}

/**
 * How near counts as exact here.
 *
 * Seven places, because that is how many the transform STRING carries:
 * `scaleY(0.8660254)` is cos 30° rounded to seven, and the browser is given
 * the string rather than the constant these vertices are worked out from. So
 * the cell that is actually drawn is a regular hexagon to seven places and no
 * further, and a test demanding ten would be holding the drawing to a
 * precision nobody hands it. The fault this exists to catch was four degrees
 * of skew and three different edge lengths.
 */
const PLACES = 7;

/** Where a drawn point lands once the lattice transform has been applied to it. */
function onScreen([x, y]: readonly [number, number]): [number, number] {
  const [a, b, c, d] = matrixOf(HEX_LATTICE.slant);
  return [a * x + b * y, c * x + d * y];
}

describe("the honeycomb's cells, once the lattice transform has had them", () => {
  it("draw six edges of one length", () => {
    const screen = HEXAGON_VERTICES.map(onScreen);
    const edges = screen.map(([x, y], k) => {
      const [nx, ny] = screen[(k + 1) % screen.length];
      return Math.hypot(nx - x, ny - y);
    });
    expect(edges).toHaveLength(6);
    for (const edge of edges) expect(edge).toBeCloseTo(edges[0], PLACES);
  });

  it("puts its six corners at even sixths of a turn, pointy end up", () => {
    const screen = HEXAGON_VERTICES.map(onScreen);
    // A pointy-top cell whose neighbours lie at 0°, 60° and 120°: see BoardLines.
    screen.forEach(([x, y], k) => {
      const turn = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
      expect(turn, `corner ${k}`).toBeCloseTo(30 + k * 60, PLACES - 1);
    });
  });

  it("holds every corner the same distance from the middle of the cell", () => {
    const reaches = HEXAGON_VERTICES.map(onScreen).map(([x, y]) => Math.hypot(x, y));
    for (const reach of reaches) expect(reach).toBeCloseTo(reaches[0], PLACES);
    // Under the spacing, so neighbouring cells leave the gap that makes them read as cells.
    expect(reaches[0]).toBeLessThan(1 / Math.sqrt(3));
    expect(reaches[0]).toBeGreaterThan(0.9 / Math.sqrt(3));
  });

  it("is undone exactly by the unslant the round things inside a cell take", () => {
    /*
     * `Intersection` draws a stone with HEX_LATTICE.unslant so that a circle is
     * a circle again. That is the same inverse this polygon works out by hand,
     * so the two must agree — and the one that was wrong was the hand-written
     * one, which is the argument for checking them against each other.
     */
    const [a, b, c, d] = matrixOf(HEX_LATTICE.slant);
    const [e, f, g, h] = matrixOf(HEX_LATTICE.unslant);
    expect(a * e + b * g).toBeCloseTo(1, PLACES);
    expect(a * f + b * h).toBeCloseTo(0, PLACES);
    expect(c * e + d * g).toBeCloseTo(0, PLACES);
    expect(c * f + d * h).toBeCloseTo(1, PLACES);
  });
});
