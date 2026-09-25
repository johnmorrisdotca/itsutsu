import { generateHiddenStones } from "./hiddenStones/generate";
import { generateMoreOrLess } from "./moreOrLess/generate";
import { generateJigsaw } from "./jigsaw/generate";
import { generateSumCages } from "./killer/generate";
import { generateDiagonal, generateNumberPlace } from "./numberPlace/generate";
import { generateTowers } from "./towers/generate";
import { generateBlackAndWhite } from "./blackAndWhite/generate";
import { generateWordDrop } from "./wordDrop/generate";
import { generateWordDropKana } from "./wordDropKana/generate";
import { KANA_SIZES, loadKanaWords } from "./wordDropKana/kanaWords";
import type { Puzzle, PuzzleKind, PuzzleLevel } from "./puzzles.types";

/**
 * A puzzle of any kind, from a seed: the one door the solve page, the
 * screenshot scene and the coverage gate go through. Each kind's generator
 * lives beside its solver; this is only the dispatch, so a kind that is
 * listed with no generator fails to compile rather than to run.
 */
export function generatePuzzle(kind: PuzzleKind, size: number, level: PuzzleLevel, seed: number): Puzzle {
  switch (kind) {
    case "numberPlace":
      return generateNumberPlace(size, level, seed);
    case "hiddenStones":
      return generateHiddenStones(size, level, seed);
    case "moreOrLess":
      return generateMoreOrLess(size, level, seed);
    case "jigsaw":
      return generateJigsaw(size, level, seed);
    case "diagonal":
      return generateDiagonal(size, level, seed);
    case "sumCages":
      return generateSumCages(size, level, seed);
    case "towers":
      return generateTowers(size, level, seed);
    case "blackAndWhite":
      return generateBlackAndWhite(size, level, seed);
    case "wordDrop":
      return generateWordDrop(size, level, seed);
    case "wordDropKana":
      // Its list is loaded by length first (`loadKanaWords`); see its generator.
      return generateWordDropKana(size, level, seed);
  }
}

/**
 * What a kind needs fetched before it can be made or checked: only the kana
 * WordDrop, whose word list is loaded a length at a time (`loadKanaWords`).
 * The solve page, the solved route and a race's finish await it for their one
 * puzzle; the gates await `prepareEveryPuzzle`.
 */
export async function preparePuzzle(kind: PuzzleKind, size: number): Promise<void> {
  if (kind === "wordDropKana") await loadKanaWords(size);
}

export async function prepareEveryPuzzle(): Promise<void> {
  await Promise.all(KANA_SIZES.map((size) => loadKanaWords(size)));
}
