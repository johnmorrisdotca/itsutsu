import { rulesFor } from "../engine";
import { DIRECTIONS, LINE_RULES } from "../gomoku.constants";
import { LINE_WEIGHTS } from "./expert.constants";
import type { Cell, GameSettings, GameState, Point, Stone } from "../gomoku.types";
import type { LineReading } from "./expert.types";

/**
 * What is actually on a five-in-a-row board.
 *
 * One job: given a board and a colour, say what shape that colour has, which
 * points would complete a five for it, and how many of its threes are still
 * open at both ends. It says nothing about what any of that is worth or what
 * to do about it — `lineExpert.ts` decides that, and keeping the two apart is
 * what lets the reading be checked against a diagram without a player in the
 * way.
 */

/** Whether a line rule counts a run longer than the winning length as a win. */
function overlineWins(settings: GameSettings, stone: Stone): boolean {
  return rulesFor(settings, stone).lineRule === LINE_RULES.atLeast;
}

/**
 * Every window of `length` the colour could still fill, weighted, and the
 * points that would finish one.
 *
 * A window holding any of the other colour is dead and counts nothing, which
 * is the whole reason this reads as strength rather than as enthusiasm: four
 * in a row with both ends shut is worth exactly what it deserves, which is
 * nothing at all.
 *
 * `exact` is the variant whose five must be five and not six. There, a window
 * with one of its own stones pressed against either flank is not a five in
 * waiting — filling it would make an overline, which that rule does not count
 * — so it is not offered as a point to five. The score still counts it: an
 * overline is poor shape rather than no shape.
 */
export function lineRead(
  board: readonly Cell[],
  size: number,
  length: number,
  stone: Stone,
  exact: boolean,
): LineReading {
  const fives = new Set<number>();
  /*
   * Open threes, keyed by where they start and which way they run.
   *
   * They have to be counted rather than added up, and the difference is not
   * pedantry. One open three sits inside three different live windows — the
   * one that leads it, the one that centres it and the one that trails it —
   * so a plain tally reported three, and every position with a single open
   * three in it was read as a double three, which is very close to a won
   * game. Both colours were flattered equally and the reading was wrong about
   * both.
   */
  const threes = new Set<number>();
  let score = 0;

  /*
   * Only the part of the board anything has been played on.
   *
   * A window with no stone in it at all is worth nothing to either colour, and
   * on a fifteen by fifteen board early in a game all but a handful of the
   * four thousand windows are exactly that. Reading the whole board every time
   * cost about a third of a second a move in the middlegame, which is a search
   * two plies shallower than the same budget could have bought. The bounds are
   * widened by a window's length, so no window that touches a stone is outside
   * them.
   */
  const bounds = playedBounds(board, size, length);
  if (bounds === null) return { score: 0, fives: [], openThrees: 0 };
  const { fromRow, toRow, fromCol, toCol } = bounds;

  for (const step of DIRECTIONS) {
    for (let row = fromRow; row <= toRow; row += 1) {
      for (let col = fromCol; col <= toCol; col += 1) {
        const endRow = row + step.row * (length - 1);
        const endCol = col + step.col * (length - 1);
        if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;

        let own = 0;
        let hole = -1;
        let first = -1;
        let dead = false;
        for (let k = 0; k < length; k += 1) {
          const index = (row + step.row * k) * size + (col + step.col * k);
          const here = board[index];
          if (here === stone) {
            own += 1;
            if (first < 0) first = index;
          } else if (here !== null) {
            dead = true;
            break;
          } else hole = index;
        }
        if (dead || own === 0) continue;

        score += LINE_WEIGHTS.window[own] ?? LINE_WEIGHTS.window[LINE_WEIGHTS.window.length - 1];
        if (own === length - 1) {
          /*
           * One empty left in the window: filling it is five, unless the rule
           * says five means five and one of our own is already pressed to a
           * flank, which would make the run one too long.
           */
          if (!exact || !ownFlank(board, size, row, col, endRow, endCol, step, stone)) {
            fives.add(hole);
          }
        }

        /*
         * The open three, read from the same window by looking at both flanks.
         *
         * A window one short of full whose two flanking points are both empty
         * is one move from a four with both ends open — .XXX.. and .XX.X. and
         * .X.XX. and no others — and an open four cannot be blocked, so this
         * is the last moment the other side gets to say anything. A three with
         * one end shut sits in just as many live windows and is not remotely
         * the same thing, which is why the flanks have to be looked at rather
         * than the window alone.
         */
        if (own === length - 2 && bothFlanksEmpty(board, size, row, col, endRow, endCol, step)) {
          // Keyed by its first stone and its direction, so one three counts once.
          threes.add(first * DIRECTIONS.length + DIRECTIONS.indexOf(step));
        }
      }
    }
  }

  return { score, fives: [...fives], openThrees: threes.size };
}

