import { describe, expect, it } from "vitest";

import type { PuzzleLevel } from "../puzzles.types";
import { pencilEngine } from "./engines";
import { generatePencil } from "./generate";
import { entered, FRESH_UI, moved, pressed, type PencilPress, type PencilUi } from "./input";
import { isPencilKind, PENCIL_KIND_LIST } from "./pencil.constants";
import { shikakuCodeOf, shikakuPlace, shikakuRectsOf, shikakuRemove } from "./shikaku";
import { slitherlinkEdgesOf } from "./slitherlink";
import type { PencilKind } from "./pencil.types";

/** The sizes and levels each kind is tested at: the ones the site offers, a size and a level at a time. */
const CASES: Record<PencilKind, { sizes: readonly number[]; levels: readonly PuzzleLevel[] }> = {
  shikaku: { sizes: [5, 7, 9, 12], levels: ["easy", "medium", "hard"] },
  akari: { sizes: [5, 7, 9, 12], levels: ["medium"] },
  slitherlink: { sizes: [4, 5, 7, 10], levels: ["medium"] },
  hitori: { sizes: [5, 7], levels: ["medium"] },
  fillomino: { sizes: [4, 5, 6], levels: ["easy"] },
  kakuro: { sizes: [10], levels: ["medium"] },
};

describe.each(PENCIL_KIND_LIST)("%s is made, read, checked and solved", (kind) => {
  const engine = pencilEngine(kind);

  it("is a pencil kind", () => {
    expect(isPencilKind(kind)).toBe(true);
    expect(isPencilKind("numberPlace")).toBe(false);
  });

  for (const size of CASES[kind].sizes) {
    for (const level of CASES[kind].levels) {
      it(`makes a puzzle at ${size}×${size} ${level} that reads, checks and has one answer`, () => {
        for (let seed = 1; seed <= 6; seed += 1) {
          const made = engine.make(size, level, seed);
          // The same seed is the same puzzle, and another seed is another.
          expect(engine.make(size, level, seed)).toEqual(made);
          expect(engine.reads(size, made.givens)).toBe(true);
          expect(made.solution).toHaveLength(engine.codeLength(size));
          expect(engine.fits(size, made.solution)).toBe(true);
          expect(engine.check(size, made.givens, made.solution)).toEqual({ ok: true });
          // The search finds the answer that was made, and it is the only one.
          expect(engine.solve(size, made.givens)).toBe(made.solution);
          // Nothing written is not an answer, and a blank code is the right length.
          const blank = engine.blank(size, made.givens);
          expect(blank).toHaveLength(engine.codeLength(size));
          expect(engine.fits(size, blank)).toBe(true);
          expect(engine.check(size, made.givens, blank).ok).toBe(false);
          expect(engine.work(size, made.givens)).toBeGreaterThan(0);
        }
      });
    }
  }

  it("refuses givens that are not a board, and an answer that is not a grid", () => {
    const size = CASES[kind].sizes[0]!;
    const made = engine.make(size, CASES[kind].levels[0]!, 3);
    expect(engine.reads(size, "")).toBe(false);
    expect(engine.reads(size, made.givens.slice(1))).toBe(false);
    expect(engine.check(size, "", made.solution).ok).toBe(false);
    expect(engine.check(size, made.givens, "").ok).toBe(false);
    expect(engine.check(size, made.givens, `${made.solution}${made.solution}`).ok).toBe(false);
    expect(engine.solve(size, "")).toBeNull();
    expect(engine.fits(size, "")).toBe(false);
  });

  it("walks to the answer one right mark at a time, and calls nothing wrong on the way", () => {
    const size = CASES[kind].sizes[0]!;
    const made = engine.make(size, CASES[kind].levels[0]!, 11);
    let code = engine.blank(size, made.givens);
    for (let step = 0; step < engine.codeLength(size) * 2; step += 1) {
      expect(engine.wrong(size, code, made.solution)).toEqual([]);
      const next = engine.fix(size, code, made.solution);
      if (next === null) break;
      expect(next.code).not.toBe(code);
      expect(next.at).toBeGreaterThanOrEqual(0);
      code = next.code;
    }
    expect(code).toBe(made.solution);
    expect(engine.missing(size, code, made.solution)).toBe(0);
    expect(engine.fix(size, code, made.solution)).toBeNull();
  });
});

