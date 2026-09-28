import { describe, expect, it } from "vitest";

import { barOf } from "@/lib/record/mosaic";
import { MOSAIC_SHAPES, type MosaicShape } from "@/lib/record/mosaic.constants";

import { decodeGrid, encodeGrid, squareAt } from "./grid";
import { kanaTileCode } from "./tileFace";
import { crosswordSvg, dayOf, kumimojiWallpaperSvg, wallpaperCrosswords, wallpaperPlaces, wallpaperPlan, wallpaperTitle } from "./wallpaper";
import { KUMIMOJI_WALLPAPER_MOST, WALLPAPER_TILE_ART } from "./wallpaper.constants";
import type { WallpaperCrossword, WallpaperTile } from "./wallpaper.types";

const SHAPES = Object.keys(MOSAIC_SHAPES) as MosaicShape[];

/** A word laid across from the top-left square, as a grid. */
function across(word: string): Map<string, string> {
  return new Map([...word].map((letter, col) => [squareAt(0, col), letter]));
}

/** A row as the Server Function answers it. */
function row(answer: string, finishedAt: string): WallpaperCrossword {
  return { answer, size: 11, finishedAt };
}

/** Every rectangle an SVG string draws, as numbers. */
function rects(svg: string): { x: number; y: number; width: number; height: number }[] {
  return [...svg.matchAll(/<rect x="([\d.e-]+)" y="([\d.e-]+)" width="([\d.e-]+)" height="([\d.e-]+)"/g)].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
    width: Number(match[3]),
    height: Number(match[4]),
  }));
}

describe("wallpaperPlan and wallpaperPlaces: where N crosswords go in each shape", () => {
  it("places nothing for no crosswords", () => {
    for (const shape of SHAPES) {
      const { width, height } = MOSAIC_SHAPES[shape];
      expect(wallpaperPlan(0, width, height)).toMatchObject({ columns: 0, rows: 0, side: 0, lastRow: 0 });
      expect(wallpaperPlaces(0, width, height)).toEqual([]);
    }
  });

  it("gives every crossword a cell, up to the cap, all the same size, inside the picture under the bar and never overlapping", () => {
    for (const shape of SHAPES) {
      const { width, height } = MOSAIC_SHAPES[shape];
      const { bar } = barOf(width, height);
      for (let count = 1; count <= KUMIMOJI_WALLPAPER_MOST + 6; count += 1) {
        const places = wallpaperPlaces(count, width, height);
        expect(places).toHaveLength(Math.min(count, KUMIMOJI_WALLPAPER_MOST));
        const side = places[0]!.side;
        expect(side).toBeGreaterThan(0);
        for (const [i, place] of places.entries()) {
          expect(place.side).toBe(side);
          expect(place.x).toBeGreaterThanOrEqual(-1e-6);
          expect(place.x + side).toBeLessThanOrEqual(width + 1e-6);
          expect(place.y).toBeGreaterThanOrEqual(bar - 1e-6);
          expect(place.y + side).toBeLessThanOrEqual(height + 1e-6);
          for (const other of places.slice(i + 1)) {
            const apart = other.x >= place.x + side - 1e-6 || other.y >= place.y + side - 1e-6 || place.x >= other.x + side - 1e-6 || place.y >= other.y + side - 1e-6;
            expect(apart).toBe(true);
          }
        }
      }
    }
  });

  it("lays two dozen six by four on the landscape picture and three by eight on the portrait one, whose bar is a line taller", () => {
    expect(wallpaperPlan(24, 1920, 1080)).toMatchObject({ columns: 6, rows: 4, side: 240, lastRow: 6 });
    expect(wallpaperPlan(24, 1170, 2532)).toMatchObject({ columns: 3, rows: 8, side: 296.5, lastRow: 3 });
  });

  it("keeps every crossword rather than squaring the grid, and centres a short last row", () => {
    const { width, height } = MOSAIC_SHAPES.landscape;
    const plan = wallpaperPlan(5, width, height);
    expect(plan.columns * (plan.rows - 1) + plan.lastRow).toBe(5);
    expect(plan.lastRow).toBeLessThan(plan.columns);
    const places = wallpaperPlaces(5, width, height);
    const last = places.slice(plan.columns);
    const left = last[0]!.x;
    const right = last[last.length - 1]!.x + plan.side;
    expect(left).toBeCloseTo(width - right, 6);
  });

  it("gives one crossword the whole of the picture's height under the bar", () => {
    const { width, height } = MOSAIC_SHAPES.landscape;
    const { bar } = barOf(width, height);
    expect(wallpaperPlan(1, width, height).side).toBe(height - bar);
  });
});

