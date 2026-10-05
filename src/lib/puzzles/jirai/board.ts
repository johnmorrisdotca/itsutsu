import { activeCell, activeCells, makeBoard, neighbours, newGame, play, validSettings, visibleGame, withBoard, hintFor, type Board, type Game, type Settings } from "@johnmorrisdotca/jirai";

import type { PuzzleCheck, PuzzleLevel } from "../puzzles.types";
import { jiraiVariantOfSeed, jiraiSideFor, type JiraiGrid, type JiraiShape } from "./variants";

/**
 * JIRAI 地雷, Minesweeper that never asks for a guess: Jirai's (`@johnmorrisdotca/jirai`).
 *
 * A puzzle is a board dealt from its seed, opened at its middle, and proved
 * to be finished by clues alone. The site makes it whole, in the browser,
 * before it is played: the mines are the answer.
 *
 *  - `givens` are the recipe and the position as it opens:
 *    `j:<grid>:<shape>:<width>x<height>:<mines>:<first>:<seed>:<cells>`, the cells
 *    a character each, `-` where the shape has none, `.` for a square still
 *    covered, a digit for one the opening has uncovered. Enough to draw the puzzle
 *    and to hold an answer to it, and nothing the answer is.
 *  - `solution` is the board uncovered: a digit for every safe square and `f` for
 *    every mine.
 *  - What is written on a board, a kept run and an answer alike, is a code of the
 *    same cells: `.` covered, `f` flagged, a digit uncovered.
 *
 * A board is finished when every safe square is uncovered, which leaves exactly
 * the mines covered; the server checks that the uncovered clues add up (`jiraiCheck`).
 */
export const COVERED = ".";
export const FLAG = "f";
export const OUTSIDE = "-";

/** The share of its squares that are mines, by level: Jirai's own beginner is 12%, intermediate 16% and expert 21%. */
export const JIRAI_DENSITY: Record<PuzzleLevel, number> = { easy: 0.12, medium: 0.16, hard: 0.2, "extra-hard": 0.2 };

export type JiraiRecipe = { settings: Settings; first: number; cells: string };

const GRID_CODE: Record<JiraiGrid, string> = { square: "s", orthogonal: "o", hex: "h", wrap: "w" };
const SHAPE_CODE: Record<JiraiShape, string> = { rectangle: "r", heart: "h", star: "s", hexagon: "x" };

const keyOf = <T extends string>(table: Record<T, string>, code: string): T | null => (Object.keys(table) as T[]).find((each) => table[each] === code) ?? null;

/** The settings of a puzzle: the way to play its seed says, a side, and a share of mines for its level. */
export function jiraiSettings(size: number, level: PuzzleLevel, seed: number): Settings {
  const variant = jiraiVariantOfSeed(seed);
  // A shape needs nine squares each way; an address that asks for less is put right before it gets here (`puzzleAsked`).
  if (jiraiSideFor(variant, size) !== size) throw new RangeError(`no shaped Jirai at ${size}`);
  const base: Settings = { shape: variant.shape, width: size, height: size, mines: 0, grid: variant.grid, noGuess: true, opening: "clear", seed };
  const mines = Math.max(1, Math.round(activeCells(base).length * JIRAI_DENSITY[level]));
  return { ...base, mines };
}

/** The square a board is opened at: the active one nearest its middle. */
export function jiraiFirst(settings: Settings): number {
  const middle = (settings.width - 1) / 2;
  let best = -1;
  let nearest = Infinity;
  for (const cell of activeCells(settings)) {
    const distance = ((cell % settings.width) - middle) ** 2 + (Math.floor(cell / settings.width) - middle) ** 2;
    if (distance < nearest) {
      best = cell;
      nearest = distance;
    }
  }
  return best;
}

/** The recipe a string spells, or null for one that is no board: its shape, its cells and its opening held to Jirai's own rules. */
export function jiraiRecipeOf(size: number, givens: string): JiraiRecipe | null {
  const parts = givens.split(":");
  if (parts.length !== 8 || parts[0] !== "j") return null;
  const [, gridCode, shapeCode, shape, minesText, firstText, seedText, cells] = parts as [string, string, string, string, string, string, string, string];
  const grid = keyOf(GRID_CODE, gridCode);
  const shapeKey = keyOf(SHAPE_CODE, shapeCode);
  const dimensions = /^(\d+)x(\d+)$/.exec(shape);
  if (grid === null || shapeKey === null || dimensions === null) return null;
  const width = Number(dimensions[1]);
  const height = Number(dimensions[2]);
  const mines = Number(minesText);
  const first = Number(firstText);
  const seed = Number(seedText);
  if (width !== height || width !== size || cells.length !== width * height) return null;
  const settings: Settings = { shape: shapeKey, width, height, mines, grid, noGuess: true, opening: "clear", seed };
  if (!validSettings(settings) || !Number.isInteger(first) || !activeCell(settings, first)) return null;
  for (let cell = 0; cell < cells.length; cell += 1) {
    const character = cells[cell]!;
    if (activeCell(settings, cell) ? !(character === COVERED || (character >= "0" && character <= "8")) : character !== OUTSIDE) return null;
  }
  return { settings, first, cells };
}

