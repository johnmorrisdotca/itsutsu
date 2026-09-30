import { describe, expect, it } from "vitest";

import { mulberry32 } from "./random.ts";
import { checkBlocks, drawSeed, freshSeed, inBlock, isSeed, SEED_MOST } from "./seeds.ts";

const at = (value: number) => () => value;
const DAILY = { from: 1_000_000_000, size: 100_000_000 };

describe("isSeed", () => {
  it("takes whole numbers from 1 to the most", () => {
    expect(isSeed(1)).toBe(true);
    expect(isSeed(SEED_MOST)).toBe(true);
    expect(isSeed(20260930)).toBe(true);
  });

  it("refuses anything else", () => {
    for (const value of [0, -1, SEED_MOST + 1, 1.5, Number.NaN, "5", null, undefined, {}]) expect(isSeed(value)).toBe(false);
    expect(isSeed(11, 10)).toBe(false);
  });
});

describe("inBlock", () => {
  it("includes the first seed and excludes the one after the last", () => {
    expect(inBlock(1_000_000_000, DAILY)).toBe(true);
    expect(inBlock(1_099_999_999, DAILY)).toBe(true);
    expect(inBlock(1_100_000_000, DAILY)).toBe(false);
    expect(inBlock(999_999_999, DAILY)).toBe(false);
  });
});

describe("checkBlocks", () => {
  it("sorts blocks", () => {
    expect(checkBlocks([{ from: 50, size: 5 }, { from: 10, size: 5 }])).toEqual([{ from: 10, size: 5 }, { from: 50, size: 5 }]);
  });

  it("refuses overlaps, empty blocks and blocks past the end", () => {
    expect(() => checkBlocks([{ from: 10, size: 5 }, { from: 14, size: 5 }])).toThrow(/overlaps/);
    expect(() => checkBlocks([{ from: 10, size: 0 }])).toThrow(RangeError);
    expect(() => checkBlocks([{ from: 0, size: 3 }])).toThrow(/overlaps/);
    expect(() => checkBlocks([{ from: 8, size: 5 }], 10)).toThrow(/runs past/);
  });

  it("lets blocks touch", () => {
    expect(() => checkBlocks([{ from: 10, size: 5 }, { from: 15, size: 5 }])).not.toThrow();
  });
});

describe("drawSeed", () => {
  it("spans 1 to the most with nothing reserved", () => {
    expect(drawSeed(at(0))).toBe(1);
    expect(drawSeed(at(1 - 2 ** -53))).toBe(SEED_MOST);
  });

  it("steps over a reserved block, so the seeds either side of it are reached and none inside", () => {
    const kept = SEED_MOST - DAILY.size;
    const drawnAt = (seed: number) => drawSeed(at((seed - 1 + 0.5) / kept), { reserved: [DAILY] });
    expect(drawnAt(DAILY.from - 1)).toBe(DAILY.from - 1);
    expect(drawnAt(DAILY.from)).toBe(DAILY.from + DAILY.size);
    expect(drawSeed(at(1 - 2 ** -53), { reserved: [DAILY] })).toBe(SEED_MOST);
  });

  it("never lands in a reserved block", () => {
    const random = mulberry32(1);
    const blocks = [DAILY, { from: 1_500_000_000, size: 100_000_000 }, { from: 5, size: 10 }];
    for (let i = 0; i < 100_000; i += 1) {
      const seed = drawSeed(random, { reserved: blocks });
      expect(isSeed(seed)).toBe(true);
      expect(blocks.some((block) => inBlock(seed, block))).toBe(false);
    }
  });

  it("over a small range, reaches every free seed about as often", () => {
    const random = mulberry32(2);
    const counts = new Map<number, number>();
    for (let i = 0; i < 70_000; i += 1) {
      const seed = drawSeed(random, { most: 10, reserved: [{ from: 3, size: 2 }, { from: 8, size: 1 }] });
      counts.set(seed, (counts.get(seed) ?? 0) + 1);
    }
    expect([...counts.keys()].sort((a, b) => a - b)).toEqual([1, 2, 5, 6, 7, 9, 10]);
    for (const count of counts.values()) expect(Math.abs(count - 10_000)).toBeLessThan(500);
  });

  it("pins the seeds Itsutsu's winnable deals try (seed * 31 + try, the daily block kept)", () => {
    const next = (seed: number, tried: number) => drawSeed(mulberry32(seed * 31 + tried), { reserved: [DAILY] });
    expect([next(1, 0), next(1, 1), next(20260930, 3)]).toEqual([1476433405, 793690243, 810619544]);
  });

  it("refuses when every seed is reserved", () => {
    expect(() => drawSeed(at(0), { most: 5, reserved: [{ from: 1, size: 5 }] })).toThrow(/every seed/);
  });
});

describe("freshSeed", () => {
  it("draws a seed outside the reserved blocks", () => {
    for (let i = 0; i < 1000; i += 1) {
      const seed = freshSeed({ reserved: [DAILY] });
      expect(isSeed(seed) && !inBlock(seed, DAILY)).toBe(true);
    }
  });
});
