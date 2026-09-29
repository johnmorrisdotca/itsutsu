import type { KlondikeColumn, KlondikeMove, KlondikePile, KlondikeRules, KlondikeTable } from "./solitaire.types";

/**
 * THE RULES OF KLONDIKE, pure: every function returns a new table and leaves
 * the one it was given alone, as the engine does, so a game is its deal and
 * its moves, and a table read back from a kept run is exactly the one its
 * moves make.
 *
 * The rules as the site plays them:
 * - Seven columns dealt from the left, one card more in each, the top card of
 *   each face up; the other twenty-four are the stock.
 * - Turn one card or three from the stock onto the waste (`draw`). Once the
 *   stock is empty the waste may be turned back over as the stock, as many
 *   times as the passes allow (`recycle`): unlimited, three passes in all, or one.
 * - A column is built down in alternating colours; any face-up run may move
 *   as a whole onto a card one higher of the other colour, and only a King, or
 *   a run headed by one, may fill an empty column.
 * - Each suit's foundation is built up from its Ace. A foundation's top card
 *   may come back down onto a column.
 * - A face-down card left on top of a column turns over by itself.
 */

export const COLUMNS = 7;
export const RANKS_A_SUIT = 13;
/** The foundations' letters, in `SUITS` order (spades, hearts, diamonds, clubs), as a card id writes a suit. */
export const FOUNDATION_PILES = ["S", "H", "D", "C"] as const satisfies readonly KlondikePile[];
export const COLUMN_PILES = ["1", "2", "3", "4", "5", "6", "7"] as const satisfies readonly KlondikePile[];

export const suitOf = (card: number): number => Math.floor(card / RANKS_A_SUIT);
export const rankOf = (card: number): number => (card % RANKS_A_SUIT) + 1;
/** Hearts and diamonds, the second and third suits. */
export const redCard = (card: number): boolean => suitOf(card) === 1 || suitOf(card) === 2;

export function isColumnPile(pile: KlondikePile): boolean {
  return pile >= "1" && pile <= "7";
}
export function isFoundationPile(pile: KlondikePile): boolean {
  return (FOUNDATION_PILES as readonly string[]).includes(pile);
}
export function columnAt(pile: KlondikePile): number {
  return Number(pile) - 1;
}
export function foundationAt(pile: KlondikePile): number {
  return (FOUNDATION_PILES as readonly string[]).indexOf(pile);
}

/** Deal a deck (card numbers, the first dealt first) into a table: column by column along each row, as a dealer does. */
export function dealKlondike(deck: readonly number[], rules: KlondikeRules): KlondikeTable {
  if (deck.length !== 4 * RANKS_A_SUIT) throw new Error("a Klondike deal needs the whole deck");
  const columns: number[][] = Array.from({ length: COLUMNS }, () => []);
  let at = 0;
  for (let row = 0; row < COLUMNS; row += 1) {
    for (let column = row; column < COLUMNS; column += 1) columns[column].push(deck[at++]);
  }
  // What is left, the stock, with the next card to turn last: the rest of the deck, turned face down as it lies.
  const stock = deck.slice(at).reverse();
  return {
    rules,
    tableau: columns.map((cards) => ({ down: cards.length - 1, cards })),
    stock,
    waste: [],
    foundation: [0, 0, 0, 0],
    recycles: 0,
  };
}

/** Whether a card may go onto a column: onto a card one higher of the other colour, or a King onto an empty one. */
export function fitsColumn(card: number, column: KlondikeColumn): boolean {
  const top = column.cards.at(-1);
  if (top === undefined) return rankOf(card) === RANKS_A_SUIT;
  return column.cards.length > column.down && rankOf(top) === rankOf(card) + 1 && redCard(top) !== redCard(card);
}

/** Whether a card may go onto its suit's foundation now. */
export function fitsFoundation(card: number, foundation: readonly number[]): boolean {
  return foundation[suitOf(card)] === rankOf(card) - 1;
}

/** A column's cards from `at` up, and what is left, with the new top turned over if it was face down. */
function lift(column: KlondikeColumn, at: number): { carried: number[]; left: KlondikeColumn } {
  const carried = column.cards.slice(at);
  const cards = column.cards.slice(0, at);
  const down = Math.min(column.down, Math.max(0, cards.length - 1));
  return { carried, left: { down, cards } };
}

/**
 * Which card of a column a carry to `to` would take: the one face-up card whose
 * run fits there, or null. A column's face-up cards are a single run, so only
 * one card in it can be one below the target's top, and only its foot can be a King.
 */
export function carriedFrom(table: KlondikeTable, column: number, to: KlondikePile): number | null {
  const from = table.tableau[column];
  if (isFoundationPile(to)) {
    // Only ever the top card goes home.
    const top = from.cards.at(-1);
    return top !== undefined && foundationAt(to) === suitOf(top) && fitsFoundation(top, table.foundation) ? from.cards.length - 1 : null;
  }
  for (let at = from.down; at < from.cards.length; at += 1) {
    if (fitsColumn(from.cards[at], table.tableau[columnAt(to)])) return at;
  }
  return null;
}

