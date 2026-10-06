import { describe, expect, it } from "vitest";

import { POINTS_A_HELP } from "@/lib/puzzles/puzzlePoints";
import { KUMIMOJI_BAG } from "@/lib/puzzles/kumimoji/tiles.constants";
import { PUZZLE_KIND_LIST, PUZZLE_SPECS, levelsFor, sizesOffered } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { kumimojiRung, nativeReference, price, rankAdd, solveIp, toFive } from "./ladder";
import {
  HELP_COST,
  KUMIMOJI_SHORT_BAG,
  LEVEL_ADD,
  LEVEL_FAMILY_PRICE_MOST,
  PUZZLE_PRICE_LEAST,
  PUZZLE_PRICE_MOST,
  PUZZLE_PRICING,
  SIZE_SERIES,
} from "./ladder.constants";
import { tobiishiBand } from "@/lib/puzzles/tobiishi/sizes";
import { bestSolvesSql } from "./ladderSql";
import { Prisma } from "@prisma/client";

const RANKED: readonly PuzzleKind[] = PUZZLE_KIND_LIST.filter((kind) => PUZZLE_PRICING[kind].how === "ranked");
const LEVELS: readonly PuzzleLevel[] = ["easy", "medium", "hard"];
const LEVELS_WITH_EXTRA: readonly PuzzleLevel[] = [...LEVELS, "extra-hard"];

/** The sizes a kind is priced at, in series from the easiest to the hardest. */
function seriesOf(kind: PuzzleKind): readonly (readonly number[])[] {
  return SIZE_SERIES[kind] ?? [[...PUZZLE_SPECS[kind].sizes].sort((a, b) => a - b)];
}

describe("the puzzle ladder prices every puzzle", () => {
  it("has a pricing for every kind, and a rung for every size the kind can be made at", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      const pricing = PUZZLE_PRICING[kind];
      expect(pricing, kind).toBeDefined();
      if (pricing.how === "tiles") continue;
      expect(Object.keys(pricing.rungs).map(Number).sort((a, b) => a - b), kind).toEqual([...PUZZLE_SPECS[kind].sizes].sort((a, b) => a - b));
    }
  });

  it("prices every offered size at every level it offers between 50 and the ceiling, to the nearest five", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      const ceiling = RANKED.includes(kind) ? LEVEL_FAMILY_PRICE_MOST : PUZZLE_PRICE_MOST;
      for (const size of PUZZLE_SPECS[kind].sizes) {
        for (const level of levelsFor(kind, size)) {
          const each = price(kind, size, level);
          expect(each, `${kind} ${size} ${level}`).toBeGreaterThanOrEqual(PUZZLE_PRICE_LEAST);
          expect(each, `${kind} ${size} ${level}`).toBeLessThanOrEqual(ceiling);
          expect(each % 5, `${kind} ${size} ${level}`).toBe(0);
        }
      }
    }
  });

  it("rises with size and with level, never falls", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      if (kind === "kumimoji") continue;
      for (const series of seriesOf(kind)) {
        for (const level of LEVELS) {
          let before = 0;
          for (const size of series) {
            const each = price(kind, size, level);
            expect(each, `${kind} ${size} ${level}`).toBeGreaterThanOrEqual(before);
            before = each;
          }
        }
        // A series with more than one size ends higher than it began.
        if (series.length > 1) expect(price(kind, series[series.length - 1]!, "easy"), kind).toBeGreaterThan(price(kind, series[0]!, "easy"));
      }
      for (const size of PUZZLE_SPECS[kind].sizes) {
        const levels = levelsFor(kind, size);
        const prices = levels.map((level) => price(kind, size, level));
        expect(prices, `${kind} ${size}`).toEqual([...prices].sort((a, b) => a - b));
      }
    }
  });

  it("starts every kind's offered sizes at 50 and tops an ordinary one at 150", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      if (RANKED.includes(kind) || kind === "kumimoji" || kind === "koushi" || kind === "solitaire") continue;
      const offered = [...sizesOffered(kind)];
      const lowest = Math.min(...offered.map((size) => price(kind, size, "easy")));
      expect(lowest, kind).toBe(50);
    }
    expect(price("numberPlace", 25, "hard")).toBe(150);
    expect([4, 6, 9, 16, 25].map((size) => price("numberPlace", size, "easy"))).toEqual([50, 75, 100, 110, 125]);
    expect(price("freecell", 4, "medium")).toBe(50);
    expect(price("freecell", 3, "medium")).toBe(100);
    expect(price("freecell", 2, "medium")).toBe(150);
    expect(price("spider", 1, "medium")).toBe(50);
    expect(price("spider", 2, "medium")).toBe(100);
    expect(price("spider", 4, "medium")).toBe(150);
  });
});

describe("Tobiishi", () => {
  it("pays 50, 85 and 125 for 3, 6 and 9 jumps, with no level add", () => {
    expect([3, 6, 9].map((size) => price("tobiishi", size, tobiishiBand(size)))).toEqual([50, 85, 125]);
    expect(price("tobiishi", 9, "hard")).toBe(125);
  });
});

