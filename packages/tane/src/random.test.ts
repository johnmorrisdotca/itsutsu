import { describe, expect, it } from "vitest";

import { deriveSeed, fork, hashSeed, mulberry32, seededRandom, step } from "./random.ts";

const draws = (seed: number, count = 5) => {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => random());
};

describe("mulberry32", () => {
  // Golden values. These are the numbers Itsutsu's daily puzzles, games and
  // deals have been built from since 2026; a change here changes every one of
  // them, so they are pinned to the last digit and must never move.
  it("gives the same numbers for a seed, forever", () => {
    expect(draws(1)).toEqual([0.6270739405881613, 0.002735721180215478, 0.5274470399599522, 0.9810509674716741, 0.9683778982143849]);
    expect(draws(42)).toEqual([0.6011037519201636, 0.44829055899754167, 0.8524657934904099, 0.6697340414393693, 0.17481389874592423]);
    expect(draws(20260930)).toEqual([0.7129707557614893, 0.9029586620163172, 0.8964550015516579, 0.8198657901957631, 0.2130950081627816]);
    expect(draws(0)).toEqual([0.26642920868471265, 0.0003297457005828619, 0.2232720274478197, 0.1462021479383111, 0.46732782293111086]);
    expect(draws(2 ** 31 - 1)).toEqual([0.4290980885270983, 0.12713524978607893, 0.3852774982806295, 0.39639189024455845, 0.11962746665813029]);
  });

  it("reads the seed as an unsigned 32-bit integer", () => {
    expect(draws(-1)).toEqual([0.8964226141106337, 0.189478256739676, 0.7156526781618595, 0.9440599093213677, 0.8452364315744489]);
    expect(draws(2 ** 32 + 7)).toEqual(draws(7));
    expect(draws(-1)).toEqual(draws(2 ** 32 - 1));
  });

  it("stays in [0, 1)", () => {
    const random = mulberry32(123);
    for (let i = 0; i < 100_000; i += 1) {
      const value = random();
      expect(value >= 0 && value < 1).toBe(true);
    }
  });

  it("is spread evenly: every tenth of [0, 1) gets its share", () => {
    const random = mulberry32(2026);
    const buckets = new Array<number>(10).fill(0);
    const n = 200_000;
    for (let i = 0; i < n; i += 1) buckets[Math.floor(random() * 10)]! += 1;
    // Chi-square with 9 degrees of freedom: 27.9 is the 0.1% critical value.
    const chiSquare = buckets.reduce((sum, count) => sum + (count - n / 10) ** 2 / (n / 10), 0);
    expect(chiSquare).toBeLessThan(27.9);
  });

  it("gives two seeds unrelated streams", () => {
    expect(draws(1)).not.toEqual(draws(2));
  });

  it("is also called seededRandom", () => {
    expect(seededRandom).toBe(mulberry32);
  });
});

describe("step", () => {
  it("walks the same stream as mulberry32, one stored integer at a time", () => {
    let state = 42;
    const walked: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      const next = step(state);
      walked.push(next.value);
      state = next.state;
    }
    expect(walked).toEqual(draws(42));
  });

  it("keeps the state a whole unsigned 32-bit number", () => {
    const { state } = step(2 ** 32 - 1);
    expect(Number.isInteger(state) && state >= 0 && state < 2 ** 32).toBe(true);
  });
});

describe("hashSeed", () => {
  it("is fixed for a text, and unsigned 32-bit", () => {
    expect(hashSeed("")).toBe(hashSeed(""));
    expect(hashSeed("room-7")).toBe(hashSeed("room-7"));
    for (const text of ["", "a", "room-7", "種", "2026-09-30"]) {
      const value = hashSeed(text);
      expect(Number.isInteger(value) && value >= 0 && value < 2 ** 32).toBe(true);
    }
  });

  it("pins its values", () => {
    expect([hashSeed(""), hashSeed("a"), hashSeed("tane"), hashSeed("種")]).toMatchInlineSnapshot(`
      [
        2872998923,
        444641715,
        1756529319,
        296313953,
      ]
    `);
  });

  it("sends near texts far apart", () => {
    const a = hashSeed("a");
    const b = hashSeed("b");
    let differing = a ^ b;
    let bits = 0;
    while (differing !== 0) {
      bits += differing & 1;
      differing >>>= 1;
    }
    expect(bits).toBeGreaterThan(8);
  });
});

describe("deriveSeed", () => {
  it("gives each label its own seed, the same every time", () => {
    const deck = deriveSeed(99, "deck");
    expect(deriveSeed(99, "deck")).toBe(deck);
    expect(deriveSeed(99, "dice")).not.toBe(deck);
    expect(deriveSeed(100, "deck")).not.toBe(deck);
  });

  it("reads labels in order, and tells a number from its text", () => {
    expect(deriveSeed(1, "round", 3)).not.toBe(deriveSeed(1, 3, "round"));
    expect(deriveSeed(1, 3)).not.toBe(deriveSeed(1, "3"));
  });

  it("pins its values", () => {
    expect([deriveSeed(1), deriveSeed(1, "deck"), deriveSeed(20260930, "round", 2)]).toMatchInlineSnapshot(`
      [
        1364076727,
        1764169370,
        3434175603,
      ]
    `);
  });
});

describe("fork", () => {
  it("takes one draw from the parent", () => {
    const parent = mulberry32(5);
    fork(parent);
    const rest = parent();
    expect(rest).toBe(draws(5, 2)[1]);
  });

  it("is reproducible and unlike its parent", () => {
    const a = fork(mulberry32(5));
    const b = fork(mulberry32(5));
    const child = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(child);
    expect(child).not.toEqual(draws(5, 3));
  });
});