describe("what is wrong and what is missing", () => {
  it("counts a mark the answer does not have as wrong, and takes it off with the next hint", () => {
    const made = pencilEngine("akari").make(7, "medium", 4);
    const at = [...made.solution].findIndex((character, place) => character === "." && made.givens[place] === ".");
    const marked = `${made.solution.slice(0, at)}o${made.solution.slice(at + 1)}`;
    expect(pencilEngine("akari").wrong(7, marked, made.solution)).toEqual([at]);
    expect(pencilEngine("akari").fix(7, marked, made.solution)).toEqual({ code: made.solution, at });
  });

  it("counts a Shikaku rectangle the answer does not have as wrong, every cell of it", () => {
    const engine = pencilEngine("shikaku");
    const made = engine.make(5, "easy", 2);
    const right = shikakuRectsOf(5, made.solution)!;
    expect(right.length).toBeGreaterThan(2);
    const [one, two] = right;
    // Both rectangles taken off, and one laid again by hand to be a different one of the same cells' union.
    const without = shikakuCodeOf(5, right.filter((rect) => rect !== one));
    expect(engine.missing(5, without, made.solution)).toBe(1);
    expect(engine.wrong(5, without, made.solution)).toEqual([]);
    // A rectangle that is not the answer's, laid where one of the answer's was: wrong, once, at its top-left cell.
    const stray = shikakuPlace(5, without, { x: one!.x, y: one!.y, width: 1, height: 1 });
    expect(engine.wrong(5, stray, made.solution)).toEqual([one!.y * 5 + one!.x]);
    expect(engine.missing(5, stray, made.solution)).toBe(1);
    expect(two).toBeDefined();
  });
});

describe("Shikaku's code", () => {
  it("writes touching rectangles in different letters, so a letter is always one rectangle", () => {
    const code = shikakuCodeOf(4, [
      { x: 0, y: 0, width: 2, height: 4 },
      { x: 2, y: 0, width: 2, height: 2 },
      { x: 2, y: 2, width: 2, height: 2 },
    ]);
    expect(code).toHaveLength(16);
    expect(shikakuRectsOf(4, code)).toHaveLength(3);
    expect(new Set(code).size).toBe(3);
  });

  it("reads back what it wrote, and refuses a letter that is not a rectangle", () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const made = pencilEngine("shikaku").make(9, "easy", seed);
      const rects = shikakuRectsOf(9, made.solution)!;
      expect(shikakuCodeOf(9, rects)).toBe(made.solution);
    }
    // An L of one letter is no rectangle.
    expect(shikakuRectsOf(2, "aa" + "a.")).toBeNull();
    expect(shikakuRectsOf(2, "A...")).toBeNull();
  });

  it("places a rectangle over the ones it touches, and takes one off by a cell", () => {
    const start = shikakuCodeOf(4, [{ x: 0, y: 0, width: 2, height: 1 }, { x: 2, y: 0, width: 2, height: 1 }]);
    const placed = shikakuPlace(4, start, { x: 1, y: 0, width: 2, height: 2 });
    expect(shikakuRectsOf(4, placed)).toEqual([{ x: 1, y: 0, width: 2, height: 2 }]);
    expect(shikakuRemove(4, placed, 1)).toBe(".".repeat(16));
    expect(shikakuRemove(4, placed, 0)).toBe(placed);
  });
});

describe("Slitherlink's code", () => {
  it("has a mark place for every edge of the board", () => {
    for (const size of [4, 5, 7, 10]) {
      const made = pencilEngine("slitherlink").make(size, "medium", 1);
      expect(made.solution).toHaveLength(2 * size * (size + 1));
      expect(slitherlinkEdgesOf(size, made.solution)!.length).toBeGreaterThan(4);
    }
  });
});

describe("a seed with no puzzle names the next that has one", () => {
  it("makes a Kakuro from seed 97, which Kazu cannot prove a board for, as the seed after it", () => {
    expect(() => pencilEngine("kakuro").make(10, "medium", 97)).toThrow();
    const made = generatePencil("kakuro", 10, "medium", 97);
    expect(made.seed).toBeGreaterThan(97);
    expect(made.seed).toBeLessThan(97 + 40);
    expect(made).toEqual(generatePencil("kakuro", 10, "medium", made.seed));
    expect(pencilEngine("kakuro").check(10, made.givens, made.solution)).toEqual({ ok: true });
  });

  it("keeps the seed it was asked for wherever that seed has a puzzle", () => {
    for (const kind of PENCIL_KIND_LIST) expect(generatePencil(kind, CASES[kind].sizes[0]!, CASES[kind].levels[0]!, 5).seed).toBe(5);
  });

  it("refuses a size it does not make rather than looking for another seed", () => {
    expect(() => generatePencil("kakuro", 8, "medium", 5)).toThrow(/no Kakuro at 8/);
    expect(() => generatePencil("hitori", 6, "medium", 5)).toThrow(/no Hitori at 6/);
  });
});

