import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { splitByTime, unknownWeight } from "./e2eShards.mjs";

const specs = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return specs(path);
    return entry.name.endsWith(".spec.ts") ? [path] : [];
  });

describe("the browser shards are balanced by time", () => {
  it("puts every file in exactly one shard", () => {
    const files = ["a", "b", "c", "d", "e", "f", "g"];
    const shards = splitByTime(files, { a: 50, b: 40, c: 30 }, 3);
    const placed = shards.flat();
    expect(placed.sort()).toEqual([...files].sort());
    expect(new Set(placed).size).toBe(files.length);
  });

  it("deals the heaviest first, each to the lightest shard", () => {
    const shards = splitByTime(["big", "mid", "small", "tiny"], { big: 100, mid: 60, small: 50, tiny: 10 }, 2);
    // 100 alone; 60 + 50 on the other; 10 joins the lighter of 100 and 110.
    expect(shards).toEqual([["big", "tiny"], ["mid", "small"]]);
  });

  it("does not depend on the order the files were listed in", () => {
    const times = { a: 5, b: 5, c: 9, d: 1 };
    expect(splitByTime(["a", "b", "c", "d"], times, 2)).toEqual(splitByTime(["d", "c", "b", "a"], times, 2));
  });

  it("weighs a file with no time as the median one, not as nothing", () => {
    expect(unknownWeight({ a: 1, b: 5, c: 9 })).toBe(5);
    expect(unknownWeight({})).toBe(1);
    const shards = splitByTime(["new", "a", "b"], { a: 10, b: 10 }, 2);
    expect(shards.flat().sort()).toEqual(["a", "b", "new"]);
  });

  it("refuses a shard count that is not one", () => {
    expect(() => splitByTime(["a"], {}, 0)).toThrow();
  });

  it("splits this suite with no shard far past the even share", () => {
    const times = JSON.parse(readFileSync("e2e/shard-times.json", "utf8")) as Record<string, number>;
    const files = specs("e2e");
    const shards = splitByTime(files, times, 14);
    expect(shards.flat().sort()).toEqual([...files].sort());
    const fallback = unknownWeight(times);
    const load = shards.map((shard) => shard.reduce((sum, file) => sum + (times[file] ?? fallback), 0));
    const even = load.reduce((a, b) => a + b, 0) / 14;
    // The heaviest single file is under the even share, so the split can come close to even.
    expect(Math.max(...load)).toBeLessThan(even * 1.1);
  });
});
