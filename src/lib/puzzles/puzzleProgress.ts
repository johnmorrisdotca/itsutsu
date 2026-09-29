import { decodeBlackAndWhite, encodeBlackAndWhite } from "./blackAndWhite/code";
import { solitaireMovesFit } from "./solitaire/check";
import { encodeMoves } from "./solitaire/code";
import type { KlondikeMove } from "./solitaire/solitaire.types";
import type { BridgeCounts, BridgesBoard } from "./bridges/bridges.types";
import { ACROSS_ONE, ACROSS_TWO, DOWN_ONE, DOWN_TWO, MOST_BRIDGES, WATER, encodeBridges } from "./bridges/code";
import { decodeGuesses, languageOf, type GomojiLanguage } from "./gomoji/code";
import { wordCountOfSeed } from "./gomoji/wordsSeed";
import { decodeCells as decodePictureCells, encodeCells as encodePictureCells } from "./pictureLogic/code";
import type { CellState } from "./pictureLogic/pictureLogic.types";
import { decodeKanaGuesses } from "./gomojiKana/kanaCode";
import { readTileProgress } from "./kumimoji/play";
import { MOST_GUESSES, guessesEverAllowed } from "./gomoji/layout";
import { decodePlay } from "./koushi/lattice";
import { decodeCells, encodeCells } from "./puzzleCode";
import type { PuzzleKind, PuzzleLevel } from "./puzzles.types";
import { linesCodeFits } from "./tsunagi/lines";

/**
 * What has been written on an unfinished puzzle, as one character a cell — what
 * a kept run holds (`PuzzleRun.progress`) and a solve screen reads back.
 *
 * A grid of numbers writes its entries the way a puzzle's cells are written
 * (`puzzleCode.ts`), givens left empty. A grid of stones writes "." for an
 * empty cell, "s" for a stone and "x" for a cross. Black and White writes its
 * whole grid as its code does, printed stones included: "b", "w" and ".".
 * Bridges writes its drawing as its answer is written (`bridges/code.ts`).
 */
export type StoneMarkCode = "" | "stone" | "cross";

const STONE_CHARS: Record<StoneMarkCode, string> = { "": ".", stone: "s", cross: "x" };

export function encodeNumberProgress(entries: readonly number[]): string {
  return encodeCells(entries);
}

export function decodeNumberProgress(code: string, size: number): number[] | null {
  return code.length === size * size ? decodeCells(code, size) : null;
}

export function encodeStoneProgress(marks: readonly StoneMarkCode[]): string {
  return marks.map((mark) => STONE_CHARS[mark]).join("");
}

export function decodeStoneProgress(code: string, size: number): StoneMarkCode[] | null {
  if (code.length !== size * size) return null;
  const marks: StoneMarkCode[] = [];
  for (const char of code) {
    if (char === ".") marks.push("");
    else if (char === "s") marks.push("stone");
    else if (char === "x") marks.push("cross");
    else return null;
  }
  return marks;
}

/** Solitaire writes its moves so far, as its answer is written (`solitaire/code.ts`); a kept run replays them from the deal. */
export function encodeSolitaireProgress(moves: readonly KlondikeMove[]): string {
  return encodeMoves(moves);
}

/** Bridges writes its drawing as its answer is written: every island's number, and each water cell's bridge or none. */
export function encodeBridgesProgress(board: BridgesBoard, counts: BridgeCounts): string {
  return encodeBridges(board, counts);
}

/** Picture logic writes the player's grid, a character a cell: "." untouched, "#" shaded, "x" marked empty. */
export function encodePictureLogicProgress(cells: readonly CellState[]): string {
  return encodePictureCells(cells);
}

export function encodeBlackAndWhiteProgress(stones: readonly number[]): string {
  return encodeBlackAndWhite(stones);
}

export function decodeBlackAndWhiteProgress(code: string, size: number): number[] | null {
  return decodeBlackAndWhite(code, size);
}

/** Gomoji writes its guesses so far, run together in lower case, as its answer is written. */
export function encodeGomojiProgress(guesses: readonly string[]): string {
  return guesses.join("");
}