describe("the Pencil puzzles", () => {
  it("prices every Pencil puzzle and Jirai by size from 50 to 125, and a level adds 0, 10, 25 or 40", () => {
    expect([5, 7, 10, 14].map((size) => price("shikaku", size, "easy"))).toEqual([50, 70, 95, 125]);
    expect([6, 8, 10, 12].map((size) => price("crossSums", size, "easy"))).toEqual([50, 75, 100, 125]);
    expect([6, 8, 10, 12].map((size) => price("regions", size, "easy"))).toEqual([50, 75, 100, 125]);
    expect(LEVELS_WITH_EXTRA.map((level) => price("shikaku", 7, level))).toEqual([70, 80, 95, 110]);
    expect(LEVELS_WITH_EXTRA.map((level) => price("crossSums", 8, level))).toEqual([75, 85, 100, 115]);
    expect([7, 9, 12, 16, 32].map((size) => price("jirai", size, "easy"))).toEqual([50, 65, 95, 110, 125]);
    expect(LEVELS_WITH_EXTRA.map((level) => price("jirai", 9, level))).toEqual([65, 75, 90, 105]);
    expect(price("jirai", 32, "hard")).toBe(150);
  });

  it("adds 40 for extra hard, and stops at the ceiling where that would pass it", () => {
    expect(LEVEL_ADD["extra-hard"]).toBe(40);
    // The biggest size's Hard is already the ceiling, so its Extra hard is the same 150: a rung never passes it.
    expect(price("shikaku", 14, "hard")).toBe(150);
    expect(price("shikaku", 14, "extra-hard")).toBe(PUZZLE_PRICE_MOST);
    expect(price("crossSums", 10, "extra-hard")).toBe(140);
  });

  it("offers extra hard only to the puzzles that make it, and prices it only for them in SQL", () => {
    const offering = PUZZLE_KIND_LIST.filter((kind) => PUZZLE_SPECS[kind].levels.includes("extra-hard"));
    expect(offering).toEqual(expect.arrayContaining(["shikaku", "akari", "loop", "hitori", "crossSums", "regions", "jirai"]));
    const query = bestSolvesSql(["shikaku", "numberPlace"], Prisma.empty, Prisma.empty);
    expect(query.sql).toContain("('shikaku', 7, 'extra-hard', 110,");
    expect(query.sql).not.toContain("('numberPlace', 9, 'extra-hard'");
  });
});

describe("the words, the tile game and Koushi", () => {
  it("prices a word by its letters", () => {
    expect([4, 5, 6].map((size) => price("gomoji", size, "easy"))).toEqual([50, 90, 125]);
    expect([4, 5, 6].map((size) => price("gomojiMot", size, "easy"))).toEqual([50, 90, 125]);
    expect([4, 5, 6].map((size) => price("gomojiWort", size, "easy"))).toEqual([50, 90, 125]);
    expect([3, 4, 5].map((size) => price("gomojiKana", size, "easy"))).toEqual([50, 90, 125]);
    expect([3, 4, 5, 6].map((size) => price("gomojiPop", size, "easy"))).toEqual([50, 80, 105, 125]);
    expect(price("gomoji", 6, "hard")).toBe(150);
  });

  it("prices Koushi 100, 110 and 125 by level", () => {
    expect(LEVELS.map((level) => price("koushi", 5, level))).toEqual([100, 110, 125]);
  });

  it("prices a Kumimoji by the tiles in its bag, 50 at 40 and 125 at 288", () => {
    expect(kumimojiRung(40)).toBe(50);
    expect(kumimojiRung(288)).toBe(125);
    expect(kumimojiRung(5)).toBe(50);
    expect(kumimojiRung(1000)).toBe(125);
    let before = 0;
    for (let tiles = 1; tiles <= 300; tiles += 1) {
      expect(kumimojiRung(tiles)).toBeGreaterThanOrEqual(before);
      before = kumimojiRung(tiles);
    }
    expect(price("kumimoji", 11, "hard", undefined, 288)).toBe(150);
    expect(price("kumimoji", 7, "easy", undefined, 40)).toBe(50);
  });

  it("holds the short bags to the package's", () => {
    expect(KUMIMOJI_SHORT_BAG).toEqual(KUMIMOJI_BAG);
    expect(HELP_COST).toBe(POINTS_A_HELP);
  });
});