describe("what a press does", () => {
  it("lays a Shikaku rectangle from two corners, a drag, or one cell twice, and Remove takes it off", () => {
    const place = (ui: PencilUi, code: string, press: PencilPress) => pressed("shikaku", 4, ".".repeat(16), code, ui, press);
    const blank = ".".repeat(16);
    const first = place(FRESH_UI, blank, { cell: 0 });
    expect(first.ui.anchor).toBe(0);
    expect(first.code).toBe(blank);
    const second = place(first.ui, first.code, { cell: 5 });
    expect(shikakuRectsOf(4, second.code)).toEqual([{ x: 0, y: 0, width: 2, height: 2 }]);
    expect(second.ui.anchor).toBeNull();
    // From the far corner as well as the near one.
    expect(place(place(FRESH_UI, blank, { cell: 15 }).ui, blank, { cell: 10 }).code).toBe(shikakuCodeOf(4, [{ x: 2, y: 2, width: 2, height: 2 }]));
    // A drag is the same rectangle.
    expect(place(FRESH_UI, blank, { from: 0, to: 5 }).code).toBe(second.code);
    // The same cell twice is a rectangle of one.
    const one = place(place(FRESH_UI, blank, { cell: 3 }).ui, blank, { cell: 3 });
    expect(shikakuRectsOf(4, one.code)).toEqual([{ x: 3, y: 0, width: 1, height: 1 }]);
    const erase = { ...FRESH_UI, erase: true };
    expect(place(erase, second.code, { cell: 1 }).code).toBe(blank);
    expect(place(erase, second.code, { cell: 3 }).code).toBe(second.code);
  });

  it("toggles a bulb on a white square only, a shade on any cell and an edge on any edge", () => {
    const akariGivens = "..#1.";
    const akari = pressed("akari", 1, akariGivens, ".....", FRESH_UI, { cell: 0 });
    expect(akari.code).toBe("o....");
    expect(pressed("akari", 1, akariGivens, akari.code, FRESH_UI, { cell: 0 }).code).toBe(".....");
    expect(pressed("akari", 1, akariGivens, ".....", FRESH_UI, { cell: 2 }).code).toBe(".....");
    expect(pressed("akari", 1, akariGivens, ".....", FRESH_UI, { cell: 3 }).code).toBe(".....");
    expect(pressed("hitori", 2, "1122", "....", FRESH_UI, { cell: 1 }).code).toBe(".#..");
    expect(pressed("slitherlink", 2, "....", ".".repeat(12), FRESH_UI, { edge: 7 }).code).toBe(".......#....");
    // A press of the wrong sort does nothing.
    expect(pressed("slitherlink", 2, "....", ".".repeat(12), FRESH_UI, { cell: 7 }).code).toBe(".".repeat(12));
  });

  it("chooses a cell and puts a number in it, never over a printed one or a black cell", () => {
    const chosen = pressed("fillomino", 2, "1...", "1...", FRESH_UI, { cell: 1 });
    expect(chosen.ui.selected).toBe(1);
    expect(entered("fillomino", "1...", "1...", chosen.ui, 2).code).toBe("12..");
    expect(entered("fillomino", "1...", "12..", chosen.ui, 0).code).toBe("1...");
    expect(pressed("fillomino", 2, "1...", "1...", FRESH_UI, { cell: 0 }).ui.selected).toBeNull();
    expect(entered("fillomino", "1...", "1...", { ...FRESH_UI, selected: 0 }, 3).code).toBe("1...");
    // A Kakuro's givens are longer than its cells; its black cells are read off the code.
    const longGivens = "#0405#0506...";
    const kakuro = pressed("kakuro", 2, longGivens, "#...", FRESH_UI, { cell: 0 });
    expect(kakuro.ui.selected).toBeNull();
    expect(pressed("kakuro", 2, longGivens, "#...", FRESH_UI, { cell: 1 }).ui.selected).toBe(1);
    expect(entered("kakuro", longGivens, "#...", { ...FRESH_UI, selected: 2 }, 9).code).toBe("#.9.");
    expect(entered("kakuro", longGivens, "#...", { ...FRESH_UI, selected: 0 }, 9).code).toBe("#...");
    expect(entered("kakuro", longGivens, "#...", { ...FRESH_UI, selected: 2 }, 10).code).toBe("#...");
  });

  it("moves with the arrow keys and stays on the board", () => {
    expect(moved("akari", 5, 0, "ArrowLeft")).toBe(0);
    expect(moved("akari", 5, 0, "ArrowRight")).toBe(1);
    expect(moved("akari", 5, 4, "ArrowRight")).toBe(4);
    expect(moved("akari", 5, 24, "ArrowDown")).toBe(24);
    expect(moved("akari", 5, 12, "ArrowUp")).toBe(7);
    expect(moved("akari", 5, null, "ArrowRight")).toBe(1);
    expect(moved("slitherlink", 4, 0, "ArrowLeft")).toBe(0);
    expect(moved("slitherlink", 4, 39, "ArrowRight")).toBe(39);
    expect(moved("slitherlink", 4, 3, "ArrowDown")).toBe(7);
    expect(moved("akari", 5, 3, "a")).toBe(3);
  });
});
