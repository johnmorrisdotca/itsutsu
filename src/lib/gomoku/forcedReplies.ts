import { otherStone, forbiddenAt, rulesFor } from "./engine";
import { DIRECTIONS } from "./gomoku.constants";
import { completionsThrough, findsForcedWins } from "./forcedWin";
import { findWinningLine } from "./rules/lines";
import { repliesToRead } from "./threatWin";
import { candidatePoints } from "./threats";
import type { Cell, GameState, Point, Stone } from "./gomoku.types";

/**
 * The only moves worth reading when a threat is on the board, or null when
 * none is and the search should weigh its usual candidates.
 *
 * Every strong five-in-a-row program narrows its search this way, and it is a
 * rule of the game rather than a guess about it:
 *
 * - a five to make wins, so that is the move;
 * - a five the other side could make next must be blocked, so the blocks are
 *   the moves;
 * - an open three of the other side's becomes an open four next, and an open
 *   four cannot be stopped, so the moves are the points that stop the three —
 *   or a four of one's own, which the other side must answer first.
 *
 * Anything else loses outright, and reading it wastes the depth the search
 * needs. Measured against an outside engine, our search lost games it had
 * been winning by force eleven to twenty-one moves earlier, because it spread
 * the same ten candidates over every position, sharp or quiet; in a forcing
 * line there are one to four moves, and reading only those is how the depth
 * to see such a line is found.
 *
 * Only in the plain line games, where a four has one answer — the same gate as
 * the finder of forced wins, for the same reason.
 *
 * ASKED AT EVERY NODE, so it is built to say "nothing is forced" cheaply: one
 * pass over the candidate points counts, for each colour, the most of its own
 * stones in any open window of the winning length through the point. Only a
 * point one stone short of five, or two short, is then read in full — and in a
 * quiet position there are none, and the answer is null after that one pass.
 */
export function forcedReplies(state: GameState): Point[] | null {
  if (!findsForcedWins(state)) return null;
  const mover = state.toPlay;
  const foe = otherStone(mover);
  const { board, settings } = state;
  const { size } = settings;
  const moverLength = rulesFor(settings, mover).winLength;
  const foeLength = rulesFor(settings, foe).winLength;

  const moverFives: Point[] = [];
  const foeFives: Point[] = [];
  const foeFours: Point[] = [];
  for (const point of candidatePoints(state)) {
    if (board[point.row * size + point.col] !== null) continue;
    // Each colour counted over windows of its own winning length, which a handicap can make differ.
    const [mine, sameLengthTheirs] = openWindowCounts(board, size, point, mover, foe, moverLength);
    const theirs = foeLength === moverLength ? sameLengthTheirs : openWindowCounts(board, size, point, mover, foe, foeLength)[1];
    if (mine >= moverLength - 1) moverFives.push(point);
    if (theirs >= foeLength - 1) foeFives.push(point);
    else if (theirs >= foeLength - 2) foeFours.push(point);
  }

  const wins = moverFives.filter((point) => completes(board, state, mover, point));
  if (wins.length > 0) return wins;
  const blocks = foeFives.filter((point) => completes(board, state, foe, point));
  if (blocks.length > 0) return blocks;

  const work = board.slice();
  const threats: Array<{ point: Point; completions: Point[] }> = [];
  for (const point of foeFours) {
    if (forbiddenAt(board, settings, foe, point) !== null) continue;
    const at = point.row * size + point.col;
    work[at] = foe;
    const completions = completionsThrough(work, state, foe, point);
    work[at] = null;
    if (completions.length >= 2) threats.push({ point, completions });
  }
  return threats.length > 0 ? repliesToRead(state, foe, threats) : null;
}

/** Whether `stone` laid at `point` makes a winning line, by the colour's own rules. */
function completes(board: Cell[], state: GameState, stone: Stone, point: Point): boolean {
  const work = board.slice();
  work[point.row * state.settings.size + point.col] = stone;
  return findWinningLine(work, state.settings, point).length > 0;
}

/**
 * For each colour, the most of its own stones in any window of `length`
 * through `point` that holds nothing else — the point itself counted as empty.
 * Both colours in the same walk over the same cells.
 */
function openWindowCounts(
  board: Cell[],
  size: number,
  point: Point,
  mover: Stone,
  foe: Stone,
  length: number,
): [number, number] {
  let bestMine = 0;
  let bestTheirs = 0;
  for (const step of DIRECTIONS) {
    for (let start = -(length - 1); start <= 0; start += 1) {
      let mine = 0;
      let theirs = 0;
      let other = false;
      let offBoard = false;
      for (let k = start; k < start + length; k += 1) {
        const row = point.row + step.row * k;
        const col = point.col + step.col * k;
        if (row < 0 || col < 0 || row >= size || col >= size) {
          offBoard = true;
          break;
        }
        if (k === 0) continue;
        const cell = board[row * size + col];
        if (cell === mover) mine += 1;
        else if (cell === foe) theirs += 1;
        else if (cell !== null) other = true;
      }
      if (offBoard || other) continue;
      if (theirs === 0 && mine > bestMine) bestMine = mine;
      if (mine === 0 && theirs > bestTheirs) bestTheirs = theirs;
    }
  }
  return [bestMine, bestTheirs];
}