/**
 * The window starts worth walking: everywhere a window of `length` could still
 * touch a stone, and nowhere else.
 *
 * Null when nothing has been played, which is a reading of nothing rather than
 * a reading of zero — there is no shape on an empty board for either colour,
 * and the caller says so rather than walking four thousand windows to find it
 * out.
 */
function playedBounds(
  board: readonly Cell[],
  size: number,
  length: number,
): { fromRow: number; toRow: number; fromCol: number; toCol: number } | null {
  let lowRow = size;
  let highRow = -1;
  let lowCol = size;
  let highCol = -1;
  for (let index = 0; index < board.length; index += 1) {
    if (board[index] === null) continue;
    const row = Math.floor(index / size);
    const col = index % size;
    if (row < lowRow) lowRow = row;
    if (row > highRow) highRow = row;
    if (col < lowCol) lowCol = col;
    if (col > highCol) highCol = col;
  }
  if (highRow < 0) return null;
  const reach = length - 1;
  return {
    fromRow: Math.max(0, lowRow - reach),
    toRow: Math.min(size - 1, highRow),
    fromCol: Math.max(0, lowCol - reach),
    toCol: Math.min(size - 1, highCol + reach),
  };
}

/** The cell just before a window and the one just after it; off the board reads as neither. */
function flanks(
  board: readonly Cell[],
  size: number,
  row: number,
  col: number,
  endRow: number,
  endCol: number,
  step: Point,
): [Cell | undefined, Cell | undefined] {
  const beforeRow = row - step.row;
  const beforeCol = col - step.col;
  const afterRow = endRow + step.row;
  const afterCol = endCol + step.col;
  const before =
    beforeRow < 0 || beforeRow >= size || beforeCol < 0 || beforeCol >= size
      ? undefined
      : board[beforeRow * size + beforeCol];
  const after =
    afterRow < 0 || afterRow >= size || afterCol < 0 || afterCol >= size
      ? undefined
      : board[afterRow * size + afterCol];
  return [before, after];
}

/** Whether this colour already sits against either flank of the window. */
function ownFlank(
  board: readonly Cell[],
  size: number,
  row: number,
  col: number,
  endRow: number,
  endCol: number,
  step: Point,
  stone: Stone,
): boolean {
  const [before, after] = flanks(board, size, row, col, endRow, endCol, step);
  return before === stone || after === stone;
}

/** Whether both flanks of the window are empty points on the board. */
function bothFlanksEmpty(
  board: readonly Cell[],
  size: number,
  row: number,
  col: number,
  endRow: number,
  endCol: number,
  step: Point,
): boolean {
  const [before, after] = flanks(board, size, row, col, endRow, endCol, step);
  return before === null && after === null;
}

/** What this colour has on this board, with the variant's own line rule applied. */
export function readingFor(state: GameState, stone: Stone): LineReading {
  const { board, settings } = state;
  return lineRead(
    board,
    settings.size,
    rulesFor(settings, stone).winLength,
    stone,
    !overlineWins(settings, stone),
  );
}

