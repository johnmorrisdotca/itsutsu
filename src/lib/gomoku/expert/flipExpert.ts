import { GAME_STATUS, STONES, WRAP_MODES } from "../gomoku.constants";
import { otherStone } from "../engine";
import { flipsAt } from "../rules/flips";
import { DECIDED_SCORE, DRAW_SCORE } from "../opponent.constants";
import { EXPERT_KINDS, EXPERT_SEARCH, FLIP_SQUARE, FLIP_WEIGHTS } from "./expert.constants";
import type { Cell, GameState, Point, Stone, VariantSpec } from "../gomoku.types";
import type { Expert } from "./expert.types";

/**
 * The Reversi specialist's reading of a board.
 *
 * Everything here is one game's theory, written out rather than approximated:
 * corners cannot be turned, the squares beside an empty corner are how a
 * corner is lost, a player with no reply must pass and a player who passes is
 * usually losing, a disc touching an empty square is a disc the other side can
 * reach, and the disc count — the one thing the shared reading leans on — is
 * worth almost nothing until the very end, when it is worth everything.
 *
 * It knows nothing about the variant it is reading. `applies` asks the spec
 * whether stones turn over and whether the larger pile wins; the name reversi
 * appears nowhere, so the four flipping boards on this site are covered by
 * what they are, and the giveaway one is excluded for the same reason — in a
 * game where the smaller pile wins, every sentence above is a different
 * sentence, and a reading that pretended otherwise would be worse than none.
 */

/** The four corners, which in a flipping game can never be turned. */
function corners(size: number): Point[] {
  const last = size - 1;
  return [
    { row: 0, col: 0 },
    { row: 0, col: last },
    { row: last, col: 0 },
    { row: last, col: last },
  ];
}

/** Which way is inward from a corner, along each axis. */
function inward(size: number, corner: Point): { row: number; col: number } {
  return { row: corner.row === 0 ? 1 : -1, col: corner.col === 0 ? 1 : -1 };
}

function cell(board: readonly Cell[], size: number, row: number, col: number): Cell | undefined {
  if (row < 0 || col < 0 || row >= size || col >= size) return undefined;
  return board[row * size + col];
}

/** How many empty squares are left. The clock of a flipping game. */
export function emptyCount(board: readonly Cell[]): number {
  let empty = 0;
  for (const square of board) if (square === null) empty += 1;
  return empty;
}

/** How many replies a colour has: the squares where it would turn something. */
export function flipMobility(board: Cell[], size: number, stone: Stone): number {
  let moves = 0;
  for (let index = 0; index < board.length; index += 1) {
    if (board[index] !== null) continue;
    const point = { row: Math.floor(index / size), col: index % size };
    if (flipsAt(board, size, stone, point).length > 0) moves += 1;
  }
  return moves;
}

/**
 * Discs of each colour that touch an empty square.
 *
 * The front line. A disc with nothing empty beside it cannot be flanked from
 * that side, so a player whose discs are all interior has handed the other
 * side very little to work with — which is why a small pile of discs early is
 * a strong position rather than a weak one.
 */
function frontier(board: Cell[], size: number): Record<Stone, number> {
  const counted: Record<Stone, number> = { black: 0, white: 0 };
  for (let index = 0; index < board.length; index += 1) {
    const here = board[index];
    if (here !== STONES.black && here !== STONES.white) continue;
    const row = Math.floor(index / size);
    const col = index % size;
    let touching = false;
    for (let dr = -1; dr <= 1 && !touching; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        if (cell(board, size, row + dr, col + dc) === null) {
          touching = true;
          break;
        }
      }
    }
    if (touching) counted[here] += 1;
  }
  return counted;
}

/**
 * Discs that can never be turned again.
 *
 * Full stability is a harder question than it looks — a disc is stable when
 * every one of its four lines is settled — and the part of it that decides
 * games is the easy part: a corner is stable, a run of one colour along an
 * edge out of a corner is stable, and a completely full edge is stable. Those
 * are counted; the rest is left alone rather than guessed at.
 */
