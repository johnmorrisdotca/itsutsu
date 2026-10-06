import { countKazuSolutions, generateKazu, KAZU_KIND_OF_SITE_KIND, kazuGuessDepth, regionsAreSound, type KazuLevel } from "@johnmorrisdotca/kazu";
import { describe, expect, it } from "vitest";

import { generatePuzzle } from "./generate";
import { generateDiagonal, generateJigsaw, generateNumberPlace, generateSumCages, isNumberKind, KAZU_KIND_OF, type NumberKind } from "./kazu";
import { shakeRegions } from "./jigsaw/shake";
import { checkSolution } from "./puzzleCheck";
import { decodeCells, encodeCells, puzzleHash, symbolOf, valueOfSymbol } from "./puzzleCode";
import { seededRandom } from "./random";
import { PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "./puzzles.constants";
import { solvedAnswerOf } from "./solvedAnswer";

const NUMBER_KINDS: readonly NumberKind[] = ["numberPlace", "jigsaw", "diagonal", "sumCages", "moreOrLess", "towers"];

/**
 * THE NUMBERS FAMILY IS KAZU'S, and a puzzle is its kind, size, level and seed:
 * a kept solve, a race and a daily puzzle are made again from those four. These
 * pin what the site made before the family moved into the package (checked then
 * against the old code at every size and level for seeds 1 to 50, today's and
 * the week's daily seeds and the largest a seed can be), so a version of Kazu
 * that makes one differently fails here before it reaches a reader.
 */
describe("the Numbers puzzles are made as they always were", () => {
  it("makes the same puzzle from the same seed, and a different one from another", () => {
    const one = generateNumberPlace(9, "medium", 12345);
    expect(generateNumberPlace(9, "medium", 12345)).toEqual(one);
    expect(generateNumberPlace(9, "medium", 12346).solution).not.toBe(one.solution);
  });

  it("leaves every smaller Number Place grid exactly as its seed always made it", () => {
    expect(generateNumberPlace(4, "medium", 20260924)).toMatchObject({ givens: "....234..2..312.", solution: "1432234142133124" });
    expect(generateNumberPlace(6, "medium", 20260924)).toMatchObject({ givens: ".3...546...16......54.12..6.5..2.1.6", solution: "231465465321612534354612146253523146" });
    expect(generateNumberPlace(9, "medium", 20260924)).toMatchObject({
      givens: "....7..1...59127...1...45...7...1.8...124...7.3.7981.2.9.48..21.......3.68.......",
      solution: "948675213365912748712834569279351486851246397436798152593487621127569834684123975",
    });
  });

  /** [kind, size, level, hash of givens, hash of solution] for the daily seed of 2026-10-02, as the site made them. */
  const DAILY_20261002: [NumberKind, number, KazuLevel, string, string][] = [
    ["numberPlace", 9, "easy", "6648d642", "a8753908"],
    ["numberPlace", 9, "medium", "8eb41612", "a8753908"],
    ["numberPlace", 9, "hard", "fb8aa063", "a8753908"],
    ["jigsaw", 7, "easy", "628755ec", "0c7c1c73"],
    ["jigsaw", 7, "medium", "ff510417", "0c7c1c73"],
    ["jigsaw", 7, "hard", "400e274d", "0c7c1c73"],
    ["diagonal", 9, "easy", "1b91075a", "491112d0"],
    ["diagonal", 9, "medium", "acf94d4f", "491112d0"],
    ["diagonal", 9, "hard", "9549ad39", "491112d0"],
    ["sumCages", 9, "easy", "08593248", "4487e81c"],
    ["sumCages", 9, "medium", "d827cf77", "4487e81c"],
    ["sumCages", 9, "hard", "7dc2d1dc", "4487e81c"],
    ["moreOrLess", 5, "easy", "bedbf4a2", "522e2038"],
    ["moreOrLess", 5, "medium", "bedbf4a2", "522e2038"],
    ["moreOrLess", 5, "hard", "bedbf4a2", "522e2038"],
    ["towers", 5, "easy", "cfa5bf51", "522e2038"],
    ["towers", 5, "medium", "49f3d076", "522e2038"],
    ["towers", 5, "hard", "49f3d076", "522e2038"],
  ];

  it.each(DAILY_20261002)("%s %i %s: the puzzle of 2026-10-02 is the one the site made", (kind, size, level, givens, solution) => {
    const made = generatePuzzle(kind, size, level, 20261002);
    expect(made).toMatchObject({ kind, size, level, seed: 20261002 });
    expect([puzzleHash(made.givens), puzzleHash(made.solution)]).toEqual([givens, solution]);
  });

  it("spells each kind the site's way and keeps the seed it was asked for", () => {
    for (const kind of NUMBER_KINDS) {
      expect(isNumberKind(kind)).toBe(true);
      const size = PUZZLE_SPECS[kind].defaultSize;
      const made = generatePuzzle(kind, size, "easy", 77);
      expect(made).toMatchObject({ kind, size, level: "easy", seed: 77 });
      // The site's door and the package's own make the same puzzle.
      const theirs = generateKazu(KAZU_KIND_OF_SITE_KIND[kind]!, size, "easy", 77);
      expect([made.givens, made.solution]).toEqual([theirs.givens, theirs.solution]);
      expect(KAZU_KIND_OF[kind]).toBe(theirs.kind);
    }
    expect(isNumberKind("gomoji")).toBe(false);
  });

  it("offers the sizes the package makes, no more and no fewer", () => {
    for (const kind of NUMBER_KINDS) {
      for (const size of PUZZLE_SPECS[kind].sizes) expect(() => generateKazu(KAZU_KIND_OF[kind], size, "easy", 1)).not.toThrow();
    }
  });
});

describe("every Numbers puzzle is a puzzle: one answer, the level's reasoning, an answer the server's check accepts", () => {
  for (const kind of NUMBER_KINDS) {
    for (const size of PUZZLE_SPECS[kind].sizes) {
      it(`${kind} ${size}×${size}: all three levels`, () => {
        for (const level of PUZZLE_LEVEL_LIST) {
          const puzzle = generatePuzzle(kind, size, level, 1);
          expect(countKazuSolutions(KAZU_KIND_OF[kind], size, puzzle.givens, 2), `${level} has one answer`).toBe(1);
          expect(checkSolution(kind, size, puzzle.givens, puzzle.solution, level)).toEqual({ ok: true });
          expect(solvedAnswerOf(kind, size, level, puzzle.givens)).toBe(puzzle.solution.slice(0, size * size));
        }
        // An easy puzzle yields to singles alone (Sum Cages is levelled by its cages, not by guesses).
        if (kind !== "sumCages") expect(kazuGuessDepth(KAZU_KIND_OF[kind], size, generatePuzzle(kind, size, "easy", 7).givens)).toBe(0);
      }, 60_000);
    }
  }

  it("makes a hard 9×9 and a hard 16×16 in the time a browser can spare", () => {
    const started = performance.now();
    for (const seed of [11, 12, 13]) generateNumberPlace(9, "hard", seed);
    expect((performance.now() - started) / 3).toBeLessThan(1500);
    const big = performance.now();
    for (const seed of [21, 22, 23]) {
      const puzzle = generateNumberPlace(16, "hard", seed);
      expect(checkSolution("numberPlace", 16, puzzle.givens, puzzle.solution)).toEqual({ ok: true });
    }
    expect((performance.now() - big) / 3).toBeLessThan(1500);
  });
});

describe("the 25×25 Colossus", () => {
  it("is made at every level in a browser's time, and the server's check of its 625 cells takes a few milliseconds", () => {
    for (const level of PUZZLE_LEVEL_LIST) {
      const started = performance.now();
      const puzzle = generateNumberPlace(25, level, 3);
      // Measured at 13 ms easy, 81 ms medium and 300 ms hard on average; the bound is for a busy runner (a phone is a few times slower).
      expect(performance.now() - started, `${level} generation`).toBeLessThan(level === "hard" ? 6000 : 2000);
      expect(puzzle.givens).toHaveLength(625);
      const check = performance.now();
      for (let again = 0; again < 20; again += 1) expect(checkSolution("numberPlace", 25, puzzle.givens, puzzle.solution, level)).toEqual({ ok: true });
      expect((performance.now() - check) / 20, `${level} check`).toBeLessThan(50);
      expect(puzzle.solution).toMatch(/[H-P]/);
    }
  });

  it("refuses a grid with a repeated number in a row, and one with a letter past P", () => {
    const puzzle = generateNumberPlace(25, "easy", 4);
    const cells = decodeCells(puzzle.solution, 25)!;
    const twice = [...cells];
    twice[1] = twice[0]!;
    expect(checkSolution("numberPlace", 25, ".".repeat(625), encodeCells(twice)).ok).toBe(false);
    expect(checkSolution("numberPlace", 25, ".".repeat(625), `Q${puzzle.solution.slice(1)}`).ok).toBe(false);
  });
});

describe("the check refuses what is wrong, and says why in the site's words", () => {
  it("refuses a grid that is right as Number Place and wrong in a cage", () => {
    const puzzle = generateSumCages(6, "easy", 5);
    expect(checkSolution("sumCages", 6, puzzle.givens, puzzle.solution)).toEqual({ ok: true });
    // Two whole bands swapped: every row, column and box still right; the cages are not.
    const grid = decodeCells(puzzle.solution, 6)!;
    const swapped = [...grid.slice(12, 24), ...grid.slice(0, 12), ...grid.slice(24)];
    const blank = ".".repeat(36) + puzzle.givens.slice(36);
    expect(checkSolution("sumCages", 6, blank, swapped.join("")).ok).toBe(false);
  });

  it("refuses regions that do not divide the grid before it reads the grid", () => {
    const puzzle = generateJigsaw(5, "medium", 4);
    const latin = Array.from({ length: 25 }, (_, index) => ((Math.floor(index / 5) + (index % 5)) % 5) + 1);
    const unsound = ".".repeat(25) + Array.from({ length: 25 }, (_, i) => "abcde"[i === 24 ? 0 : i % 5]).join("");
    expect(puzzle.givens).toHaveLength(50);
    expect(checkSolution("jigsaw", 5, unsound, encodeCells(latin))).toEqual({ ok: false, reason: "the regions do not divide the grid" });
  });

  it("refuses a size it does not make, in the site's name for the kind", () => {
    expect(checkSolution("numberPlace", 8, "", "")).toEqual({ ok: false, reason: "no numberPlace at 8" });
  });

  it("refuses a Diagonal whose diagonals repeat", () => {
    const puzzle = generateDiagonal(9, "medium", 5);
    const solution = decodeCells(puzzle.solution, 9)!;
    const swapped = [...solution.slice(9, 18), ...solution.slice(0, 9), ...solution.slice(18)];
    const diagonalWhole = new Set(Array.from({ length: 9 }, (_, i) => swapped[i * 9 + i])).size === 9 && new Set(Array.from({ length: 9 }, (_, i) => swapped[i * 9 + 8 - i])).size === 9;
    expect(checkSolution("diagonal", 9, ".".repeat(81), encodeCells(swapped)).ok).toBe(diagonalWhole);
  });
});

describe("the set-up picture's regions", () => {
  it("shakes regions that are sound and never a plain row or column, over many seeds", () => {
    for (const size of PUZZLE_SPECS.jigsaw.sizes) {
      for (let seed = 1; seed <= 40; seed += 1) {
        const region = shakeRegions(size, seededRandom(seed));
        expect(regionsAreSound(size, region)).toBe(true);
        for (let group = 0; group < size; group += 1) {
          const cells = region.flatMap((value, index) => (value === group ? [index] : []));
          expect(new Set(cells.map((index) => Math.floor(index / size))).size).toBeGreaterThan(1);
          expect(new Set(cells.map((index) => index % size)).size).toBeGreaterThan(1);
        }
      }
    }
  });
});

describe("the cells past nine are letters", () => {
  it("writes 10 to 16 as A to G and reads them back", () => {
    expect([9, 10, 16].map(symbolOf)).toEqual(["9", "A", "G"]);
    expect(encodeCells([0, 1, 10, 16])).toBe(".1AG");
    expect(decodeCells(".1AG", 2)).toBeNull();
    const row = Array.from({ length: 16 }, (_, i) => i + 1);
    const grid = Array.from({ length: 16 }, () => row).flat();
    expect(decodeCells(encodeCells(grid), 16)).toEqual(grid);
  });

  it("reads a typed letter in either case, but a code only in capitals", () => {
    expect(valueOfSymbol("a")).toBe(10);
    expect(valueOfSymbol("G")).toBe(16);
    expect(valueOfSymbol("H")).toBe(17);
    expect(valueOfSymbol("p")).toBe(25);
    expect(valueOfSymbol("Q")).toBe(0);
    expect(valueOfSymbol("0")).toBe(0);
    expect(decodeCells("a".padEnd(256, "."), 16)).toBeNull();
    expect(decodeCells("A".padEnd(256, "."), 16)).not.toBeNull();
  });

  it("refuses a letter past the grid's side", () => {
    expect(decodeCells("A".padEnd(81, "."), 9)).toBeNull();
  });
});
