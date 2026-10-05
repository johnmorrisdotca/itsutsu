import { checkBridges } from "./bridges/check";
import { checkPictureLogic } from "./pictureLogic/check";
import { checkSolitaire, checkSolitaireGivenUp } from "./solitaire/check";
import { checkFreeCell, checkFreeCellGivenUp } from "./freecell/check";
import { checkSpider, checkSpiderGivenUp } from "./spider/check";
import { checkAwase } from "@johnmorrisdotca/jarajara/awase";
import { checkCube, checkCubeGivenUp } from "./cube/check";
import { checkSuido } from "./suido/check";
import { checkMeikyuu } from "./meikyuu/check";
import { checkTobiishi } from "./tobiishi/check";
import { pencilEngine } from "./pencil/engines";
import { decodeRegions, decodeStones } from "./hiddenStones/code";
import { BLACK, decodeBlackAndWhite, EMPTY } from "./blackAndWhite/code";
import { isWord, languageOf, type GomojiLanguage } from "./gomoji/code";
import { formerWordRowsOf, guessesOf, hiddenWordsOf, wordGridOf, wordRowsOf } from "./gomoji/futago";
import { baseGuesses } from "./gomoji/layout";
import { kanaWordsOf } from "./gomojiKana/kanaWords";
import { checkKumimoji } from "./kumimoji/check";
import type { KumimojiOptions } from "./kumimoji/kumimoji.types";
import { dodgeGuesses, readDodge } from "./gomoji/dodgePlay";
import { decodeDodgeGivens } from "./gomoji/dodgeSeed";
import { backwardsGuesses, breaksBackwardsRule, isGuessable } from "./gomoji/backwards";
import { isBackwardsGivens } from "./gomoji/backwardsSeed";
import { hiddenOfPlay } from "./gomoji/backwardsPlay";
import { isDailyPoolWord } from "./dailyWords/dailyPools";
import { checkKoushi } from "./koushi/check";
import { checkNumbers } from "./kazu";
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
 * The Numbers family's checks are Kazu's (`kazu.ts`), restated the same way
 * beside its solver.
 */
/** `level` decides how many guesses a Gomoji gives (`layout.ts`); a grid of any other kind does not need it. */
export function checkSolution(kind: PuzzleKind, size: number, givens: string, answer: string, level?: PuzzleLevel, kumimoji?: KumimojiOptions): PuzzleCheck {
  if (!PUZZLE_SPECS[kind].sizes.includes(size)) return { ok: false, reason: `no ${kind} at ${size}` };
  switch (kind) {
    case "numberPlace":
    case "moreOrLess":
    case "jigsaw":
    case "diagonal":
    case "sumCages":
    case "towers":
      // The Numbers family, read by Kazu in one pass: the same verdicts and the same words as before it was a package.
      return checkNumbers(kind, size, givens, answer);
    case "hiddenStones":
      return checkHiddenStones(size, givens, answer);
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
      return checkKumimoji(size, givens, answer, { ...kumimoji, level: level ?? "medium" });
    case "koushi":
      return checkKoushi(size, givens, answer, "found", level);
    case "bridges":
      return checkBridges(size, givens, answer);
    case "pictureLogic":
      return checkPictureLogic(size, givens, answer);
    case "solitaire":
      // A replay of the moves from the deal: every one allowed, and every card home at the end.
      return checkSolitaire(size, givens, answer, level ?? "easy");
    case "freecell":
      return checkFreeCell(size, givens, answer);
    case "spider":
      return checkSpider(size, givens, answer);
    case "mahjong":
      return checkAwase(size, givens, answer);
    case "cube":
      // The turns, turned from the scramble: every face one colour at the end.
      return checkCube(size, givens, answer);
    case "suido":
      // The water, run through the answer's pieces: what the kind asks reached, and nothing running out.
      return checkSuido(size, givens, answer);
    case "meikyuu":
      // The line, walked from the maze's start: every step through an open passage, ending on its goal.
      return checkMeikyuu(size, givens, answer);
    case "tobiishi":
      // The jumps, replayed from the level's own starting position: every one legal, one peg left, in the goal.
      return checkTobiishi(size, givens, answer);
    case "shikaku":
    case "akari":
    case "slitherlink":
    case "hitori":
    case "fillomino":
    case "kakuro":
      // The pencil puzzles, read by Kazu in one pass over the answer: its rules restated by the package, never the solver that made the board.
      return pencilEngine(kind).check(size, givens, answer);
    default:
      return { ok: false, reason: `no check for ${kind}` };
  }
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
  // A Solitaire given up: its moves allowed, at least one made, and not won.
  if (kind === "solitaire") return PUZZLE_SPECS[kind].sizes.includes(size) ? checkSolitaireGivenUp(size, givens, answer, level ?? "easy") : { ok: false, reason: `no ${kind} at ${size}` };
  // A cube given up: its turns all turns the cube has, at least one made, and not solved.
  if (kind === "cube") return checkCubeGivenUp(size, givens, answer);
  // FreeCell and Spider given up, the same way; each refuses a size it is not played at.
  if (kind === "freecell") return checkFreeCellGivenUp(size, givens, answer);
  if (kind === "spider") return checkSpiderGivenUp(size, givens, answer);
  if (kind !== "gomoji" && kind !== "gomojiKana" && kind !== "gomojiMot" && kind !== "gomojiWort" && kind !== "gomojiPop" && kind !== "koushi") {
    return { ok: false, reason: `a ${kind} cannot run out of guesses` };
  }
  if (!PUZZLE_SPECS[kind].sizes.includes(size)) return { ok: false, reason: `no ${kind} at ${size}` };
  // Koushi's guesses are its swaps: every one the level gives made, and the grid not right.
  if (kind === "koushi") return checkKoushi(size, givens, answer, "spent", level);
  return checkWords(kind, size, givens, answer, "spent", level);
}

