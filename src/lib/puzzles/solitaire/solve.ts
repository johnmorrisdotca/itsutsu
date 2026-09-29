import {
  COLUMN_PILES,
  FOUNDATION_PILES,
  carriedFrom,
  columnAt,
  fitsColumn,
  fitsFoundation,
  foundationPileOf,
  klondikeWon,
  playKlondike,
  rankOf,
  redCard,
} from "./klondike";
import type { KlondikeMove, KlondikePile, KlondikeTable } from "./solitaire.types";

/**
 * A KLONDIKE SOLVER, in the browser: it finds a winning line for a deal, or
 * gives up after a fixed number of tables, never after a fixed time — so the
 * same deal gets the same answer on a phone, a desk and the server, and a seed
 * that was winnable yesterday is winnable today.
 *
 * Depth first, with three things that make it quick enough:
 * - SAFE MOVES ARE MADE AT ONCE, without branching: a card goes home when no
 *   card left on the table could ever want to be put on it (both foundations
 *   of the other colour are within one of it), or it is an Ace or a Two.
 * - TABLES ARE SEEN ONCE: every table is remembered by what matters — the
 *   foundations, the stock and waste, the passes used, and the columns in any
 *   order, since two tables whose columns are the same seven in another order
 *   are the same game.
 * - THE LIKELY MOVES ARE TRIED FIRST: home, then a move that turns a card over
 *   (the column with most still face down first), then the waste onto a
 *   column, then a column emptied or a card freed for home, and the stock last.
 *
 * It does not try every legal move — a run moved for no reason, a foundation
 * card brought down without a use for it — so it can miss a win that needs
 * one. That makes it a finder of wins, never a judge of losses: "winnable"
 * here means it found the line, and it is only ever said of a deal it has.
 */

/** Whether a card may go home now with nothing on the table ever wanting it. */
function safeHome(card: number, foundation: readonly number[]): boolean {
  if (!fitsFoundation(card, foundation)) return false;
  const rank = rankOf(card);
  if (rank <= 2) return true;
  const red = redCard(card);
  // Both suits of the other colour: every card of theirs that could go on this one is already home.
  const others = [0, 1, 2, 3].filter((suit) => (suit === 1 || suit === 2) !== red);
  return others.every((suit) => foundation[suit] >= rank - 1);
}

/** Make every safe move home, from the waste and the columns, until there is none: the table and the moves made. */
function playSafe(table: KlondikeTable): { table: KlondikeTable; moves: KlondikeMove[] } {
  const moves: KlondikeMove[] = [];
  let now = table;
  for (let found = true; found; ) {
    found = false;
    const tops: KlondikePile[] = ["w", ...COLUMN_PILES];
    for (const from of tops) {
      const card = from === "w" ? now.waste.at(-1) : now.tableau[columnAt(from)].cards.at(-1);
      if (card === undefined || !safeHome(card, now.foundation)) continue;
      const move: KlondikeMove = { kind: "carry", from, to: foundationPileOf(card) };
      const next = playKlondike(now, move);
      if (next === null) continue;
      now = next;
      moves.push(move);
      found = true;
    }
  }
  return { table: now, moves };
}

const letter = (card: number) => String.fromCharCode(48 + card);

/** What a table is, for having seen it: its columns in any order, since the order of the seven changes nothing. */
function keyOf(table: KlondikeTable): string {
  const columns = table.tableau.map((column) => `${column.down}${column.cards.map(letter).join("")}`).sort();
  const passes = Number.isFinite(table.rules.passes) ? table.recycles : 0;
  return `${table.foundation.join("")}|${table.stock.map(letter).join("")}|${table.waste.map(letter).join("")}|${passes}|${columns.join("/")}`;
}

