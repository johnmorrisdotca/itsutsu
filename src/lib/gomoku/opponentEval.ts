import { shapeScore } from "./analysis";
import {
  campSquares,
  discCount,
  isStone,
  otherStone,
  pointOf,
  legalPoints,
} from "./engine";
import { DIRECTIONS, GAME_STATUS, STONES, VARIANT_SPECS } from "./gomoku.constants";
import { SHAPE_BASE } from "./analysis.constants";
import { rulesFor } from "./engine";
import { DECIDED_SCORE, DRAW_SCORE, EVAL_WEIGHTS } from "./opponent.constants";
import { threatAt } from "./threats";
import { tengen } from "./obstacles";
import type { GameState, Point, Stone, VariantSpec } from "./gomoku.types";

/**
 * How good a position is for one colour, read from the game's spec rather than
 * from its name.
 *
 * Every family of game here is scored by the thing that family is about: the
 * discs and the corners where stones turn, the pieces home where they race,
 * the stones taken where they are taken, the shape of the lines where lines
 * are read — and the sign of all of it flips in the giveaway games, where
 * making the thing is how you lose.
 *
 * Nothing here decides anything. A settled game is scored from what the engine
 * already put in `status` and `winner`, so a variant with a losing condition
 * nobody here has thought about is still scored correctly the moment it
 * settles: the engine settled it.
 */

/**
 * Whether the threat ladder in `threats.ts` says anything true about this
 * game.
 *
 * The reading counts fives, fours and open threes and calls them good. That
 * is exactly backwards in a giveaway game, where a line loses; it is a
 * different question in the maker-breaker game, where a line of *either*
 * colour is what one side wants; and it is beside the point where a shorter
 * run loses or a square wins. The spec says which of those is the case; the
 * variant's name is never asked.
 */
export function readsThreats(spec: VariantSpec): boolean {
  return (
    spec.analysis &&
    !spec.misere &&
    !spec.makerBreaker &&
    spec.loseLength === null &&
    !spec.squareWins
  );
}

/**
 * Which way the line reading points for this colour.
 *
 * +1 where making a line wins, -1 where it loses. In the maker-breaker game
 * the maker wants a line of either colour and the breaker wants none, so the
 * two sides read the same board with opposite signs.
 */
function lineSign(spec: VariantSpec, stone: Stone): number {
  if (spec.misere) return -1;
  if (spec.makerBreaker) return stone === STONES.black ? 1 : -1;
  return 1;
}

/** What a finished game is worth, from `stone`'s side of the board. */
function settledScore(state: GameState, stone: Stone): number {
  if (state.status === GAME_STATUS.draw) return DRAW_SCORE;
  if (state.winner === null) return DRAW_SCORE;
  return state.winner === stone ? DECIDED_SCORE : -DECIDED_SCORE;
}

/** The four corners of the board, which in a flipping game can never be turned. */
function corners(size: number): Point[] {
  const last = size - 1;
  return [
    { row: 0, col: 0 },
    { row: 0, col: last },
    { row: last, col: 0 },
    { row: last, col: last },
  ];
}

/**
 * The flipping games: corners, then how many replies each side is left with,
 * and only late on the count of discs itself.
 *
 * Holding more discs early is famously the losing plan — every disc is one
 * more thing the other side can turn — so the count is weighted by how full
 * the board is, and matters most at the end, when it is the whole result.
 */
function flipScore(state: GameState, stone: Stone, spec: VariantSpec): number {
  const { size } = state.settings;
  const foe = otherStone(stone);
  const discs = discCount(state.board);
  const played = discs.black + discs.white;
  const fullness = played / (size * size);
  // A giveaway flipping game is won by the smaller pile, so the lead is negated.
  const sign = spec.misere ? -1 : 1;

  let held = 0;
  for (const corner of corners(size)) {
    const cell = state.board[corner.row * size + corner.col];
    if (cell === stone) held += 1;
    else if (cell === foe) held -= 1;
  }

  const mine = legalPoints(state).length;
  const mobility = state.toPlay === stone ? mine : -mine;

  return (
    sign * held * EVAL_WEIGHTS.corner +
    sign * (discs[stone] - discs[foe]) * EVAL_WEIGHTS.disc * fullness +
    mobility * EVAL_WEIGHTS.mobility
  );
}

