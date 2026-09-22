import { createGame, indexOf, isStone, otherStone, pieceMoves, pointOf } from "../engine";
import { STONES } from "../gomoku.constants";
import { farCampSquares } from "../rules/farCamp";
import type { Cell, GameState, Point, RuleVariant, Stone } from "../gomoku.types";

/**
 * The board a race is run on, measured once and kept.
 *
 * Halma and Chinese Checkers are the same game on two lattices — step to a
 * neighbouring cell, or chain jumps over anything into the cell beyond, and
 * get every piece into the camp opposite. What separates a player that races
 * from one that wanders is knowing HOW FAR a cell is from home, and the shared
 * reading has never known: `campDistance` in `opponentFamilies.ts` measures it
 * as |Δrow| + |Δcol|, which is the right answer on neither board. Halma's
 * pieces step diagonally, so a Manhattan count charges two for one step; the
 * star's cells are a hex lattice embedded in a square array, so the same count
 * charges two for some steps and one for others depending which way they lean.
 * A distance that is wrong by a factor that varies with direction is a compass
 * that points differently depending where you are standing.
 *
 * So the distance here is COUNTED, by breadth-first search over the lattice's
 * own steps: the exact number of single steps from one cell to another on an
 * empty board. Exact rather than estimated, because it is the whole of what a
 * race position is worth and the search compares positions many plies apart.
 *
 * AND THE LATTICE IS ASKED FOR, NEVER ASSUMED. The neighbours of a cell come
 * from `pieceMoves` — the engine's own answer — run on a board holding one
 * piece and nothing else, where there is nothing to jump over and every answer
 * it can give is therefore a single step. Eight directions on Halma's square,
 * six on the star, and whatever a race board added next year turns out to use,
 * without a direction table here to be got wrong or to go stale. It is the
 * same discipline `chooseTurn` follows for legality: ask the rules.
 */

/** One board's geometry: who neighbours whom, and how far every cell is from every camp square. */
export type RaceBoard = {
  size: number;
  /** Board indices reachable in one step from each index; empty for a cell no piece may stand on. */
  neighbours: readonly (readonly number[])[];
  /**
   * The camp each colour is racing to fill, deepest square first.
   *
   * Deepest meaning furthest from where that colour's pieces START, measured
   * on this same lattice rather than by reading the camp table's row order —
   * the two camps are built by different modules and hand their squares back
   * in opposite orders, so the order they arrive in says nothing.
   *
   * The order is load-bearing: a camp is filled from the back. A piece that
   * stops in the mouth of the camp stands in the doorway of every piece still
   * to come, and a reading that counted it as home would rate the position
   * that loses the game above the one that wins it.
   */
  campOf: Record<Stone, readonly number[]>;
  /** Steps from every cell to each square of that colour's camp, in the same order. */
  stepsToCamp: Record<Stone, readonly Int16Array[]>;
  /** Steps from every cell to the nearest square of that colour's camp — for ordering moves. */
  stepsToNearest: Record<Stone, Int16Array>;
};

/** A cell no piece can reach from the camp. See `measure` for why it is refused rather than scored. */
const UNREACHABLE = -1;

const boards = new Map<string, RaceBoard>();

/**
 * The measured board for this game, worked out once per variant and size.
 *
 * Kept for the life of the process, like `farCampSquares` and for the reason
 * written there: it is a fact about a board rather than about a position, it
 * cannot change while the process lives, and it is asked for at every node of
 * a search. The key space is two variants times the sizes they are offered at.
 */
export function raceBoard(variant: RuleVariant, size: number): RaceBoard {
  const key = `${variant}|${size}`;
  const known = boards.get(key);
  if (known !== undefined) return known;
  const measured = measure(variant, size);
  boards.set(key, measured);
  return measured;
}

