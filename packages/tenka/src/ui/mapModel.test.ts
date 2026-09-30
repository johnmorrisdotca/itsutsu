import { describe, expect, it } from "vitest";

import { TENKA_CONTINENTS, TENKA_TERRITORY_COUNT } from "../tenkaMap.ts";
import { startTenka } from "../tenkaStart.ts";
import { ownerColour, TENKA_NEUTRAL_COLOUR, TENKA_SEAT_COLOURS } from "./colours.ts";
import { continentView, nearestLand, tenkaMapModel } from "./mapModel.ts";
import { TENKA_SHAPES } from "../tenkaShapes.data.ts";

describe("the map drawn for a game", () => {
  const game = startTenka(20, ["A", "B"], 7)!;

  it("draws every territory in its owner's colour, with its armies and its ring", () => {
    const model = tenkaMapModel(game, { chosen: 3, reach: [4, 5], target: 5 });
    expect(model.lands).toHaveLength(TENKA_TERRITORY_COUNT);
    for (const land of model.lands) {
      expect(land.fill).toBe(ownerColour(game.owners[land.territory]!));
      expect(land.armies).toBe(game.armies[land.territory]);
    }
    expect(model.lands[3]!.ring).toBe("chosen");
    expect(model.lands[4]!.ring).toBe("reach");
    expect(model.lands[5]!.ring).toBe("target");
    expect(model.lands[6]!.ring).toBeNull();
  });

  it("draws the neutral army grey, and wraps colours past the list", () => {
    expect(ownerColour(-1)).toBe(TENKA_NEUTRAL_COLOUR);
    expect(ownerColour(TENKA_SEAT_COLOURS.length)).toBe(TENKA_SEAT_COLOURS[0]);
  });

  it("frames each continent in the map's own shape, holding every counter of it", () => {
    const shape = TENKA_SHAPES.width / TENKA_SHAPES.height;
    expect(continentView(null)).toEqual([0, 0, TENKA_SHAPES.width, TENKA_SHAPES.height]);
    for (const continent of TENKA_CONTINENTS) {
      const [x, y, w, h] = continentView(continent.key);
      expect(w / h).toBeCloseTo(shape, 5);
      expect(w).toBeLessThan(TENKA_SHAPES.width);
      for (const territory of continent.territories) {
        const [lx, ly] = TENKA_SHAPES.labels[territory]!;
        expect(lx).toBeGreaterThan(x);
        expect(lx).toBeLessThan(x + w);
        expect(ly).toBeGreaterThan(y);
        expect(ly).toBeLessThan(y + h);
      }
    }
  });

  it("finds the territory nearest a press on the sea, and none out of reach", () => {
    const [x, y] = TENKA_SHAPES.labels[10]!;
    expect(nearestLand(x! + 3, y! - 2, 20)).toBe(10);
    expect(nearestLand(-500, -500, 20)).toBeNull();
  });
});
