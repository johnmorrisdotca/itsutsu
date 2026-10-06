import { describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { progressFits } from "../puzzleProgress";
import { PUZZLE_SPECS, levelsFor } from "../puzzles.constants";
import { seededRandom } from "../random";
import { checkPictureLogic } from "./check";
import { answerOfCells, cluesOf, decodeCells, decodeClues, decodePicture, encodeCells, encodeClues, givensLength, runsOf } from "./code";
import { generatePictureLogic } from "./generate";
import { pictureChecked, pictureHint, pictureWrong } from "./help";
import { slideLine, wholeLine } from "./lines";
import { clueDepth, metLines, nextState, painted, runBetween } from "./paint";
import { drawPicture, drawScene } from "./picture";
import type { CellState, PictureClues } from "./pictureLogic.types";
import { levelOf, solutionOf, solveClues } from "./solve";
import { cpuNow } from "@/lib/testing/cpuTime";

/** A picture drawn row by row, "#" shaded. */
const picture = (...rows: string[]) => rows.join("").split("").map((char) => char === "#");
const clues = (...rows: string[]) => cluesOf(picture(...rows), rows.length);
const line = (text: string): CellState[] => [...text].map((char) => (char === "#" ? 1 : char === "x" ? 2 : 0));
const show = (cells: CellState[] | null) => (cells === null ? null : cells.map((cell) => (cell === 1 ? "#" : cell === 2 ? "x" : ".")).join(""));

describe("the Picture logic code", () => {
  it("reads runs, and writes the clues in two panels of right-aligned slots", () => {
    expect(runsOf([true, true, false, true, false, false, true])).toEqual([2, 1, 1]);
    const made = clues("#.#..", ".....", "#####", "##.##", "....#");
    expect(made.rows).toEqual([[1, 1], [], [5], [2, 2], [1]]);
    expect(made.cols).toEqual([[1, 2], [2], [1, 1], [2], [3]]);
    const givens = encodeClues(made);
    expect(givens).toHaveLength(givensLength(5));
    expect(givens.slice(0, 15)).toBe(".11" + "..." + "..5" + ".22" + "..1");
    expect(decodeClues(givens, 5)).toEqual(made);
    // Twenty is "k": one character a number, whatever the size.
    const full = cluesOf(new Array(400).fill(true), 20);
    expect(encodeClues(full).slice(0, 10)).toBe(".........k");
    expect(decodeClues(encodeClues(full), 20)).toEqual(full);
  });

  it("writes a run past thirty-five as a capital, so a line of fifty squares has a place for its 50", () => {
    const all = cluesOf(new Array(2500).fill(true), 50);
    const givens = encodeClues(all);
    expect(givens).toHaveLength(givensLength(50));
    expect(givens).toHaveLength(2500);
    // 35 is "z", 36 "A" and 50 "O"; the run is the whole line.
    expect(givens.slice(0, 25)).toBe(".".repeat(24) + "O");
    expect(decodeClues(givens, 50)).toEqual(all);
    expect(encodeClues(cluesOf(new Array(36 * 36).fill(true), 36)).slice(0, 18)).toBe(".".repeat(17) + "A");
    // A run longer than its line is no clue, whichever digit it is written in.
    expect(decodeClues(".".repeat(24) + "P" + ".".repeat(2475), 50)).toBeNull();
    // What an older puzzle wrote, to twenty or so, reads as it did.
    expect(decodeClues(".........k" + ".".repeat(390), 20)).not.toBeNull();
  });

  it("refuses clues that are not a puzzle's: a gap inside a slot, runs that cannot fit, the wrong length", () => {
    expect(decodeClues("1.1" + ".".repeat(27), 5)).toBeNull();
    expect(decodeClues("..6" + ".".repeat(27), 5)).toBeNull();
    expect(decodeClues(".33" + ".".repeat(27), 5)).toBeNull();
    expect(decodeClues(".".repeat(29), 5)).toBeNull();
    expect(decodeClues(".".repeat(30), 5)).not.toBeNull();
  });

  it("keeps the player's grid with its ✕s, and hands in the picture without them", () => {
    const cells = line("#x..#");
    expect(encodeCells(cells)).toBe("#x..#");
    expect(decodeCells("#x..#", 1)).toBeNull();
    expect(decodeCells("#x?.#", 5)).toBeNull();
    expect(answerOfCells(cells)).toBe("#...#");
    expect(decodePicture("#...#", 1)).toBeNull();
    expect(progressFits("pictureLogic", 2, "#x..")).toBe(true);
    expect(progressFits("pictureLogic", 2, "#x.")).toBe(false);
  });
});

describe("one line against its clue", () => {
  it("the ends: overlap shades, what no run reaches is empty, and a met line is finished", () => {
    // A 4 in 6: however it slides, the middle two are shaded.
    expect(show(slideLine([4], line("......")))).toBe("..##..");
    // A ✕ at the start pushes it right: now it reaches cells 1..5, and 3 are sure.
    expect(show(slideLine([3], line("x.....")))).toBe("x..#..");
    // A met line: every other cell empty.
    expect(show(slideLine([1, 1], line("#..#..")))).toBe("#xx#xx");
    // A line with no runs is all empty.
    expect(show(slideLine([], line("....")))).toBe("xxxx");
  });

  it("the whole line finds what the ends cannot: which run a shaded cell belongs to", () => {
    // A 2 in 6 with a shade at cell 1: slid either way it reaches everywhere, so the ends see nothing more;
    // read whole, the 2 must cover cell 1, so it lies at 0–1 or 1–2 and cells 3 to 5 are empty.
    const known = line(".#....");
    expect(show(slideLine([2], known))).toBe(".#....");
    expect(show(wholeLine([2], known))).toBe(".#.xxx");
  });

  it("says when a line cannot lie as it is", () => {
    expect(wholeLine([3], line("x.x.x"))).toBeNull();
    expect(slideLine([3], line("x.x.x"))).toBeNull();
    expect(wholeLine([1], line("#.#"))).toBeNull();
  });
});

describe("solving Picture logic", () => {
  it("finishes a picture by the ends alone, and calls it easy", () => {
    const easy = clues("#####", "#...#", "#.#.#", "#...#", "#####");
    expect(levelOf(easy)).toBe("easy");
    expect(solutionOf(easy)).toEqual(picture("#####", "#...#", "#.#.#", "#...#", "#####"));
  });

  it("says a picture with two answers is no puzzle", () => {
    // Two diagonal cells: the other diagonal meets the same clues.
    const twice = clues("#.", ".#");
    expect(solveClues(twice)).toBeNull();
  });

  it("proves every level it offers at every size, and the level is the one asked", () => {
    for (const size of PUZZLE_SPECS.pictureLogic.sizes) {
      for (const level of levelsFor("pictureLogic", size)) {
        for (const seed of [1, 2, 3]) {
          const made = generatePictureLogic(size, level, seed);
          const read = decodeClues(made.givens, size)!;
          const found = solveClues(read);
          expect(found?.level, `${size} ${level} seed ${seed}`).toBe(level);
          expect(encodeCells(found!.grid).replace(/x/g, ".")).toBe(made.solution);
          expect(checkSolution("pictureLogic", size, made.givens, made.solution, level)).toEqual({ ok: true });
        }
      }
    }
  });

  it("needs a trial for a hard puzzle: the whole line alone stalls on it", () => {
    const made = generatePictureLogic(10, "hard", 4);
    const read = decodeClues(made.givens, 10)!;
    expect(levelOf(read)).toBe("hard");
    const medium = generatePictureLogic(10, "medium", 4);
    expect(levelOf(decodeClues(medium.givens, 10)!)).toBe("medium");
  });
});

describe("the two biggest boards, 40×40 and 50×50", () => {
  const BIG = [40, 50] as const;

  it("come at easy and medium only, and are read by lines alone: never a guess", () => {
    for (const size of BIG) {
      expect(PUZZLE_SPECS.pictureLogic.sizes).toContain(size);
      expect(levelsFor("pictureLogic", size)).toEqual(["easy", "medium"]);
      for (const level of ["easy", "medium"] as const) {
        for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
          const made = generatePictureLogic(size, level, seed);
          const read = decodeClues(made.givens, size)!;
          // Solved with trials forbidden: the lines alone finish it, so it has the one answer it was drawn from.
          const found = solveClues(read, "medium");
          expect(found?.level, `${size} ${level} seed ${seed}`).toBe(level);
          expect(encodeCells(found!.grid).replace(/x/g, ".")).toBe(made.solution);
        }
      }
    }
  });

  it("made for a hard they do not offer, are the medium, and made as quickly as any", () => {
    for (const size of BIG) {
      const started = cpuNow();
      const made = generatePictureLogic(size, "hard", 5);
      expect(cpuNow() - started).toBeLessThan(2000);
      expect(solveClues(decodeClues(made.givens, size)!, "medium")?.level).toBe("medium");
    }
  });

  it("make a puzzle with clues worth reading, a scene of four pictures and not one plain blob", () => {
    for (const size of BIG) {
      const read = decodeClues(generatePictureLogic(size, "medium", 3).givens, size)!;
      expect(clueDepth(read), `${size}`).toBeGreaterThanOrEqual(4);
      const shaded = decodePicture(generatePictureLogic(size, "medium", 3).solution, size)!.filter(Boolean).length;
      expect(shaded).toBeGreaterThan(size * 4);
      expect(shaded).toBeLessThan(size * size * 0.7);
    }
    expect(drawScene(40, () => "figure", seededRandom(5))).toEqual(drawScene(40, () => "figure", seededRandom(5)));
  });

  it("are made in a browser's time: every seed, both levels, well under a second on this machine", () => {
    for (const size of BIG) {
      for (const level of ["easy", "medium"] as const) {
        const started = cpuNow();
        for (let seed = 100; seed < 120; seed += 1) generatePictureLogic(size, level, seed);
        const each = (cpuNow() - started) / 20;
        expect(each, `${size} ${level}`).toBeLessThan(500);
      }
    }
  });

  it("are checked by the server in one pass over the 2,500 squares, and a wrong square is refused", () => {
    const made = generatePictureLogic(50, "medium", 12);
    const started = cpuNow();
    for (let again = 0; again < 20; again += 1) expect(checkSolution("pictureLogic", 50, made.givens, made.solution, "medium")).toEqual({ ok: true });
    expect((cpuNow() - started) / 20).toBeLessThan(25);
    const flipped = made.solution.slice(0, 1250) + (made.solution[1250] === "#" ? "." : "#") + made.solution.slice(1251);
    expect(checkSolution("pictureLogic", 50, made.givens, flipped, "medium").ok).toBe(false);
    expect(progressFits("pictureLogic", 50, "x".repeat(2500))).toBe(true);
    expect(PUZZLE_SPECS.pictureLogic.mostCells).toBeGreaterThanOrEqual(made.givens.length);
  });
});

