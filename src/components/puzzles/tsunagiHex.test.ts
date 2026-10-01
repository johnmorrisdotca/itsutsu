import { describe, expect, it } from "vitest";

import { inHex } from "@johnmorrisdotca/tsunagi";

import { hexCellAt, hexCellCentre, tsunagiHexFit } from "./tsunagiHex";

/**
 * A FINGER ON A HEXAGON: every cell's centre is found as that cell, and so is
 * every point well inside its hexagon — toward each of its six neighbours — so
 * a line is drawn where the finger is, not in the square cell a naive grid
 * would pick.
 */
describe("the cell under a finger on a hexagon", () => {
  for (const size of [5, 7, 9, 11]) {
    it(`finds every cell of the ${size} hexagon from its centre and from near its edges`, () => {
      const fit = tsunagiHexFit(size);
      for (let at = 0; at < size * size; at += 1) {
        if (!inHex(size, at)) continue;
        const centre = hexCellCentre(size, fit, at);
        expect(hexCellAt(size, fit, centre.x, centre.y), `cell ${at}`).toBe(at);
        // Four tenths of the way to each neighbour's centre is still this cell.
        for (const by of [-size, 1 - size, 1, size, size - 1, -1]) {
          const next = at + by;
          if (next < 0 || next >= size * size || Math.abs((next % size) - (at % size)) > 1) continue;
          const there = hexCellCentre(size, fit, next);
          const near = { x: centre.x + 0.4 * (there.x - centre.x), y: centre.y + 0.4 * (there.y - centre.y) };
          expect(hexCellAt(size, fit, near.x, near.y), `cell ${at} toward ${next}`).toBe(at);
        }
      }
    });
  }

  it("puts every hexagon inside the board's box", () => {
    for (const size of [5, 7, 9, 11]) {
      const fit = tsunagiHexFit(size);
      for (let at = 0; at < size * size; at += 1) {
        if (!inHex(size, at)) continue;
        const { x, y } = hexCellCentre(size, fit, at);
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(1);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(1);
      }
    }
  });
});
