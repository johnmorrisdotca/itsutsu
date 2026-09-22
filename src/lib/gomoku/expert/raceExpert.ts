import { indexOf, otherStone, pieceMoves, pointOf } from "../engine";
import { MOVE_KINDS, STONES, VARIANT_SPECS } from "../gomoku.constants";
import { racesForCamp } from "../rules/farCamp";
import { EXPERT_KINDS, RACE, RACE_WEIGHTS } from "./expert.constants";
import { raceBoard, type RaceBoard } from "./raceBoard";
import type { Cell, GameState, Point, Stone, VariantSpec } from "../gomoku.types";
import type { BotTurn } from "../opponent.types";
import type { Expert } from "./expert.types";

/**
 * The race player: Halma, and Chinese Checkers on the star.
 *
 * These two are the games on this site with no engine anywhere to measure
 * against — no tournament scene, no published benchmark, nothing above hobby
 * grade — and they are also the two the shared reading understood least. It
 * scores a race as "your pieces are further along than mine", by a distance
 * that is wrong on both lattices (see `raceBoard.ts`) and summed over pieces
 * each measuring to whichever camp square happens to be nearest. Three things
 * follow from that last part, and all three are visible in a game:
 *
 * - **Every piece heads for the same square.** Ten pieces measuring to the
 *   nearest corner of the camp all want the same corner, so the army arrives
 *   in a queue at the mouth of the camp and the sum stops falling.
 * - **The camp fills from the front.** A piece that stops in the doorway
 *   scores zero distance and blocks every piece behind it. The reading rates
 *   the position that cannot be finished above the one that can.
 * - **Nothing minds a straggler.** A sum of ten distances does not care
 *   whether it is ten pieces four steps out or nine pieces home and one still
 *   in its own camp — and only one of those is nearly a win, because the game
 *   is not over until the LAST piece is in.
 *
 * So this reading does three things differently, and they are the whole of it:
 * it counts steps on the lattice the game is actually played on; it gives each
 * piece a camp square OF ITS OWN, deepest square first; and it charges
 * separately for the piece that is furthest from the square it was given.
 * Nothing here is clever — it is a hand-written evaluation of the kind a
 * player would describe out loud — and against a reading that cannot see the
 * camp it does not have to be.
 *
 * Advisory, like every other specialist: the engine enumerates the moves, the
 * engine applies them, and the engine says who has won. Chain jumps are not
 * modelled here at all, because `starMoves` and `campMoves` already hand back
 * the end of every chain as one move — a ladder is a move in these games, and
 * a reading that tried to score it separately would be scoring it twice.
 */

/** Whether a colour has a camp to race for in this game. */
function raceApplies(spec: VariantSpec): boolean {
  return racesForCamp(spec);
}

/** Where `stone`'s pieces stand, as board indices. */
function piecesOf(board: readonly Cell[], stone: Stone): number[] {
  const at: number[] = [];
  for (let index = 0; index < board.length; index += 1) if (board[index] === stone) at.push(index);
  return at;
}

/**
 * Both armies from one pass over the board.
 *
 * `raceRead` wants each side's pieces and runs at every leaf of the search, so
 * the scan is worth doing once rather than once a colour — a fifth off the
 * cost of a leaf on Halma's own board. It matters more here than the saving
 * suggests: this player is bounded by the CLOCK rather than by its node
 * count (see `RACE`), so a cheaper leaf is not a smaller bill, it is a deeper
 * search for the same one.
 */
function armies(board: readonly Cell[]): Record<Stone, number[]> {
  const black: number[] = [];
  const white: number[] = [];
  for (let index = 0; index < board.length; index += 1) {
    const cell = board[index];
    if (cell === STONES.black) black.push(index);
    else if (cell === STONES.white) white.push(index);
  }
  return { black, white };
}

/**
 * Who is going where, and what that costs: the whole of the reading, in one
 * pass, because the reading and the move ordering want exactly the same answer.
 *
 * **Each piece gets a square of its own.** The camp holds exactly as many
 * squares as a side has pieces, so a position's real cost is an assignment of
 * pieces to squares, and what is wanted is the cheapest one. This takes the
 * squares deepest first and gives each the nearest piece not yet spoken for —
 * greedy, not optimal, and deliberately so: the exact assignment is a
 * Hungarian solve at every leaf of a search, for an answer a step or two
 * better on a measure that is itself advisory.
 *
 * Deepest first is the part that earns its place, because it is what makes a
 * piece parked in the doorway expensive rather than free: the square behind it
 * still has to be filled by somebody, and the somebody nearest to it is the
 * piece in the doorway.
 */
export type Assignment = {
  /** Steps left for the whole army, each piece to the square it was given. */
  total: number;
  /** Steps left by whichever piece has furthest to go. */
  worst: number;
  /** The camp square each piece is headed for, by board index. */
  goes: Map<number, number>;
};

export function assign(board: readonly Cell[], measured: RaceBoard, stone: Stone): Assignment {
  return assignPieces(piecesOf(board, stone), measured, stone);
}