function replaceColumn(tableau: readonly KlondikeColumn[], index: number, column: KlondikeColumn): KlondikeColumn[] {
  return tableau.map((each, at) => (at === index ? column : each));
}

function withFoundation(foundation: readonly number[], suit: number, count: number): number[] {
  return foundation.map((each, at) => (at === suit ? count : each));
}

/** How many times the waste may still be turned back: passes less one, less those already made. */
export function recyclesLeft(table: KlondikeTable): number {
  return table.rules.passes - 1 - table.recycles;
}

/** The table after a move, or null where the rules refuse it. */
export function playKlondike(table: KlondikeTable, move: KlondikeMove): KlondikeTable | null {
  if (move.kind === "draw") {
    if (table.stock.length === 0) return null;
    const turned = Math.min(table.rules.draw, table.stock.length);
    // One at a time off the top of the stock onto the waste, so the last turned is the one on top.
    const taken = table.stock.slice(table.stock.length - turned).reverse();
    return { ...table, stock: table.stock.slice(0, table.stock.length - turned), waste: [...table.waste, ...taken] };
  }
  if (move.kind === "recycle") {
    if (table.stock.length > 0 || table.waste.length === 0 || recyclesLeft(table) <= 0) return null;
    return { ...table, stock: [...table.waste].reverse(), waste: [], recycles: table.recycles + 1 };
  }
  const { from, to } = move;
  if (from === to || to === "s" || to === "w" || from === "s") return null;

  // The cards carried, and the table without them.
  let carried: number[];
  let rest: KlondikeTable;
  if (from === "w") {
    const card = table.waste.at(-1);
    if (card === undefined) return null;
    carried = [card];
    rest = { ...table, waste: table.waste.slice(0, -1) };
  } else if (isFoundationPile(from)) {
    const suit = foundationAt(from);
    const count = table.foundation[suit];
    if (count === 0 || isFoundationPile(to)) return null;
    carried = [suit * RANKS_A_SUIT + count - 1];
    rest = { ...table, foundation: withFoundation(table.foundation, suit, count - 1) };
  } else {
    const column = columnAt(from);
    const at = carriedFrom(table, column, to);
    if (at === null) return null;
    const lifted = lift(table.tableau[column], at);
    carried = lifted.carried;
    rest = { ...table, tableau: replaceColumn(table.tableau, column, lifted.left) };
  }

  const foot = carried[0];
  if (isFoundationPile(to)) {
    if (carried.length !== 1 || foundationAt(to) !== suitOf(foot) || !fitsFoundation(foot, rest.foundation)) return null;
    return { ...rest, foundation: withFoundation(rest.foundation, suitOf(foot), rankOf(foot)) };
  }
  const target = columnAt(to);
  if (!fitsColumn(foot, rest.tableau[target])) return null;
  const onto = rest.tableau[target];
  return { ...rest, tableau: replaceColumn(rest.tableau, target, { down: onto.down, cards: [...onto.cards, ...carried] }) };
}

/** Whether every card is home. */
export function klondikeWon(table: KlondikeTable): boolean {
  return table.foundation.every((count) => count === RANKS_A_SUIT);
}

/** Whether every card on the columns is face up: from here the game plays itself out (`autoFinish`). */
export function allFaceUp(table: KlondikeTable): boolean {
  return table.tableau.every((column) => column.down === 0);
}

/** The foundation a card goes to. */
export function foundationPileOf(card: number): KlondikePile {
  return FOUNDATION_PILES[suitOf(card)];
}

/**
 * Every move the rules allow from this table, in a fixed order: to the
 * foundations first, then onto the columns, then the stock. The table's own
 * list, for a solver and a stuck-game check; a person's move is checked by
 * `playKlondike` alone.
 */
export function movesFrom(table: KlondikeTable): KlondikeMove[] {
  const moves: KlondikeMove[] = [];
  const carry = (from: KlondikePile, to: KlondikePile) => {
    if (playKlondike(table, { kind: "carry", from, to }) !== null) moves.push({ kind: "carry", from, to });
  };
  const tops: KlondikePile[] = ["w", ...COLUMN_PILES];
  for (const from of tops) {
    const card = from === "w" ? table.waste.at(-1) : table.tableau[columnAt(from)].cards.at(-1);
    if (card !== undefined) carry(from, foundationPileOf(card));
  }
  for (const from of [...tops, ...FOUNDATION_PILES]) for (const to of COLUMN_PILES) if (from !== to) carry(from, to);
  if (table.stock.length > 0) moves.push({ kind: "draw" });
  else if (playKlondike(table, { kind: "recycle" }) !== null) moves.push({ kind: "recycle" });
  return moves;
}