describe("the check the server runs", () => {
  const made = generatePictureLogic(5, "easy", 11);
  it("passes the answer and refuses anything else", () => {
    expect(checkPictureLogic(5, made.givens, made.solution)).toEqual({ ok: true });
    const flipped = (made.solution[0] === "#" ? "." : "#") + made.solution.slice(1);
    expect(checkPictureLogic(5, made.givens, flipped).ok).toBe(false);
    expect(checkPictureLogic(5, made.givens, made.solution.replace("#", "x")).ok).toBe(false);
    expect(checkPictureLogic(5, made.givens, made.solution + ".").ok).toBe(false);
    expect(checkPictureLogic(5, "nonsense", made.solution).ok).toBe(false);
  });
});

describe("painting the grid", () => {
  it("cycles a tap through shade, ✕ and clear, or ✕ first with the ✕ pen", () => {
    expect([nextState(0, "shade"), nextState(1, "shade"), nextState(2, "shade")]).toEqual([1, 2, 0]);
    expect([nextState(0, "mark"), nextState(2, "mark"), nextState(1, "mark")]).toEqual([2, 1, 0]);
  });

  it("drags along the row or column it went further along, and paints only squares like the first", () => {
    expect(runBetween(5, 6, 9)).toEqual([6, 7, 8, 9]);
    expect(runBetween(5, 6, 22)).toEqual([6, 11, 16, 21]);
    expect(runBetween(5, 9, 5)).toEqual([9, 8, 7, 6, 5]);
    const before = line("..x#.");
    expect(show(painted(before, [0, 1, 2, 3, 4], "shade"))).toBe("##x##");
    expect(show(painted(before, [0, 1, 2, 3, 4], "mark"))).toBe("xxxxx".replace(/./g, (char, at) => (at === 3 ? "#" : "x")));
  });

  it("knows a met clue, and how deep the clue panels are", () => {
    const made = clues("#.#", "...", "###");
    expect(clueDepth(made)).toBe(2);
    const met = metLines(made, line("#.#" + "..." + "##."));
    expect(met.rows).toEqual([true, true, false]);
    expect(met.cols).toEqual([true, true, false]);
  });
});

