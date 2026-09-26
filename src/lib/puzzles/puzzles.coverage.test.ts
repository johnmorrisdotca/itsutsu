import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { EVERY_GAME_KEY, gameCopyFor, isPuzzleKind } from "@/lib/catalogue/gameKeys";
import { gameArtPath, gameThumbPath } from "@/lib/gomoku/artwork";
import { GAME_FAMILIES, boardGamesOf, familyOf } from "@/lib/gomoku/families";
import { PUZZLE_SLUGS, slugFor } from "@/lib/gomoku/slugs";

import { generatePuzzle, prepareEveryPuzzle } from "./generate";

// The kana Gomoji is made from a list loaded a length at a time: load them all before anything is made.
beforeAll(prepareEveryPuzzle);
import { checkSolution } from "./puzzleCheck";
import { puzzleRulesPage } from "./puzzleRulesPage";
import { PUZZLE_DISPLAY, PUZZLE_KIND_LIST, PUZZLE_SPECS } from "./puzzles.constants";
import type { Puzzle, PuzzleKind, PuzzleLevel } from "./puzzles.types";

/**
 * The New Game Gate, for a puzzle.
 *
 * `variants.coverage.test.ts` holds every rule variant to what makes it a
 * game a person can find, understand and trust — a family, a picture, full
 * copy, a rules page, a unit test, a browser test. A puzzle is not a variant
 * (docs/plans/numbers/README.md) and none of that gate sees it, so this one
 * asks the same questions in the puzzle's terms, plus the two only a puzzle
 * can fail: that it makes a puzzle with exactly one answer at every size and
 * level it offers, and that the check the server runs refuses a wrong grid.
 *
 * Every question is asked of `PUZZLE_KIND_LIST`, so the day a second puzzle
 * is listed it is held to all of this before it ships.
 */

/** The generator for a kind, or null while a kind is declared and not yet made. */
function makerFor(kind: PuzzleKind): ((size: number, level: PuzzleLevel, seed: number) => Puzzle) | null {
  try {
    generatePuzzle(kind, PUZZLE_SPECS[kind].sizes[0], PUZZLE_SPECS[kind].levels[0], 1);
  } catch {
    return null;
  }
  return (size, level, seed) => generatePuzzle(kind, size, level, seed);
}

