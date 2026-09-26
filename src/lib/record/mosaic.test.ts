import { describe, expect, it } from "vitest";

import { createGame } from "@/lib/gomoku/engine";
import { BOARD_GRIDS, RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { replayTimeline } from "@/lib/gomoku/replay";

import { framesOf, mosaicDraws, mosaicGrid, mosaicLayout, mosaicPlan, mosaicSvg, pickFrames } from "./mosaic";
import { MOSAIC_COPY, MOSAIC_MOST_TILES, MOSAIC_PICKS, MOSAIC_SHAPES, type MosaicShape } from "./mosaic.constants";
import type { MosaicFrame } from "./mosaic.types";
import { MOSAIC_WORDMARK } from "./mosaicLogo.constants";

/** A stored game of five in a row on 9×9: black runs along row 4, white along row 0. */
function storedGame(moves: [number, number][]) {
  const stones = ["black", "white"] as const;
  return {
    size: 9,
    winLength: 5,
    variant: RULE_VARIANTS.freestyle,
    obstacles: "none",
    opener: "black",
    opening: "free",
    handicap: null,
    headStart: null,
    seed: 0,
    drawLimit: null,
    moveTimeMs: null,
    moves: moves.map(([row, col], i) => ({ number: i + 1, row, col, stone: stones[i % 2], kind: "place" })),
  } as unknown as Parameters<typeof replayTimeline>[0];
}

describe("framesOf", () => {
  it("gives one frame a move, the empty start left out, each one stone more than the last", () => {
    const timeline = replayTimeline(storedGame([[4, 0], [0, 0], [4, 1], [0, 1], [4, 2]]));
    const frames = framesOf(timeline);
    expect(frames).toHaveLength(5);
    frames.forEach((frame, i) => {
      expect(frame.move).toBe(i + 1);
      expect([...frame.board].filter((cell) => cell !== ".")).toHaveLength(i + 1);
    });
    expect(frames[0].board[4 * 9]).toBe("b");
    expect(frames[1].board[0]).toBe("w");
  });

  it("draws nothing for a start with no moves", () => {
    expect(framesOf([createGame({ size: 9 })])).toEqual([]);
  });
});

describe("pickFrames", () => {
  const frames = Array.from({ length: 300 }, (_, i) => i + 1);

  it("keeps every one while they fit", () => {
    expect(pickFrames(frames.slice(0, 50), MOSAIC_PICKS.spread, 120)).toHaveLength(50);
  });

  it("spreads across the whole game, first and last always in, in order", () => {
    const picked = pickFrames(frames, MOSAIC_PICKS.spread, 120);
    expect(picked).toHaveLength(120);
    expect(picked[0]).toBe(1);
    expect(picked[119]).toBe(300);
    expect([...picked].sort((a, b) => a - b)).toEqual(picked);
    expect(new Set(picked).size).toBe(120);
  });

  it("or takes the ending, counted back from the last move", () => {
    const picked = pickFrames(frames, MOSAIC_PICKS.ending, 120);
    expect(picked[0]).toBe(181);
    expect(picked[119]).toBe(300);
  });
});

describe("mosaicLayout", () => {
  it("fits every tile in the picture, and tiles shrink as they multiply", () => {
    let previous = Infinity;
    for (const count of [1, 4, 30, 60, 120]) {
      const { columns, rows, side } = mosaicLayout(count, 1920, 1080);
      expect(columns * rows).toBeGreaterThanOrEqual(count);
      expect(columns * side).toBeLessThanOrEqual(1920 + 1e-9);
      expect(rows * side).toBeLessThanOrEqual(1080 + 1e-9);
      expect(side).toBeLessThanOrEqual(previous);
      previous = side;
    }
  });
});

/** A tile's board: the picture's only rounded rectangles. */
const BOARD = /<rect [^>]*rx="/g;

/** A picture of these frames in one of the two shapes, titled "Ann vs Bo". */
function picture(frames: readonly MosaicFrame[], shape: MosaicShape = "landscape", details: readonly string[] = ["2026-09-25", "itsutsu.com"]): string {
  const { width, height } = MOSAIC_SHAPES[shape];
  return mosaicSvg({ frames, pick: MOSAIC_PICKS.spread, size: 9, grid: BOARD_GRIDS.lines, width, height, title: { name: "Ann vs Bo", details } });
}

describe("mosaicGrid", () => {
  it("is always a full grid, ending on its last tile, for every count on both shapes", () => {
    for (const shape of Object.values(MOSAIC_SHAPES)) {
      for (let count = 1; count <= MOSAIC_MOST_TILES; count += 1) {
        const { columns, rows, side, shown } = mosaicGrid(count, shape.width, shape.height);
        expect(columns * rows).toBe(shown);
        expect(shown).toBeLessThanOrEqual(count);
        // Never more than a row of the loosest layout short of the game.
        expect(count - shown).toBeLessThan(mosaicLayout(count, shape.width, shape.height).columns);
        expect(columns * side).toBeLessThanOrEqual(shape.width + 1e-9);
        expect(rows * side).toBeLessThanOrEqual(shape.height + 1e-9);
      }
    }
  });

  it("shows every position when they make a rectangle, as 120 do on either shape", () => {
    for (const { width, height } of Object.values(MOSAIC_SHAPES)) expect(mosaicPlan(120, width, height).shown).toBe(120);
    const tall = MOSAIC_SHAPES.portrait;
    const { columns, rows } = mosaicPlan(120, tall.width, tall.height);
    expect(rows).toBeGreaterThan(columns);
  });

  it("fills a long game's shape with whole rows or columns more, never smaller tiles", () => {
    for (const { width, height } of Object.values(MOSAIC_SHAPES)) {
      const most = mosaicPlan(MOSAIC_MOST_TILES, width, height);
      const long = mosaicPlan(400, width, height);
      expect(long.side).toBe(most.side);
      expect(long.shown).toBe(long.columns * long.rows);
      expect(long.shown).toBeGreaterThanOrEqual(most.shown);
      // No room left for another row or column of the same tiles.
      expect(long.columns * long.side + long.side).toBeGreaterThan(width);
      expect(long.bar + (long.rows + 1) * long.side).toBeGreaterThan(height);
    }
    // And never more than the game has.
    const { width, height } = MOSAIC_SHAPES.portrait;
    expect(mosaicPlan(121, width, height).shown).toBeLessThanOrEqual(121);
  });
});

describe("mosaicSvg", () => {
  it("is one SVG the shape's size with a board for every frame", () => {
    const frames = framesOf(replayTimeline(storedGame([[4, 0], [0, 0], [4, 1]])));
    const svg = picture(frames);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"')).toBe(true);
    // One board per frame — the only rounded rectangles — and one stone for every stone in every frame: 1 + 2 + 3.
    expect(svg.match(BOARD)).toHaveLength(3);
    expect(svg.replace(MOSAIC_WORDMARK.body, "").match(/<circle/g)).toHaveLength(6);
    expect(picture(frames, "portrait").startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="1170" height="2532"')).toBe(true);
  });
});

describe("mosaicSvg's labels and title bar", () => {
  const frames = framesOf(replayTimeline(storedGame([[4, 0], [0, 0], [4, 1]])));

  it("names each move on its tile, the way the move list does", () => {
    expect(frames.map((frame) => frame.name)).toEqual(["A5", "A9", "B5"]);
    const svg = picture(frames);
    expect(svg).toContain(">1 · A5</text>");
    expect(svg).toContain(">3 · B5</text>");
  });

  // Seven positions make no rectangle on a wide picture, so the grid holds six.
  const seven = framesOf(replayTimeline(storedGame([[4, 0], [0, 0], [4, 1], [0, 1], [4, 2], [0, 2], [4, 3]])));

  it("carries the logo, the game's name and its details across the top, and no card after the last move", () => {
    const svg = picture(seven);
    // The logo, carried inside the picture, and no brand typed in a font.
    expect(svg).toContain(MOSAIC_WORDMARK.body);
    expect(svg).not.toContain("GAME VIEWER");
    expect(svg).toContain(">Ann vs Bo</text>");
    expect(svg).toContain("2026-09-25 · itsutsu.com");
    // Six boards and nothing after them.
    expect(svg.match(BOARD)).toHaveLength(6);
  });

  it("ends on the last move and says how many positions it holds of how many", () => {
    const svg = picture(seven);
    expect(svg).toContain(">7 · D5</text>");
    expect(svg).toContain(">1 · A5</text>");
    expect(svg).toContain(MOSAIC_COPY.shownOf(6, 7));
    expect(picture(frames)).not.toContain("positions");
  });

  it("wraps a long line of details onto more lines rather than off the edge: two wide, three tall", () => {
    const long = Array.from({ length: 20 }, (_, i) => `a detail with some length ${i}`);
    for (const [shape, most] of [["landscape", 2], ["portrait", 3]] as const) {
      const svg = picture(frames, shape, long);
      const lines = [...svg.matchAll(/<text [^>]*fill="#c9b89c">([^<]*)<\/text>/g)].map((match) => match[1]);
      expect(lines).toHaveLength(most);
      expect(lines[most - 1].endsWith("…")).toBe(true);
    }
  });

  it("never lets a typed name out of its text", () => {
    const { width, height } = MOSAIC_SHAPES.landscape;
    const svg = mosaicSvg({
      frames,
      pick: MOSAIC_PICKS.spread,
      size: 9,
      grid: BOARD_GRIDS.lines,
      width,
      height,
      title: { name: '<b>"x"</b> & c', details: ["<i>"] },
    });
    expect(svg).not.toContain("<b>");
    expect(svg).not.toContain("<i>");
    expect(svg).toContain("&lt;b&gt;&quot;x&quot;&lt;/b&gt; &amp; c");
  });
});

describe("mosaicDraws", () => {
  it("draws the square-grid games and leaves the hexagon lattices alone", () => {
    expect(mosaicDraws(RULE_VARIANTS.freestyle)).toBe(true);
    expect(mosaicDraws(RULE_VARIANTS.reversi)).toBe(true);
    expect(mosaicDraws(RULE_VARIANTS.hex)).toBe(false);
    expect(mosaicDraws(RULE_VARIANTS.chineseCheckers)).toBe(false);
  });
});
