import { describe, expect, it } from "vitest";

import { TENKA_TERRITORIES } from "@/lib/party/tenka/tenkaMap";
import { TENKA_SHAPES } from "@/lib/party/tenka/tenkaShapes.data";

import { TENKA_CHIP, TENKA_ZOOM_MOST } from "./tenka.constants";
import type { MapBox } from "./tenka.types";
import { READABLE_SCALE, areaAround, nearestTerritory, chipRadius, chipWidth, fitView, framedView, isFitted, keptView, laidOutChips, pannedBy, zoomedAbout } from "./tenkaView";

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

  it("draws a counter the same size on the screen however far the map is zoomed", () => {
    for (const scale of [0.1, 0.5, 2]) expect(chipRadius(scale) * scale).toBeCloseTo(TENKA_CHIP.screen);
  });

  it("never lays one army counter over another at its largest, two figures each, from the readable scale up", () => {
    const r = TENKA_CHIP.apart;
    const width = r * chipWidth(2);
    const labels = TENKA_SHAPES.labels;
    for (let a = 0; a < labels.length; a += 1) {
      for (let b = a + 1; b < labels.length; b += 1) {
        const apart = Math.abs(labels[a][0] - labels[b][0]) >= width || Math.abs(labels[a][1] - labels[b][1]) >= 2 * r;
        expect(apart, `${TENKA_TERRITORIES[a].key} and ${TENKA_TERRITORIES[b].key}`).toBe(true);
      }
    }
    expect(READABLE_SCALE).toBeCloseTo(TENKA_CHIP.screen / TENKA_CHIP.apart);
  });

  it("turns a crowded counter into a dot at the whole-world view on a phone, the more important one kept whole, and none from the readable scale up", () => {
    const armies = new Array<number>(TENKA_TERRITORIES.length).fill(12);
    const everyone = TENKA_TERRITORIES.map((_, territory) => territory);
    const phoneWorld = fitView(phone).scale;
    const dots = laidOutChips(TENKA_SHAPES.labels, armies, phoneWorld, everyone);
    expect(dots.size).toBeGreaterThan(0);
    expect(dots.size).toBeLessThan(TENKA_TERRITORIES.length);
    // The first in the order is never a dot; put Central Europe first and it is drawn whole.
    const central = TENKA_TERRITORIES.findIndex((territory) => territory.key === "northernEurope");
    expect(laidOutChips(TENKA_SHAPES.labels, armies, phoneWorld, [central, ...everyone.filter((one) => one !== central)]).has(central)).toBe(false);
    expect(laidOutChips(TENKA_SHAPES.labels, armies, READABLE_SCALE, everyone).size).toBe(0);
    // And the counters drawn whole at the whole-world view cover none of each other.
    const r = chipRadius(phoneWorld);
    const whole = everyone.filter((territory) => !dots.has(territory));
    for (const a of whole) {
      for (const b of whole) {
        if (a >= b) continue;
        const [ax, ay] = TENKA_SHAPES.labels[a];
        const [bx, by] = TENKA_SHAPES.labels[b];
        expect(Math.abs(ax - bx) >= r * chipWidth(2) || Math.abs(ay - by) >= 2 * r).toBe(true);
      }
    }
  });

  it("frames a continent on a phone close enough that every counter there is whole", () => {
    const europe = TENKA_TERRITORIES.flatMap((territory, at) => (territory.continent === "europe" ? [at] : []));
    const view = framedView(areaAround(europe.map((territory) => TENKA_SHAPES.boxes[territory])), phone, 0);
    expect(view.scale).toBeGreaterThanOrEqual(READABLE_SCALE);
    // Every European counter is on the screen.
    for (const territory of europe) {
      const [x, y] = TENKA_SHAPES.labels[territory];
      expect(view.x + x * view.scale).toBeGreaterThan(0);
      expect(view.x + x * view.scale).toBeLessThan(phone.width);
      expect(view.y + y * view.scale).toBeGreaterThan(0);
      expect(view.y + y * view.scale).toBeLessThan(phone.height);
    }
    // Asked for no less than the readable scale, a wide area is framed at it.
    expect(framedView([0, 0, 2000, 984], phone, READABLE_SCALE).scale).toBeCloseTo(READABLE_SCALE);
  });

  /*
   * EVERY "LOOK AT" BUTTON FRAMES ITS CONTINENT, whole and filling the box.
   * N. America once framed the whole world (a far island counted as the
   * Eastern United States stretched it across the map), and Asia left two
   * fifths of a desk to Europe and Africa (Svalbard to Malaysia is too tall).
   */
  const full: MapBox = { width: 1600, height: 800, mapWidth: 2000, mapHeight: 984 };
  const continents = ["northAmerica", "southAmerica", "europe", "africa", "asia", "australia"] as const;
  it.each(continents.flatMap((key) => [[key, "phone", phone], [key, "desk", desk], [key, "full", full]] as const))("frames %s on a %s: all of it in view, and more than the whole world", (key, _, box) => {
    const members = TENKA_TERRITORIES.flatMap((territory, at) => (territory.continent === key ? [at] : []));
    const area = areaAround(members.map((territory) => TENKA_SHAPES.boxes[territory]));
    const view = framedView(area, box, 0);
    expect(view.scale).toBeGreaterThan(fitView(box).scale * 1.5);
    const [left, top, right, bottom] = [view.x + area[0] * view.scale, view.y + area[1] * view.scale, view.x + area[2] * view.scale, view.y + area[3] * view.scale];
    expect(left).toBeGreaterThan(-1);
    expect(top).toBeGreaterThan(-1);
    expect(right).toBeLessThan(box.width + 1);
    expect(bottom).toBeLessThan(box.height + 1);
    // It fills the box one way or the other: the continent's width or its height, less the sea kept round it.
    expect(Math.max((right - left) / box.width, (bottom - top) / box.height)).toBeGreaterThan(0.85);
  });

  it("gives Asia most of a desk's width, not a share with Europe and Africa", () => {
    const asia = TENKA_TERRITORIES.flatMap((territory, at) => (territory.continent === "asia" ? [at] : []));
    const area = areaAround(asia.map((territory) => TENKA_SHAPES.boxes[territory]));
    const view = framedView(area, desk, 0);
    expect(((area[2] - area[0]) * view.scale) / desk.width).toBeGreaterThan(0.75);
  });

  it("gives a tap on the sea to the nearest territory within a fingertip, and to nobody further out", () => {
    const japan = TENKA_TERRITORIES.findIndex((territory) => territory.key === "japan");
    const [x, y] = TENKA_SHAPES.labels[japan];
    // Twenty map units east of Japan's counter, out in the Pacific, with a reach of thirty: Japan.
    expect(nearestTerritory(TENKA_SHAPES.labels, x + 20, y, 30)).toBe(japan);
    // Mid-Pacific, nothing within reach.
    expect(nearestTerritory(TENKA_SHAPES.labels, 50, 700, 30)).toBeNull();
  });
});
