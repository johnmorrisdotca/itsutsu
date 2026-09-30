import { bestFirst } from "../bestFirst";

import type { SpiderMove, SpiderTable } from "./spider.types";
import { COLUMNS, canDeal, countOnto, playSpider, rankOf, runLength, spiderWon, suitOf } from "./rules";

/**
 * A SPIDER SOLVER, in the browser: best first (`bestFirst`), giving up after
 * a fixed number of tables, never after a fixed time, so the same deal gets
 * the same answer everywhere, and a seed can name "the first deal from here it
 * wins".
 *
 * The moves it tries are the ones that change something: a run onto a card
 * one higher where it frees what was under it or joins its own suit, a run
 * into an empty column where it leaves something behind, and the stock last.
 * Moving a run from one card that takes it onto another of the same rank and
 * no better suit is left out, as nothing a person wants.
 *
 * It finds wins and never judges losses: a deal is called winnable only once
 * it has won it.
 */

/** Whether a column's cards `at` and `at + 1` are in one suit and in order. */
function joined(cards: readonly number[], at: number): boolean {
  return suitOf(cards[at]) === suitOf(cards[at + 1]) && rankOf(cards[at]) === rankOf(cards[at + 1]) + 1;
}

/** The moves worth trying from a table, the likeliest first. */
function candidates(table: SpiderTable): SpiderMove[] {
  const scored: { move: SpiderMove; score: number }[] = [];
  const empty = table.tableau.findIndex((column) => column.cards.length === 0);
  table.tableau.forEach((column, from) => {
    const size = column.cards.length;
    if (size === 0) return;
    const run = runLength(column);
    for (let to = 0; to < COLUMNS; to += 1) {
      if (to === from || table.tableau[to].cards.length === 0) continue;
      const count = countOnto(table, from, to);
      if (count === null) continue;
      const foot = column.cards[size - count];
      const top = table.tableau[to].cards.at(-1)!;
      const sameSuit = suitOf(top) === suitOf(foot);
      const under = size - count - 1;
      // What the card under the run was to it: nothing (the column empties), a face-down card, or a card it already sits on.
      const frees = under < 0 || under < column.down;
      const sitsOnRank = !frees && rankOf(column.cards[under]) === rankOf(foot) + 1;
      if (sitsOnRank && (!sameSuit || joined(column.cards, under))) continue;
      let score = sameSuit ? 40 : 10;
      if (under < 0) score += 30;
      else if (under < column.down) score += 25 + (column.down > 3 ? 5 : 0);
      else if (!sitsOnRank) score += count === run ? 5 : 0;
      score += Math.min(count, 5);
      scored.push({ move: { kind: "carry", from, to, count }, score });
    }
    if (empty >= 0 && run < size) {
      scored.push({ move: { kind: "carry", from, to: empty, count: run }, score: column.down >= size - run ? 20 : 5 });
    }
  });
  scored.sort((a, b) => b.score - a.score);
  const moves = scored.map((each) => each.move);
  if (canDeal(table)) moves.push({ kind: "deal" });
  return moves;
}

const letter = (card: number) => String.fromCharCode(48 + card);

/** What a table is, for having seen it: its columns in any order, the stock by how much of it is left, and the runs made. */
function keyOf(table: SpiderTable): string {
  const columns = table.tableau.map((column) => `${column.down}${column.cards.map(letter).join("")}`).sort();
  return `${table.stock.length}|${table.done.length}|${columns.join("/")}`;
}

/** How far a table looks from won, the lower the nearer: runs not made, cards face down, and breaks in the face-up cards. */
function distance(table: SpiderTable): number {
  let breaks = 0;
  let down = 0;
  let empty = 0;
  for (const column of table.tableau) {
    down += column.down;
    if (column.cards.length === 0) empty += 1;
    for (let at = column.down; at < column.cards.length - 1; at += 1) if (!joined(column.cards, at)) breaks += 1;
  }
  return (8 - table.done.length) * 80 + down * 6 + breaks * 4 + table.stock.length * 2 - empty * 12;
}

/** A winning line from this table, or null when none was found within `budget` tables. */
export function solveSpider(start: SpiderTable, budget = 10_000): { moves: SpiderMove[] | null; tables: number } {
  return bestFirst({ candidates, play: playSpider, won: spiderWon, key: keyOf, distance }, start, budget);
}
