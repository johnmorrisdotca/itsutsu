import { BLANK, BULB, EDGE, SHADE, symbolFor } from "./codes";
import { BLACK } from "./crossSums";
import { shikakuPlace, shikakuRemove } from "./shikaku";
import type { PencilKind } from "./pencil.types";
import { ARROW_KEY } from "../../ui/keyNames.constants";

/**
 * WHAT A PRESS DOES to a pencil puzzle's board, kept out of the components so
 * it is the same for a finger, a mouse and a key, and can be tested without a
 * page. A board is its code (`pencil.types.ts`); a press, a drag or a number
 * turns one code into another, and into what the board is leaving highlighted.
 */
export type PencilUi = {
  /** The cell or edge highlighted: where a key will act, and the cell a number goes into. */
  selected: number | null;
  /** Shikaku's first corner, waiting for the opposite one. */
  anchor: number | null;
  /** Shikaku's Remove: a press takes off the rectangle it is on, rather than starting one. */
  erase: boolean;
};

export const FRESH_UI: PencilUi = { selected: null, anchor: null, erase: false };

/** A cell or an edge pressed, or (Shikaku) a drag from one cell to another. */
export type PencilPress = { cell: number } | { edge: number } | { from: number; to: number };

export type Pressed = { code: string; ui: PencilUi };

const set = (code: string, at: number, character: string): string => `${code.slice(0, at)}${character}${code.slice(at + 1)}`;
const flip = (code: string, at: number, mark: string): string => set(code, at, code[at] === mark ? BLANK : mark);

/** Whether a cell is one a number or a bulb or a shade can go on: not a black square, not a printed number. */
function openCell(kind: PencilKind, givens: string, code: string, cell: number): boolean {
  // A Cross Sums board's givens are longer than its cells (a black cell is five characters), so its black cells are read off the code, which marks each.
  if (kind === "crossSums") return code[cell] !== undefined && code[cell] !== BLACK;
  const printed = givens[cell];
  if (printed === undefined) return false;
  if (kind === "akari" || kind === "regions") return printed === BLANK;
  return true;
}

/** A press on a board, as the code and the highlight it leaves. */
export function pressed(kind: PencilKind, size: number, givens: string, code: string, ui: PencilUi, press: PencilPress): Pressed {
  if (kind === "loop") {
    if (!("edge" in press)) return { code, ui };
    return { code: flip(code, press.edge, EDGE), ui: { ...ui, selected: press.edge } };
  }
  if (kind === "shikaku") return shikakuPressed(size, code, ui, press);
  if (!("cell" in press) || !openCell(kind, givens, code, press.cell)) return { code, ui };
  const cell = press.cell;
  if (kind === "akari") return { code: flip(code, cell, BULB), ui: { ...ui, selected: cell } };
  if (kind === "hitori") return { code: flip(code, cell, SHADE), ui: { ...ui, selected: cell } };
  // Regions and Cross Sums choose a cell, and a number is entered into it (`entered`).
  return { code, ui: { ...ui, selected: cell } };
}

function shikakuPressed(size: number, code: string, ui: PencilUi, press: PencilPress): Pressed {
  const corners = (a: number, b: number) => ({
    x: Math.min(a % size, b % size),
    y: Math.min(Math.floor(a / size), Math.floor(b / size)),
    width: Math.abs((a % size) - (b % size)) + 1,
    height: Math.abs(Math.floor(a / size) - Math.floor(b / size)) + 1,
  });
  if ("from" in press) return { code: shikakuPlace(size, code, corners(press.from, press.to)), ui: { ...ui, selected: press.to, anchor: null } };
  if (!("cell" in press)) return { code, ui };
  if (ui.erase) return { code: shikakuRemove(size, code, press.cell), ui: { ...ui, selected: press.cell, anchor: null } };
  if (ui.anchor === null) return { code, ui: { ...ui, selected: press.cell, anchor: press.cell } };
  return { code: shikakuPlace(size, code, corners(ui.anchor, press.cell)), ui: { ...ui, selected: press.cell, anchor: null } };
}

/** A number into the chosen cell (0 clears it), for the two puzzles that take numbers. */
export function entered(kind: PencilKind, givens: string, code: string, ui: PencilUi, value: number): Pressed {
  const cell = ui.selected;
  if ((kind !== "regions" && kind !== "crossSums") || cell === null || !openCell(kind, givens, code, cell)) return { code, ui };
  const most = kind === "crossSums" ? 9 : 35;
  if (!Number.isInteger(value) || value < 0 || value > most) return { code, ui };
  const character = value === 0 ? BLANK : symbolFor(value);
  return character === null ? { code, ui } : { code: set(code, cell, character), ui };
}

/** The cell or edge an arrow key moves to from `from`, staying on the board. A Slitherlink's edges are walked in their order, left and right by one, up and down by a row of them. */
export function moved(kind: PencilKind, size: number, from: number | null, key: string): number | null {
  if (!key.startsWith(ARROW_KEY)) return from;
  const total = kind === "loop" ? 2 * size * (size + 1) : size * size;
  const start = from ?? 0;
  if (kind === "loop") {
    const next = start + ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -size, ArrowDown: size }[key] ?? 0);
    return next >= 0 && next < total ? next : start;
  }
  const column = start % size;
  if (key === "ArrowLeft") return column > 0 ? start - 1 : start;
  if (key === "ArrowRight") return column < size - 1 ? start + 1 : start;
  if (key === "ArrowUp") return start >= size ? start - size : start;
  return start + size < total ? start + size : start;
}