function stableDiscs(board: Cell[], size: number): Record<Stone, number> {
  const stable = new Set<number>();
  const last = size - 1;

  for (const corner of corners(size)) {
    const held = board[corner.row * size + corner.col];
    if (held !== STONES.black && held !== STONES.white) continue;
    stable.add(corner.row * size + corner.col);
    const step = inward(size, corner);
    // Along the corner's own row, then its own column, while the colour holds.
    for (let col = corner.col + step.col; col >= 0 && col <= last; col += step.col) {
      if (board[corner.row * size + col] !== held) break;
      stable.add(corner.row * size + col);
    }
    for (let row = corner.row + step.row; row >= 0 && row <= last; row += step.row) {
      if (board[row * size + corner.col] !== held) break;
      stable.add(row * size + corner.col);
    }
  }

  // A full edge cannot be flanked anywhere along it, whoever holds the corners.
  const edges: Point[][] = [[], [], [], []];
  for (let k = 0; k < size; k += 1) {
    edges[0].push({ row: 0, col: k });
    edges[1].push({ row: last, col: k });
    edges[2].push({ row: k, col: 0 });
    edges[3].push({ row: k, col: last });
  }
  for (const edge of edges) {
    if (edge.some((point) => board[point.row * size + point.col] === null)) continue;
    for (const point of edge) stable.add(point.row * size + point.col);
  }

  const counted: Record<Stone, number> = { black: 0, white: 0 };
  for (const index of stable) {
    const held = board[index];
    if (held === STONES.black || held === STONES.white) counted[held] += 1;
  }
  return counted;
}

/**
 * What holding, or giving away, the squares around each corner is worth.
 *
 * The penalties apply only while the corner itself is empty. Once somebody
 * owns the corner the X-square beside it is an ordinary square — often a good
 * one — and a reading that went on punishing it would refuse to build the
 * edge it had just won.
 */
function cornerPlay(board: Cell[], size: number, me: Stone, foe: Stone): number {
  let score = 0;
  for (const corner of corners(size)) {
    const held = board[corner.row * size + corner.col];
    if (held === me) score += FLIP_WEIGHTS.corner;
    else if (held === foe) score -= FLIP_WEIGHTS.corner;
    if (held !== null) continue;

    const step = inward(size, corner);
    const diagonal = cell(board, size, corner.row + step.row, corner.col + step.col);
    if (diagonal === me) score -= FLIP_WEIGHTS.xSquare;
    else if (diagonal === foe) score += FLIP_WEIGHTS.xSquare;

    for (const beside of [
      cell(board, size, corner.row, corner.col + step.col),
      cell(board, size, corner.row + step.row, corner.col),
    ]) {
      if (beside === me) score -= FLIP_WEIGHTS.cSquare;
      else if (beside === foe) score += FLIP_WEIGHTS.cSquare;
    }
  }
  return score;
}

/** What a settled game is worth, from `me`'s side. */
function settled(state: GameState, me: Stone): number {
  if (state.status === GAME_STATUS.draw || state.winner === null) return DRAW_SCORE;
  return state.winner === me ? DECIDED_SCORE : -DECIDED_SCORE;
}

/**
 * The whole position, from `me`'s side, in the units the search compares.
 *
 * A settled game is read off the engine's own verdict, so a flipping variant
 * with a losing condition nothing here has thought about is still scored
 * correctly the moment it settles.
 */