/** How far a point is from the middle of the far camp it is racing towards. */
function campDistance(size: number, stone: Stone, point: Point): number {
  const far = campSquares(size, otherStone(stone));
  let nearest = size * 2;
  for (const square of far) {
    const gap = Math.abs(square.row - point.row) + Math.abs(square.col - point.col);
    if (gap < nearest) nearest = gap;
  }
  return nearest;
}

/**
 * The race games: pieces already home count for a great deal, and short of
 * that, the whole army's remaining distance to the far camp.
 */
function raceScore(state: GameState, stone: Stone): number {
  const { size } = state.settings;
  const foe = otherStone(stone);
  let mine = 0;
  let theirs = 0;
  let home = 0;
  let away = 0;

  state.board.forEach((cell, index) => {
    if (!isStone(cell)) return;
    const point = pointOf(size, index);
    if (cell === stone) {
      const gap = campDistance(size, stone, point);
      mine += gap;
      if (gap === 0) home += 1;
    } else if (cell === foe) {
      const gap = campDistance(size, foe, point);
      theirs += gap;
      if (gap === 0) away += 1;
    }
  });

  return (home - away) * EVAL_WEIGHTS.home + (theirs - mine) * EVAL_WEIGHTS.advance;
}

/**
 * The connection game: how much of the axis a colour has to join it already
 * spans, less the same for the other side.
 *
 * A thin reading, and honestly so — joining two sides is not a thing lines or
 * counts can see, and a real Hex player searches. It is enough to make the
 * computer play towards its own edges instead of at random, which on an
 * eleven-point rhombus is already a game rather than a scribble.
 */
function connectScore(state: GameState, stone: Stone): number {
  const { size } = state.settings;
  const foe = otherStone(stone);
  const reach = (colour: Stone, along: "row" | "col") => {
    let low = size;
    let high = -1;
    state.board.forEach((cell, index) => {
      if (cell !== colour) return;
      const point = pointOf(size, index);
      const value = along === "row" ? point.row : point.col;
      if (value < low) low = value;
      if (value > high) high = value;
    });
    return high < 0 ? 0 : high - low + 1;
  };
  // Black joins top to bottom, white left to right — see the hex rules module.
  const mineAxis = stone === STONES.black ? "row" : "col";
  const foeAxis = foe === STONES.black ? "row" : "col";
  return (reach(stone, mineAxis) - reach(foe, foeAxis)) * EVAL_WEIGHTS.mobility;
}

/**
 * Every window of `winLength` on the board that only `stone` has stones in,
 * weighted by how many.
 *
 * The whole board rather than one point — which is the difference between an
 * evaluation and a move score, and the difference is not academic. A search
 * has to compare positions several plies apart, and adding up what each stone
 * was worth as it landed does not do that: the sum keeps crediting shape the
 * other side has since shut down. Scored that way, the strongest grade played
 * deeper games and lost to the grade below it, five to nil.
 *
 * A window with any enemy stone in it is dead and scores nothing, which is the
 * whole of why this reads as strength: four in a row with both ends shut is
 * worth exactly as much as it deserves, which is nothing.
 *
 * An obstacle or a hot square counts as blocking, which is right for a dead
 * square and slightly pessimistic for a hot one; and the wrapping boards are
 * read flat, so a line across the join is not counted. Both are approximations
 * in an advisory reading, and the engine still settles every game.
 */
function windowScore(
  board: readonly (string | null)[],
  size: number,
  winLength: number,
  stone: Stone,
): number {
  let total = 0;
  for (const step of DIRECTIONS) {
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const lastRow = row + step.row * (winLength - 1);
        const lastCol = col + step.col * (winLength - 1);
        if (lastRow < 0 || lastRow >= size || lastCol < 0 || lastCol >= size) continue;
        let own = 0;
        let usable = true;
        for (let k = 0; k < winLength; k += 1) {
          const cell = board[(row + step.row * k) * size + (col + step.col * k)];
          if (cell === stone) own += 1;
          else if (cell !== null) {
            usable = false;
            break;
          }
        }
        if (usable && own > 0) total += SHAPE_BASE ** own;
      }
    }
  }
  return total;
}

/**
 * The whole position as a line game reads it: what this colour has going,
 * less what the other colour has, with the sign the game's spec asks for.
 */
