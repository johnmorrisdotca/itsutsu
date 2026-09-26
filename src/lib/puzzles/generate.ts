import { generateHiddenStones } from "./hiddenStones/generate";
import { generateMoreOrLess } from "./moreOrLess/generate";
import { generateJigsaw } from "./jigsaw/generate";
import { generateSumCages } from "./killer/generate";
import { generateDiagonal, generateNumberPlace } from "./numberPlace/generate";
import { generateTowers } from "./towers/generate";
import { generateBlackAndWhite } from "./blackAndWhite/generate";
import { generateGomoji } from "./gomoji/generate";
import { generateGomojiKana } from "./gomojiKana/generate";
import { generateKoushi } from "./koushi/generate";
import { KANA_SIZES, loadKanaWords } from "./gomojiKana/kanaWords";
import { loadEveryTsunagiLevel, loadTsunagiLevels, tsunagiPuzzle } from "./tsunagi/levels";
import { generateKumimoji } from "./kumimoji/generate";
import { loadTileWords } from "./kumimoji/tileWords";
import { loadDailyPools } from "./dailyWords/dailyPools";
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
    case "gomoji":
      return generateGomoji(size, level, seed);
    case "gomojiMot":
      return generateGomoji(size, level, seed, "fr", "gomojiMot");
    case "gomojiWort":
      return generateGomoji(size, level, seed, "de", "gomojiWort");
    case "gomojiKana":
      // Its list is loaded by length first (`loadKanaWords`); see its generator.
      return generateGomojiKana(size, level, seed);
    case "tsunagi":
      // Not made at all: a fixed level, its number the seed, read from its size's list (`preparePuzzle` loads it).
      return tsunagiPuzzle(size, seed);
    case "kumimoji":
      // Its bag is laid out as a crossword first, from its word list (`loadTileWords`); see its generator.
      return generateKumimoji(size, level, seed);
    case "koushi":
      // One size, the lattice: `size` is always its 5, and the level decides the swaps.
      return generateKoushi(level, seed);
  }
}

/**
 * What a kind needs fetched before it can be made or checked: the kana
 * Gomoji, whose word list is loaded a length at a time (`loadKanaWords`) with
 * its daily words' pool at that length beside it (`loadDailyPools`), and
 * Kumimoji, whose one list is loaded whole (`loadTileWords`).
 * The solve page, the solved route and a race's finish await it for their one
 * puzzle; the gates await `prepareEveryPuzzle`.
 */
export async function preparePuzzle(kind: PuzzleKind, size: number): Promise<void> {
  if (kind === "gomojiKana") await Promise.all([loadKanaWords(size), loadDailyPools(kind, [size])]);
  if (kind === "tsunagi") await loadTsunagiLevels(size);
  if (kind === "kumimoji") await loadTileWords();
}

export async function prepareEveryPuzzle(): Promise<void> {
  await Promise.all([...KANA_SIZES.map((size) => loadKanaWords(size)), loadDailyPools("gomojiKana", KANA_SIZES), loadEveryTsunagiLevel(), loadTileWords()]);
}
