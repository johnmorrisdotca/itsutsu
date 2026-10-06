import { describe, expect, it } from "vitest";

import { JIRAI_SEED_BLOCK } from "../random";
import { COVERED, FLAG, jiraiBoardOf, jiraiCheck, jiraiFix, jiraiFits, jiraiMissing, jiraiPress, jiraiRecipeOf, jiraiSettings, jiraiWon, jiraiWork, jiraiWrong, jiraiFirst } from "./board";
import { generateJirai } from "./generate";
import { freshJiraiSeed, isJiraiVariant, JIRAI_GRIDS, JIRAI_OTHER_VARIANTS, JIRAI_SHAPES, jiraiVariantOfSeed, type JiraiVariant } from "./variants";

/** Every way to play, each as a seed that says it. */
const VARIANTS: { variant: JiraiVariant; seed: number }[] = [
  { variant: { grid: "square", shape: "rectangle" }, seed: 7 },
  ...JIRAI_OTHER_VARIANTS.map((variant) => ({ variant, seed: freshJiraiSeed(variant, () => 0.3) })),
];

describe("the ways to play Jirai are said by the seed", () => {
  it("has thirteen ways, each of the others in a block of its own and the classic board every ordinary seed", () => {
    expect(JIRAI_OTHER_VARIANTS).toHaveLength(12);
    expect(jiraiVariantOfSeed(1)).toEqual({ grid: "square", shape: "rectangle" });
    expect(jiraiVariantOfSeed(JIRAI_SEED_BLOCK.from - 1)).toEqual({ grid: "square", shape: "rectangle" });
    expect(jiraiVariantOfSeed(JIRAI_SEED_BLOCK.from + JIRAI_SEED_BLOCK.size)).toEqual({ grid: "square", shape: "rectangle" });
    for (const { variant, seed } of VARIANTS.slice(1)) expect(jiraiVariantOfSeed(seed)).toEqual(variant);
    expect(new Set(VARIANTS.map(({ seed }) => JSON.stringify(jiraiVariantOfSeed(seed)))).size).toBe(13);
  });

  it("knows which ways exist: a shape needs a flat board, so edges that join take none", () => {
    for (const grid of JIRAI_GRIDS) for (const shape of JIRAI_SHAPES) expect(isJiraiVariant(grid, shape), `${grid} ${shape}`).toBe(!(grid === "wrap" && shape !== "rectangle"));
    expect(isJiraiVariant("cube", "rectangle")).toBe(false);
  });

  it("draws a fresh seed inside the block of the way asked for, and an ordinary one for the classic", () => {
    for (const variant of JIRAI_OTHER_VARIANTS) for (const random of [() => 0, () => 0.999999]) expect(jiraiVariantOfSeed(freshJiraiSeed(variant, random))).toEqual(variant);
    expect(jiraiVariantOfSeed(freshJiraiSeed({ grid: "square", shape: "rectangle" }))).toEqual({ grid: "square", shape: "rectangle" });
  });
});

describe.each(VARIANTS)("Jirai, $variant.grid $variant.shape", ({ variant, seed }) => {
  const sizes = variant.shape === "rectangle" ? [7, 9, 12, 16, 32] : [9, 12, 16, 32];
  it.each(sizes)("makes a board at %i that reads, checks, and is finished by what the clues prove", (size) => {
    for (const level of ["easy", "hard", "extra-hard"] as const) {
      const made = generateJirai(size, level, seed);
      expect(generateJirai(size, level, seed)).toEqual(made);
      const recipe = jiraiRecipeOf(size, made.givens)!;
      expect(recipe).not.toBeNull();
      expect(recipe.settings.mines).toBeGreaterThan(0);
      expect(made.solution).toHaveLength(size * size);
      expect(jiraiCheck(size, made.givens, made.solution)).toEqual({ ok: true });
      expect(jiraiFits(size, made.solution)).toBe(true);
      expect(jiraiWork(made.givens)).toBeGreaterThan(0);
      // The opening is uncovered, with something to go on.
      expect(recipe.cells[recipe.first]).toMatch(/[0-8]/);
      // Hint after hint finishes it, with no mistake and no flag wrong on the way (the biggest boards only made and checked: the search is the cost).
      if (size > 12) continue;
      const board = jiraiBoardOf(recipe, made.solution)!;
      let code = recipe.cells;
      for (let step = 0; step < size * size && !jiraiWon(code, made.solution); step += 1) {
        const next = jiraiFix(recipe, board, code, made.solution);
        expect(next, `stuck at step ${step}`).not.toBeNull();
        code = next!.code;
        expect(jiraiWrong(code, made.solution)).toEqual([]);
      }
      expect(jiraiWon(code, made.solution)).toBe(true);
      expect(jiraiMissing(code, made.solution)).toBe(0);
      expect(jiraiCheck(size, made.givens, code)).toEqual({ ok: true });
    }
  });
});

