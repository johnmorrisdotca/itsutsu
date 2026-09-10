import { isLegalMove, otherStone, pointOf } from "../engine";
import { DIRECTIONS, GAME_STATUS, LINE_RULES, PLACEMENTS, WRAP_MODES } from "../gomoku.constants";
import { DECIDED_SCORE, DRAW_SCORE } from "../opponent.constants";
import { tengen } from "../obstacles";
import { EXPERT_KINDS, EXPERT_SEARCH, LINE_WEIGHTS } from "./expert.constants";
import { readingFor } from "./lineShapes";
import type { Cell, GameState, Point, Stone, VariantSpec } from "../gomoku.types";
import type { Expert, LineReading } from "./expert.types";

/**
 * The five-in-a-row specialist: what a position is worth to it, and which
 * moves it will spend a node on.
 *
 * The shared reading counts windows — a run of the board's winning length with
 * none of the other colour in it — and weights them by how many stones are
 * already there. That is a true thing to count and it is not what decides a
 * game of five in a row. What decides it is the threat: a four has to be
 * answered on the spot, an open four cannot be answered at all, and two
 * threats made by one stone is how every game between players who can count
 * is won.
 *
 * So it counts the windows too, and then reads the threats — see
 * `lineShapes.ts`, which does the counting, while this decides what the counts
 * are worth. The points that complete a five do two jobs here. They are most
 * of the judgement, since one of them with the move is a win and two of them
 * is a win whoever has the move. And they are the whole of the move ordering,
 * because when either side has one the position is not a game of choices: you
 * take yours, or you answer theirs, and a search that spends its budget
 * weighing thirteen other moves there has spent it on nothing. Following the
 * forced reply is what lets a modest budget see the end of a sequence rather
 * than the start of one.
 */

/** What a colour's threes are worth, given whether it has the move. */
function threeScore(reading: LineReading, toMove: boolean): number {
  if (reading.openThrees === 0) return 0;
  const first = toMove ? LINE_WEIGHTS.openThreeMade : LINE_WEIGHTS.openThreeHeld;
  const doubled = reading.openThrees > 1 ? LINE_WEIGHTS.doubleThree : 0;
  /*
   * A four and an open three together, which is the other way a game ends: the
   * four has to be answered, and answering it leaves the three to become an
   * open four that cannot be. Two threats made of different shapes, and the
   * reading has to see the pair rather than the two halves.
   */
  const paired = reading.fives.length > 0 ? LINE_WEIGHTS.fourAndThree : 0;
  return first + doubled + paired;
}

/** What a settled game is worth, from `me`'s side. */
function settled(state: GameState, me: Stone): number {
  if (state.status === GAME_STATUS.draw || state.winner === null) return DRAW_SCORE;
  return state.winner === me ? DECIDED_SCORE : -DECIDED_SCORE;
}

/**
 * The whole position, from `me`'s side.
 *
 * The shape of both colours, and then the threats, which are what actually
 * settle a game of this kind. A threat is worth a great deal more when it is
 * your move than when it is not: the same four on the board is a win for the
 * side about to play it and a nuisance for the side about to block it.
 *
 * The threat numbers are deliberately far below `DECIDED_SCORE`. This is a
 * reading of a live position and never a verdict on a settled one — the engine
 * settles games, and the search reads its verdict rather than this.
 */
export function lineValue(state: GameState, me: Stone): number {
  if (state.status !== GAME_STATUS.playing) return settled(state, me);

  const foe = otherStone(me);
  const mine = readingFor(state, me);
  const theirs = readingFor(state, foe);

  let value = mine.score - theirs.score * LINE_WEIGHTS.defence;
  const moving = state.toPlay;
  if (mine.fives.length > 0) value += moving === me ? LINE_WEIGHTS.won : LINE_WEIGHTS.threat;
  if (theirs.fives.length > 0) value -= moving === foe ? LINE_WEIGHTS.won : LINE_WEIGHTS.threat;
  // Two points to five cannot both be blocked, whoever has the move.
  if (mine.fives.length > 1) value += LINE_WEIGHTS.won;
  if (theirs.fives.length > 1) value -= LINE_WEIGHTS.won;
  /*
   * The threes. Worth their most to the side about to move, because an open
   * three plus the move is an open four, and an open four is the end of it —
   * unless there is a four on the board demanding an answer first, which is
   * why the fours above are read before these and are worth more.
   */
  value += threeScore(mine, moving === me);
  value -= threeScore(theirs, moving === foe);
  return value;
}

/**
 * How interesting a point is, for ordering only: the runs of either colour it
 * would join, along all four lines through it.
 *
 * Cheap on purpose — it is asked of every candidate at every node, and the
 * judgement is `lineValue`'s job. It counts the other colour's runs almost as
 * heavily as its own, because the point that makes their four is the same
 * point that stops it.
 */
export function lineHeat(
  board: readonly Cell[],
  size: number,
  point: Point,
  stone: Stone,
): number {
  const foe = otherStone(stone);
  const top = LINE_WEIGHTS.heat.length - 1;
  let heat = 0;
  for (const step of DIRECTIONS) {
    for (const colour of [stone, foe]) {
      let run = 0;
      for (const way of [1, -1]) {
        for (let k = 1; k <= top; k += 1) {
          const row = point.row + step.row * k * way;
          const col = point.col + step.col * k * way;
          if (row < 0 || row >= size || col < 0 || col >= size) break;
          if (board[row * size + col] !== colour) break;
          run += 1;
        }
      }
      const worth = LINE_WEIGHTS.heat[Math.min(run, top)];
      heat += colour === stone ? worth : worth * 0.9;
    }
  }
  return heat;
}

