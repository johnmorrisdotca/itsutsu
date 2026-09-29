import { describe, expect, it } from "vitest";

import { TENKA_TERRITORIES } from "@/lib/party/tenka/tenkaMap";
import { TENKA_SHAPES } from "@/lib/party/tenka/tenkaShapes.data";

import { TENKA_CHIP, TENKA_ZOOM_MOST } from "./tenka.constants";
import type { MapBox } from "./tenka.types";
import { chipRadius, fitView, isFitted, keptView, pannedBy, zoomedAbout } from "./tenkaView";

/** How Tenka's map is looked at: Fit, the zoom's limits, and counters that never cover each other. */

const phone: MapBox = { width: 358, height: 268, mapWidth: 2000, mapHeight: 984 };
const desk: MapBox = { width: 800, height: 400, mapWidth: 2000, mapHeight: 984 };

describe("the map's view", () => {
  it("fits the whole world in the box, in the middle", () => {
    const view = fitView(phone);
    expect(view.scale).toBeCloseTo(358 / 2000);
    expect(view.x).toBeCloseTo(0);
    expect(view.y).toBeCloseTo((268 - 984 * view.scale) / 2);
    expect(isFitted(view, phone)).toBe(true);
    // On a desk the box is the map's own shape, near enough, and the world fills it.
    expect(fitView(desk).scale).toBeCloseTo(Math.min(800 / 2000, 400 / 984));
  });

  it("zooms about the point pressed, which stays over the same place, between the whole world and eight times it", () => {
    const fit = fitView(desk);
    const zoomed = zoomedAbout(fit, 2, 400, 200, desk);
    const mapX = (400 - fit.x) / fit.scale;
    expect((400 - zoomed.x) / zoomed.scale).toBeCloseTo(mapX);
    expect(zoomedAbout(fit, 0.5, 400, 200, desk)).toEqual(fit);
    expect(zoomedAbout(fit, 100, 400, 200, desk).scale).toBeCloseTo(fit.scale * TENKA_ZOOM_MOST);
  });

  it("never pans past the map's edge into empty sea", () => {
    const zoomed = zoomedAbout(fitView(phone), 4, 0, 0, phone);
    const left = pannedBy(zoomed, 10_000, 10_000, phone);
    expect(left.x).toBe(0);
    expect(left.y).toBe(0);
    const right = pannedBy(zoomed, -10_000, -10_000, phone);
    expect(right.x).toBeCloseTo(phone.width - 2000 * zoomed.scale);
    expect(right.y).toBeCloseTo(phone.height - 984 * zoomed.scale);
    // At the whole world there is nothing to pan to.
    expect(keptView({ ...fitView(phone), x: 50 }, phone)).toEqual(fitView(phone));
  });

  it("draws a counter ten pixels across where it can, within the map's own limits", () => {
    expect(chipRadius(1)).toBe(TENKA_CHIP.screen);
    expect(chipRadius(0.1)).toBe(TENKA_CHIP.most);
    expect(chipRadius(5)).toBe(TENKA_CHIP.least);
  });

  it("never lays one army counter over another, even at its largest with two figures", () => {
    const r = TENKA_CHIP.most;
    // The pill as `TenkaMap` draws it: padding, the letter, a gap, two figures, padding; two radii tall.
    const width = r * (0.45 + 0.75 + 0.1 + 0.74 * 2 + 0.45);
    const labels = TENKA_SHAPES.labels;
    for (let a = 0; a < labels.length; a += 1) {
      for (let b = a + 1; b < labels.length; b += 1) {
        const apart = Math.abs(labels[a][0] - labels[b][0]) >= width || Math.abs(labels[a][1] - labels[b][1]) >= 2 * r;
        expect(apart, `${TENKA_TERRITORIES[a].key} and ${TENKA_TERRITORIES[b].key}`).toBe(true);
      }
    }
  });
});
