import { checkShikaku, generateShikaku, isShikakuBoard, solveShikaku, type ShikakuBoard, type ShikakuRectangle } from "@johnmorrisdotca/kazu/shikaku";

import type { PuzzleCheck } from "../puzzles.types";
import { BLANK, symbolFor, valueOf } from "./codes";
import type { PencilEngine } from "./pencil.types";

/**
 * SHIKAKU 四角, cut the grid into rectangles: Kazu's (`@johnmorrisdotca/kazu/shikaku`).
 *
 * The givens are a character a cell: `.` for a cell with no number, else the
 * area its rectangle has, one character (2 to 35 is room; Kazu makes none past
 * 15). What a reader writes is a character a cell too, so a step log and a
 * kept run read it like any grid: `.` for a cell no rectangle covers, else a
 * letter that is the same for every cell of one rectangle and differs between
 * rectangles that touch. Two rectangles that touch never share a letter, so a
 * run of one letter is always one rectangle, and a code is read back into the
 * rectangles it was written from.
 */
const LETTERS = "abcdefghijklmnopqrstuvwxyz";

/** The board the givens are, or null for givens that are not one. */
export function shikakuBoardOf(size: number, givens: string): ShikakuBoard | null {
  if (givens.length !== size * size) return null;
  const clues: number[] = [];
  for (const character of givens) {
    const value = character === BLANK ? 0 : valueOf(character);
    if (value === null) return null;
    clues.push(value);
  }
  const board = { width: size, height: size, clues };
  return isShikakuBoard(board) ? board : null;
}

/** The rectangles a code was written from, or null for a code that is not rectangles of one letter each. */
export function shikakuRectsOf(size: number, code: string): ShikakuRectangle[] | null {
  if (code.length !== size * size) return null;
  const seen = new Set<number>();
  const found: ShikakuRectangle[] = [];
  for (let start = 0; start < code.length; start += 1) {
    const letter = code[start]!;
    if (letter === BLANK) continue;
    if (!LETTERS.includes(letter)) return null;
    if (seen.has(start)) continue;
    // The run of this letter from here: every cell joined to it by an edge.
    const run: number[] = [];
    const queue = [start];
    seen.add(start);
    while (queue.length > 0) {
      const cell = queue.pop()!;
      run.push(cell);
      const x = cell % size;
      for (const next of [x > 0 ? cell - 1 : -1, x < size - 1 ? cell + 1 : -1, cell - size, cell + size]) {
        if (next < 0 || next >= code.length || seen.has(next) || code[next] !== letter) continue;
        seen.add(next);
        queue.push(next);
      }
    }
    const xs = run.map((cell) => cell % size);
    const ys = run.map((cell) => Math.floor(cell / size));
    const rect = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs) + 1, height: Math.max(...ys) - Math.min(...ys) + 1 };
    if (rect.width * rect.height !== run.length) return null;
    found.push(rect);
  }
  return found;
}

/** Rectangles as a code: each takes the first letter no rectangle touching it, placed before it in reading order, already has. */
export function shikakuCodeOf(size: number, rects: readonly ShikakuRectangle[]): string {
  const cells = new Array<string>(size * size).fill(BLANK);
  const ordered = [...rects].sort((a, b) => a.y - b.y || a.x - b.x);
  for (const rect of ordered) {
    const taken = new Set<string>();
    for (let y = rect.y - 1; y <= rect.y + rect.height; y += 1) {
      for (let x = rect.x - 1; x <= rect.x + rect.width; x += 1) {
        const inside = x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
        const corner = (x < rect.x || x >= rect.x + rect.width) && (y < rect.y || y >= rect.y + rect.height);
        if (inside || corner || x < 0 || y < 0 || x >= size || y >= size) continue;
        const neighbour = cells[y * size + x]!;
        if (neighbour !== BLANK) taken.add(neighbour);
      }
    }
    const letter = [...LETTERS].find((one) => !taken.has(one)) ?? LETTERS[0]!;
    for (let y = rect.y; y < rect.y + rect.height; y += 1) for (let x = rect.x; x < rect.x + rect.width; x += 1) cells[y * size + x] = letter;
  }
  return cells.join("");
}

/** The cells a rectangle covers, as indexes. */
function coverOf(size: number, rect: ShikakuRectangle): number[] {
  return Array.from({ length: rect.width * rect.height }, (_, at) => (rect.y + Math.floor(at / rect.width)) * size + rect.x + (at % rect.width));
}

const same = (a: ShikakuRectangle, b: ShikakuRectangle) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

/** A rectangle placed on a code: whatever it touches is taken off, as Kazu's player does. */
export function shikakuPlace(size: number, code: string, rect: ShikakuRectangle): string {
  const rects = shikakuRectsOf(size, code) ?? [];
  const covered = new Set(coverOf(size, rect));
  const kept = rects.filter((each) => !coverOf(size, each).some((cell) => covered.has(cell)));
  return shikakuCodeOf(size, [...kept, rect]);
}

/** A code with the rectangle covering one cell taken off. */
export function shikakuRemove(size: number, code: string, cell: number): string {
  const rects = shikakuRectsOf(size, code) ?? [];
  return shikakuCodeOf(size, rects.filter((each) => !coverOf(size, each).includes(cell)));
}

export const shikaku: PencilEngine = {
  codeLength: (size) => size * size,
  make(size, level, seed) {
    const made = generateShikaku(size, size, level, seed);
    const givens = made.clues.map((clue) => (clue === 0 ? BLANK : (symbolFor(clue) ?? "?"))).join("");
    return { givens, solution: shikakuCodeOf(size, made.solution) };
  },
  reads: (size, givens) => shikakuBoardOf(size, givens) !== null,
  blank: (size) => BLANK.repeat(size * size),
  fits: (size, code) => shikakuRectsOf(size, code) !== null,
  check(size, givens, answer): PuzzleCheck {
    const board = shikakuBoardOf(size, givens);
    if (board === null) return { ok: false, reason: "the givens are not a Shikaku board" };
    const rects = shikakuRectsOf(size, answer);
    if (rects === null) return { ok: false, reason: "the answer is not a set of rectangles" };
    const verdict = checkShikaku(board, rects);
    if (verdict.ok) return { ok: true };
    return { ok: false, reason: verdict.errors.length > 0 ? "a rectangle does not hold exactly one number, or its area" : "some cells are in no rectangle" };
  },
  solve(size, givens) {
    const board = shikakuBoardOf(size, givens);
    if (board === null) return null;
    const found = solveShikaku(board, [], { limit: 2 });
    return found.complete && found.count === 1 && found.solution !== null ? shikakuCodeOf(size, found.solution) : null;
  },
  // One place a wrong rectangle: its top-left cell, so a count of them is a count of rectangles.
  wrong(size, code, solution) {
    const rects = shikakuRectsOf(size, code) ?? [];
    const right = shikakuRectsOf(size, solution) ?? [];
    return rects.filter((rect) => !right.some((one) => same(one, rect))).map((rect) => rect.y * size + rect.x);
  },
  missing(size, code, solution) {
    const rects = shikakuRectsOf(size, code) ?? [];
    return (shikakuRectsOf(size, solution) ?? []).filter((one) => !rects.some((rect) => same(one, rect))).length;
  },
  fix(size, code, solution) {
    const rects = shikakuRectsOf(size, code) ?? [];
    const next = (shikakuRectsOf(size, solution) ?? []).find((one) => !rects.some((rect) => same(one, rect)));
    if (next === undefined) return null;
    return { code: shikakuPlace(size, code, next), at: next.y * size + next.x };
  },
  work: (size) => size * size,
};

