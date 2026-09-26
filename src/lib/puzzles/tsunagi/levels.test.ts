import { beforeAll, describe, expect, it } from "vitest";

import { firstUnsolvedTsunagiLevel, loadEveryTsunagiLevel, nextLevelLabel, nextTsunagiLevel, openTsunagiLevels, TSUNAGI_LEVEL_COUNTS, TSUNAGI_SIZES } from "./levels";

/**
 * HOW TSUNAGI'S LEVELS OPEN AND WHICH COMES NEXT. Every level itself — proved
 * to have one answer, measured, marked — is in `levels.<size>.test.ts`, one
 * file a size (`levels.suite.ts`).
 */
beforeAll(loadEveryTsunagiLevel);

describe("the levels open a block of sixteen at a time", () => {
  const upTo = (last: number) => Array.from({ length: last }, (_, at) => at + 1);

  it("opens the first block to a newcomer", () => {
    expect(openTsunagiLevels(5, new Set())).toBe(16);
    expect(nextTsunagiLevel(5, new Set())).toBe(1);
  });

  it("opens the next block only once every level of the one before is solved", () => {
    const fifteen = new Set(upTo(15));
    expect(openTsunagiLevels(5, fifteen)).toBe(16);
    expect(nextTsunagiLevel(5, fifteen)).toBe(16);
    const sixteen = new Set(upTo(16));
    expect(openTsunagiLevels(5, sixteen)).toBe(32);
    expect(nextTsunagiLevel(5, sixteen)).toBe(17);
    // Levels solved past the open blocks open nothing beyond a block left unfinished.
    expect(openTsunagiLevels(5, new Set([...fifteen, 17, 18]))).toBe(16);
  });

  it("opens every block when every level is solved, and offers the last", () => {
    expect(openTsunagiLevels(6, new Set(upTo(256)))).toBe(256);
    expect(nextTsunagiLevel(6, new Set(upTo(256)))).toBe(256);
    // 4×4's twelve blocks.
    expect(openTsunagiLevels(4, new Set(upTo(192)))).toBe(192);
  });

  it("has whole blocks at every size: 256 a size, 192 at 4×4, 128 at 10×10 and 64 at 11×11", () => {
    for (const size of TSUNAGI_SIZES) expect(TSUNAGI_LEVEL_COUNTS[size]! % 16, `${size}×${size}`).toBe(0);
    expect(TSUNAGI_LEVEL_COUNTS).toEqual({ 4: 192, 5: 256, 6: 256, 7: 256, 8: 256, 9: 256, 10: 128, 11: 64 });
  });
});

describe("the next level is the lowest one not yet solved", () => {
  it("sends somebody who solved only level 10 back to level 1, never on to 11", () => {
    // John's screenshot: level 10 solved on its own, and "Level 11 →" offered.
    const solved = new Set([10]);
    expect(firstUnsolvedTsunagiLevel(5, solved)).toBe(1);
    expect(openTsunagiLevels(5, solved)).toBe(16);
    expect(nextLevelLabel(10, 1)).toBe("Level 1, the first one you have not finished →");
  });

  it("names the gap, and says the level after plainly when that is the gap", () => {
    expect(firstUnsolvedTsunagiLevel(5, new Set([1, 2, 4, 5]))).toBe(3);
    expect(nextLevelLabel(5, 3)).toBe("Level 3, the first one you have not finished →");
    expect(firstUnsolvedTsunagiLevel(5, new Set([1, 2, 3]))).toBe(4);
    expect(nextLevelLabel(3, 4)).toBe("Level 4 →");
  });

  it("goes on to the next block once a block is all solved, and to nothing once every level is", () => {
    const block = new Set(Array.from({ length: 16 }, (_, at) => at + 1));
    expect(firstUnsolvedTsunagiLevel(7, block)).toBe(17);
    const all = new Set(Array.from({ length: 256 }, (_, at) => at + 1));
    expect(firstUnsolvedTsunagiLevel(7, all)).toBeNull();
  });
});
