import { decodeRegions, decodeStones } from "./hiddenStones/code";
import { decodeMoreOrLess } from "./moreOrLess/code";
import { decodeJigsaw } from "./jigsaw/code";
import { decodeKiller } from "./killer/code";
import { decodeTowers, lineFrom, TOWER_SIDES } from "./towers/code";
import { BLACK, decodeBlackAndWhite, EMPTY } from "./blackAndWhite/code";
import { isWord, languageOf, type GomojiLanguage } from "./gomoji/code";
import { guessesOf, hiddenWordsOf, wordGridOf, wordRowsOf } from "./gomoji/futago";
import { baseGuesses } from "./gomoji/layout";
import { kanaWordsOf } from "./gomojiKana/kanaWords";
import { checkKumimoji } from "./kumimoji/check";
import { isDailyPoolWord } from "./dailyWords/dailyPools";
import { checkKoushi } from "./koushi/check";
import { boxedLayout, regionLayout, regionsAreSound, type Layout } from "./numberPlace/layout";
import { decodeCells } from "./puzzleCode";
import { checkTsunagi } from "./tsunagi/check";
import { PUZZLE_SPECS } from "./puzzles.constants";
import type { PuzzleCheck, PuzzleKind, PuzzleLevel } from "./puzzles.types";

/**
 * Whether an answer solves a puzzle: the one check the server also runs.
 *
 * O(cells), no search, nothing remembered between calls. A browser runs it
 * to say "done"; `POST /api/puzzles/solved` runs it before paying, so a
 * member is paid for a grid that is right and not for a grid that was
 * posted. It refuses rather than repairs: a grid of the wrong size, a
 * value out of range or a given moved is a "no" with its reason, never a
 * best guess at what was meant.
 *
 * The rules of each kind are restated here rather than shared with its
 * solver on purpose — the solver is what MADE the puzzle, and a check that
 * reads the solver's mind proves only that the solver agrees with itself.
 */
/** `level` decides how many guesses a Gomoji gives (`layout.ts`); a grid of any other kind does not need it. */
export function checkSolution(kind: PuzzleKind, size: number, givens: string, answer: string, level?: PuzzleLevel): PuzzleCheck {
  if (!PUZZLE_SPECS[kind].sizes.includes(size)) return { ok: false, reason: `no ${kind} at ${size}` };
  switch (kind) {
    case "numberPlace":
      return checkNumberPlace(size, givens, answer);
    case "hiddenStones":
      return checkHiddenStones(size, givens, answer);
    case "moreOrLess":
      return checkMoreOrLess(size, givens, answer);
    case "jigsaw":
      return checkJigsaw(size, givens, answer);
    case "diagonal":
      return checkDiagonal(size, givens, answer);
    case "sumCages":
      return checkSumCages(size, givens, answer);
    case "towers":
      return checkTowers(size, givens, answer);
    case "blackAndWhite":
      return checkBlackAndWhite(size, givens, answer);
    case "gomoji":
    case "gomojiMot":
    case "gomojiWort":
    case "gomojiPop":
    case "gomojiKana":
      return checkWords(kind, size, givens, answer, "found", level);
    case "tsunagi":
      return checkTsunagi(size, givens, answer);
    case "kumimoji":
      return checkKumimoji(size, givens, answer);
    case "koushi":
      return checkKoushi(size, givens, answer, "found", level);
    default:
      return { ok: false, reason: `no check for ${kind}` };
  }
}

/** Every unit a permutation of 1..size, and every given where it was. */
function checkNumberPlace(size: number, givens: string, answer: string): PuzzleCheck {
  return checkOnLayout(boxedLayout(size), decodeCells(givens, size), answer);
}

function checkDiagonal(size: number, givens: string, answer: string): PuzzleCheck {
  return checkOnLayout(boxedLayout(size, true), decodeCells(givens, size), answer);
}

/**
 * A Jigsaw is checked against the regions it was handed, in its givens. They
 * must be sound — `size` joined regions of `size` cells — or the grid is
 * refused before it is read: regions of one cell each would make any grid
 * whose rows and columns are right look like an answer.
 */