describe("every level is dealt as it was asked for, on every way to play", () => {
  it("keeps the seed asked for, at every size and level, and the mines step up with the level", () => {
    for (const { variant, seed } of VARIANTS) {
      const sizes = variant.shape === "rectangle" ? [7, 9, 12, 16, 32] : [9, 12, 16, 32];
      for (const size of sizes) {
        let before = 0;
        for (const level of ["easy", "medium", "hard", "extra-hard"] as const) {
          for (const each of [seed, seed + 1, seed + 2]) {
            // The very seed, not the next that has a board: a level that sends a reader to another seed is a level that is hard to make.
            expect(generateJirai(size, level, each).seed, `${variant.grid} ${variant.shape} ${size} ${level} ${each}`).toBe(each);
          }
          const mines = jiraiRecipeOf(size, generateJirai(size, level, seed).givens)!.settings.mines;
          expect(mines, `${variant.grid} ${variant.shape} ${size} ${level}`).toBeGreaterThan(before);
          before = mines;
        }
      }
    }
  });
});

describe("a press", () => {
  const made = generateJirai(9, "medium", 5);
  const recipe = jiraiRecipeOf(9, made.givens)!;
  const board = jiraiBoardOf(recipe, made.solution)!;
  const mine = [...made.solution].findIndex((character) => character === FLAG);
  const safe = [...recipe.cells].findIndex((character, cell) => character === COVERED && made.solution[cell] !== FLAG);

  it("turns a flag on and off on a covered square, and none on an uncovered one", () => {
    const flagged = jiraiPress(recipe, board, recipe.cells, { kind: "flag", cell: safe });
    expect(flagged.code[safe]).toBe(FLAG);
    expect(jiraiPress(recipe, board, flagged.code, { kind: "flag", cell: safe }).code).toBe(recipe.cells);
    expect(jiraiPress(recipe, board, recipe.cells, { kind: "flag", cell: recipe.first }).code).toBe(recipe.cells);
  });

  it("uncovers a safe square and what opens with it, and leaves a flag alone", () => {
    const opened = jiraiPress(recipe, board, recipe.cells, { kind: "reveal", cell: safe });
    expect(opened.mistakes).toBe(0);
    expect(opened.code[safe]).toMatch(/[0-8]/);
    const guarded = jiraiPress(recipe, board, jiraiPress(recipe, board, recipe.cells, { kind: "flag", cell: safe }).code, { kind: "reveal", cell: safe });
    expect(guarded.code[safe]).toBe(FLAG);
  });

  it("flags a mine that is uncovered and counts one mistake, rather than ending the puzzle", () => {
    const boom = jiraiPress(recipe, board, recipe.cells, { kind: "reveal", cell: mine });
    expect(boom.mistakes).toBe(1);
    expect(boom.hit).toEqual([mine]);
    expect(boom.code[mine]).toBe(FLAG);
    expect([...boom.code].filter((character, cell) => character !== recipe.cells[cell])).toEqual([FLAG]);
  });

  it("chords only where the flags round a number are its number", () => {
    const number = [...recipe.cells].findIndex((character) => character >= "1" && character <= "8");
    const bare = jiraiPress(recipe, board, recipe.cells, { kind: "chord", cell: number });
    expect(bare.code).toBe(recipe.cells);
    expect(jiraiPress(recipe, board, recipe.cells, { kind: "chord", cell: safe }).code).toBe(recipe.cells);
  });
});

describe("what the server checks", () => {
  const made = generateJirai(9, "easy", 11);
  const recipe = jiraiRecipeOf(9, made.givens)!;

  it("refuses an answer that is not a board, that moved the opening, that leaves a safe square covered, or whose numbers do not add up", () => {
    expect(jiraiCheck(9, made.givens, "").ok).toBe(false);
    expect(jiraiCheck(9, "nonsense", made.solution).ok).toBe(false);
    expect(jiraiCheck(9, made.givens, recipe.cells).ok).toBe(false);
    const covered = [...made.solution].map((character, cell) => (cell === recipe.first ? COVERED : character)).join("");
    expect(jiraiCheck(9, made.givens, covered).ok).toBe(false);
    const altered = [...made.solution].map((character, cell) => (character >= "1" && character <= "7" && cell !== recipe.first ? String(Number(character) + 1) : character)).join("");
    expect(jiraiCheck(9, made.givens, altered).ok).toBe(false);
    expect(jiraiCheck(9, made.givens, made.solution.replace(FLAG, "9")).ok).toBe(false);
  });

  it("takes a mine left covered or flagged, as the player left it", () => {
    const covered = made.solution.replaceAll(FLAG, COVERED);
    expect(jiraiCheck(9, made.givens, covered)).toEqual({ ok: true });
  });

  it("asks for a flat board when it is shaped, and refuses a size it does not make", () => {
    expect(() => jiraiSettings(7, "easy", freshJiraiSeed({ grid: "square", shape: "heart" }))).toThrow(/no shaped Jirai/);
    expect(jiraiFirst(jiraiSettings(9, "easy", 3))).toBe(40);
  });
});