describe("wallpaperCrosswords: which crosswords, in what order", () => {
  it("lays them oldest first, so the newest lands last, and reads each back from its code", () => {
    const newestFirst = [row(encodeGrid(across("new")), "2026-09-28T10:00:00Z"), row(encodeGrid(across("old")), "2026-09-01T10:00:00Z")];
    const laid = wallpaperCrosswords(newestFirst, (_, tiles) => `${tiles}`);
    expect(laid.map((crossword) => [...crossword.tiles.values()].join(""))).toEqual(["old", "new"]);
    expect(laid.map((crossword) => crossword.label)).toEqual(["3", "3"]);
  });

  it("leaves out a code that is not a grid, or one with no tiles, rather than drawing an empty square", () => {
    const laid = wallpaperCrosswords([row("CAT!", "2026-09-28T10:00:00Z"), row("", "2026-09-27T10:00:00Z"), row("cat", "2026-09-26T10:00:00Z")], () => "");
    expect(laid).toHaveLength(1);
  });

  it("takes no more than one picture holds", () => {
    const many = Array.from({ length: KUMIMOJI_WALLPAPER_MOST + 5 }, (_, i) => row("cat", new Date(Date.UTC(2026, 8, 28) - i * 86_400_000).toISOString()));
    expect(wallpaperCrosswords(many, () => "")).toHaveLength(KUMIMOJI_WALLPAPER_MOST);
  });
});

describe("crosswordSvg: one crossword on its square", () => {
  const cell = { x: 100, y: 200, side: 240 };

  it("fits a long word and a square block alike inside its square", () => {
    const long = across("crosswords");
    const block = decodeGrid("cat/ooo/wed")!;
    for (const tiles of [long, block]) {
      const drawn: WallpaperTile = { tiles, finishedAt: "2026-09-28T10:00:00Z", label: "2026-09-28" };
      for (const rect of rects(crosswordSvg(drawn, cell.x, cell.y, cell.side))) {
        expect(rect.x).toBeGreaterThanOrEqual(cell.x);
        expect(rect.x + rect.width).toBeLessThanOrEqual(cell.x + cell.side + 1e-6);
        expect(rect.y).toBeGreaterThanOrEqual(cell.y);
        expect(rect.y + rect.height).toBeLessThanOrEqual(cell.y + cell.side + 1e-6);
      }
    }
  });

  it("prints English in capitals, a kana as it is, and a wild in charcoal — its blank as 五", () => {
    const tiles = new Map([
      [squareAt(0, 0), "c"],
      [squareAt(0, 1), "A"],
      [squareAt(0, 2), "*"],
      [squareAt(1, 0), kanaTileCode("か")!],
    ]);
    const svg = crosswordSvg({ tiles, finishedAt: "", label: "" }, 0, 0, 400);
    expect(svg).toContain(">C</text>");
    expect(svg).toContain(">A</text>");
    expect(svg).toContain(">五</text>");
    expect(svg).toContain(">か</text>");
    // The kana's other form in its corner, once the tile is big enough.
    expect(svg).toContain(">が</text>");
    // Two wilds: the lettered A and the blank.
    expect(svg.match(new RegExp(`rx="[\\d.]+" fill="${WALLPAPER_TILE_ART.wild}"`, "g"))).toHaveLength(2);
  });

  it("carries its line under the board once the square is big enough, and not on a tiny one", () => {
    const drawn: WallpaperTile = { tiles: across("cat"), finishedAt: "", label: "2026-09-28 · 3 tiles" };
    expect(crosswordSvg(drawn, 0, 0, 240)).toContain("2026-09-28 · 3 tiles");
    expect(crosswordSvg(drawn, 0, 0, 40)).not.toContain("3 tiles");
  });
});

describe("wallpaperTitle and the whole picture", () => {
  const laid = wallpaperCrosswords([row("cat", "2026-09-28T12:00:00Z"), row(encodeGrid(across("dogs")), "2026-09-02T12:00:00Z")], () => "");

  it("names how many, the days they span, and the tiles laid", () => {
    const title = wallpaperTitle("Kumimoji", laid, false);
    expect(title.name).toBe("Kumimoji · 2 crosswords");
    expect(title.details).toContain("7 tiles");
    expect(title.details.some((detail) => /^2026-09-0\d to 2026-09-2\d$/.test(detail))).toBe(true);
    expect(title.details.some((detail) => detail.startsWith("your newest"))).toBe(false);
    expect(wallpaperTitle("Kumimoji", laid, true).details[0]).toBe("your newest 2");
  });

  it("is an SVG of the shape's own size, with the title on its bar", () => {
    for (const shape of SHAPES) {
      const { width, height } = MOSAIC_SHAPES[shape];
      const svg = kumimojiWallpaperSvg({ crosswords: laid, width, height, title: wallpaperTitle("Kumimoji", laid, false) });
      expect(svg.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"`)).toBe(true);
      expect(svg).toContain("Kumimoji · 2 crosswords");
    }
  });

  it("reads a day in the calendar it runs in, and nothing from a date it cannot read", () => {
    expect(dayOf("not a date")).toBeNull();
    expect(dayOf("2026-09-28T12:00:00Z")).toMatch(/^2026-09-2[789]$/);
  });
});