/**
 * Every Gomoji, in any language and with one word, a Futago's two or a
 * Yotsugo's four (`futago.ts`, `yotsugo.ts`): every guess a word of the list, in order, no more of them
 * than the rows allow — and either every word was guessed and the last guess
 * found the last of them ("found"), or every row is spent and some word was
 * never guessed ("spent"). Marking the letters is the browser's; the server
 * asks only what decides the result. A kana word is found only when it is
 * guessed exactly, right size and right mark, and its free grey word is the
 * puzzle's, not a guess, and is not in the answer. The kana list must have
 * been loaded (`loadKanaWords`).
 */
function checkWords(kind: PuzzleKind, size: number, givens: string, answer: string, ending: "found" | "spent", level: PuzzleLevel | undefined): PuzzleCheck {
  if (decodeDodgeGivens(givens) !== null) return checkDodge(kind, size, givens, guessesOf(kind, size, answer), ending, level);
  if (isBackwardsGivens(givens)) return checkBackwards(kind, size, givens, answer, ending, level);
  const kana = kind === "gomojiKana";
  const hidden = hiddenWordsOf(kind, size, givens);
  const guesses = guessesOf(kind, size, answer);
  const many = hidden !== null && hidden.words.length > 1;
  // "both words" for a Futago's two, "all four words" for a Yotsugo's four.
  const every = hidden !== null && hidden.words.length === 2 ? "both words" : "all four words";
  if (hidden === null) return { ok: false, reason: kana ? "the givens are not a hidden kana word" : "the givens are not a hidden word" };
  if (guesses === null || guesses.length === 0) return { ok: false, reason: kana ? "the answer is not whole guesses in hiragana" : "the answer is not whole guesses" };
  // How many guesses the level gave: refused, never guessed at, without one.
  if (level === undefined) return { ok: false, reason: "no level to count the guesses by" };
  const rows = wordRowsOf(kind, size, level, hidden);
  // The count before 2026-09-28, for a run kept under it: the larger of the two is the most it may hold (`guessesEverAllowed`).
  const former = formerWordRowsOf(kind, size, level, hidden);
  if (guesses.length > Math.max(rows, former)) return { ok: false, reason: "more guesses than the rows allow" };
  const lang: GomojiLanguage | "ja" = kana ? "ja" : languageOf(kind);
  let unknown: string | undefined;
  try {
    const allowed = kana ? kanaWordsOf(size).allowed : null;
    const known = (guess: string) => (allowed === null ? isWord(guess, size, lang as GomojiLanguage) : allowed.has(guess));
    // A day's word is a guess its own puzzle takes, whatever the list has since become (`isDailyPoolWord`).
    unknown = guesses.find((guess) => !known(guess) && !(hidden.words.includes(guess) && isDailyPoolWord(lang, size, guess)));
  } catch {
    // Refused rather than waved through: a check that cannot read its list (`wordData.ts`, the kana lists) cannot say the guesses are words.
    return { ok: false, reason: kana ? "the kana word list is not loaded" : "the word list is not loaded" };
  }
  if (unknown !== undefined) return { ok: false, reason: `${unknown} is not in the word list` };
  const firstFound = hidden.words.map((word) => guesses.indexOf(word));
  if (ending === "found") {
    if (firstFound.includes(-1)) return { ok: false, reason: many ? "a word was not guessed" : "the word was not guessed" };
    if (Math.max(...firstFound) !== guesses.length - 1) return { ok: false, reason: many ? `guesses go on after ${every} were found` : "guesses go on after the word was found" };
    return { ok: true };
  }
  if (!firstFound.includes(-1)) return { ok: false, reason: many ? `${every} were found` : "the word was found" };
  // The level's count, or the published count a page loaded before the levels differed ended at (`baseGuesses`).
  if (guesses.length !== rows && guesses.length !== former && (many || guesses.length !== baseGuesses(wordGridOf(kind), size))) return { ok: false, reason: "there are guesses left" };
  return { ok: true };
}