/**
 * Every cell's neighbours, asked of the engine one cell at a time.
 *
 * The probe board holds exactly one piece, so no jump is available and
 * `pieceMoves` can only answer with steps. Obstacles are kept as they were
 * laid — the star seals the six corners of its square array with the same
 * BLOCKED cell the drop games scatter — so a step onto one is never offered
 * and the hexagram's shape needs no separate description here.
 */
function neighbourTable(fresh: GameState): (readonly number[])[] {
  const { size } = fresh.settings;
  const bare: Cell[] = fresh.board.map((cell) => (isStone(cell) ? null : cell));
  const table: (readonly number[])[] = [];
  for (let index = 0; index < bare.length; index += 1) {
    if (bare[index] !== null) {
      table.push([]);
      continue;
    }
    const board = [...bare];
    board[index] = STONES.black;
    const probe: GameState = { ...fresh, board, toPlay: STONES.black };
    table.push(pieceMoves(probe, pointOf(size, index)).map((to) => indexOf(size, to)));
  }
  return table;
}

/** Steps from every cell to the nearest of `sources`, or UNREACHABLE where there is no way. */
function stepsFrom(neighbours: readonly (readonly number[])[], sources: readonly number[]): Int16Array {
  const steps = new Int16Array(neighbours.length).fill(UNREACHABLE);
  const queue: number[] = [];
  for (const source of sources) {
    if (steps[source] !== UNREACHABLE) continue;
    steps[source] = 0;
    queue.push(source);
  }
  for (let head = 0; head < queue.length; head += 1) {
    const at = queue[head];
    const next = steps[at] + 1;
    for (const to of neighbours[at]) {
      if (steps[to] !== UNREACHABLE) continue;
      steps[to] = next;
      queue.push(to);
    }
  }
  return steps;
}

/**
 * The whole measurement for one board.
 *
 * A LATTICE WITH A CELL NOBODY CAN REACH IS REFUSED, not measured around. A
 * race on a board in two halves is a game nobody can win, and the honest
 * answer to "how far is home" from a cell cut off from it is that there is no
 * answer — which is the same call `unreadableCamp` already makes one module
 * over, for the same reason. Both race boards on this site are connected, and
 * `raceBoard.test.ts` holds them to it; the throw is what a third one would
 * meet on the day it was added rather than a fortnight later, in a bot that
 * had been quietly rating half its pieces as infinitely far from home.
 */
function measure(variant: RuleVariant, size: number): RaceBoard {
  const fresh = createGame({ variant, size });
  const neighbours = neighbourTable(fresh);

  const campOf = {} as Record<Stone, readonly number[]>;
  const stepsToCamp = {} as Record<Stone, readonly Int16Array[]>;
  const stepsToNearest = {} as Record<Stone, Int16Array>;

  for (const stone of [STONES.black, STONES.white] as const) {
    const target = farCampSquares(size, stone).map((point: Point) => indexOf(size, point));
    if (target.length === 0) throw new Error(`No camp to race for on a ${size}x${size} board of ${variant}.`);

    // Where this colour's own pieces start, so "deep in the camp" can be measured
    // as distance from them rather than read off a table's row order.
    const home = farCampSquares(size, otherStone(stone)).map((point: Point) => indexOf(size, point));
    const fromHome = stepsFrom(neighbours, home);
    const deepestFirst = [...target].sort((a, b) => fromHome[b] - fromHome[a]);

    const perSquare = deepestFirst.map((square) => stepsFrom(neighbours, [square]));
    for (const steps of perSquare) {
      for (let index = 0; index < steps.length; index += 1) {
        if (neighbours[index].length > 0 && steps[index] === UNREACHABLE) {
          throw new Error(`A ${variant} board of ${size} has a cell no piece can reach its camp from.`);
        }
      }
    }

    campOf[stone] = deepestFirst;
    stepsToCamp[stone] = perSquare;
    stepsToNearest[stone] = stepsFrom(neighbours, deepestFirst);
  }

  return { size, neighbours, campOf, stepsToCamp, stepsToNearest };
}
