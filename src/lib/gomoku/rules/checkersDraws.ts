import { STONES, VARIANT_SPECS } from "../gomoku.constants";
import type { EndgameCount, GameState, Move, PieceTally, Stone } from "../gomoku.types";
import { otherStone } from "./board";

/**
 * The draws a game of the checkers family writes down for itself: the same
 * position coming round again, and the endings that must be won inside a
 * count of moves.
 *
 * Both are read from the record rather than stored, the way the no-progress
 * count is, so a replayed game draws where the played one did. Neither ever
 * fires on a game whose rules do not name it — English checkers here names
 * neither — and neither answers anything but "not drawn" when it cannot tell.
 *
 * A MOVE HERE IS A TURN. The engine records a capture chain one jump at a
 * time, so a count of moves is a count of the jumps that began a turn, never
 * of the jumps that continued one.
 */

/** Whether a move could be taken back by a later one: a king stepping, with nothing captured. */
function reversible(move: Move): boolean {
  return move.from !== undefined && (move.captured?.length ?? 0) === 0 && move.wasKing === true;
}

/**
 * How many times the position on the board now has stood there with this side
 * to move, this time included.
 *
 * Exact, not hashed. Walking back from now, each move is added up as a piece
 * arriving at one square and leaving another; the position before a move is
 * the position now exactly when every square's arrivals and departures cancel.
 * Only moves that could be undone are walked — a capture or a man's step can
 * never be taken back, so nothing before one can be the position now — which
 * keeps the walk as short as the run of king moves it is looking along.
 */
export function timesRepeated(state: GameState): number {
  const net = new Map<string, number>();
  let unsettled = 0;
  const shift = (key: string, by: number) => {
    const was = net.get(key) ?? 0;
    const now = was + by;
    if (was === 0) unsettled += 1;
    else if (now === 0) unsettled -= 1;
    net.set(key, now);
  };
  let times = 1;
  for (let at = state.moves.length - 1; at >= 0; at -= 1) {
    const move = state.moves[at];
    if (!reversible(move) || move.from === undefined) break;
    shift(`${move.stone}:${move.row},${move.col}`, 1);
    shift(`${move.stone}:${move.from.row},${move.from.col}`, -1);
    if (unsettled === 0 && move.stone === state.toPlay) times += 1;
  }
  return times;
}

type Tallies = Record<Stone, PieceTally>;

/** Each side's kings and men on the board now. */
function talliesOf(state: GameState): Tallies {
  const { size } = state.settings;
  const kings = new Set(state.kings.map((point) => point.row * size + point.col));
  const tallies: Tallies = { black: { kings: 0, men: 0 }, white: { kings: 0, men: 0 } };
  state.board.forEach((cell, index) => {
    if (cell !== STONES.black && cell !== STONES.white) return;
    if (kings.has(index)) tallies[cell].kings += 1;
    else tallies[cell].men += 1;
  });
  return tallies;
}

function sameTally(a: PieceTally, b: PieceTally): boolean {
  return a.kings === b.kings && a.men === b.men;
}

/** Whether these pieces are one of the count's endings, either side holding either half. */
function inEnding(count: EndgameCount, tallies: Tallies): boolean {
  return count.endings.some(
    ([one, other]) =>
      (sameTally(tallies.black, one) && sameTally(tallies.white, other)) ||
      (sameTally(tallies.white, one) && sameTally(tallies.black, other)),
  );
}

/** The most pieces any of the count's endings holds, so a fuller board is passed over without a walk. */
function largestEnding(count: EndgameCount): number {
  return Math.max(...count.endings.map(([one, other]) => one.kings + one.men + other.kings + other.men));
}

/**
 * How many turns have been played since the position entered one of this
 * count's endings, or null when it is not in one of them now.
 *
 * Walked back from now, taking each move's effect off the tallies — a captured
 * piece returned to its side, a crowning undone — until the position before a
 * move was not in the ending: that move is the one that entered it, and every
 * turn after it is counted.
 */
export function turnsInEnding(state: GameState, count: EndgameCount): number | null {
  if (count.endings.length === 0) return null;
  const tallies = talliesOf(state);
  const pieces = tallies.black.kings + tallies.black.men + tallies.white.kings + tallies.white.men;
  if (pieces > largestEnding(count) || !inEnding(count, tallies)) return null;
  let turns = 0;
  for (let at = state.moves.length - 1; at >= 0; at -= 1) {
    const move = state.moves[at];
    const taken = move.captured?.length ?? 0;
    if (taken > 0) {
      const loser = tallies[otherStone(move.stone)];
      if (move.capturedWasKing === true) loser.kings += taken;
      else loser.men += taken;
    }
    if (move.crowned === true) {
      tallies[move.stone].kings -= 1;
      tallies[move.stone].men += 1;
    }
    if (!inEnding(count, tallies)) break;
    if (move.from !== undefined && move.continuedChain !== true) turns += 1;
  }
  return turns;
}

/** Whether the game has come to one of the draws its own rules write down. */
export function drawnByCheckersRule(state: GameState): boolean {
  return repeatedTooOften(state) || endingRanOut(state);
}

/** Whether the position has now stood as often as the game's repetition rule allows. */
export function repeatedTooOften(state: GameState): boolean {
  const limit = VARIANT_SPECS[state.settings.variant].checkersRules?.repetitionDraw ?? null;
  return limit !== null && timesRepeated(state) >= limit;
}

/** Whether an ending the game counts has run out of moves without being won. */
export function endingRanOut(state: GameState): boolean {
  const counts = VARIANT_SPECS[state.settings.variant].checkersRules?.endgameCounts ?? [];
  return counts.some((count) => (turnsInEnding(state, count) ?? -1) >= count.movesEach * 2);
}