/**
 * A GOMOJI NIGE (`dodge.ts`): every guess a word of the list, no more than
 * the level gives (`dodgeGuesses`), replayed against the dodger its givens'
 * seed makes — and either the last guess pinned it down and none before it
 * did, or every guess is spent and none did. The server replays it from the
 * guesses alone, as the browser did.
 */
/**
 * A GOMOJI SAKASA 逆さ, played backwards (`gomoji/backwards.ts`): its ending
 * the other way round. Solved ("found", the puzzle's own win) is every row
 * filled and none of them the word; ended unsolved ("spent") is the word typed
 * on the last row and on none before. Every guess a word of the list, each
 * keeping to what the rows before it uncovered, as the page made it.
 */
function checkBackwards(kind: PuzzleKind, size: number, givens: string, answer: string, ending: "found" | "spent", level: PuzzleLevel | undefined): PuzzleCheck {
  let word: string | null;
  try {
    word = hiddenOfPlay(kind, size, givens);
  } catch {
    return { ok: false, reason: "the word list is not loaded" };
  }
  const guesses = guessesOf(kind, size, answer);
  if (word === null) return { ok: false, reason: "the givens are not a hidden word" };
  if (guesses === null || guesses.length === 0) return { ok: false, reason: "the answer is not whole guesses" };
  if (level === undefined) return { ok: false, reason: "no level to count the guesses by" };
  const rows = backwardsGuesses(kind, size, level);
  if (guesses.length > rows) return { ok: false, reason: "more guesses than the rows allow" };
  for (const [at, guess] of guesses.entries()) {
    let known: boolean;
    try {
      known = isGuessable(kind, size, guess);
    } catch {
      return { ok: false, reason: "the word list is not loaded" };
    }
    if (!known) return { ok: false, reason: `${guess} is not in the word list` };
    const breaks = breaksBackwardsRule(kind, guesses.slice(0, at), word, guess);
    if (breaks !== null) return { ok: false, reason: breaks };
  }
  const caught = guesses.indexOf(word);
  if (ending === "found") {
    if (caught !== -1) return { ok: false, reason: "the word was typed" };
    if (guesses.length !== rows) return { ok: false, reason: "there are rows left" };
    return { ok: true };
  }
  if (caught !== guesses.length - 1) return { ok: false, reason: caught === -1 ? "the word was never typed" : "guesses go on after the word was typed" };
  return { ok: true };
}

function checkDodge(kind: PuzzleKind, size: number, givens: string, guesses: string[] | null, ending: "found" | "spent", level: PuzzleLevel | undefined): PuzzleCheck {
  const seed = decodeDodgeGivens(givens)!;
  if (guesses === null || guesses.length === 0) return { ok: false, reason: "the answer is not whole guesses" };
  if (level === undefined) return { ok: false, reason: "no level to count the guesses by" };
  const rows = dodgeGuesses(kind, size);
  if (guesses.length > rows) return { ok: false, reason: "more guesses than the rows allow" };
  let allowed: (word: string) => boolean;
  if (kind === "gomojiKana") {
    try {
      const words = kanaWordsOf(size).allowed;
      allowed = (word) => words.has(word);
    } catch {
      return { ok: false, reason: "the kana word list is not loaded" };
    }
  } else {
    allowed = (word) => isWord(word, size, languageOf(kind));
  }
  const unknown = guesses.find((guess) => !allowed(guess));
  if (unknown !== undefined) return { ok: false, reason: `${unknown} is not in the word list` };
  for (let at = 1; at < guesses.length; at += 1) {
    if (readDodge(kind, size, level, seed, guesses.slice(0, at)).found) return { ok: false, reason: "guesses go on after the word was found" };
  }
  const found = readDodge(kind, size, level, seed, guesses).found;
  if (ending === "found") return found ? { ok: true } : { ok: false, reason: "the word was not pinned down" };
  if (found) return { ok: false, reason: "the word was found" };
  if (guesses.length !== rows) return { ok: false, reason: "there are guesses left" };
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