describe("the families of 256 fixed levels", () => {
  it("add 0 to 50 by the level's place, so the first is the rung and the last is 50 above it, or the ceiling where that would pass it (Meikyuu's colossal square rung, 160)", () => {
    for (const kind of RANKED) {
      for (const size of PUZZLE_SPECS[kind].sizes) {
        const first = price(kind, size, "easy", 1);
        const last = price(kind, size, "hard", 256);
        expect(last - first, `${kind} ${size}`).toBe(Math.min(50, LEVEL_FAMILY_PRICE_MOST - first));
        let before = 0;
        for (let rank = 1; rank <= 256; rank += 1) {
          const each = price(kind, size, "easy", rank);
          expect(each).toBeGreaterThanOrEqual(before);
          expect(each % 5).toBe(0);
          before = each;
        }
        expect(last, `${kind} ${size}`).toBeLessThanOrEqual(LEVEL_FAMILY_PRICE_MOST);
      }
    }
  });

  it("price a kept solve at the middle of its third when only the third is known", () => {
    expect(rankAdd(43)).toBe(10);
    expect(rankAdd(128)).toBe(25);
    expect(rankAdd(213)).toBe(40);
    expect(price("meikyuu", 1, "easy")).toBe(65);
    expect(price("meikyuu", 1, "medium")).toBe(80);
    expect(price("meikyuu", 1, "hard")).toBe(95);
    expect(price("meikyuu", 5, "easy")).toBe(170);
    expect(price("meikyuu", 5, "hard")).toBe(200);
    expect(price("meikyuu", 6496, "medium")).toBe(135);
  });

  it("match the measured ranges at the first and last level", () => {
    const range = (kind: PuzzleKind, size: number) => [price(kind, size, "easy", 1), price(kind, size, "hard", 256)];
    expect([1, 2, 3, 4].map((size) => range("meikyuu", size))).toEqual([[55, 105], [95, 145], [120, 170], [150, 200]]);
    expect(range("meikyuu", 609)).toEqual([50, 100]);
    expect(range("meikyuu", 2030)).toEqual([100, 150]);
    // The colossal sizes (package 2.1): the top rung of each series, the square one up to the family's 200 and the tall one to 160, and 128 levels priced as 256 (the third a solve names is what is kept).
    expect(range("meikyuu", 5)).toEqual([160, 200]);
    expect(range("meikyuu", 6496)).toEqual([110, 160]);
    expect(range("suido", 5)).toEqual([50, 100]);
    expect(range("suido", 14)).toEqual([150, 200]);
    expect(range("tsunagi", 4)).toEqual([50, 100]);
    expect(range("tsunagi", 15)).toEqual([150, 200]);
  });
});

describe("what a kept solve pays", () => {
  const solve = (overrides: Partial<Parameters<typeof solveIp>[0]>) =>
    solveIp({ kind: "numberPlace", size: 9, level: "medium", points: 250, helps: 0, solved: true, ...overrides });

  it("pays the whole price for a solve with no help", () => {
    expect(solve({})).toBe(110);
  });

  it("takes off the share of the score that help cost", () => {
    // 250 points with no help, 150 after two helps: 150 of 250.
    expect(solve({ points: 150, helps: 2 })).toBe(toFive((110 * 150) / 250));
    expect(solve({ points: 150, helps: 2 })).toBeLessThan(solve({}));
  });

  it("pays nothing for a solve that scored nothing, and never less than 5 for one that did", () => {
    expect(solve({ points: 0, helps: 6 })).toBe(0);
    expect(solve({ points: 5, helps: 9 })).toBe(5);
  });

  it("halves a word that scored very little but was found, and pays a lost word only what it found", () => {
    const word = { kind: "gomoji" as const, size: 5, level: "medium" as const };
    expect(nativeReference("gomoji", 5)).toBe(800);
    expect(solveIp({ ...word, points: 800, helps: 0, solved: true })).toBe(100);
    expect(solveIp({ ...word, points: 1200, helps: 0, solved: true })).toBe(100);
    expect(solveIp({ ...word, points: 1, helps: 0, solved: true })).toBe(50);
    expect(solveIp({ ...word, points: 400, helps: 0, solved: false })).toBe(50);
  });

  it("never pays beyond the price", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      for (const size of PUZZLE_SPECS[kind].sizes) {
        for (const level of levelsFor(kind, size)) {
          const tiles = kind === "kumimoji" ? 50 : undefined;
          expect(solveIp({ kind, size, level, points: 100000, helps: 0, solved: true, tiles })).toBeLessThanOrEqual(price(kind, size, level, undefined, tiles));
        }
      }
    }
  });
});

describe("the ladder in SQL", () => {
  it("writes one row for each size and level of the kinds asked for, with the ladder's prices", () => {
    const query = bestSolvesSql(["meikyuu", "numberPlace"], Prisma.empty, Prisma.empty);
    const text = query.sql + JSON.stringify(query.values);
    expect(query.sql).toContain("('numberPlace', 9, 'medium', 110,");
    expect(query.sql).toContain(`('meikyuu', 1, 'easy', ${price("meikyuu", 1, "easy")},`);
    expect(query.sql).not.toContain("gomoji");
    expect(text).toContain("numberPlace");
  });

  it("carries a Kumimoji's tile rung the same as the code", () => {
    const query = bestSolvesSql(["kumimoji"], Prisma.empty, Prisma.empty);
    expect(query.sql).toContain("LN(GREATEST(LENGTH(s.\"givens\"), 1)::float8 / 40)");
    expect(query.sql).toContain("('kumimoji', 0, 'hard', 25,");
  });
});
