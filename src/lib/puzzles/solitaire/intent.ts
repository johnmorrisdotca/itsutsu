import {
  allFaceUp,
  carriedFrom,
  columnAt,
  foundationAt,
  foundationPileOf,
  isColumnPile,
  isFoundationPile,
  klondikeWon,
  movesFrom,
  playKlondike,
  RANKS_A_SUIT,
} from "./klondike";
import { solveKlondike } from "./solve";
import type { KlondikeMove, KlondikePile, KlondikeTable } from "./solitaire.types";

/**
 * WHAT A PERSON MEANT, read against the rules: the card they took hold of or
 * tapped, and where they let it go or tapped next, as a move — or nothing.
 * Pure, so every way of moving a card (a drag, two taps, a double tap, a key)
 * goes through the same few lines, and a test can drive them without a browser.
 */

/** A card on the table, as a person points at it: the pile, and its place from the bottom (-1 for the pile's empty place). */
export type TableSpot = { pile: KlondikePile; index: number };

/** The cards of a pile, bottom first, as the table holds them. */
export function pileCards(table: KlondikeTable, pile: KlondikePile): readonly number[] {
  if (pile === "s") return table.stock;
  if (pile === "w") return table.waste;
  if (isFoundationPile(pile)) {
    const suit = foundationAt(pile);
    return Array.from({ length: table.foundation[suit] }, (_, at) => suit * RANKS_A_SUIT + at);
  }
  return table.tableau[columnAt(pile)].cards;
}

/**
 * The cards a person can take hold of from a spot, the one held and every one
 * on it, or none: the waste's top card, a foundation's top card, or any
 * face-up card of a column with the run on top of it.
 */
export function liftable(table: KlondikeTable, spot: TableSpot): readonly number[] {
  const cards = pileCards(table, spot.pile);
  if (spot.index < 0 || spot.index >= cards.length || spot.pile === "s") return [];
  if (!isColumnPile(spot.pile)) return spot.index === cards.length - 1 ? [cards[spot.index]] : [];
  const column = table.tableau[columnAt(spot.pile)];
  return spot.index >= column.down ? cards.slice(spot.index) : [];
}

/**
 * The move that carries the cards held at `from` to `to`, if the rules allow
 * exactly those cards there. A column gives up the one run that fits, so the
 * card held must be that run's foot: holding the 7 of a 9-8-7 and letting it
 * go on an 8 carries the 7, never the 9 that happens to fit somewhere.
 */
export function moveFor(table: KlondikeTable, from: TableSpot, to: KlondikePile): KlondikeMove | null {
  if (from.pile === to || liftable(table, from).length === 0) return null;
  if (isColumnPile(from.pile) && carriedFrom(table, columnAt(from.pile), to) !== from.index) return null;
  const move: KlondikeMove = { kind: "carry", from: from.pile, to };
  return playKlondike(table, move) === null ? null : move;
}

/** The move that sends a top card home, if it can go: what a double tap does. */
export function homeMove(table: KlondikeTable, spot: TableSpot): KlondikeMove | null {
  const held = liftable(table, spot);
  if (held.length !== 1) return null;
  return moveFor(table, spot, foundationPileOf(held[0]));
}

/** What a press on the stock does: turn it, or turn the waste back over, or nothing once the passes are spent. */
export function stockMove(table: KlondikeTable): KlondikeMove | null {
  const move: KlondikeMove = table.stock.length > 0 ? { kind: "draw" } : { kind: "recycle" };
  return playKlondike(table, move) === null ? null : move;
}

/**
 * THE GAME PLAYS ITSELF OUT once every card on the columns is face up: the
 * moves that bring the rest home, found by the solver on a small budget (a
 * table with nothing hidden is solved in a handful of tables), or null while a
 * card is still face down or no way home is found — then the player goes on.
 */
export function finishingMoves(table: KlondikeTable): KlondikeMove[] | null {
  if (!allFaceUp(table) || klondikeWon(table)) return null;
  return solveKlondike(table, 2000).moves;
}

/**
 * Whether nothing can be done but give up: no card can move anywhere, and the
 * stock can be neither turned nor turned back. With passes left a person may
 * still turn the stock for a card they need, so this is only ever said of the
 * one table where it is certainly true.
 */
export function stuck(table: KlondikeTable): boolean {
  return !klondikeWon(table) && movesFrom(table).length === 0;
}