function checkJigsaw(size: number, givens: string, answer: string): PuzzleCheck {
  const asked = decodeJigsaw(givens, size);
  if (asked === null) return { ok: false, reason: "the givens are not a grid with regions" };
  if (!regionsAreSound(size, asked.regions)) return { ok: false, reason: "the regions do not divide the grid" };
  return checkOnLayout(regionLayout(size, asked.regions), asked.cells, answer);
}

/**
 * Sum Cages: a Number Place grid, and every cage it was handed holds no
 * number twice and adds to its sum. The cages come from the givens, as a
 * Jigsaw's regions do; each cell is in exactly one, which the code's shape
 * already guarantees.
 */
function checkSumCages(size: number, givens: string, answer: string): PuzzleCheck {
  const asked = decodeKiller(givens, size);
  if (asked === null) return { ok: false, reason: "the givens are not a grid with cages" };
  const plain = checkOnLayout(boxedLayout(size), asked.cells, answer);
  if (!plain.ok) return plain;
  const filled = decodeCells(answer, size)!;
  for (const [at, cage] of asked.cages.entries()) {
    const values = cage.cells.map((index) => filled[index]!);
    if (new Set(values).size !== values.length) return { ok: false, reason: `cage ${at + 1} repeats a number` };
    if (values.reduce((total, value) => total + value, 0) !== cage.sum) return { ok: false, reason: `cage ${at + 1} does not add to ${cage.sum}` };
  }
  return { ok: true };
}

/** Every group of the layout holds every number once, and no given was changed. One pass over the cells. */
function checkOnLayout(layout: Layout, asked: number[] | null, answer: string): PuzzleCheck {
  const { size } = layout;
  const filled = decodeCells(answer, size);
  if (asked === null) return { ok: false, reason: "the givens are not a grid" };
  if (filled === null) return { ok: false, reason: "the answer is not a grid" };
  if (filled.some((value) => value === 0)) return { ok: false, reason: "the answer has empty cells" };
  for (let index = 0; index < asked.length; index += 1) {
    if (asked[index] !== 0 && asked[index] !== filled[index]) return { ok: false, reason: "a given was changed" };
  }
  const seen = new Array<number>(layout.groups.length).fill(0);
  for (let index = 0; index < filled.length; index += 1) {
    const bit = 1 << filled[index]!;
    for (const group of layout.groupsOf[index]!) {
      if (seen[group]! & bit) return { ok: false, reason: `${groupName(layout, group)} repeats a number` };
      seen[group]! |= bit;
    }
  }
  return { ok: true };
}

/** "row 3", "column 5", "box 2", "region 4", "a diagonal": the groups in `build`'s order. */
function groupName(layout: Layout, group: number): string {
  const { size } = layout;
  if (group < size) return `row ${group + 1}`;
  if (group < 2 * size) return `column ${group - size + 1}`;
  if (group < 3 * size) return `${layout.regionWord} ${group - 2 * size + 1}`;
  return "a diagonal";
}

function checkMoreOrLess(size: number, givens: string, answer: string): PuzzleCheck {
  const asked = decodeMoreOrLess(givens, size);
  if (asked === null) return { ok: false, reason: "the givens are not a grid with marks" };
  const square = checkLatinSquare(size, asked.cells, answer);
  if (!square.ok) return square;
  const filled = decodeCells(answer, size)!;
  for (const mark of asked.marks) {
    if (!(filled[mark.less] < filled[mark.more])) return { ok: false, reason: "a mark is not true" };
  }
  return { ok: true };
}

/** Every row and column a permutation of 1..size, nothing empty, and every given where it was: More or Less and Towers alike. */
function checkLatinSquare(size: number, asked: readonly number[], answer: string): PuzzleCheck {
  const filled = decodeCells(answer, size);
  if (filled === null) return { ok: false, reason: "the answer is not a grid" };
  if (filled.some((value) => value === 0)) return { ok: false, reason: "the answer has empty cells" };
  for (let index = 0; index < asked.length; index += 1) {
    if (asked[index] !== 0 && asked[index] !== filled[index]) return { ok: false, reason: "a given was changed" };
  }
  const rows = Array.from({ length: size }, () => 0);
  const cols = Array.from({ length: size }, () => 0);
  for (let index = 0; index < filled.length; index += 1) {
    const bit = 1 << filled[index];
    const row = Math.floor(index / size);
    const col = index % size;
    if (rows[row] & bit) return { ok: false, reason: `row ${row + 1} repeats a number` };
    if (cols[col] & bit) return { ok: false, reason: `column ${col + 1} repeats a number` };
    rows[row] |= bit;
    cols[col] |= bit;
  }
  return { ok: true };
}

