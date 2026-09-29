import { describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { PUZZLE_LEVEL_LIST } from "../puzzles.constants";
import { blockedBy, canTake, freePairs, freeSlots, geometryOf, isFree, overlapsOnLayer, takePair, tilesLeft } from "./board";
import { checkMahjong } from "./check";
import { layPairs, pairsLeft, shuffleTiles } from "./deal";
import { MAHJONG_SAME_BLOCK, bonusRuleOfSeed, freshMahjongSeed, generateMahjong } from "./generate";
import { MAHJONG_LAYOUTS, layoutExtent, layoutFor } from "./layouts";
import type { MahjongLayout } from "./mahjong.types";
import { SHUFFLE_MARK, decodeMoves, encodeMoves, playSolve } from "./moves";
import { MAHJONG_FACES, bonusRuleOf, faceOf, matchClass, pairPoints, setPairs, tilesMatch } from "./tiles";
import { seededRandom } from "../random";

/**
 * Mahjong Solitaire ("mahjong"): what makes a tile free, a pair a match, a deal
 * clearable and a solve honest. The little layouts are drawn by hand, in half
 * tiles: a tile covers two across and two down.
 */
function layout(slots: { x: number; y: number; z: number }[]): MahjongLayout {
  return { size: 99, key: "test", slots };
}

/*
 *   A B C      one row of three on the table, and D on top of B and C,
 *     D        half over each:  B and C are covered; A is free on its left,
 *              D is free (nothing on it, nothing beside it).
 */
const ROW = layout([
  { x: 0, y: 0, z: 0 },
  { x: 2, y: 0, z: 0 },
  { x: 4, y: 0, z: 0 },
  { x: 3, y: 0, z: 1 },
]);

describe("the set", () => {
  it("holds 144 tiles in 42 faces, each written as one letter", () => {
    expect(MAHJONG_FACES).toHaveLength(42);
    expect(new Set(MAHJONG_FACES.map((face) => face.code)).size).toBe(42);
    for (const rule of ["group", "same"] as const) {
      const pairs = setPairs(rule, seededRandom(3));
      expect(pairs).toHaveLength(72);
      expect(pairs.every(([a, b]) => tilesMatch(a, b, rule))).toBe(true);
    }
    // The usual rule deals each flower and season once; Identical deals four bonus faces twice each.
    const group = setPairs("group", seededRandom(3)).flat();
    expect(group.filter((code) => faceOf(code)!.suit === "flowers")).toHaveLength(4);
    expect(new Set(group.filter((code) => faceOf(code)!.suit === "flowers")).size).toBe(4);
    const same = setPairs("same", seededRandom(3)).flat();
    const bonus = same.filter((code) => ["flowers", "seasons"].includes(faceOf(code)!.suit));
    expect(bonus).toHaveLength(8);
    expect(new Set(bonus).size).toBe(4);
  });

  it("matches identical tiles, and any flower with any flower under the usual rule only", () => {
    const plum = MAHJONG_FACES.find((face) => face.suit === "flowers" && face.rank === 1)!.code;
    const orchid = MAHJONG_FACES.find((face) => face.suit === "flowers" && face.rank === 2)!.code;
    const spring = MAHJONG_FACES.find((face) => face.suit === "seasons" && face.rank === 1)!.code;
    expect(tilesMatch(plum, orchid, "group")).toBe(true);
    expect(tilesMatch(plum, spring, "group")).toBe(false);
    expect(tilesMatch(plum, orchid, "same")).toBe(false);
    expect(tilesMatch(plum, plum, "same")).toBe(true);
    expect(tilesMatch("a", "a", "group")).toBe(true);
    expect(tilesMatch("a", "b", "group")).toBe(false);
    expect(matchClass("a", "group")).toBe("a");
    expect(bonusRuleOf(`${plum}${orchid}aa`)).toBe("group");
    expect(bonusRuleOf(`${plum}${plum}aa`)).toBe("same");
  });

  it("prices a pair for the table: plain suits 1, ones and nines 2, winds 3, dragons 4, bonus 2", () => {
    const code = (suit: string, rank: number) => MAHJONG_FACES.find((face) => face.suit === suit && face.rank === rank)!.code;
    expect(pairPoints(code("circles", 5))).toBe(1);
    expect(pairPoints(code("bamboo", 1))).toBe(2);
    expect(pairPoints(code("characters", 9))).toBe(2);
    expect(pairPoints(code("winds", 2))).toBe(3);
    expect(pairPoints(code("dragons", 1))).toBe(4);
    expect(pairPoints(code("seasons", 3))).toBe(2);
  });
});

describe("what makes a tile free", () => {
  const geometry = geometryOf(ROW);

  it("needs nothing on it and one long side open", () => {
    expect(freeSlots(geometry, "abcd")).toEqual([0, 3]);
    expect(blockedBy(geometry, "abcd", 1)).toBe("covered");
    expect(blockedBy(geometry, "abcd", 2)).toBe("covered");
    // With the top tile gone, B is still held on both sides and C is free on its right.
    expect(freeSlots(geometry, "abc.")).toEqual([0, 2]);
    expect(blockedBy(geometry, "abc.", 1)).toBe("sides");
    expect(isFree(geometry, "a.c.", 2)).toBe(true);
    expect(isFree(geometry, "....", 0)).toBe(false);
  });

  it("takes only two free tiles that match, and leaves the tiles it was given alone", () => {
    const cells = "abca";
    expect(freePairs(geometry, cells, "group")).toEqual([[0, 3]]);
    expect(canTake(geometry, cells, "group", 0, 3)).toBe(true);
    expect(canTake(geometry, cells, "group", 0, 1)).toBe(false);
    expect(canTake(geometry, cells, "group", 0, 0)).toBe(false);
    expect(takePair(cells, 0, 3)).toBe(".bc.");
    expect(cells).toBe("abca");
    expect(tilesLeft(".bc.")).toBe(2);
  });
});

describe("the layouts", () => {
  it.each(MAHJONG_LAYOUTS.map((each) => [each.key, each] as const))("%s has an even count, one width, and no two tiles in one place", (_, each) => {
    expect(each.slots.length % 2).toBe(0);
    expect(overlapsOnLayer(each)).toBe(false);
    expect(layoutExtent(each).width).toBe(each.size * 2);
    expect(layoutFor(each.size)).toBe(each);
  });

  it("offers the classic Turtle of 144", () => {
    expect(layoutFor(15)!.slots).toHaveLength(144);
    expect(layoutExtent(layoutFor(15)!).layers).toBe(5);
  });
});

describe("a deal", () => {
  it("is laid in reverse, so the order it was laid in clears it", () => {
    const geometry = geometryOf(ROW);
    const laid = layPairs(geometry, [true, true, true, true], [["a", "a"], ["b", "b"]], seededRandom(5))!;
    expect(laid.cells).not.toContain(".");
    let cells = laid.cells;
    for (const [a, b] of laid.order) {
      expect(canTake(geometry, cells, "group", a, b)).toBe(true);
      cells = takePair(cells, a, b);
    }
    expect(tilesLeft(cells)).toBe(0);
  });

  it.each(MAHJONG_LAYOUTS.map((each) => [each.key, each.size] as const))("of the %s is the same from the same seed, at every level, and clears", (_, size) => {
    for (const level of PUZZLE_LEVEL_LIST) {
      const puzzle = generateMahjong(size, level, 4242);
      expect(generateMahjong(size, level, 4242)).toEqual(puzzle);
      expect(checkMahjong(size, puzzle.givens, puzzle.solution)).toEqual({ ok: true });
      expect(checkSolution("mahjong", size, puzzle.givens, puzzle.solution, level)).toEqual({ ok: true });
    }
  });

  it("says its flowers' rule by the block its seed is drawn from", () => {
    expect(bonusRuleOfSeed(20260929)).toBe("group");
    expect(bonusRuleOfSeed(MAHJONG_SAME_BLOCK.from + 5)).toBe("same");
    expect(bonusRuleOfSeed(freshMahjongSeed("same", seededRandom(1)))).toBe("same");
    expect(bonusRuleOfSeed(freshMahjongSeed("group"))).toBe("group");
    const same = generateMahjong(15, "medium", MAHJONG_SAME_BLOCK.from + 11);
    expect(bonusRuleOf(same.givens)).toBe("same");
    expect(bonusRuleOf(generateMahjong(15, "medium", 11).givens)).toBe("group");
  });
});

describe("a solve", () => {
  const puzzle = generateMahjong(8, "medium", 99);
  const moves = decodeMoves(puzzle.solution, puzzle.givens.length)!;

  it("is written as its moves, a pair in four characters and a shuffle as a star", () => {
    expect(encodeMoves(moves)).toBe(puzzle.solution);
    expect(encodeMoves([{ shuffle: true }, { pair: [1, 40] }])).toBe(`${SHUFFLE_MARK}0114`);
    expect(decodeMoves("0114", 30)).toBeNull();
    expect(decodeMoves("01", 64)).toBeNull();
    expect(decodeMoves("0101", 64)).toBeNull();
  });

  it("is refused for a pair out of order, a pair left on, or a shuffle while a pair is free", () => {
    expect(checkMahjong(8, puzzle.givens, encodeMoves([...moves].reverse())).ok).toBe(false);
    expect(checkMahjong(8, puzzle.givens, encodeMoves(moves.slice(0, -1)))).toEqual({ ok: false, reason: "tiles are left on the layout" });
    expect(checkMahjong(8, puzzle.givens, `${SHUFFLE_MARK}${puzzle.solution}`).ok).toBe(false);
    expect(checkMahjong(8, puzzle.givens.slice(1), puzzle.solution).ok).toBe(false);
    expect(checkMahjong(9, puzzle.givens, puzzle.solution).ok).toBe(false);
  });

  it("shuffles when stuck, the same way every time, and play goes on to the end", () => {
    const layout = layoutFor(8)!;
    const geometry = geometryOf(layout);
    // Play badly — always the last pair offered — until stuck, then shuffle and go on.
    const random = seededRandom(7);
    let found = false;
    for (let seed = 1; seed < 40 && !found; seed += 1) {
      const deal = generateMahjong(8, "hard", seed);
      let cells = deal.givens;
      const played: ({ pair: [number, number] } | { shuffle: true })[] = [];
      let shuffles = 0;
      for (let step = 0; step < 200 && tilesLeft(cells) > 0; step += 1) {
        const pairs = freePairs(geometry, cells, "group");
        if (pairs.length > 0) {
          const [a, b] = pairs[Math.floor(random() * pairs.length)]!;
          played.push({ pair: [a, b] });
          cells = takePair(cells, a, b);
          continue;
        }
        const next = shuffleTiles(geometry, cells, "group", shuffles);
        if (next === null) break;
        expect(shuffleTiles(geometry, cells, "group", shuffles)).toBe(next);
        expect(pairsLeft(next, "group").flat().sort()).toEqual(pairsLeft(cells, "group").flat().sort());
        expect(freePairs(geometry, next, "group").length).toBeGreaterThan(0);
        played.push({ shuffle: true });
        cells = next;
        shuffles += 1;
        found = true;
      }
      if (!found) continue;
      const replayed = playSolve(8, deal.givens, played)!;
      expect(replayed.cells).toBe(cells);
      expect(replayed.shuffles).toBe(shuffles);
      if (tilesLeft(cells) === 0) expect(checkMahjong(8, deal.givens, encodeMoves(played))).toEqual({ ok: true });
    }
    expect(found, "no seed got stuck, so no shuffle was tried").toBe(true);
  });

  it("cannot shuffle a tower of two with nothing beside it", () => {
    const tower = layout([
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
    ]);
    expect(shuffleTiles(geometryOf(tower), "aa", "group", 0)).toBeNull();
  });
});
