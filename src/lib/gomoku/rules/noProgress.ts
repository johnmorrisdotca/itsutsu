import { STAR_RADIUS, starCampSquares, starSize } from "./chineseCheckers";
import { campSquares } from "./camps";
import { GAME_STATUS, RULE_VARIANTS } from "../gomoku.constants";
import type { Cell, GameState, Move, Point, RuleVariant, Stone } from "../gomoku.types";

/**
 * A game nobody is getting anywhere in is a draw.
 *
 * Every game where stones are PLACED is bounded by the board: each move fills
 * a point for good, so 361 moves is a real ceiling on a 19×19 and the game
 * cannot outlast it. The games where pieces MOVE have no such bound. Two kings
 * shuffling between the same squares, or two Halma pieces stepping back and
 * forth, is a game that never ends and that neither player can be made to
 * stop — which is the oldest known problem in draughts, and why draughts has
 * had a rule about it for a century.
 *
 * The site's existing length setting cannot help here, and not by accident:
 * it refuses any board smaller than 81 points on the reasoning that "a small
 * board resolves on its own before any share of it has been played" — true of
 * noughts and crosses, false of draughts. Checkers is 8×8, so 64 < 81, and
 * the one game that most needs a cap is the one where the cap is unreachable.
 * And where a limit IS allowed it is a share of the board's CELLS, which
 * measures nothing in a game whose moves do not consume cells.
 *
 * So this counts moves rather than cells, and asks each family what progress
 * means in its own terms rather than inventing one measure for all of them.
 */

/**
 * How many plies of nobody getting anywhere ends a game, per family.
 *
 * MEASURED, not reasoned about. My first numbers came from imagining how long
 * a march ought to take, and one of them was low enough to end a real game of
 * Halma — an existing bot test caught it. What matters is not how long a game
 * runs but how long it runs WITHOUT anybody setting a new low, and those are
 * different by an order of magnitude:
 *
 *     checkers   longest idle run 4 plies, in games of up to 72
 *     halma      longest idle run 18 plies, in games of up to 389
 *
 * Both measured over bot-vs-bot play with this rule lifted, or it would have
 * been measuring its own threshold.
 *
 * The margins are enormous on purpose. A cap that is ten times too generous
 * costs nothing — the game still ends, a little later. A cap that is slightly
 * too tight ends somebody's real game as a draw, which is a worse fault than
 * the endless game this exists to stop. And the weakest bot plays games
 * fifteen times longer than the strongest, so anything calibrated on good
 * play is calibrated on the easy case.
 *
 * Checkers keeps the draughts number rather than a multiple of its own
 * measurement: forty moves each is what draughts has said for a century, and
 * agreeing with the game people already know is worth more here than a
 * tighter bound nobody expects.
 */
export const NO_PROGRESS_PLIES: Partial<Record<RuleVariant, number>> = {
  [RULE_VARIANTS.checkers]: 80,
  [RULE_VARIANTS.halma]: 400,
  [RULE_VARIANTS.squareFour]: 400,
  /*
   * Chinese Checkers is capped like the others but says something different
   * when it ends — see `couldNotFinish`.
   *
   * It was left out until its star camps were wired in, because the rule was
   * reading an empty camp for them and would have drawn every game for a
   * reason that looked like a property of the game. That is fixed and
   * checked: on a 17×17 star, black's distance falls from 24 at its own camp
   * to 0 at the corner of the camp it fills.
   *
   * The separate wording is John's ruling, and it is the right one. Fifteen
   * bot games across every grade never filled more than three of the ten
   * squares a win needs, so this game may not be winnable in real play. A
   * plain draw would file that away as an ordinary result and the evidence
   * would be gone; saying plainly that the game could not be finished keeps
   * the game playable and keeps the symptom in view.
   */
  [RULE_VARIANTS.chineseCheckers]: 400,
};

/**
 * Whether this game ended because nobody could finish it, rather than by any
 * of the ordinary draws.
 *
 * Derived, never stored — the same way `drawnByLength` answers its question.
 * A finished game is its settings and its moves, and anything the two of them
 * imply is a question to ask, not a column to keep in step.
 */
export function couldNotFinish(state: GameState): boolean {
  return state.status === GAME_STATUS.draw && stalled(state);
}

/** Whether this game can run away at all: pieces that move rather than land. */
export function canStall(variant: string): boolean {
  return NO_PROGRESS_PLIES[variant as RuleVariant] !== undefined;
}

/**
 * The camp a colour is trying to fill, in whichever geometry its game uses.
 *
 * Halma lays its camps out in the corners of a square board; Chinese Checkers
 * lays them at the points of a star, from a different module, on a board size
 * the square one has never heard of. Asking the wrong one is not an error you
 * see — it answers with an empty camp.
 */
function farCamp(size: number, stone: Stone): Point[] {
  const other: Stone = stone === "black" ? "white" : "black";
  if (size === starSize(STAR_RADIUS)) return starCampSquares(STAR_RADIUS, other);
  return campSquares(size, other);
}

