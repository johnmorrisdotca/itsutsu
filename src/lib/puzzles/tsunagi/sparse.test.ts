import { beforeAll, describe, expect, it } from "vitest";

import { decodeLayout, sparseMost, stepBetween, wrappedStep } from "./code";
import { challengesOf, tsunagiRole } from "./ladder";
import { loadEveryTsunagiLevel, TSUNAGI_SIZES, tsunagiLevelsOf } from "./levels";
import { countSolutions } from "./solve";
import { sparseCandidate } from "./sparse";
import { seededRandom } from "../random";

/**
 * HARDER WITHOUT NEW RULES: sparse boards (few, long lines) and a stroke
 * limit. John, 2026-09-26: "fewer, longer lines (difficulty from distance,
 * chosen by the measure), and an optional limit of N strokes where lifting the
 * finger spends one. Both usable as ladder blocks."
 */
beforeAll(loadEveryTsunagiLevel);

/** Three pairs on a 5×5, each along its own row, the last two rows empty: A 0–4, B 5–9, C 10–14. */
const THREE = "A...AB...BC...C..........";

describe("the words that say so", () => {
  it("reads `sparse` only on a board with no more lines than a sparse one has", () => {
    expect(sparseMost(5)).toBe(3);
    expect(sparseMost(9)).toBe(6);
    expect(decodeLayout(`${THREE}|sparse`, 5)!.sparse).toBe(true);
    expect(decodeLayout(THREE, 5)!.sparse).toBe(false);
    // Four lines on a 5×5 is not sparse, and a board that says it is is not read.
    expect(decodeLayout(`A...AB...BC...CD...D.....|sparse`, 5)).toBeNull();
  });

  it("reads a stroke limit last, and never one fewer than the lines", () => {
    expect(decodeLayout(`${THREE}|strokes3`, 5)!.strokes).toBe(3);
    expect(decodeLayout(`${THREE}|sparse|boom3|strokes6`, 5)!.strokes).toBe(6);
    expect(decodeLayout(THREE, 5)!.strokes).toBeNull();
    expect(decodeLayout(`${THREE}|strokes2`, 5)).toBeNull();
    expect(decodeLayout(`${THREE}|strokes3|sparse`, 5)).toBeNull();
  });

  it("are challenges of their own, in the order the ladder meets them", () => {
    expect(challengesOf(`${THREE}|sparse|strokes4`)).toEqual(["strokes", "sparse"]);
  });
});

describe("a sparse board", () => {
  it("is made with no more lines than sparse allows, and exactly one answer", () => {
    const random = seededRandom(20260926);
    let made = null;
    for (let tries = 0; made === null && tries < 20_000; tries += 1) made = sparseCandidate(5, random, 5_000);
    expect(made).not.toBeNull();
    const layout = decodeLayout(made!.layout, 5)!;
    expect(layout.sparse).toBe(true);
    expect(layout.ends.length).toBeLessThanOrEqual(sparseMost(5));
    expect(countSolutions(layout, 2).count).toBe(1);
  });
});

describe("the ladder's stroke limits and sparse boards", () => {
  const levels = () => TSUNAGI_SIZES.flatMap((size) => tsunagiLevelsOf(size).map(([layout, answer], at) => ({ size, level: at + 1, layout, answer, decoded: decodeLayout(layout, size)! })));

  it("gives every stroke limit at least the fewest strokes its board can be solved in: none to spare at a 16th, three at a 15th", () => {
    const limited = levels().filter((each) => each.decoded.strokes !== null);
    expect(limited.length).toBeGreaterThan(0);
    for (const { size, level, answer, decoded } of limited) {
      // One stroke a line, and one more each time a line crosses a wrapped board's join.
      let least = decoded.ends.length;
      if (decoded.wrap) {
        for (let at = 0; at < size * size; at += 1) {
          for (const by of [1, size]) {
            const next = wrappedStep(size, at, by);
            if (stepBetween(size, at, next, false) === 0 && /[A-P]/.test(answer[at]!) && answer[at] === answer[next]) least += 1;
          }
        }
      }
      const role = tsunagiRole(size, level)?.role;
      expect(decoded.strokes, `${size}×${size} level ${level}`).toBe(role === "tests" ? least : least + 3);
    }
  });

  it("has sparse boards only from 5×5 to 9×9, as 15ths and 16ths", () => {
    const sparse = levels().filter((each) => each.decoded.sparse);
    expect(sparse.length).toBeGreaterThan(0);
    for (const { size, level } of sparse) {
      expect(size, `${size}×${size} level ${level}`).toBeGreaterThanOrEqual(5);
      expect(size, `${size}×${size} level ${level}`).toBeLessThanOrEqual(9);
      expect(tsunagiRole(size, level), `${size}×${size} level ${level}`).not.toBeNull();
    }
  });
});
