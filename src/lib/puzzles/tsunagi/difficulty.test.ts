import { beforeAll, describe, expect, it } from "vitest";

import { difficultyScores, forcedShare, measureLevel, type LevelMeasure } from "./difficulty";
import { isTwist } from "./ladder";
import { TSUNAGI_MARKS } from "./levels/marks.data";
import { loadEveryTsunagiLevel, TSUNAGI_SIZES, tsunagiLevelsOf } from "./levels";

/**
 * THE DIFFICULTY MEASURE: each of its four parts on boards made to show it,
 * and the whole on the levels the site plays — which must come out easiest
 * first, since that is the order the level-making script wrote them in.
 */
beforeAll(loadEveryTsunagiLevel);

/** Four straight rows, each pair at its row's two ends: John's "literally the easiest map we have". */
const STRAIGHT_ROWS = { layout: "A..AB..BC..CD..D", answer: "AAAABBBBCCCCDDDD" };
/** A board whose lines turn: three bends in the long A line. */
const WINDING = { layout: ".ABCAD..D.BCE..E", answer: "AABCADBCDDBCEEEE" };

describe("the four measures", () => {
  it("counts no corners in straight rows, and some in a winding board", () => {
    expect(measureLevel(STRAIGHT_ROWS.layout, STRAIGHT_ROWS.answer, 4)!.turns).toBe(0);
    expect(measureLevel(WINDING.layout, WINDING.answer, 4)!.turns).toBeGreaterThan(0);
  });

  it("measures the longest line in cells", () => {
    expect(measureLevel(STRAIGHT_ROWS.layout, STRAIGHT_ROWS.answer, 4)!.longest).toBe(4);
    expect(measureLevel(WINDING.layout, WINDING.answer, 4)!.longest).toBe(4);
  });

  it("fills a board of straight rows by forced moves alone", () => {
    expect(forcedShare(STRAIGHT_ROWS.layout, 4)).toBe(1);
  });

  it("says a full board has nothing left to force, and refuses a layout of the wrong size", () => {
    expect(forcedShare("AABB", 2)).toBe(1);
    expect(measureLevel("A..A", "AAAA", 4)).toBeNull();
  });
});

describe("the score", () => {
  const base: LevelMeasure = { pairs: 4, turns: 0, longest: 4, empties: 8, forcedShare: 1, nodes: 10, branches: 0 };

  it("puts a board that is harder on every measure above one that is easier on every measure", () => {
    const hard: LevelMeasure = { ...base, turns: 6, longest: 8, forcedShare: 0.2, nodes: 400, branches: 3 };
    const [easy, harder] = difficultyScores([base, hard], 4);
    expect(easy).toBe(0);
    expect(harder).toBe(100);
  });

  it("weighs guessing by branches first, and only then by positions looked at", () => {
    const manyNodes: LevelMeasure = { ...base, nodes: 5_000, branches: 0 };
    const oneBranch: LevelMeasure = { ...base, nodes: 20, branches: 1 };
    const [nodes, branch] = difficultyScores([manyNodes, oneBranch], 4);
    expect(branch).toBeGreaterThan(nodes!);
  });

  it("counts every board solved without a branch as no guessing, however many positions the solver looked at", () => {
    const small: LevelMeasure = { ...base, nodes: 12 };
    const bigger: LevelMeasure = { ...base, nodes: 13 };
    const [a, b] = difficultyScores([small, bigger], 4);
    expect(a).toBe(b);
  });

  it("gives levels that measure the same the same score", () => {
    expect(new Set(difficultyScores([base, { ...base }, { ...base }], 4)).size).toBe(1);
  });
});

/** Each size's levels measured once, for every test below: measuring runs the solver on all 1,536. */
const measuredOnce = new Map<number, LevelMeasure[]>();
function measuredLevels(size: number): LevelMeasure[] {
  if (!measuredOnce.has(size)) measuredOnce.set(size, tsunagiLevelsOf(size).map(([layout, answer]) => measureLevel(layout, answer, size)!));
  return measuredOnce.get(size)!;
}

describe("the levels the site plays", () => {
  it("makes John's four straight rows 4×4 level 1: \"that would have to be number one\"", () => {
    const levels = tsunagiLevelsOf(4);
    const at = levels.findIndex(([layout]) => layout === STRAIGHT_ROWS.layout);
    expect(at + 1, "its level number").toBe(1);
  });

  it.each(TSUNAGI_SIZES.map((size) => [size]))("climb block by block at %i×%i: each block's plain levels no easier on average than the block before's", (size) => {
    const levels = tsunagiLevelsOf(size);
    const measured = measuredLevels(size);
    const plain = levels.flatMap(([layout], at) => (isTwist(layout) ? [] : [{ at }]));
    const scores = difficultyScores(
      plain.map(({ at }) => measured[at]!),
      size,
    );
    const byBlock = new Map<number, number[]>();
    plain.forEach(({ at }, index) => byBlock.set(Math.floor(at / 16), [...(byBlock.get(Math.floor(at / 16)) ?? []), scores[index]!]));
    const means = [...byBlock.values()].map((each) => each.reduce((sum, score) => sum + score, 0) / each.length);
    for (let block = 1; block < means.length; block += 1) expect(means[block]!, `block ${block + 1}`).toBeGreaterThanOrEqual(means[block - 1]!);
  });

  it.each(TSUNAGI_SIZES.map((size) => [size]))("marks every %i×%i level 1 to 5 by its measured score among the size's levels", (size) => {
    const scores = difficultyScores(measuredLevels(size), size);
    expect(TSUNAGI_MARKS[size]).toBe(scores.map((score) => String(Math.min(5, 1 + Math.floor(score / 20)))).join(""));
  });
});