/**
 * Towers: a Latin square that keeps its givens, and from every clue exactly
 * that many towers show. The counting is written out here rather than taken
 * from the code's `towersSeen`, which the solver that made the puzzle uses;
 * only where each clue looks from is shared, because that is the spelling.
 */
function checkTowers(size: number, givens: string, answer: string): PuzzleCheck {
  const asked = decodeTowers(givens, size);
  if (asked === null) return { ok: false, reason: "the givens are not a square with clues" };
  const square = checkLatinSquare(size, asked.cells, answer);
  if (!square.ok) return square;
  const filled = decodeCells(answer, size)!;
  for (const side of TOWER_SIDES) {
    for (let at = 0; at < size; at += 1) {
      const clue = asked.clues[side][at]!;
      if (clue === 0) continue;
      let tallest = 0;
      let seen = 0;
      for (const index of lineFrom(side, at, size)) {
        if (filled[index]! > tallest) {
          tallest = filled[index]!;
          seen += 1;
        }
      }
      if (seen !== clue) return { ok: false, reason: `the ${side} clue ${clue} sees ${seen}` };
    }
  }
  return { ok: true };
}

/**
 * Black and White: every cell a stone, every printed stone where it was
 * printed, every row and column half black, never three alike side by side,
 * and no two rows or two columns the same. Written out here, not taken from
 * the solver that made the puzzle.
 */
function checkBlackAndWhite(size: number, givens: string, answer: string): PuzzleCheck {
  const asked = decodeBlackAndWhite(givens, size);
  const filled = decodeBlackAndWhite(answer, size);
  if (asked === null) return { ok: false, reason: "the givens are not a grid of stones" };
  if (filled === null) return { ok: false, reason: "the answer is not a grid of stones" };
  if (filled.some((cell) => cell === EMPTY)) return { ok: false, reason: "the answer has empty cells" };
  if (asked.some((given, index) => given !== EMPTY && given !== filled[index])) return { ok: false, reason: "a printed stone was changed" };
  for (const direction of ["row", "column"] as const) {
    const seen = new Set<string>();
    for (let at = 0; at < size; at += 1) {
      const line = Array.from({ length: size }, (_, k) => filled[direction === "row" ? at * size + k : k * size + at]!);
      if (line.filter((cell) => cell === BLACK).length * 2 !== size) return { ok: false, reason: `${direction} ${at + 1} is not half black` };
      for (let k = 2; k < size; k += 1) {
        if (line[k] === line[k - 1] && line[k] === line[k - 2]) return { ok: false, reason: `${direction} ${at + 1} has three alike` };
      }
      const spelled = line.join("");
      if (seen.has(spelled)) return { ok: false, reason: `${direction} ${at + 1} repeats another` };
      seen.add(spelled);
    }
  }
  return { ok: true };
}

/**
 * A PUZZLE ENDED WITHOUT BEING SOLVED: only a word puzzle can be, when every
 * guess is spent. Checked like a solve, so a member's games lose a run only
 * for a loss that really happened — every row a word, none of them the word.
 */
export function checkOutOfGuesses(kind: PuzzleKind, size: number, givens: string, answer: string, level?: PuzzleLevel): PuzzleCheck {
  if (kind !== "gomoji" && kind !== "gomojiKana" && kind !== "gomojiMot" && kind !== "gomojiWort" && kind !== "gomojiPop" && kind !== "koushi") {
    return { ok: false, reason: `a ${kind} cannot run out of guesses` };
  }
  if (!PUZZLE_SPECS[kind].sizes.includes(size)) return { ok: false, reason: `no ${kind} at ${size}` };
  // Koushi's guesses are its swaps: every one the level gives made, and the grid not right.
  if (kind === "koushi") return checkKoushi(size, givens, answer, "spent", level);
  return checkWords(kind, size, givens, answer, "spent", level);
}

