import { describe, expect, it } from "vitest";

import { below, chance, distinctBelow, float, int, normal, pick, sample, shuffle, shuffled, weightedIndex, weightedPick } from "./draws.ts";
import { mulberry32, type Random } from "./random.ts";

/** A stream that hands out the given numbers, in order, and counts what it gave. */
function scripted(values: number[]): Random & { taken: number } {
  const random = Object.assign(() => {
    const value = values[random.taken % values.length]!;
    random.taken += 1;
    return value;
  }, { taken: 0 });
  return random;
}

describe("below and int", () => {
  it("map the ends of [0, 1) onto the ends of the range", () => {
    expect(below(scripted([0]), 6)).toBe(0);
    expect(below(scripted([0.999999]), 6)).toBe(5);
    expect(int(scripted([0]), 1, 6)).toBe(1);
    expect(int(scripted([0.999999]), 1, 6)).toBe(6);
    expect(int(scripted([0.5]), -3, 3)).toBe(0);
  });

  it("reach every value evenly", () => {
    const random = mulberry32(8);
    const counts = new Map<number, number>();
    for (let i = 0; i < 60_000; i += 1) {
      const value = int(random, 1, 6);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    for (const count of counts.values()) expect(Math.abs(count - 10_000)).toBeLessThan(500);
  });

  it("refuse a range with nothing in it", () => {
    expect(() => below(mulberry32(1), 0)).toThrow(RangeError);
    expect(() => below(mulberry32(1), 1.5)).toThrow(RangeError);
    expect(() => int(mulberry32(1), 6, 1)).toThrow(RangeError);
    expect(() => int(mulberry32(1), 0, Number.NaN)).toThrow(RangeError);
  });

  it("take one draw", () => {
    const random = scripted([0.3]);
    int(random, 1, 100);
    below(random, 10);
    expect(random.taken).toBe(2);
  });
});

describe("float and chance", () => {
  it("float spans [min, max)", () => {
    expect(float(scripted([0]), 10, 20)).toBe(10);
    expect(float(scripted([0.5]), 10, 20)).toBe(15);
  });

  it("chance is never at 0 and always at 1", () => {
    const random = mulberry32(3);
    for (let i = 0; i < 1000; i += 1) {
      expect(chance(random, 0)).toBe(false);
      expect(chance(random, 1)).toBe(true);
    }
  });
});

describe("pick", () => {
  it("picks by the draw", () => {
    expect(pick(scripted([0]), ["a", "b", "c"])).toBe("a");
    expect(pick(scripted([0.99]), ["a", "b", "c"])).toBe("c");
  });

  it("refuses an empty list", () => {
    expect(() => pick(mulberry32(1), [])).toThrow(RangeError);
  });
});

describe("shuffle and shuffled", () => {
  it("pin the order a seed gives (Itsutsu's deals depend on it)", () => {
    expect(shuffled(mulberry32(20260930), [..."ABCDEFGHIJ"]).join("")).toBe("GCADEBFJIH");
  });

  it("shuffled leaves the list alone; shuffle works in place", () => {
    const list = [1, 2, 3, 4, 5];
    const copy = shuffled(mulberry32(1), list);
    expect(list).toEqual([1, 2, 3, 4, 5]);
    expect(copy.sort()).toEqual(list);
    const same = shuffle(mulberry32(1), list);
    expect(same).toBe(list);
    expect(list).toEqual(shuffled(mulberry32(1), [1, 2, 3, 4, 5]));
  });

  it("take one draw per item but the first", () => {
    const random = scripted([0.4]);
    shuffled(random, [1, 2, 3, 4, 5, 6]);
    expect(random.taken).toBe(5);
    expect(shuffled(mulberry32(1), [])).toEqual([]);
  });

  it("make every order of three equally often", () => {
    const random = mulberry32(77);
    const counts = new Map<string, number>();
    for (let i = 0; i < 60_000; i += 1) {
      const order = shuffled(random, ["a", "b", "c"]).join("");
      counts.set(order, (counts.get(order) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const count of counts.values()) expect(Math.abs(count - 10_000)).toBeLessThan(500);
  });
});

describe("sample", () => {
  it("draws distinct items, in order drawn", () => {
    const got = sample(mulberry32(4), [..."ABCDEFGH"], 5);
    expect(got).toHaveLength(5);
    expect(new Set(got).size).toBe(5);
    expect(sample(mulberry32(4), [..."ABCDEFGH"], 5)).toEqual(got);
  });

  it("gives the whole list for too many, and nothing for none", () => {
    expect(sample(mulberry32(4), [1, 2, 3], 10).sort()).toEqual([1, 2, 3]);
    expect(sample(mulberry32(4), [1, 2, 3], 0)).toEqual([]);
  });
});

describe("distinctBelow", () => {
  it("pins the numbers a seed gives (stored games depend on it)", () => {
    expect(distinctBelow(mulberry32(99), 5, 10)).toEqual([2, 8, 5, 6, 0]);
  });

  it("stops at the limit", () => {
    expect(distinctBelow(mulberry32(1), 20, 4).sort()).toEqual([0, 1, 2, 3]);
  });
});

describe("weighted draws", () => {
  it("choose in proportion to weight", () => {
    const random = mulberry32(12);
    const counts = [0, 0, 0];
    for (let i = 0; i < 60_000; i += 1) counts[weightedIndex(random, [1, 2, 3])]! += 1;
    expect(Math.abs(counts[0]! - 10_000)).toBeLessThan(500);
    expect(Math.abs(counts[1]! - 20_000)).toBeLessThan(600);
    expect(Math.abs(counts[2]! - 30_000)).toBeLessThan(700);
  });

  it("never choose a weight of nothing, and give 0 when all are nothing", () => {
    const random = mulberry32(12);
    for (let i = 0; i < 1000; i += 1) expect(weightedIndex(random, [0, 1, 0])).toBe(1);
    expect(weightedIndex(random, [0, 0])).toBe(0);
  });

  it("weightedPick returns the item", () => {
    expect(weightedPick(scripted([0.99]), ["x", "y"], [1, 1])).toBe("y");
    expect(() => weightedPick(mulberry32(1), [], [])).toThrow(RangeError);
  });
});

describe("normal", () => {
  it("has the mean and spread asked for", () => {
    const random = mulberry32(31);
    const values = Array.from({ length: 50_000 }, () => normal(random, 100, 15));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
    expect(Math.abs(mean - 100)).toBeLessThan(0.5);
    expect(Math.abs(sd - 15)).toBeLessThan(0.5);
  });

  it("takes two draws and survives a draw of 0", () => {
    const random = scripted([0, 0.25]);
    expect(Number.isFinite(normal(random))).toBe(true);
    expect(random.taken).toBe(2);
  });
});

describe("a seeded sequence of mixed draws", () => {
  // Itsutsu's player projection makes these draws in this order; pinned so it renders the same numbers.
  it("pins every value", () => {
    const random = mulberry32(7);
    expect([int(random, 1, 6), float(random, 10, 20), chance(random, 0.5), normal(random, 100, 15), weightedIndex(random, [1, 2, 3, 4])]).toEqual([
      1, 10.61958257574588, false, 87.42141674150272, 2,
    ]);
  });
});
