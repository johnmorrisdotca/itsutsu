import { generateBridges } from "./bridges/generate";
import { generatePictureLogic } from "./pictureLogic/generate";
import { generateSolitaire } from "./solitaire/generate";
import { generateFreeCell } from "./freecell/generate";
import { generateSpider } from "./spider/generate";
import { generateHiddenStones } from "./hiddenStones/generate";
import { generateMahjong } from "./mahjong/generate";
import { generateCube } from "./cube/generate";
import { loadWordData } from "./gomoji/wordData";
import { generateMoreOrLess } from "./moreOrLess/generate";
import { generateJigsaw } from "./jigsaw/generate";
import { generateSumCages } from "./killer/generate";
import { generateDiagonal, generateNumberPlace } from "./numberPlace/generate";
import { generateTowers } from "./towers/generate";
import { generateBlackAndWhite } from "./blackAndWhite/generate";
import { generateGomoji } from "./gomoji/generate";
import { generateGomojiKana } from "./gomojiKana/generate";
import { generateKoushi } from "./koushi/generate";
import { loadKanaWords } from "./gomojiKana/kanaWords";
import { loadTsunagiLevels, tsunagiPuzzle } from "./tsunagi/levels";
import { generateKumimoji } from "./kumimoji/generate";
import type { KumimojiLanguage, KumimojiOptions } from "./kumimoji/kumimoji.types";
import { loadTileWords } from "./kumimoji/tileWords";
import { loadDailyPools } from "./dailyWords/dailyPools";
import type { Puzzle, PuzzleKind, PuzzleLevel } from "./puzzles.types";
import { loadPopGuesses } from "./gomoji/popWords";

/**
 * A puzzle of any kind, from a seed: the one door the solve page, the
 * screenshot scene and the coverage gate go through. Each kind's generator
 * lives beside its solver; this is only the dispatch, so a kind that is
 * listed with no generator fails to compile rather than to run.
 */
export function generatePuzzle(kind: PuzzleKind, size: number, level: PuzzleLevel, seed: number, kumimoji?: KumimojiOptions): Puzzle {
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
    case "gomojiPop":
      return generateGomoji(size, level, seed, "pop", "gomojiPop");
    case "gomojiKana":
      // Its list is loaded by length first (`loadKanaWords`); see its generator.
      return generateGomojiKana(size, level, seed);
    case "tsunagi":
      // Not made at all: a fixed level, its number the seed, read from its size's list (`preparePuzzle` loads it).
      return tsunagiPuzzle(size, seed);
    case "kumimoji":
      // Its bag is laid out as a crossword first, from its word list (`loadTileWords`); see its generator.
      return generateKumimoji(size, level, seed, kumimoji);
    case "koushi":
      // One size, the lattice: `size` is always its 5, and the level decides the swaps.
      return generateKoushi(level, seed);
    case "bridges":
      return generateBridges(size, level, seed);
    case "pictureLogic":
      return generatePictureLogic(size, level, seed);
    case "solitaire":
      // A deal, not a grid: the first winnable deal from this seed, or the seed's own shuffle in the any-deal block (`solitaire/generate.ts`).
      return generateSolitaire(size, level, seed);
    case "freecell":
      // A deal the solver has won with this many free cells: the first from this seed (`freecell/generate.ts`).
      return generateFreeCell(size, level, seed);
    case "spider":
      // Two decks of this many suits, a deal the solver has won: the first from this seed (`spider/generate.ts`).
      return generateSpider(size, level, seed);
    case "mahjong":
      // A layout dealt in reverse, five times, the level choosing among them by how forgiving each is.
      return generateMahjong(size, level, seed);
    case "cube":
      // A scramble, not a grid: the seed's turns from solved, taken back as its solution (`cube/generate.ts`).
      return generateCube(size, level, seed);
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
/**
 * Whether a puzzle of this kind and size has anything to load before it can be
 * made or checked (`preparePuzzle`): its words or its levels. Beside the loader
 * so the two cannot disagree; a page waits on exactly these.
 */
export function puzzleLoads(kind: PuzzleKind): boolean {
  // Every word puzzle's list (`wordData.ts`, the kana lists, Pop's guesses, Kumimoji's tiles), and Tsunagi's levels.
  return kind === "gomoji" || kind === "gomojiMot" || kind === "gomojiWort" || kind === "gomojiPop" || kind === "gomojiKana" || kind === "koushi" || kind === "kumimoji" || kind === "tsunagi";
}

export async function preparePuzzle(kind: PuzzleKind, size: number, language: KumimojiLanguage = "english"): Promise<void> {
  // Gomoji's lists (`wordData.ts`): French for Mot, German for Wort, English for Gomoji, Pop's dictionary guesses, Koushi's lattice and Kumimoji's grid check.
  if (kind === "gomojiMot") await loadWordData("fr");
  if (kind === "gomojiWort") await loadWordData("de");
  if (kind === "gomoji" || kind === "gomojiPop" || kind === "koushi" || kind === "kumimoji") await loadWordData("en");
  if (kind === "gomojiKana") await Promise.all([loadKanaWords(size), loadDailyPools(kind, [size])]);
  if (kind === "tsunagi") await loadTsunagiLevels(size);
  if (kind === "kumimoji") await loadTileWords(language);
  // Pop Gomoji's dictionary guesses at three and seven letters (`popWords.ts`).
  if (kind === "gomojiPop") await loadPopGuesses(size);
}