const recipeText = (settings: Settings, first: number, cells: string): string =>
  `j:${GRID_CODE[settings.grid]}:${SHAPE_CODE[settings.shape ?? "rectangle"]}:${settings.width}x${settings.height}:${settings.mines}:${first}:${settings.seed}:${cells}`;

/** The code of a game: a character a square. */
export function jiraiCodeOf(game: Game): string {
  return game.marks.map((mark, cell) => (!activeCell(game.settings, cell) ? OUTSIDE : mark === "open" ? String(game.board?.clues[cell] ?? 0) : mark === "flag" ? FLAG : COVERED)).join("");
}

/** A puzzle from a seed: the board Jirai deals and proves, opened at its middle. Throws when Jirai cannot prove one for the seed. */
export function jiraiMake(size: number, level: PuzzleLevel, seed: number): { givens: string; solution: string } {
  const settings = jiraiSettings(size, level, seed);
  const first = jiraiFirst(settings);
  const board = makeBoard(settings, first);
  const opened = play(withBoard(newGame(settings), board), { kind: "reveal", cell: first });
  const solution = board.clues.map((clue, cell) => (!activeCell(settings, cell) ? OUTSIDE : board.mines[cell] ? FLAG : String(clue))).join("");
  return { givens: recipeText(settings, first, jiraiCodeOf(opened)), solution };
}

/** The board as the answer has it, rebuilt from the recipe and the answer's cells; null where they do not belong together. */
export function jiraiBoardOf(recipe: JiraiRecipe, solution: string): Board | null {
  if (solution.length !== recipe.cells.length) return null;
  const mines = [...solution].map((character) => character === FLAG);
  const clues = [...solution].map((character) => (character >= "0" && character <= "8" ? Number(character) : 0));
  return { settings: recipe.settings, mines, clues, first: recipe.first, attempt: 0 };
}

/** A game on a board, with the marks a code has. */
export function jiraiGameOf(recipe: JiraiRecipe, board: Board, code: string): Game {
  const marks = [...code].map((character) => (character === FLAG ? ("flag" as const) : character >= "0" && character <= "8" ? ("open" as const) : ("covered" as const)));
  return { settings: recipe.settings, board, marks, status: "playing", exploded: null, moves: [], helped: false };
}

export type JiraiMove = { kind: "reveal" | "chord" | "flag"; cell: number };
export type Pressed = { code: string; mistakes: number; hit: readonly number[] };

const set = (code: string, at: number, character: string): string => `${code.slice(0, at)}${character}${code.slice(at + 1)}`;

/**
 * A press on a board. A flag is turned on or off. A reveal uncovers the square and
 * whatever opens with it, a press on an uncovered number whose flags are all its
 * mines (a chord) uncovers the rest round it; both by Jirai's own rules (`play`).
 *
 * A mine uncovered is not the end of the puzzle here: it is flagged where it lies,
 * the press does nothing else, and it is counted as a mistake, which costs what a
 * Hint does. A puzzle that cannot be asked a guess of ends when the player is wrong
 * only by a slip, and a slip on a phone is a thumb, not a bad guess.
 */
export function jiraiPress(recipe: JiraiRecipe, board: Board, code: string, move: JiraiMove): Pressed {
  const same = { code, mistakes: 0, hit: [] as number[] };
  const here = code[move.cell];
  if (here === undefined || here === OUTSIDE) return same;
  if (move.kind === "flag") return here === COVERED || here === FLAG ? { ...same, code: set(code, move.cell, here === FLAG ? COVERED : FLAG) } : same;
  const game = jiraiGameOf(recipe, board, code);
  // The squares this press would uncover that are mines.
  const around = neighbours(recipe.settings, move.cell);
  const starts = move.kind === "reveal" ? (here === COVERED ? [move.cell] : []) : around.filter((cell) => code[cell] === COVERED);
  const chord = move.kind === "chord" && here !== COVERED && here !== FLAG && around.filter((cell) => code[cell] === FLAG).length === board.clues[move.cell];
  if (move.kind === "chord" && !chord) return same;
  const hit = starts.filter((cell) => board.mines[cell]);
  if (hit.length > 0) return { code: hit.reduce((so, cell) => set(so, cell, FLAG), code), mistakes: hit.length, hit };
  const next = play(game, { kind: move.kind, cell: move.cell });
  return next === game ? same : { code: jiraiCodeOf(next), mistakes: 0, hit: [] };
}

/** Whether every safe square is uncovered: the puzzle is done. */
export function jiraiWon(code: string, solution: string): boolean {
  for (let cell = 0; cell < solution.length; cell += 1) if (solution[cell] !== FLAG && solution[cell] !== OUTSIDE && !(code[cell]! >= "0" && code[cell]! <= "8")) return false;
  return true;
}

