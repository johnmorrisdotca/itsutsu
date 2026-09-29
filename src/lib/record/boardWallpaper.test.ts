import { describe, expect, it } from "vitest";

import { barOf } from "./mosaic";
import { MOSAIC_SHAPES } from "./mosaic.constants";
import { boardPlace, boardWallpaperSvg, boardWallpaperTitle, todayWords } from "./boardWallpaper";

describe("a finished board's wallpaper", () => {
  it("puts the board under the bar, centred, as large as the shape allows, its own shape kept", () => {
    for (const shape of Object.values(MOSAIC_SHAPES)) {
      const { bar } = barOf(shape.width, shape.height);
      for (const board of [
        { width: 400, height: 400 },
        { width: 800, height: 300 },
        { width: 300, height: 900 },
      ]) {
        const place = boardPlace(board, shape.width, shape.height);
        expect(place.y).toBeGreaterThanOrEqual(bar);
        expect(place.x).toBeGreaterThanOrEqual(0);
        expect(place.x + place.w).toBeLessThanOrEqual(shape.width + 1e-6);
        expect(place.y + place.h).toBeLessThanOrEqual(shape.height + 1e-6);
        expect(place.w / place.h).toBeCloseTo(board.width / board.height, 6);
        expect(place.x * 2 + place.w).toBeCloseTo(shape.width, 6);
        // It fills the room one way or the other: its width or its height reaches the share it may take.
        const fillsAcross = place.w >= shape.width * 0.9 - 1e-6;
        const fillsDown = place.h >= (shape.height - bar) * 0.9 - 1e-6;
        expect(fillsAcross || fillsDown).toBe(true);
      }
    }
  });

  it("draws the frame, the bar and the board picture, at the shape's size", () => {
    const svg = boardWallpaperSvg({
      board: { url: "data:image/png;base64,AAAA", width: 300, height: 300 },
      ...MOSAIC_SHAPES.portrait,
      title: boardWallpaperTitle("Sudoku", ["9×9 · Easy", "Solved in 4:49"], new Date(2026, 8, 29)),
    });
    expect(svg.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" width="1170" height="2532"`)).toBe(true);
    expect(svg).toContain(`<image href="data:image/png;base64,AAAA"`);
    expect(svg).toContain("Sudoku");
    expect(svg).toContain("Solved in 4:49");
    expect(svg).toContain("itsutsu.com");
  });

  it("titles it with the game, the day in this calendar, how it ended and the site, and drops what is empty", () => {
    expect(boardWallpaperTitle("Dots and Boxes", ["Aiko wins", ""], new Date(2026, 0, 5))).toEqual({
      name: "Dots and Boxes",
      details: ["2026-01-05", "Aiko wins", "itsutsu.com"],
    });
    expect(todayWords(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});
