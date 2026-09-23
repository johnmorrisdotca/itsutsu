import { describe, expect, it } from "vitest";

import { createGame } from "@/lib/gomoku/engine";
import { BOARD_GRIDS, RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { replayTimeline } from "@/lib/gomoku/replay";

import { framesOf, mosaicDraws, mosaicLayout, mosaicSvg, pickFrames } from "./mosaic";
import { MOSAIC_PICKS } from "./mosaic.constants";

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

describe("mosaicSvg", () => {
  it("is one SVG the picture's size with a board for every frame", () => {
    const frames = framesOf(replayTimeline(storedGame([[4, 0], [0, 0], [4, 1]])));
    const svg = mosaicSvg({ frames, size: 9, grid: BOARD_GRIDS.lines, width: 1920, height: 1080, fillSpare: false, details: [] });
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"')).toBe(true);
    // One wood board per frame, and one stone for every stone in every frame: 1 + 2 + 3.
    expect(svg.match(/fill="#e2ba7a"/g)).toHaveLength(3);
    expect(svg.match(/<circle/g)).toHaveLength(6);
  });
});

describe("mosaicSvg's labels and spare spaces", () => {
  const frames = framesOf(replayTimeline(storedGame([[4, 0], [0, 0], [4, 1]])));

  it("names each move on its tile, the way the move list does", () => {
    expect(frames.map((frame) => frame.name)).toEqual(["A5", "A9", "B5"]);
    const svg = mosaicSvg({ frames, size: 9, grid: BOARD_GRIDS.lines, width: 1920, height: 1080, fillSpare: false, details: [] });
    expect(svg).toContain(">1 · A5</text>");
    expect(svg).toContain(">3 · B5</text>");
  });

  // Five tiles on a wide screen lay out three and two, so one space is left over.
  const five = framesOf(replayTimeline(storedGame([[4, 0], [0, 0], [4, 1], [0, 1], [4, 2]])));

  it("fills the spaces after the last move with empty boards, the last one carrying the game's lines", () => {
    const frames = five;
    const { columns, rows } = mosaicLayout(5, 1920, 1080);
    const spare = columns * rows - 5;
    expect(spare).toBeGreaterThan(0);
    const svg = mosaicSvg({ frames, size: 9, grid: BOARD_GRIDS.lines, width: 1920, height: 1080, fillSpare: true, details: ["Ann vs Bo", "itsutsu.com"] });
    // Every slot has its wood: the three moves, the empty boards and the card.
    expect(svg.match(/fill="#e2ba7a"/g)).toHaveLength(columns * rows);
    expect(svg).toContain(">Ann vs Bo</text>");
    // Left unfilled, only the moves have wood.
    const bare = mosaicSvg({ frames, size: 9, grid: BOARD_GRIDS.lines, width: 1920, height: 1080, fillSpare: false, details: ["Ann vs Bo"] });
    expect(bare.match(/fill="#e2ba7a"/g)).toHaveLength(5);
    expect(bare).not.toContain("Ann vs Bo");
  });

  it("never lets a typed name out of its text", () => {
    const frames = five;
    const svg = mosaicSvg({ frames, size: 9, grid: BOARD_GRIDS.lines, width: 1920, height: 1080, fillSpare: true, details: ['<b>"x"</b> & c'] });
    expect(svg).not.toContain("<b>");
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