/** The same, for a caller that has already found the pieces. */
function assignPieces(pieces: readonly number[], measured: RaceBoard, stone: Stone): Assignment {
  const squares = measured.campOf[stone];
  const steps = measured.stepsToCamp[stone];
  const taken = new Array<boolean>(pieces.length).fill(false);

  let total = 0;
  let worst = 0;
  const goes = new Map<number, number>();
  for (let square = 0; square < squares.length; square += 1) {
    const toHere = steps[square];
    let chosen = -1;
    let nearest = Infinity;
    for (let piece = 0; piece < pieces.length; piece += 1) {
      if (taken[piece]) continue;
      const gap = toHere[pieces[piece]];
      if (gap < nearest) {
        nearest = gap;
        chosen = piece;
      }
    }
    /*
     * Fewer pieces than squares. It cannot happen in either game as they are
     * played — nothing is ever captured and the camps are cut to the piece
     * count — so this is not a case to price, only one not to crash on. The
     * squares nobody is left to fill are simply not charged for.
     */
    if (chosen === -1) break;
    taken[chosen] = true;
    goes.set(pieces[chosen], square);
    total += nearest;
    if (nearest > worst) worst = nearest;
  }
  return { total, worst, goes };
}

/** What a race position is worth to `me`: how much less of it is left for me than for them. */
export function raceRead(state: GameState, me: Stone): number {
  const measured = raceBoard(state.settings.variant, state.settings.size);
  const both = armies(state.board);
  const foe = otherStone(me);
  const mine = assignPieces(both[me], measured, me);
  const theirs = assignPieces(both[foe], measured, foe);
  return (
    (theirs.total - mine.total) * RACE_WEIGHTS.step +
    (theirs.worst - mine.worst) * RACE_WEIGHTS.strand
  );
}

/**
 * The moves worth looking at, the ones that gain most ground first.
 *
 * Ordering only — nothing legal is refused a place in the list until `limit`
 * cuts it — and the measure is how many steps nearer its OWN camp square the
 * piece ends up, which is the same question the reading asks.
 *
 * IT USED TO ASK THE CHEAPER QUESTION, distance to whichever camp square was
 * nearest, and that is worth recording because of where it failed. On the star
 * it worked: thirteen steps of race and chains that cover five or six of them
 * at once give the gains a wide spread, so the shortlist was right and the
 * player took eighteen games in eighteen off the graded ladder. On Halma's
 * small board the whole race is SIX steps, and nearly every move gains
 * exactly one — so the ordering was a list of ties, the narrow branch below
 * the root threw away seven moves in eight of them at random, and the same
 * player lost. A cheap ordering is not a small error when it stops
 * discriminating; it is the search choosing at random and reporting a number.
 *
 * The assignment is worked out once for the position and then read per
 * candidate, so the sharper question costs one pass over the board rather than
 * one per move. It is approximate in the honest direction: it assumes the
 * moving piece keeps the square it was given, which is what makes it a
 * ranking rather than a second evaluation — the search re-reads the position
 * properly a ply later either way.
 *
 * A chain of jumps arrives as a single landing, so the move that gains six
 * steps sorts above the step that gains one without any of this knowing what
 * a jump is. Ties go to the piece with furthest left to travel, which is the
 * straggler the reading is already charging for.
 */
export function raceTurns(state: GameState, limit: number): BotTurn[] {
  const spec = VARIANT_SPECS[state.settings.variant];
  if (!raceApplies(spec)) return [];
  const { size } = state.settings;
  const me = state.toPlay;
  const measured = raceBoard(state.settings.variant, size);
  const steps = measured.stepsToCamp[me];
  const nearest = measured.stepsToNearest[me];
  const { goes } = assign(state.board, measured, me);

  const ranked: { turn: BotTurn; gain: number; left: number }[] = [];
  for (const from of piecesOf(state.board, me)) {
    const at: Point = pointOf(size, from);
    // A piece the assignment had nothing left to give is measured to the
    // nearest square, which is the answer it would have had anyway.
    const square = goes.get(from);
    const toIts = square === undefined ? nearest : steps[square];
    for (const to of pieceMoves(state, at)) {
      const landed = indexOf(size, to);
      ranked.push({
        turn: { kind: MOVE_KINDS.move, from: at, row: to.row, col: to.col },
        gain: toIts[from] - toIts[landed],
        left: toIts[from],
      });
    }
  }
  ranked.sort((a, b) => b.gain - a.gain || b.left - a.left);
  return ranked.slice(0, limit).map((entry) => entry.turn);
}

/**
 * The race specialist.
 *
 * `candidates` answers nothing, and has to: every move in these games is a
 * slide, which is a `from` and a `to` rather than a point, and a caller handed
 * a bare landing point would have to guess which piece was meant. `turns` is
 * what the search reads — see `expertSearch.ts` — and an expert that supplies
 * it never has its points asked for.
 */
export const RACE_EXPERT: Expert = {
  kind: EXPERT_KINDS.race,
  applies: raceApplies,
  read: raceRead,
  candidates: () => [],
  turns: raceTurns,
  branch: RACE.branch,
  rootBranch: RACE.rootBranch,
  /*
   * One depth throughout. A race has no endgame in the sense Reversi has one —
   * there is no point at which the remaining moves can be counted out exactly,
   * because a piece can always step backwards and the game ends by arriving
   * rather than by filling the board. What changes near the end is the width:
   * pieces already home have few moves worth making, so the same depth costs
   * less and the deepening gets further on the same clock.
   */
  depth(): number {
    return RACE.depth;
  },
};