function sourcesUnder(dir: string, suffix: string): string {
  const found: string[] = [];
  const walk = (at: string) => {
    for (const entry of readdirSync(at)) {
      const path = join(at, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (entry.endsWith(suffix) && !entry.startsWith("puzzles.coverage")) found.push(readFileSync(path, "utf8"));
    }
  };
  walk(dir);
  return found.join("\n");
}

describe("every puzzle is finished, not just declared", () => {
  const unitTests = sourcesUnder(join(process.cwd(), "src", "lib", "puzzles"), ".test.ts");
  const browserSpecs = readdirSync("e2e")
    .filter((name) => name.endsWith(".ts"))
    .map((name) => readFileSync(join("e2e", name), "utf8"));

  it("lists at least one puzzle, so the gate below is checking something", () => {
    expect(PUZZLE_KIND_LIST.length).toBeGreaterThan(0);
  });

  it.each(PUZZLE_KIND_LIST)("%s has a generator", (kind) => {
    expect(makerFor(kind), `${kind} is listed in PUZZLE_KIND_LIST and nothing makes one`).not.toBeNull();
  });

  it.each(PUZZLE_KIND_LIST)("%s makes a puzzle with exactly one answer at every size and level, in a browser's time", (kind) => {
    const make = makerFor(kind);
    if (make === null) return;
    const spec = PUZZLE_SPECS[kind];
    for (const size of spec.sizes) {
      for (const level of spec.levels) {
        const started = performance.now();
        const puzzle = make(size, level, 5);
        const took = performance.now() - started;
        expect(took, `${kind} ${size}×${size} ${level} took ${Math.round(took)} ms to make`).toBeLessThan(3000);
        // At least the cells; More or Less writes its marks after them, within the kind's cap. A Gomoji's
        // givens are its one word, whose length is its size: a word has letters, not a square of cells. A kana
        // Gomoji's are its word and its free grey word. A tile game's (Kumimoji) are its bag, more tiles than the
        // hand its size names, and any sound grid of them is an answer: the solution only proves there is one.
        expect(puzzle.givens.length).toBeGreaterThanOrEqual(
          kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort" || spec.tiles === true ? size : size * size,
        );
        expect(puzzle.givens.length).toBeLessThanOrEqual(spec.mostCells);
        expect(checkSolution(kind, size, puzzle.givens, puzzle.solution, level), `${kind} ${size} ${level}`).toEqual({ ok: true });
        expect(make(size, level, 5), "the same seed must make the same puzzle").toEqual(puzzle);
      }
    }
  });

  it.each(PUZZLE_KIND_LIST)("%s's check refuses a grid that is not its answer", (kind) => {
    const make = makerFor(kind);
    if (make === null) return;
    const spec = PUZZLE_SPECS[kind];
    const puzzle = make(spec.sizes[0], spec.levels[0], 9);
    const wrong = puzzle.solution.slice(1) + puzzle.solution[0];
    expect(checkSolution(kind, spec.sizes[0], puzzle.givens, wrong, spec.levels[0]).ok).toBe(false);
    expect(checkSolution(kind, spec.sizes[0], puzzle.givens, puzzle.givens, spec.levels[0]).ok).toBe(false);
  });

  it.each(PUZZLE_KIND_LIST)("%s is named by at least one unit test", (kind) => {
    expect(unitTests).toContain(kind);
  });

  it.each(PUZZLE_KIND_LIST)("%s is driven by at least one browser spec", (kind) => {
    const named = browserSpecs.some(
      (source) => source.includes(`"${kind}"`) || source.includes(`/${PUZZLE_SLUGS[kind]}/`) || source.includes(`"${PUZZLE_SLUGS[kind]}"`),
    );
    expect(named, `no spec under e2e/ names ${kind} (${PUZZLE_SLUGS[kind]}) — write the case that solves one`).toBe(true);
  });

  it.each(PUZZLE_KIND_LIST)("%s has a picture and a thumbnail in public/art/games", (kind) => {
    expect(existsSync(join(process.cwd(), "public", gameArtPath(kind))), `${kind}: run pnpm screenshots:puzzles`).toBe(true);
    expect(existsSync(join(process.cwd(), "public", gameThumbPath(kind))), `${kind}: run pnpm screenshots:puzzles`).toBe(true);
  });

  it.each(PUZZLE_KIND_LIST)("%s belongs to a family of puzzles, so an index page can show it", (kind) => {
    const family = familyOf(kind);
    expect(family).not.toBeNull();
    // A puzzle lives with the puzzles: a board game's ladder and record would show a blank for it.
    expect(boardGamesOf(family!)).toEqual([]);
  });

  it.each(PUZZLE_KIND_LIST)("%s tells a solver what it is, and says what it is our version of", (kind) => {
    const copy = PUZZLE_DISPLAY[kind];
    expect(copy.label.length).toBeGreaterThan(0);
    expect(copy.kanji.length).toBeGreaterThan(0);
    expect(copy.tagline.length).toBeGreaterThan(0);
    expect(copy.origin.length).toBeGreaterThan(0);
    expect(copy.board.length).toBeGreaterThan(0);
    expect(copy.rules.length).toBeGreaterThanOrEqual(3);
    // Every puzzle here is our version of a published one, under a name of our own.
    expect(copy.inspiredBy, `${kind} names nothing it is our version of`).toBeDefined();
  });

  it.each(PUZZLE_KIND_LIST)("%s builds a rules page with every section filled", (kind) => {
    const page = puzzleRulesPage(kind);
    expect(page.object.length).toBeGreaterThan(0);
    expect(page.board.length).toBeGreaterThan(0);
    expect(page.play.length).toBeGreaterThan(0);
    expect(page.house.length).toBeGreaterThan(0);
  });

  it.each(PUZZLE_KIND_LIST)("%s has an address of its own", (kind) => {
    expect(slugFor(kind)).toBe(PUZZLE_SLUGS[kind]);
    expect(slugFor(kind)).toMatch(/^[a-z0-9-]+$/);
  });

  it("offers each size and level once, with the defaults among them", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      const spec = PUZZLE_SPECS[kind];
      expect(new Set(spec.sizes).size).toBe(spec.sizes.length);
      expect(spec.sizes).toContain(spec.defaultSize);
      expect(spec.levels).toContain(spec.defaultLevel);
      expect(Math.max(...spec.sizes) ** 2).toBeLessThanOrEqual(spec.mostCells);
    }
  });
});

describe("the catalogue counts the puzzles among the games", () => {
  it("lists every puzzle in EVERY_GAME_KEY, after the board games, and copies it", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      expect(EVERY_GAME_KEY).toContain(kind);
      expect(isPuzzleKind(kind)).toBe(true);
      expect(gameCopyFor(kind).label).toBe(PUZZLE_DISPLAY[kind].label);
    }
    expect(EVERY_GAME_KEY.length).toBe(GAME_FAMILIES.flatMap((family) => family.games).length);
  });
});
