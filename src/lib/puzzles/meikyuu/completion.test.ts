import { describe, expect, it } from "vitest";

import { completesSize, progressOf, solvedIn } from "./completion";
import { MEIKYUU_LEVELS_A_SIZE } from "./levelCounts";

/*
 * PROGRESS THROUGH A SIZE (`completion.ts`): nothing is locked, so what encourages finishing is the count of what is done
 * and the mark of a size that is whole.
 */
const every = Array.from({ length: MEIKYUU_LEVELS_A_SIZE }, (_, at) => at + 1);

describe("how far through a size a player is", () => {
  it("counts the levels solved, the account's and the device's together, each once", () => {
    expect(solvedIn(1)).toBe(0);
    expect(solvedIn(1, { 1: [1, 2, 3] })).toBe(3);
    expect(solvedIn(1, { 1: [1, 2, 3] }, { 1: [3, 4] })).toBe(4);
    // Another size's levels are not this size's, and a solve of nothing counts for nothing.
    expect(solvedIn(1, { 2: [1, 2, 3] }, null, undefined)).toBe(0);
  });

  it("counts only numbers the size has", () => {
    expect(solvedIn(1, { 1: [0, 257, 1.5, -3, 12] })).toBe(1);
    expect(solvedIn(609, { 609: [1, 256, 257] })).toBe(2);
  });

  it("reads each size asked about, in order, with its count and whether it is whole", () => {
    expect(progressOf([1, 2, 609], { 1: every, 2: [5], 609: [1] })).toEqual([
      { size: 1, solved: 256, count: 256, complete: true },
      { size: 2, solved: 1, count: 256, complete: false },
      { size: 609, solved: 1, count: 256, complete: false },
    ]);
  });

  it("is never whole for a size the levels do not come in", () => {
    expect(progressOf([7], { 7: [1] })).toEqual([{ size: 7, solved: 0, count: 0, complete: false }]);
  });

  it("knows when a solve is the one that completes a size, and only then", () => {
    const allButOne = { 1: every.filter((level) => level !== 40) };
    expect(completesSize(1, 40, allButOne)).toBe(true);
    // Solving a level already solved, or any level while others are missing, completes nothing.
    expect(completesSize(1, 41, allButOne)).toBe(false);
    expect(completesSize(1, 40, { 1: every })).toBe(false);
    expect(completesSize(1, 40, { 1: every.slice(0, 100) })).toBe(false);
    // The last level may be solved on the device and the rest on the account.
    expect(completesSize(1, 40, { 1: every.filter((level) => level < 40) }, { 1: every.filter((level) => level > 40) })).toBe(true);
  });
});