/**
 * How far a point is from the camp a colour is trying to fill, or null when
 * this board has no camps this rule can read.
 *
 * NULL RATHER THAN ZERO, and that is the whole of a bug worth remembering.
 * The first version answered zero for a board it did not know — and zero is a
 * distance, so every piece was already home, no move ever set a new low, and
 * every game read as one long idle run. Measured on Chinese Checkers, whose
 * 17×17 star board is not in the square game's table: the rule would have
 * drawn every game of it at the threshold, and the reason would have looked
 * like a property of the game rather than a hole in the rule.
 *
 * A rule that cannot measure must not fire. Silence is the safe answer; zero
 * is the dangerous one.
 *
 * Measured to the far corner of the camp rather than its nearest square, so
 * the number keeps falling all the way in: a piece at the camp's edge is
 * still getting somewhere while it fills the depth of it.
 */
export function distanceHome(size: number, stone: Stone, point: Point): number | null {
  const far = farCamp(size, stone);
  if (far.length === 0) return null;
  const corner = far[far.length - 1];
  return Math.abs(point.row - corner.row) + Math.abs(point.col - corner.col);
}

/**
 * Whether one move got anywhere, for a game with captures.
 *
 * Checkers takes the draughts definition exactly: a capture, or a move by a
 * man rather than a king. Both are irreversible — a captured piece does not
 * come back, and a man never becomes a man again — so a game with either in
 * it lately is going somewhere. Two kings circling is the case the rule
 * exists for, and it is the only case with neither.
 */
function tookOrPromoted(move: Move): boolean {
  if ((move.captured?.length ?? 0) > 0) return true;
  return move.wasKing !== true;
}

/**
 * The total distance a colour's pieces stand from the camp they are filling,
 * on a given board, or null when this board has no camps this rule reads.
 */
function totalDistance(board: Cell[], size: number, stone: Stone): number | null {
  let sum = 0;
  for (let index = 0; index < board.length; index += 1) {
    if (board[index] !== stone) continue;
    const away = distanceHome(size, stone, { row: Math.floor(index / size), col: index % size });
    if (away === null) return null;
    sum += away;
  }
  return sum;
}

/**
 * Whether a racing game has gone `window` plies with neither side ever
 * getting nearer than it stood at the start of them.
 *
 * WINDOWED, AND REWOUND RATHER THAN REPLAYED — both for the same reason,
 * which is that the first version of this was quadratic and nobody noticed
 * until a bot test timed out. It walked the whole move list from the opening
 * position on every single move, recomputing every piece's distance each
 * time; a Halma game of a few hundred plies did that a few hundred times and
 * took four hundred seconds instead of thirty.
 *
 * So this reads the CURRENT board, which the state already has, and rewinds
 * the last `window` moves to see where things stood then. Bounded work, once
 * per move, however long the game runs.
 *
 * It is also closer to the rule it is named after. The fifty-move rule counts
 * since the last capture or pawn move — a window on recent play, not a
 * ledger of the whole game — and "nobody has got anywhere lately" is the
 * question actually being asked.
 */
function racingStalled(state: GameState, window: number): boolean {
  const { size } = state.settings;
  if (state.moves.length < window) return false;

  const board = [...state.board];
  const now: Partial<Record<Stone, number>> = {};
  for (const stone of ["black", "white"] as Stone[]) {
    const total = totalDistance(board, size, stone);
    if (total === null) return false;
    now[stone] = total;
  }

  // Rewind the window: a race has no captures, so a move is just a piece
  // stepping, and putting it back is the same step the other way.
  for (let at = state.moves.length - 1; at >= state.moves.length - window; at -= 1) {
    const move = state.moves[at];
    if (move.from === undefined) return false;
    board[move.from.row * size + move.from.col] = board[move.row * size + move.col];
    board[move.row * size + move.col] = null;
  }

  for (const stone of ["black", "white"] as Stone[]) {
    const before = totalDistance(board, size, stone);
    if (before === null) return false;
    // Anybody nearer than they stood a window ago has got somewhere.
    if ((now[stone] ?? 0) < before) return false;
  }
  return true;
}

/**
 * How many plies have been played with nobody getting anywhere, for the games
 * measured that way, or null where the question is asked differently.
 *
 * Only Checkers answers a count: its rule is "since the last capture or man's
 * move", which is a thing you can point at in the record. The racing games
 * answer a yes or no over a window instead — see `racingStalled`.
 */
export function pliesWithoutProgress(state: GameState): number | null {
  if (state.settings.variant !== RULE_VARIANTS.checkers) return null;
  let idle = 0;
  for (let at = state.moves.length - 1; at >= 0; at -= 1) {
    if (tookOrPromoted(state.moves[at])) break;
    idle += 1;
  }
  return idle;
}

/** Whether this game has gone nowhere for long enough to call it a draw. */
export function stalled(state: GameState): boolean {
  const variant = state.settings.variant;
  const limit = NO_PROGRESS_PLIES[variant as RuleVariant];
  if (limit === undefined) return false;
  if (variant !== RULE_VARIANTS.checkers) return racingStalled(state, limit);
  const idle = pliesWithoutProgress(state);
  return idle !== null && idle >= limit;
}
