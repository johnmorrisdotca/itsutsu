import { bestFirst } from "../bestFirst";

import type { FreeCellMove, FreeCellPile, FreeCellTable } from "./freecell.types";
import {
  CELL_PILES,
  COLUMN_PILES,
  cellAt,
  columnAt,
  countOnto,
  fitsFoundation,
  follows,
  foundationPileOf,
  freeCellWon,
  mostCarried,
  playFreeCell,
  rankOf,
  redCard,
  runLength,
} from "./rules";

/**
 * A FREECELL SOLVER, in the browser: best first (`bestFirst`), giving up
 * after a fixed number of tables, never after a fixed time, so the same deal
 * gets the same answer on a phone, a desk and the server. Depth first, as
 * Klondike's solver is, won about one deal in six fewer and took lines three
 * times as long (measured 2026-09-30).
 *
 * - SAFE MOVES ARE MADE AT ONCE: a card goes home when nothing left on the
 *   table could ever want to be put on it.
 * - TABLES ARE SEEN ONCE, remembered with the columns in any order and the
 *   free cells in any order, since neither order changes the game.
 * - THE LIKELY MOVES ARE TRIED FIRST: home, then a run onto a card that frees
 *   what was under it, then a card out of a cell, then into an empty column,
 *   and a card put into a cell last.
 *
 * It finds wins and never judges losses: a deal is called winnable only once
 * it has won it.
 */

/** Whether a card may go home now with nothing on the table ever wanting it. */
function safeHome(card: number, foundation: readonly number[]): boolean {
  if (!fitsFoundation(card, foundation)) return false;
  const rank = rankOf(card);
  if (rank <= 2) return true;
  const red = redCard(card);
  const others = [0, 1, 2, 3].filter((suit) => (suit === 1 || suit === 2) !== red);
  return others.every((suit) => foundation[suit] >= rank - 1);
}

function cellsOf(table: FreeCellTable): FreeCellPile[] {
  return CELL_PILES.slice(0, table.cells.length);
}

/** Make every safe move home, from the cells and the columns, until there is none. */
function playSafe(table: FreeCellTable): { table: FreeCellTable; moves: FreeCellMove[] } {
  const moves: FreeCellMove[] = [];
  let now = table;
  for (let found = true; found; ) {
    found = false;
    for (const from of [...cellsOf(now), ...COLUMN_PILES]) {
      const card = from >= "a" ? now.cells[cellAt(from)] : now.tableau[columnAt(from)].at(-1);
      if (card === null || card === undefined || !safeHome(card, now.foundation)) continue;
      const move: FreeCellMove = { from, to: foundationPileOf(card), count: 1 };
      const next = playFreeCell(now, move);
      if (next === null) continue;
      now = next;
      moves.push(move);
      found = true;
    }
  }
  return { table: now, moves };
}

const letter = (card: number) => String.fromCharCode(48 + card);

/** What a table is, for having seen it: its columns and its cells each in any order. */
function keyOf(table: FreeCellTable): string {
  const columns = table.tableau.map((column) => column.map(letter).join("")).sort();
  const cells = table.cells.map((card) => (card === null ? "" : letter(card))).sort();
  return `${table.foundation.join(",")}|${cells.join("")}|${columns.join("/")}`;
}

/** How many cards lie on top of the lowest card not yet home of each suit: the work left, for ordering moves. */
function buried(table: FreeCellTable): number {
  let total = 0;
  for (const column of table.tableau) {
    column.forEach((card, at) => {
      if (rankOf(card) === table.foundation[Math.floor(card / 13)] + 1) total += column.length - 1 - at;
    });
  }
  return total;
}

/** The moves worth trying from a table, the likeliest first. */
function candidates(table: FreeCellTable): FreeCellMove[] {
  const scored: { move: FreeCellMove; score: number }[] = [];
  const add = (move: FreeCellMove, score: number) => scored.push({ move, score });
  const cells = cellsOf(table);
  const freeCell = cells.find((cell) => table.cells[cellAt(cell)] === null);
  const emptyColumn = COLUMN_PILES.find((pile) => table.tableau[columnAt(pile)].length === 0);

  for (const from of cells) {
    const card = table.cells[cellAt(from)];
    if (card === null) continue;
    if (fitsFoundation(card, table.foundation)) add({ from, to: foundationPileOf(card), count: 1 }, 100);
    for (const to of COLUMN_PILES) {
      const top = table.tableau[columnAt(to)].at(-1);
      if (top !== undefined && follows(top, card)) add({ from, to, count: 1 }, 60);
    }
    if (emptyColumn !== undefined) add({ from, to: emptyColumn, count: 1 }, 20);
  }

  for (const from of COLUMN_PILES) {
    const column = table.tableau[columnAt(from)];
    const top = column.at(-1);
    if (top === undefined) continue;
    if (fitsFoundation(top, table.foundation)) add({ from, to: foundationPileOf(top), count: 1 }, 90);
    const run = runLength(column);
    for (const to of COLUMN_PILES) {
      if (to === from || table.tableau[columnAt(to)].length === 0) continue;
      const count = countOnto(table, from, to);
      if (count === null) continue;
      // The whole run, freeing the card under it or emptying the column, is worth most; a run split is worth little.
      const score = count === run ? (count === column.length ? 55 : 70 - Math.min(10, column.length - count)) : 15;
      add({ from, to, count }, score);
    }
    if (emptyColumn !== undefined && run < column.length) {
      const count = Math.min(run, mostCarried(table, true));
      add({ from, to: emptyColumn, count }, 30 + count);
    }
    if (freeCell !== undefined) {
      // Into a cell: better the shorter the column, as the card under it is nearer to being freed.
      add({ from, to: freeCell, count: 1 }, 10 - Math.min(9, column.length) + (run === 1 ? 5 : 0));
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((each) => each.move);
}

/** How far a table looks from won, the lower the nearer: cards not home, cards over the next ones wanted, cells filled. */
function distance(table: FreeCellTable): number {
  const home = table.foundation.reduce((sum, count) => sum + count, 0);
  const filled = table.cells.filter((card) => card !== null).length;
  const empty = table.tableau.filter((column) => column.length === 0).length;
  return (52 - home) * 6 + buried(table) * 1 + filled * 4 - empty * 6;
}

/**
 * A winning line from this table — every move a replay of it makes, the safe
 * ones home included — or null when none was found within `budget` tables.
 * Best first (`bestFirst`): the table that looks nearest to won is opened next.
 */
export function solveFreeCell(start: FreeCellTable, budget = 10_000): { moves: FreeCellMove[] | null; tables: number } {
  return bestFirst({ candidates, play: playFreeCell, settle: playSafe, won: freeCellWon, key: keyOf, distance }, start, budget);
}