export function boardScore(state: GameState, stone: Stone, spec: VariantSpec): number {
  const { board, settings } = state;
  const foe = otherStone(stone);
  const mine = windowScore(board, settings.size, rulesFor(settings, stone).winLength, stone);
  const theirs = windowScore(board, settings.size, rulesFor(settings, foe).winLength, foe);
  // The maker wants a line of either colour; the breaker wants neither.
  if (spec.makerBreaker) return (stone === STONES.black ? 1 : -1) * (mine + theirs);
  return lineSign(spec, stone) * (mine - theirs);
}

/** Distance from the middle of the board, so ties settle inwards. */
function centreScore(size: number, point: Point): number {
  const centre = tengen(size);
  const gap = Math.abs(point.row - centre.row) + Math.abs(point.col - centre.col);
  return (size - gap) * EVAL_WEIGHTS.centre;
}

/**
 * How much a stone landing at `point` is worth to `stone` in a game that reads
 * lines: the shape it makes, plus the shape it denies the other colour by
 * occupying a point they wanted.
 */
export function pointScore(
  before: GameState,
  point: Point,
  stone: Stone,
  spec: VariantSpec,
): number {
  const foe = otherStone(stone);
  const { board, settings } = before;
  const sign = lineSign(spec, stone);
  const offence = shapeScore(board, settings, stone, point);
  const defence = shapeScore(board, settings, foe, point);
  /*
   * In the maker-breaker game a line of either colour is a line, so the maker
   * counts both and the breaker denies both. Everywhere else the other
   * colour's shape at this point is what taking it is worth defensively.
   */
  const denied = spec.makerBreaker ? offence + defence : defence;
  return (
    sign * offence * EVAL_WEIGHTS.shape +
    sign * denied * EVAL_WEIGHTS.shape * 0.85 +
    centreScore(settings.size, point)
  );
}

/**
 * What a whole piece is worth where a game lays several cells at once.
 *
 * A piece from the queue carries both colours, so it is scored cell by cell
 * and signed: a cell of your own colour is shape you have made, a cell of the
 * other colour is shape you have handed over. Without this a piece game is
 * scored by the position alone — which in a game with no captures and no
 * discs is the same number for every placement, and the computer lays its
 * pieces at random. It did, until this existed.
 */
export function pieceScore(
  before: GameState,
  cells: readonly { row: number; col: number; stone: Stone }[],
  me: Stone,
  spec: VariantSpec,
): number {
  let total = 0;
  for (const cell of cells) {
    const point = { row: cell.row, col: cell.col };
    const worth = pointScore(before, point, cell.stone, spec);
    total += cell.stone === me ? worth : -worth;
  }
  return total;
}

/**
 * What the threat reading makes of a point, where the reading applies: the
 * shape this colour would create there, and the shape it denies by taking it.
 * Only the strongest tier consults this — it is the difference between a
 * player who answers what is on the board and one who sees it coming.
 */
export function threatScore(
  before: GameState,
  point: Point,
  stone: Stone,
): number {
  const { board, settings } = before;
  const value: Record<string, number> = {
    five: 40_000,
    openFour: 9_000,
    doubleThreat: 8_000,
    openThree: 1_500,
    four: 1_200,
  };
  const mine = threatAt(board, settings, stone, point).kind;
  const theirs = threatAt(board, settings, otherStone(stone), point).kind;
  const build = mine === null ? 0 : value[mine];
  // Denying a threat is worth a shade less than making the same one yourself.
  const deny = theirs === null ? 0 : value[theirs] * 0.9;
  return build + deny;
}

/**
 * The whole position, from `stone`'s side. A settled game is read straight off
 * the engine's verdict; an unsettled one is read through whichever of the
 * families above the game's spec puts it in.
 */
export function positionScore(state: GameState, stone: Stone): number {
  if (state.status !== GAME_STATUS.playing) return settledScore(state, stone);
  const spec = VARIANT_SPECS[state.settings.variant];
  if (spec.flips) return flipScore(state, stone, spec);
  if (spec.camps) return raceScore(state, stone);
  if (spec.connects) return connectScore(state, stone);

  const foe = otherStone(stone);
  const captured =
    (state.captures[stone] - state.captures[foe]) * EVAL_WEIGHTS.capture;
  return captured;
}
