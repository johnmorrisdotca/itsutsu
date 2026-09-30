import type { SpiderColumn, SpiderMove, SpiderTable } from "./spider.types";

/**
 * THE RULES OF SPIDER, pure: every function returns a new table and leaves the
 * one it was given alone, as Klondike's and FreeCell's do, so a game is its
 * deal and its moves.
 *
 * The rules as the site plays them:
 * - Two decks, dealt into ten columns: fifty-four cards, one to each column in
 *   turn, so the first four take six and the rest five, and only the top card
 *   of each face up. The other fifty are the stock.
 * - A card may go onto any card one higher, of any suit, or into an empty
 *   column. A run may move as a whole only if it is all one suit, in order.
 * - A full run of one suit, King down to Ace, is taken off the table by
 *   itself. Eight of them win the game.
 * - A face-down card left on top of a column turns over by itself.
 * - The stock deals one card face up onto every column at once, five times in
 *   all, and only while no column is empty.
 */

export const COLUMNS = 10;
export const RANKS_A_SUIT = 13;
/** Full runs to make: two decks of four suits. */
export const RUNS_TO_WIN = 8;
/** Cards dealt to the columns before play; the rest are the stock. */
export const DEALT = 54;
export const DECK_SIZE = 104;

export const suitOf = (card: number): number => Math.floor(card / RANKS_A_SUIT);
export const rankOf = (card: number): number => (card % RANKS_A_SUIT) + 1;

/** The suits a game of so many suits is played with, in `SUITS` order: spades; spades and hearts; all four. */
export function suitsFor(suits: number): number[] {
  if (suits === 1) return [0];
  if (suits === 2) return [0, 1];
  if (suits === 4) return [0, 1, 2, 3];
  throw new Error(`Spider is played with one suit, two or four, not ${suits}`);
}

/** The hundred and four cards of a game of so many suits, sorted: each suit's thirteen, as many times as fill two decks. */
export function spiderDeck(suits: number): number[] {
  const kept = suitsFor(suits);
  const deck: number[] = [];
  for (let copy = 0; copy < RUNS_TO_WIN / kept.length; copy += 1) {
    for (const suit of kept) for (let rank = 0; rank < RANKS_A_SUIT; rank += 1) deck.push(suit * RANKS_A_SUIT + rank);
  }
  return deck;
}

/** Deal a shuffled deck (card numbers, the first dealt first) into a table. */
export function dealSpider(deck: readonly number[]): SpiderTable {
  if (deck.length !== DECK_SIZE) throw new Error("a Spider deal needs two whole decks");
  const columns: number[][] = Array.from({ length: COLUMNS }, () => []);
  deck.slice(0, DEALT).forEach((card, at) => columns[at % COLUMNS].push(card));
  return { tableau: columns.map((cards) => ({ down: cards.length - 1, cards })), stock: deck.slice(DEALT), done: [] };
}

/** How many cards on top of a column are one suit and in order, all face up: the most a carry can take. */
export function runLength(column: SpiderColumn): number {
  const { cards, down } = column;
  if (cards.length === 0) return 0;
  let length = 1;
  while (cards.length - length - 1 >= down) {
    const under = cards[cards.length - length - 1];
    const over = cards[cards.length - length];
    if (suitOf(under) !== suitOf(over) || rankOf(under) !== rankOf(over) + 1) break;
    length += 1;
  }
  return length;
}

/** A column with its top turned over, if what is left on top lies face down. */
function turned(column: SpiderColumn): SpiderColumn {
  return { down: Math.min(column.down, Math.max(0, column.cards.length - 1)), cards: column.cards };
}

/** A column with a full run taken off its top, if it has one: the column, and the suit taken, or null. */
function takeRun(column: SpiderColumn): { column: SpiderColumn; suit: number | null } {
  if (column.cards.length < RANKS_A_SUIT || runLength(column) < RANKS_A_SUIT) return { column, suit: null };
  const top = column.cards[column.cards.length - 1];
  // A run of thirteen in order ends on an Ace, and so starts at a King.
  if (rankOf(top) !== 1) return { column, suit: null };
  return { column: turned({ down: column.down, cards: column.cards.slice(0, -RANKS_A_SUIT) }), suit: suitOf(top) };
}