/**
 * The empty points within `radius` of a stone, or the middle of an empty
 * board.
 *
 * The same idea as `candidatePoints` in `threats.ts` and a different way round
 * on purpose: that one asks of every empty point whether any stone is near it,
 * which is the number of empties times the number of stones, and on a fifteen
 * by fifteen board late in a game that is twenty thousand comparisons — at
 * every node of a search. This walks out from each stone instead, which is the
 * number of stones times a small constant. Same answer, and it was the
 * difference between a specialist that could look four plies ahead inside a
 * request and one that could look two.
 */
function nearbyPoints(state: GameState, radius: number): Point[] {
  const { board, settings } = state;
  const { size } = settings;
  const marked = new Set<number>();
  let stones = 0;

  for (let index = 0; index < board.length; index += 1) {
    if (board[index] === null) continue;
    stones += 1;
    const row = Math.floor(index / size);
    const col = index % size;
    const fromRow = Math.max(0, row - radius);
    const toRow = Math.min(size - 1, row + radius);
    const fromCol = Math.max(0, col - radius);
    const toCol = Math.min(size - 1, col + radius);
    for (let r = fromRow; r <= toRow; r += 1) {
      for (let c = fromCol; c <= toCol; c += 1) {
        const near = r * size + c;
        if (board[near] === null) marked.add(near);
      }
    }
  }

  if (stones === 0) {
    const centre = tengen(size);
    return board[centre.row * size + centre.col] === null ? [centre] : [];
  }
  return [...marked].map((index) => pointOf(size, index));
}

/**
 * The points worth searching here, best first, at most `limit` of them.
 *
 * A forced position is answered rather than weighed. When this colour can
 * complete five, that is the move and there is nothing to compare it with;
 * when the other colour can, the only moves worth a node are the ones that
 * stop it. Both cases collapse the branching to one or two, which is what
 * lets the search follow a sequence of fours to its end instead of looking a
 * little way down thirteen quiet moves — and following the forcing line is
 * how a game of five in a row is actually won.
 */
export function lineCandidates(state: GameState, limit: number): Point[] {
  const { board, settings } = state;
  const { size } = settings;
  const mover = state.toPlay;

  const mine = readingFor(state, mover);
  for (const index of mine.fives) {
    const point = pointOf(size, index);
    // A win in hand, where the rules let this colour take it.
    if (isLegalMove(state, point)) return [point];
  }

  const theirs = readingFor(state, otherStone(mover));
  if (theirs.fives.length > 0) {
    const blocks = theirs.fives
      .map((index) => pointOf(size, index))
      .filter((point) => isLegalMove(state, point));
    /*
     * More than one point to five and the game is already lost — blocking one
     * leaves the other — but the search is told to block anyway rather than
     * to give up, because "lost" here is this reading's opinion and the
     * engine's verdict is the only one that settles anything.
     */
    if (blocks.length > 0) return blocks.slice(0, limit);
  }

  const scored = nearbyPoints(state, EXPERT_SEARCH.lineRadius)
    .filter((point) => isLegalMove(state, point))
    .map((point) => ({ point, heat: lineHeat(board, size, point, mover) }));
  scored.sort((a, b) => b.heat - a.heat);
  return scored.slice(0, limit).map((entry) => entry.point);
}

/**
 * Whether this reading says anything true about a game with this spec.
 *
 * Narrow, and honestly so. What is written above is the theory of five in a
 * row on an ordinary board: one stone a turn, stones that stay where they are
 * put, no captures to change the count under the reading, no edge that joins
 * another edge, and a line that wins rather than loses. Every one of those is
 * asked of the spec. A game that fails any of them gets the shared reading and
 * the graded ladder, which is the right answer — a specialist that guessed
 * outside its game would be worse than the generalist, which is exactly the
 * thing this whole module exists because of.
 *
 * Renju is in, forbidden shapes and all. The reading itself does not know that
 * black may not make a double three; the move list does, because every
 * candidate goes through `isLegalMove` — so a threat black is not allowed to
 * make is a threat the search cannot play, and it costs a little judgement
 * rather than a wrong move.
 */
export function lineApplies(spec: VariantSpec): boolean {
  return (
    spec.analysis &&
    !spec.misere &&
    !spec.makerBreaker &&
    spec.loseLength === null &&
    !spec.squareWins &&
    !spec.captures &&
    spec.stonesPerTurn === 1 &&
    spec.firstTurnStones === 1 &&
    spec.placement === PLACEMENTS.free &&
    spec.wrap === WRAP_MODES.none &&
    spec.wormholes === 0 &&
    spec.deadSquares === 0 &&
    spec.hotSquares === 0 &&
    spec.queue === null &&
    spec.quadrantSize === null &&
    spec.pieces === null &&
    !spec.lineClear &&
    !spec.anyColour &&
    !spec.singleColour &&
    !spec.flips &&
    !spec.camps &&
    !spec.connects &&
    !spec.go &&
    !spec.checkers &&
    !spec.chineseCheckers &&
    spec.lineRule.black !== LINE_RULES.exactOpen &&
    spec.lineRule.white !== LINE_RULES.exactOpen
  );
}

export const LINE_EXPERT: Expert = {
  kind: EXPERT_KINDS.line,
  applies: lineApplies,
  read: lineValue,
  candidates: lineCandidates,
  branch: EXPERT_SEARCH.lineBranch,
  rootBranch: EXPERT_SEARCH.lineRootBranch,
  depth: () => EXPERT_SEARCH.lineDepth,
};