export function flipRead(state: GameState, me: Stone): number {
  if (state.status !== GAME_STATUS.playing) return settled(state, me);

  const board = state.board;
  const { size } = state.settings;
  const foe = otherStone(me);
  const empties = emptyCount(board);

  const mine = flipMobility(board, size, me);
  const theirs = flipMobility(board, size, foe);
  const mobility =
    mine + theirs === 0 ? 0 : (FLIP_WEIGHTS.mobility * (mine - theirs)) / (mine + theirs + 1);

  const front = frontier(board, size);
  const stable = stableDiscs(board, size);
  let discs = 0;
  for (const square of board) {
    if (square === me) discs += 1;
    else if (square === foe) discs -= 1;
  }

  /*
   * The last move. With an odd number of empty squares left the side to move
   * takes the last one, and the last disc laid in a game of Reversi turns
   * discs that nobody gets to answer.
   */
  const lastMoveIsMine = empties % 2 === 1 ? state.toPlay === me : state.toPlay !== me;
  const discWeight =
    empties <= FLIP_WEIGHTS.lateEmpties ? FLIP_WEIGHTS.discLate : FLIP_WEIGHTS.discEarly;

  return (
    cornerPlay(board, size, me, foe) +
    (stable[me] - stable[foe]) * FLIP_WEIGHTS.stable +
    mobility +
    (front[foe] - front[me]) * FLIP_WEIGHTS.frontier +
    (lastMoveIsMine ? FLIP_WEIGHTS.parity : -FLIP_WEIGHTS.parity) +
    discs * discWeight
  );
}

/** What a square is worth before anything is on the board, for ordering moves. */
export function squareValue(size: number, point: Point): number {
  const last = size - 1;
  const fromRow = Math.min(point.row, last - point.row);
  const fromCol = Math.min(point.col, last - point.col);
  if (fromRow === 0 && fromCol === 0) return FLIP_SQUARE.corner;
  if (fromRow <= 1 && fromCol <= 1) {
    return fromRow === 1 && fromCol === 1 ? FLIP_SQUARE.xSquare : FLIP_SQUARE.cSquare;
  }
  if (fromRow === 0 || fromCol === 0) return FLIP_SQUARE.edge;
  if (fromRow === 1 || fromCol === 1) return FLIP_SQUARE.nextToEdge;
  return FLIP_SQUARE.middle;
}

/**
 * The moves worth looking at, best first.
 *
 * Ordered by the square table and by turning *few* discs rather than many:
 * a quiet move that leaves the other side short of replies is the Reversi
 * move, and the greedy one that turns half the board is usually the losing
 * one. Ordering is not judgement — the reading above judges — but a search
 * gets nearly all of its pruning from trying the right move first.
 *
 * Empty in the one case where a flipping game is not yet a flipping game: the
 * variant whose players lay the middle four themselves turns nothing on those
 * first moves, so nothing here is a candidate and the shared chooser lays
 * them. Answering "no moves" is the right answer to a question about flips
 * being asked before any flip is possible.
 */
export function flipCandidates(state: GameState, limit: number): Point[] {
  const board = state.board;
  const { size } = state.settings;
  const mover = state.toPlay;
  const scored: { point: Point; score: number }[] = [];
  for (let index = 0; index < board.length; index += 1) {
    if (board[index] !== null) continue;
    const point = { row: Math.floor(index / size), col: index % size };
    const turned = flipsAt(board, size, mover, point).length;
    if (turned === 0) continue;
    scored.push({ point, score: squareValue(size, point) - turned });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.point);
}

/**
 * Whether this reading says anything true about a game with this spec: stones
 * turn over, and the larger pile wins. Read from the spec, never from a name.
 */
export function flipApplies(spec: VariantSpec): boolean {
  return spec.flips && !spec.misere && spec.wrap === WRAP_MODES.none && spec.wormholes === 0;
}

export const FLIP_EXPERT: Expert = {
  kind: EXPERT_KINDS.flip,
  applies: flipApplies,
  read: flipRead,
  candidates: flipCandidates,
  branch: EXPERT_SEARCH.flipBranch,
  rootBranch: EXPERT_SEARCH.flipRootBranch,
  /*
   * Near the end the game is played out rather than judged. The disc count at
   * the last square is not a heuristic — it is the result, exactly — so once
   * the board is nearly full the honest depth is "all of it", and the budget
   * rather than the ply count is what stops the search.
   */
  depth(state: GameState): number {
    const empties = emptyCount(state.board);
    return empties <= EXPERT_SEARCH.flipExactEmpties ? empties + 1 : EXPERT_SEARCH.flipDepth;
  },
};
