import { describe, expect, it } from "vitest";

import { SUIDO_BIG_SIZES } from "@johnmorrisdotca/suido/levels-info";

import { firstUnsolvedSuidoBigLevel, isSuidoBigLevelAt, nextSuidoBigLevel, openSuidoBigLevels, SUIDO_BIG_SIZE_LIST, suidoBigLevelsAt, suidoBigSizeOf } from "./bigLevels";
import { isSuidoBigLevel, suidoBigLevelBand, SUIDO_BIG_LEVEL_COUNT } from "./levelCounts";
import { suidoLevelOfSeed, suidoLevelSeed, suidoSetOfSeed } from "./seed";
import { isSuidoLevelSize, suidoSizeKey } from "./sizes";

/**
 * THE BIG-PIECES SET, AS THE SITE KEEPS IT: sixty-four levels numbered across every size, each a level of its own size, named by a seed in the
 * level block's second half, so every record that carries (size, seed) carries a level of either set and tells them apart.
 */
describe("a level of the big-pieces set", () => {
  it("is one of sixty-four, each at a size the levels come in, and its size is the package's", () => {
    expect(SUIDO_BIG_LEVEL_COUNT).toBe(64);
    expect(SUIDO_BIG_SIZES).toHaveLength(64);
    for (let level = 1; level <= 64; level += 1) {
      const size = suidoBigSizeOf(level)!;
      expect(isSuidoLevelSize(size), `level ${level}`).toBe(true);
      expect(suidoSizeKey(size), `level ${level}`).toBe(SUIDO_BIG_SIZES[level - 1]);
      expect(isSuidoBigLevelAt(size, level)).toBe(true);
      expect(isSuidoBigLevel(level)).toBe(true);
    }
    expect(suidoBigSizeOf(0)).toBeNull();
    expect(suidoBigSizeOf(65)).toBeNull();
    expect(isSuidoBigLevel(65)).toBe(false);
    expect(isSuidoBigLevel(1.5)).toBe(false);
  });

  it("lists the sizes it has, smallest first, with the levels at each", () => {
    expect(SUIDO_BIG_SIZE_LIST[0]).toBe(5);
    expect(SUIDO_BIG_SIZE_LIST.at(-1)).toBe(20);
    expect(SUIDO_BIG_SIZE_LIST.length).toBeGreaterThanOrEqual(8);
    let covered = 0;
    for (const size of SUIDO_BIG_SIZE_LIST) {
      const levels = suidoBigLevelsAt(size);
      expect(levels.length).toBeGreaterThan(0);
      for (const level of levels) expect(suidoBigSizeOf(level)).toBe(size);
      covered += levels.length;
    }
    // Every level is at one of the sizes, and a size the set has no level at has none.
    expect(covered).toBe(64);
    expect(suidoBigLevelsAt(28)).toEqual([]);
  });

  it("is named by a seed in the second half of the level block, which no level by size can be, and the number comes back", () => {
    for (let level = 1; level <= 64; level += 1) {
      const seed = suidoLevelSeed(level, "big");
      expect(suidoSetOfSeed(seed)).toBe("big");
      expect(suidoLevelOfSeed(seed)).toBe(level);
      expect(suidoLevelSeed(level)).not.toBe(seed);
    }
    for (let level = 1; level <= 256; level += 1) {
      expect(suidoSetOfSeed(suidoLevelSeed(level))).toBe("classic");
      expect(suidoLevelOfSeed(suidoLevelSeed(level))).toBe(level);
    }
    expect(suidoSetOfSeed(7)).toBeNull();
    expect(suidoLevelOfSeed(7)).toBeNull();
  });

  it("is in the third of the set its place says, and opens by blocks of sixteen of its own", () => {
    expect(suidoBigLevelBand(1)).toBe("easy");
    expect(suidoBigLevelBand(22)).toBe("easy");
    expect(suidoBigLevelBand(23)).toBe("medium");
    expect(suidoBigLevelBand(64)).toBe("hard");
    const upTo = (last: number) => new Set(Array.from({ length: last }, (_, at) => at + 1));
    expect(openSuidoBigLevels(new Set())).toBe(16);
    expect(nextSuidoBigLevel(new Set())).toBe(1);
    expect(openSuidoBigLevels(upTo(16))).toBe(32);
    expect(nextSuidoBigLevel(upTo(16))).toBe(17);
    expect(firstUnsolvedSuidoBigLevel(new Set([1, 2, 4]))).toBe(3);
    expect(firstUnsolvedSuidoBigLevel(upTo(64))).toBeNull();
  });
});