/** The flags that are not on a mine. */
export function jiraiWrong(code: string, solution: string): number[] {
  const found: number[] = [];
  for (let cell = 0; cell < code.length; cell += 1) if (code[cell] === FLAG && solution[cell] !== FLAG) found.push(cell);
  return found;
}

/** How many safe squares are still covered. */
export function jiraiMissing(code: string, solution: string): number {
  let count = 0;
  for (let cell = 0; cell < solution.length; cell += 1) if (solution[cell] !== FLAG && solution[cell] !== OUTSIDE && !(code[cell]! >= "0" && code[cell]! <= "8")) count += 1;
  return count;
}

/**
 * One right move, and where: what the clues prove (Jirai's own hint, which reads no flags and no answer) —
 * a safe square uncovered, else a mine flagged — and failing that the first safe square still covered. A flag
 * that is wrong over a square about to be uncovered goes first. Null when the board is done.
 */
export function jiraiFix(recipe: JiraiRecipe, board: Board, code: string, solution: string): { code: string; at: number } | null {
  const seen = visibleGame(jiraiGameOf(recipe, board, code));
  const proved = hintFor(seen);
  const safe = proved.safe.find((cell) => !(code[cell]! >= "0" && code[cell]! <= "8"));
  const mine = proved.mines.find((cell) => code[cell] !== FLAG);
  const open = safe ?? [...solution].findIndex((character, cell) => character !== FLAG && character !== OUTSIDE && !(code[cell]! >= "0" && code[cell]! <= "8"));
  if (open !== -1 && open !== undefined) {
    const cleared = code[open] === FLAG ? set(code, open, COVERED) : code;
    const pressed = jiraiPress(recipe, board, cleared, { kind: "reveal", cell: open });
    return { code: pressed.code, at: open };
  }
  if (mine !== undefined) return { code: set(code, mine, FLAG), at: mine };
  return null;
}

/** The squares a solve is worth by: those the opening leaves to uncover. */
export function jiraiWork(givens: string): number {
  const parts = givens.split(":");
  const cells = parts[7] ?? "";
  const mines = Number(parts[4]);
  let safe = 0;
  for (const character of cells) if (character === COVERED || (character >= "0" && character <= "8")) safe += 1;
  let opened = 0;
  for (const character of cells) if (character >= "0" && character <= "8") opened += 1;
  return Math.max(1, safe - (Number.isFinite(mines) ? mines : 0) - opened);
}

/** Whether a code could have been written on a board of this side: its shape alone. */
export function jiraiFits(size: number, code: string): boolean {
  return code.length === size * size && /^[.f\-0-8]+$/.test(code);
}

/**
 * Whether an answer finishes a board: the check the server runs, in O(squares). It cannot deal the board again
 * (that is a search), so it asks that the answer is a board that holds together and keeps what the puzzle
 * showed — the squares the opening uncovered still uncovered with the same numbers, every uncovered number
 * the count of covered squares round it, and exactly as many covered as there are mines. The board is held
 * to the one it was dealt by the browser that made it, as every puzzle here is (`/api/puzzles/solved`).
 */
export function jiraiCheck(size: number, givens: string, answer: string): PuzzleCheck {
  const recipe = jiraiRecipeOf(size, givens);
  if (recipe === null) return { ok: false, reason: "the givens are not a Jirai board" };
  const { settings, cells } = recipe;
  if (answer.length !== cells.length || !/^[.f\-0-8]+$/.test(answer)) return { ok: false, reason: "the answer is not a grid of squares" };
  let covered = 0;
  for (let cell = 0; cell < answer.length; cell += 1) {
    const character = answer[cell]!;
    if (!activeCell(settings, cell)) {
      if (character !== OUTSIDE) return { ok: false, reason: "the answer has a square outside the shape" };
      continue;
    }
    if (character === OUTSIDE) return { ok: false, reason: "the answer is missing a square" };
    const printed = cells[cell]!;
    if (printed !== COVERED && printed !== character) return { ok: false, reason: "a square the opening uncovered was changed" };
    if (character === COVERED || character === FLAG) covered += 1;
  }
  if (covered !== settings.mines) return { ok: false, reason: covered > settings.mines ? "there are safe squares still covered" : "a mine was uncovered" };
  for (let cell = 0; cell < answer.length; cell += 1) {
    const character = answer[cell]!;
    if (character < "0" || character > "8") continue;
    const near = neighbours(settings, cell).filter((each) => answer[each] === COVERED || answer[each] === FLAG).length;
    if (near !== Number(character)) return { ok: false, reason: "a number does not match the covered squares round it" };
  }
  if (answer[recipe.first]! < "0" || answer[recipe.first]! > "8") return { ok: false, reason: "the opening was covered again" };
  return { ok: true };
}