/** The moves worth trying from a table, the likeliest first. */
function candidates(table: KlondikeTable): KlondikeMove[] {
  const home: KlondikeMove[] = [];
  const turning: { move: KlondikeMove; down: number }[] = [];
  const fromWaste: KlondikeMove[] = [];
  const later: KlondikeMove[] = [];
  const carry = (from: KlondikePile, to: KlondikePile): KlondikeMove => ({ kind: "carry", from, to });

  const waste = table.waste.at(-1);
  if (waste !== undefined && fitsFoundation(waste, table.foundation)) home.push(carry("w", foundationPileOf(waste)));
  table.tableau.forEach((column, index) => {
    const top = column.cards.at(-1);
    if (top !== undefined && fitsFoundation(top, table.foundation)) home.push(carry(COLUMN_PILES[index], foundationPileOf(top)));
  });

  table.tableau.forEach((column, index) => {
    const from = COLUMN_PILES[index];
    for (const to of COLUMN_PILES) {
      if (to === from) continue;
      const at = carriedFrom(table, index, to);
      if (at === null) continue;
      const empty = table.tableau[columnAt(to)].cards.length === 0;
      if (at === column.down && column.down > 0) {
        // The whole face-up run, turning over the card under it. Onto an empty column only once, not to each.
        if (!empty || firstEmpty(table) === to) turning.push({ move: carry(from, to), down: column.down });
      } else if (at === column.down) {
        // The whole run off a column with nothing under it: worth it only to empty the column onto a card, never into another space.
        if (!empty) later.push(carry(from, to));
      } else {
        // Part of a run, worth it when the card it uncovers can then go home.
        const under = column.cards[at - 1];
        if (fitsFoundation(under, table.foundation)) later.push(carry(from, to));
      }
    }
  });

  if (waste !== undefined) {
    let toEmpty = false;
    for (const to of COLUMN_PILES) {
      const column = table.tableau[columnAt(to)];
      if (!fitsColumn(waste, column)) continue;
      if (column.cards.length === 0) {
        if (toEmpty) continue;
        toEmpty = true;
      }
      fromWaste.push(carry("w", to));
    }
  }

  // A foundation's top card brought down, where the waste's top card or a column's run could then go onto it.
  FOUNDATION_PILES.forEach((pile, suit) => {
    const count = table.foundation[suit];
    if (count < 3) return;
    const card = suit * 13 + count - 1;
    const wanted = [waste, ...table.tableau.map((column) => column.cards[column.down])].some(
      (other) => other !== undefined && rankOf(other) === rankOf(card) - 1 && redCard(other) !== redCard(card),
    );
    if (!wanted) return;
    for (const to of COLUMN_PILES) if (fitsColumn(card, table.tableau[columnAt(to)])) later.push(carry(pile, to));
  });

  const stock: KlondikeMove[] = table.stock.length > 0 ? [{ kind: "draw" }] : table.waste.length > 0 ? [{ kind: "recycle" }] : [];
  turning.sort((a, b) => b.down - a.down);
  return [...home, ...turning.map((each) => each.move), ...fromWaste, ...later, ...stock];
}

function firstEmpty(table: KlondikeTable): KlondikePile | null {
  const at = table.tableau.findIndex((column) => column.cards.length === 0);
  return at < 0 ? null : COLUMN_PILES[at];
}

type Frame = { table: KlondikeTable; tries: KlondikeMove[]; next: number; via: KlondikeMove[] };

/**
 * A winning line from this table — every move, the safe ones home included,
 * that a replay of it makes — or null when none was found within `budget`
 * tables. `budget` is a count, never a time, so every browser agrees.
 */
export function solveKlondike(start: KlondikeTable, budget = 60_000): { moves: KlondikeMove[] | null; tables: number } {
  const seen = new Set<string>();
  const first = playSafe(start);
  if (klondikeWon(first.table)) return { moves: first.moves, tables: 1 };
  seen.add(keyOf(first.table));
  const stack: Frame[] = [{ table: first.table, tries: candidates(first.table), next: 0, via: first.moves }];
  let tables = 1;
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (frame.next >= frame.tries.length) {
      stack.pop();
      continue;
    }
    const move = frame.tries[frame.next++];
    const played = playKlondike(frame.table, move);
    if (played === null) continue;
    const safe = playSafe(played);
    if (klondikeWon(safe.table)) {
      return { moves: [...stack.flatMap((each) => each.via), move, ...safe.moves], tables };
    }
    const key = keyOf(safe.table);
    if (seen.has(key)) continue;
    seen.add(key);
    tables += 1;
    if (tables > budget) return { moves: null, tables };
    stack.push({ table: safe.table, tries: candidates(safe.table), next: 0, via: [move, ...safe.moves] });
  }
  return { moves: null, tables };
}

/** Whether a card is one the solver treats as home safely: exported for its test. */
export const isSafeHome = safeHome;
