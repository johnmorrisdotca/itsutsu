import { describe, expect, it } from "vitest";

import { seededRandom, shuffled } from "../random";
import { leastSwaps, swapsSolving } from "./leastSwaps";

/** The true fewest swaps, by breadth-first search over every string a swap away: slow, and beyond doubt. */
function bySearch(from: string, to: string): number {
  const seen = new Set([from]);
  let layer = [from];
  for (let depth = 0; ; depth += 1) {
    if (layer.includes(to)) return depth;
    const next: string[] = [];
    for (const word of layer) {
      for (let a = 0; a < word.length; a += 1) {
        for (let b = a + 1; b < word.length; b += 1) {
          if (word[a] === word[b]) continue;
          const chars = [...word];
          [chars[a], chars[b]] = [chars[b]!, chars[a]!];
          const made = chars.join("");
          if (!seen.has(made)) {
            seen.add(made);
            next.push(made);
          }
        }
      }
    }
    layer = next;
  }
}

const every = (length: number) => Array.from({ length }, (_, cell) => cell);

describe("the fewest swaps between two grids", () => {
  it("is a permutation's cells out of place less its cycles when every letter differs", () => {
    // abcdef → bcaedf: a three-cycle and a two-cycle, 5 cells out of place, 2 cycles.
    expect(leastSwaps([..."bcaedf"], [..."abcdef"], every(6))).toBe(3);
    expect(leastSwaps([..."abcdef"], [..."abcdef"], every(6))).toBe(0);
  });

  it("finds the shortcut repeated letters allow", () => {
    // Moved as one six-cycle (five swaps), but the two a's and two b's let it be undone in fewer.
    expect(leastSwaps([..."babaab"], [..."aabbab"], every(6))).toBe(bySearch("babaab", "aabbab"));
    expect(leastSwaps([..."eeabcd"], [..."abcdee"], every(6))).toBe(bySearch("eeabcd", "abcdee"));
  });

  it("agrees with a breadth-first search on hundreds of scrambles of words with repeated letters", () => {
    const random = seededRandom(20260926);
    const words = ["eerie", "banana", "letter", "assess", "abcabc", "aabbcc", "mammal", "papaya"];
    for (let round = 0; round < 300; round += 1) {
      const target = words[round % words.length]!;
      const from = shuffled([...target], random).join("");
      expect(leastSwaps([...from], [...target], every(target.length)), `${from} → ${target}`).toBe(bySearch(from, target));
    }
  });

  it("writes out a run of exactly that many swaps that reaches the target", () => {
    const random = seededRandom(7);
    for (let round = 0; round < 200; round += 1) {
      const target = [..."aabbccdeeefgh"];
      const from = shuffled(target, random);
      const swaps = swapsSolving(from, target, every(target.length))!;
      expect(swaps.length).toBe(leastSwaps(from, target, every(target.length)));
      const grid = [...from];
      for (const [a, b] of swaps) [grid[a], grid[b]] = [grid[b]!, grid[a]!];
      expect(grid).toEqual(target);
    }
  });

  it("says no number of swaps will do when the letters differ", () => {
    expect(leastSwaps([..."abc"], [..."abd"], every(3))).toBeNull();
    expect(swapsSolving([..."abc"], [..."abd"], every(3))).toBeNull();
  });

  it("counts only the cells it is asked about, as the lattice asks only of its 21 letters", () => {
    expect(leastSwaps([..."b.a"], [..."a.b"], [0, 2])).toBe(1);
  });
});