export function decodeGomojiProgress(code: string, size: number, lang: GomojiLanguage = "en"): string[] | null {
  const guesses = decodeGuesses(code, size, lang);
  // Any level's count: the kept run's level decides the rest when it is opened (`layout.ts`).
  return guesses !== null && guesses.length <= MOST_GUESSES ? guesses : null;
}

/** Whether a progress code is one a puzzle of this kind and size could have written. */
/** A kana Gomoji writes its guesses as English does, run together, in hiragana. */
export function encodeKanaProgress(guesses: readonly string[]): string {
  return guesses.join("");
}

export function decodeKanaProgress(code: string, size: number): string[] | null {
  if (code === "") return [];
  const guesses = decodeKanaGuesses(code, size);
  return guesses !== null && guesses.length <= MOST_GUESSES ? guesses : null;
}

export function progressFits(kind: PuzzleKind, size: number, code: string): boolean {
  if (kind === "hiddenStones") return decodeStoneProgress(code, size) !== null;
  if (kind === "blackAndWhite") return decodeBlackAndWhiteProgress(code, size) !== null;
  if (kind === "gomoji") return decodeGomojiProgress(code, size) !== null;
  if (kind === "gomojiMot") return decodeGomojiProgress(code, size, "fr") !== null;
  if (kind === "gomojiWort") return decodeGomojiProgress(code, size, "de") !== null;
  if (kind === "gomojiPop") return decodeGomojiProgress(code, size, "pop") !== null;
  if (kind === "gomojiKana") return decodeKanaProgress(code, size) !== null;
  // Tsunagi keeps its lines, one character a cell (`encodeLines`); read against its layout when opened.
  if (kind === "tsunagi") return linesCodeFits(code, size);
  // A Kumimoji's shape only: its bag is checked when the game is opened again (`decodeTileProgress`).
  if (kind === "kumimoji") return readTileProgress(code) !== null;
  // Solitaire keeps its moves, as its answer is written; replayed from the deal when it is opened.
  if (kind === "solitaire") return solitaireMovesFit(code);
  // Bridges keeps its drawing, one character a cell, as its answer is written; read against its islands when opened.
  if (kind === "bridges") return bridgesCodeFits(code, size);
  // Picture logic keeps the player's grid, one character a cell: "." untouched, "#" shaded, "x" marked empty (`pictureLogic/code.ts`).
  if (kind === "pictureLogic") return decodePictureCells(code, size) !== null;
  // Koushi keeps the grid as it stands and the swaps so far, as its answer is written.
  if (kind === "koushi") return decodePlay(code) !== null;
  return decodeNumberProgress(code, size) !== null;
}

/**
 * Whether a word puzzle's kept guesses are no more than its own level allows:
 * `progressFits` reads a code against the most any Gomoji has (`MOST_GUESSES`,
 * a Futago's), and a run is kept with its level and seed, which say how many
 * this one has — one word, a Futago's two or a Yotsugo's four (`wordsSeed.ts`), and the kana
 * version's free grey word below hard. A run past its rows could never end.
 * Any other kind has no count to be past.
 */
export function runGuessesFit(kind: PuzzleKind, size: number, level: PuzzleLevel, seed: number, code: string): boolean {
  if (kind !== "gomoji" && kind !== "gomojiMot" && kind !== "gomojiWort" && kind !== "gomojiPop" && kind !== "gomojiKana") return true;
  const guesses = kind === "gomojiKana" ? decodeKanaProgress(code, size) : decodeGomojiProgress(code, size, languageOf(kind));
  if (guesses === null) return false;
  const grid = kind === "gomojiKana" ? "gomojiKana" : "gomoji";
  const free = grid === "gomojiKana" && level !== "hard" ? 1 : 0;
  // Up to the level's count, or the count before 2026-09-28 for a run kept under it (`guessesEverAllowed`).
  return guesses.length <= guessesEverAllowed(grid, size, level, free, wordCountOfSeed(seed));
}

/** Whether a Bridges drawing is a grid of this size in its own characters: islands, water and bridges (`bridges/code.ts`). */
function bridgesCodeFits(code: string, size: number): boolean {
  if (code.length !== size * size) return false;
  const kinds = new Set([WATER, ACROSS_ONE, ACROSS_TWO, DOWN_ONE, DOWN_TWO]);
  return [...code].every((char) => kinds.has(char) || (char >= "1" && char <= String(MOST_BRIDGES)));
}