/** Every column checked for a full run after cards land on it, in order from the left. */
function settle(tableau: readonly SpiderColumn[], done: readonly number[], landed: readonly number[]): { tableau: SpiderColumn[]; done: number[] } {
  const columns = [...tableau];
  const taken = [...done];
  for (const at of landed) {
    const { column, suit } = takeRun(columns[at]);
    if (suit === null) continue;
    columns[at] = column;
    taken.push(suit);
  }
  return { tableau: columns, done: taken };
}

/** Whether the stock can deal now: cards left, and no column empty. */
export function canDeal(table: SpiderTable): boolean {
  return table.stock.length > 0 && table.tableau.every((column) => column.cards.length > 0);
}

/** The table after a move, or null where the rules refuse it. */
export function playSpider(table: SpiderTable, move: SpiderMove): SpiderTable | null {
  if (move.kind === "deal") {
    if (!canDeal(table)) return null;
    const dealt = table.tableau.map((column, at) => ({ down: column.down, cards: [...column.cards, table.stock[at]] }));
    const settled = settle(dealt, table.done, dealt.map((_, at) => at));
    return { tableau: settled.tableau, stock: table.stock.slice(COLUMNS), done: settled.done };
  }
  const { from, to, count } = move;
  if (from === to || !Number.isInteger(count) || count < 1) return null;
  if (!(from >= 0 && from < COLUMNS && to >= 0 && to < COLUMNS)) return null;
  const source = table.tableau[from];
  if (count > runLength(source)) return null;
  const foot = source.cards[source.cards.length - count];
  const target = table.tableau[to];
  const top = target.cards.at(-1);
  if (top !== undefined && rankOf(top) !== rankOf(foot) + 1) return null;
  const tableau = table.tableau.map((column, at) => {
    if (at === from) return turned({ down: column.down, cards: column.cards.slice(0, column.cards.length - count) });
    if (at === to) return { down: column.down, cards: [...column.cards, ...source.cards.slice(source.cards.length - count)] };
    return column;
  });
  const settled = settle(tableau, table.done, [to]);
  return { ...table, tableau: settled.tableau, done: settled.done };
}

/**
 * How many cards a carry from one column onto another takes, where it is not
 * the player's to say: onto a card, the one count whose foot is one lower.
 * Into an empty column any count up to the run would do, so none is chosen here.
 */
export function countOnto(table: SpiderTable, from: number, to: number): number | null {
  const top = table.tableau[to].cards.at(-1);
  if (top === undefined) return null;
  const source = table.tableau[from];
  const run = runLength(source);
  for (let count = 1; count <= run; count += 1) {
    if (rankOf(source.cards[source.cards.length - count]) + 1 === rankOf(top)) return count;
  }
  return null;
}

/** Whether all eight runs are made. */
export function spiderWon(table: SpiderTable): boolean {
  return table.done.length === RUNS_TO_WIN;
}

/** Whether every card is dealt and face up: from here the game plays itself out, where it can (`finishingMoves`). */
export function allShowing(table: SpiderTable): boolean {
  return table.stock.length === 0 && table.tableau.every((column) => column.down === 0);
}

/** Every move the rules allow from a table, one of each (the whole run into an empty column), for a stuck-game check. */
export function movesFrom(table: SpiderTable): SpiderMove[] {
  const moves: SpiderMove[] = [];
  table.tableau.forEach((column, from) => {
    if (column.cards.length === 0) return;
    for (let to = 0; to < COLUMNS; to += 1) {
      if (to === from) continue;
      const count = countOnto(table, from, to) ?? (table.tableau[to].cards.length === 0 ? runLength(column) : null);
      if (count !== null) moves.push({ kind: "carry", from, to, count });
    }
  });
  if (canDeal(table)) moves.push({ kind: "deal" });
  return moves;
}