/**
 * Every Gomoji, in any language and with one word or a Futago's two
 * (`futago.ts`): every guess a word of the list, in order, no more of them
 * than the rows allow — and either every word was guessed and the last guess
 * found the last of them ("found"), or every row is spent and some word was
 * never guessed ("spent"). Marking the letters is the browser's; the server
 * asks only what decides the result. A kana word is found only when it is
 * guessed exactly, right size and right mark, and its free grey word is the
 * puzzle's, not a guess, and is not in the answer. The kana list must have
 * been loaded (`loadKanaWords`).
 */
function checkWords(kind: PuzzleKind, size: number, givens: string, answer: string, ending: "found" | "spent", level: PuzzleLevel | undefined): PuzzleCheck {
  const kana = kind === "gomojiKana";
  const hidden = hiddenWordsOf(kind, size, givens);
  const guesses = guessesOf(kind, size, answer);
  const twins = hidden !== null && hidden.words.length > 1;
  if (hidden === null) return { ok: false, reason: kana ? "the givens are not a hidden kana word" : "the givens are not a hidden word" };
  if (guesses === null || guesses.length === 0) return { ok: false, reason: kana ? "the answer is not whole guesses in hiragana" : "the answer is not whole guesses" };
  // How many guesses the level gave: refused, never guessed at, without one.
  if (level === undefined) return { ok: false, reason: "no level to count the guesses by" };
  const rows = wordRowsOf(kind, size, level, hidden);
  if (guesses.length > rows) return { ok: false, reason: "more guesses than the rows allow" };
  const lang: GomojiLanguage | "ja" = kana ? "ja" : languageOf(kind);
  let known: (guess: string) => boolean;
  try {
    const allowed = kana ? kanaWordsOf(size).allowed : null;
    known = (guess) => (allowed === null ? isWord(guess, size, lang as GomojiLanguage) : allowed.has(guess));
  } catch {
    // Refused rather than waved through: a check that cannot read the list cannot say the guesses are words.
    return { ok: false, reason: "the kana word list is not loaded" };
  }
  // A day's word is a guess its own puzzle takes, whatever the list has since become (`isDailyPoolWord`).
  const unknown = guesses.find((guess) => !known(guess) && !(hidden.words.includes(guess) && isDailyPoolWord(lang, size, guess)));
  if (unknown !== undefined) return { ok: false, reason: `${unknown} is not in the word list` };
  const firstFound = hidden.words.map((word) => guesses.indexOf(word));
  if (ending === "found") {
    if (firstFound.includes(-1)) return { ok: false, reason: twins ? "a word was not guessed" : "the word was not guessed" };
    if (Math.max(...firstFound) !== guesses.length - 1) return { ok: false, reason: twins ? "guesses go on after both words were found" : "guesses go on after the word was found" };
    return { ok: true };
  }
  if (!firstFound.includes(-1)) return { ok: false, reason: twins ? "both words were found" : "the word was found" };
  // The level's count, or the published count a page loaded before the levels differed ended at (`baseGuesses`).
  if (guesses.length !== rows && (twins || guesses.length !== baseGuesses(wordGridOf(kind), size))) return { ok: false, reason: "there are guesses left" };
  return { ok: true };
}

/** One stone per row (the answer's shape), every column and region once, and no two stones touching. */
function checkHiddenStones(size: number, givens: string, answer: string): PuzzleCheck {
  const regions = decodeRegions(givens, size);
  const stones = decodeStones(answer, size);
  if (regions === null) return { ok: false, reason: "the regions are not a grid" };
  if (stones === null) return { ok: false, reason: "the answer is not a stone in every row" };
  const columns = new Set<number>();
  const used = new Set<number>();
  for (let row = 0; row < size; row += 1) {
    const col = stones[row];
    if (columns.has(col)) return { ok: false, reason: `column ${col + 1} has two stones` };
    columns.add(col);
    const region = regions[row * size + col];
    if (used.has(region)) return { ok: false, reason: "a region has two stones" };
    used.add(region);
    if (row > 0 && Math.abs(col - stones[row - 1]) < 2) return { ok: false, reason: `the stones in rows ${row} and ${row + 1} touch` };
  }
  return { ok: true };
}
