import type { FreeCellMove, FreeCellPile, FreeCellTable } from "./freecell.types";
import {
  CELL_PILES,
  COLUMN_PILES,
  cellAt,
  columnAt,
  fitsFoundation,
  foundationAt,
  foundationPileOf,
  freeCellWon,
  isCellPile,
  isColumnPile,
  isFoundationPile,
  movesFrom,
  playFreeCell,
  RANKS_A_SUIT,
  runLength,
} from "./rules";

/**
 * WHAT A PERSON MEANT, read against FreeCell's rules, as Solitaire's
 * `intent.ts` reads Klondike's: the card they took hold of or tapped, and
 * where they let it go or tapped next, as a move — or nothing. Pure, so every
 * way of moving a card goes through the same few lines.
 */

/** A card on the table, as a person points at it: the pile, and its place from the bottom (-1 for the pile's empty place). */
export type FreeCellSpot = { pile: FreeCellPile; index: number };

/** The cards of a pile, bottom first, as the table holds them. */
export function freeCellPileCards(table: FreeCellTable, pile: FreeCellPile): readonly number[] {
  if (isColumnPile(pile)) return table.tableau[columnAt(pile)];
  if (isCellPile(pile)) {
    const card = table.cells[cellAt(pile)];
    return card === null || card === undefined ? [] : [card];
  }
  const suit = foundationAt(pile);
  return Array.from({ length: table.foundation[suit] }, (_, at) => suit * RANKS_A_SUIT + at);
}

/**
 * The cards a person can take hold of from a spot, the one held and every one
 * on it, or none: a free cell's card, or a column's card with the run in order
 * on top of it. A foundation's cards stay home.
 */
export function freeCellLiftable(table: FreeCellTable, spot: FreeCellSpot): readonly number[] {
  if (isFoundationPile(spot.pile)) return [];
  const cards = freeCellPileCards(table, spot.pile);
  if (spot.index < 0 || spot.index >= cards.length) return [];
  if (isCellPile(spot.pile)) return cards;
  return cards.length - spot.index <= runLength(cards) ? cards.slice(spot.index) : [];
}

/** The move that carries the cards held at `from` to `to`, if the rules allow exactly those cards there. */
export function freeCellMoveFor(table: FreeCellTable, from: FreeCellSpot, to: FreeCellPile): FreeCellMove | null {
  const held = freeCellLiftable(table, from);
  if (from.pile === to || held.length === 0) return null;
  // A pile named by its letter: a free cell asked for as a whole is its own empty place, and any free one will do.
  const target = isCellPile(to) && table.cells[cellAt(to)] !== null ? CELL_PILES.slice(0, table.cells.length).find((cell) => table.cells[cellAt(cell)] === null) : to;
  if (target === undefined) return null;
  const move: FreeCellMove = { from: from.pile, to: target, count: held.length };
  return playFreeCell(table, move) === null ? null : move;
}

/** The move that sends a top card home, if it can go: what a double tap does. */
export function freeCellHomeMove(table: FreeCellTable, spot: FreeCellSpot): FreeCellMove | null {
  const held = freeCellLiftable(table, spot);
  if (held.length !== 1) return null;
  return freeCellMoveFor(table, spot, foundationPileOf(held[0]));
}

/**
 * THE GAME PLAYS ITSELF OUT once nothing is left to decide: when every card
 * still out can go home in turn, the lowest first, the moves that take them
 * there — or null while one cannot, and the player goes on.
 */
export function freeCellFinishingMoves(table: FreeCellTable): FreeCellMove[] | null {
  if (freeCellWon(table)) return null;
  const moves: FreeCellMove[] = [];
  let now = table;
  for (let moved = true; moved && !freeCellWon(now); ) {
    moved = false;
    for (const from of [...CELL_PILES.slice(0, now.cells.length), ...COLUMN_PILES]) {
      const card = isCellPile(from) ? now.cells[cellAt(from)] : now.tableau[columnAt(from)].at(-1);
      if (card === null || card === undefined || !fitsFoundation(card, now.foundation)) continue;
      const move: FreeCellMove = { from, to: foundationPileOf(card), count: 1 };
      now = playFreeCell(now, move)!;
      moves.push(move);
      moved = true;
      break;
    }
  }
  return freeCellWon(now) ? moves : null;
}

/** Whether nothing can be done but give up: no card can move anywhere. */
export function freeCellStuck(table: FreeCellTable): boolean {
  return !freeCellWon(table) && movesFrom(table).length === 0;
}
