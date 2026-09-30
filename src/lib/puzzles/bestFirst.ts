/**
 * A BEST-FIRST SEARCH for a card game played alone, shared by FreeCell's
 * solver and Spider's (`freecell/solve.ts`, `spider/solve.ts`).
 *
 * The table that looks nearest to won is opened next (`distance`, the lower
 * the nearer), ties in the order they were found, and every table is opened
 * once (`key`). It gives up after a fixed number of tables, never after a
 * fixed time, so the same deal gets the same answer on a phone, a desk and the
 * server — which is what lets a seed name "the first winnable deal from here"
 * in every browser alike.
 *
 * `settle` is what a game does by itself after every move (FreeCell's safe
 * cards sent home): its moves are part of the line, so a replay of the line
 * makes exactly the tables the search saw.
 */
export type BestFirstGame<Table, Move> = {
  candidates: (table: Table) => Move[];
  play: (table: Table, move: Move) => Table | null;
  settle?: (table: Table) => { table: Table; moves: Move[] };
  won: (table: Table) => boolean;
  key: (table: Table) => string;
  distance: (table: Table) => number;
};

type Node<Table, Move> = { table: Table; parent: Node<Table, Move> | null; via: Move[]; score: number; order: number };

/** A heap of nodes, the lowest score first, ties to the one found first. */
class Heap<Table, Move> {
  private items: Node<Table, Move>[] = [];
  get size(): number {
    return this.items.length;
  }
  private less(a: number, b: number): boolean {
    const x = this.items[a];
    const y = this.items[b];
    return x.score < y.score || (x.score === y.score && x.order < y.order);
  }
  private swap(a: number, b: number): void {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
  }
  push(node: Node<Table, Move>): void {
    this.items.push(node);
    for (let at = this.items.length - 1; at > 0; ) {
      const up = (at - 1) >> 1;
      if (!this.less(at, up)) break;
      this.swap(at, up);
      at = up;
    }
  }
  pop(): Node<Table, Move> {
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length === 0) return top;
    this.items[0] = last;
    for (let at = 0; ; ) {
      const left = 2 * at + 1;
      let least = at;
      if (left < this.items.length && this.less(left, least)) least = left;
      if (left + 1 < this.items.length && this.less(left + 1, least)) least = left + 1;
      if (least === at) break;
      this.swap(at, least);
      at = least;
    }
    return top;
  }
}

function lineTo<Table, Move>(node: Node<Table, Move>): Move[] {
  const parts: Move[][] = [];
  for (let at: Node<Table, Move> | null = node; at !== null; at = at.parent) parts.push(at.via);
  return parts.reverse().flat();
}

/**
 * A winning line from this table — every move a replay of it makes, the
 * settling ones included — or null when none was found within `budget` tables.
 */
export function bestFirst<Table, Move>(game: BestFirstGame<Table, Move>, start: Table, budget: number): { moves: Move[] | null; tables: number } {
  const settle = game.settle ?? ((table: Table) => ({ table, moves: [] as Move[] }));
  const first = settle(start);
  if (game.won(first.table)) return { moves: first.moves, tables: 1 };
  const seen = new Set<string>([game.key(first.table)]);
  const open = new Heap<Table, Move>();
  let order = 0;
  open.push({ table: first.table, parent: null, via: first.moves, score: game.distance(first.table), order: order++ });
  let tables = 1;
  while (open.size > 0) {
    const node = open.pop();
    for (const move of game.candidates(node.table)) {
      const played = game.play(node.table, move);
      if (played === null) continue;
      const settled = settle(played);
      const child: Node<Table, Move> = { table: settled.table, parent: node, via: [move, ...settled.moves], score: 0, order: order++ };
      if (game.won(settled.table)) return { moves: lineTo(child), tables };
      const key = game.key(settled.table);
      if (seen.has(key)) continue;
      seen.add(key);
      tables += 1;
      if (tables > budget) return { moves: null, tables };
      child.score = game.distance(settled.table);
      open.push(child);
    }
  }
  return { moves: null, tables };
}