describe("Check, Show and Hint", () => {
  it("counts wrong squares and those still to shade, marks the wrong ones, and hints a right one", () => {
    const answer = picture("#.", "##");
    const cells = line("x#" + "#.");
    expect(pictureWrong(cells, answer)).toEqual([0, 1]);
    expect(pictureChecked(cells, answer)).toEqual({ wrong: 2, toShade: 2 });
    const hint = pictureHint(2, cells, answer)!;
    expect([0, 1, 3]).toContain(hint);
    expect(pictureHint(2, line("#x##"), answer)).toBeNull();
  });
});

describe("the pictures", () => {
  it("draws each kind of picture the same from the same seed, and never all blank at every seed", () => {
    for (const style of ["figure", "hills", "cloud"] as const) {
      expect(drawPicture(10, style, seededRandom(3))).toEqual(drawPicture(10, style, seededRandom(3)));
      const shaded = drawPicture(15, style, seededRandom(8)).filter(Boolean).length;
      expect(shaded, style).toBeGreaterThan(15);
      expect(shaded, style).toBeLessThan(15 * 15);
    }
  });

  it("keeps the same answer for the same seed, as a race and an address need", () => {
    const one: PictureClues = decodeClues(generatePictureLogic(15, "medium", 99).givens, 15)!;
    const two: PictureClues = decodeClues(generatePictureLogic(15, "medium", 99).givens, 15)!;
    expect(one).toEqual(two);
  });
});
