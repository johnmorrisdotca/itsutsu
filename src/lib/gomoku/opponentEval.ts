import { shapeScore } from "./analysis";
import {
  discCount,
  isStone,
  otherStone,
  pointOf,
  legalPoints,
} from "./engine";
import { DIRECTIONS, GAME_STATUS, STONES, VARIANT_SPECS } from "./gomoku.constants";
import { SHAPE_BASE } from "./analysis.constants";
import { rulesFor } from "./engine";
import { farCampSquares, racesForCamp } from "./rules/farCamp";
import { isKingAt } from "./rules/checkers";
import { DECIDED_SCORE, DRAW_SCORE, EVAL_WEIGHTS } from "./opponent.constants";
import { KOMI, scoreArea } from "./rules/go";
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
 *
 * DO NOT REWEIGHT THIS TO FIX THE BOTTOM OF THE LADDER. It was tried, and the
 * measurement is the reason it is not here.
 *
 * The three grades that do not search are level with each other at Reversi:
 * over thirty games a pairing, разряд 14-16 級 and разряд 14-16 段 while 級 loses
 * 6-23 to 段 — so following this reading MORE closely at one ply does not
 * reliably make a player stronger. The obvious culprit is the disc term, since
 * greedy disc-taking is the classic losing plan, and the obvious fix is to make
 * it later still. Cubing `fullness` made things worse in both directions:
 * разряд went to 15-11 up on 級, and 級 came out 16-14 AHEAD of 段, which is a
 * new inversion where there had been a clear one.
 *
 * The diagnosis that survives is that a flipping game cannot be played at one
 * ply at all. A move there is good or bad because of what it lets the other side
 * do next, so no weighting of a reading that cannot see next puts three one-ply
 * players in an order. What separates the bottom grades is their noise and their
 * blunder rate, and those need a judgement worth degrading. Giving 段 a search
 * would order them — and 段 is the Medium grade, so that is a bill on every
 * middling game on the site, and a decision for the site's owner rather than for
 * this comment.
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

/**
 * Go, by the only measure Go has: the area score, which is what the engine
 * settles the game by.
 *
 * Go was falling through to the capture count, and its placements were being
 * scored by the line reading — so the computer was being rewarded for
 * building rows of five on a Go board and had no idea what territory was. It
 * played a long, shapeless game because nothing it could see ever improved.
 *
 * Komi belongs in it: it is part of the score, and a bot that thinks an empty
 * board is level is wrong before the first stone.
 */
function goScore(state: GameState, stone: Stone): number {
  const area = scoreArea(state.board, state.settings.size);
  const foe = otherStone(stone);
  const mine = area[stone] + (stone === STONES.white ? KOMI : 0);
  const theirs = area[foe] + (foe === STONES.white ? KOMI : 0);
  return (mine - theirs) * EVAL_WEIGHTS.area;
}

/**
 * How far a point is from the nearest square of the far camp it is racing
 * towards.
 *
 * The camp comes from `farCampSquares`, which knows the star board as well as
 * the square ones. This used to ask the square table directly, which has no
 * row for the 17-wide star, so on Chinese Checkers every piece scored as
 * equally far from home wherever it stood and every grade played blind.
 *
 * Null for a board with no camp to measure to, never a distance. A number
 * here would be read as one — that is exactly how the draw rule once took
 * every piece to be home — so the caller is made to notice instead.
 */
function campDistance(size: number, stone: Stone, point: Point): number | null {
  const far = farCampSquares(size, stone);
  if (far.length === 0) return null;
  let nearest = Infinity;
  for (const square of far) {
    const gap = Math.abs(square.row - point.row) + Math.abs(square.col - point.col);
    if (gap < nearest) nearest = gap;
  }
  return nearest;
}

/**
 * A race is being scored on a board whose camps neither camp module knows.
 * That is a programming error — every board a race game is offered at is
 * checked in farCamp.test.ts — and the honest answer is to say so, not to
 * play on with a made-up distance.
 */
function unreadableCamp(size: number): never {
  throw new Error(`No camp to race for on a ${size}×${size} board.`);
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
      const gap = campDistance(size, stone, point) ?? unreadableCamp(size);
      mine += gap;
      if (gap === 0) home += 1;
    } else if (cell === foe) {
      const gap = campDistance(size, foe, point) ?? unreadableCamp(size);
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
 * Checkers: what each side has on the board, and how close its men are to being
 * crowned.
 *
 * Thin, and it is the difference between a game and a coin toss. Checkers
 * matches none of the families above — it does not flip, it races for no camp,
 * it connects nothing, and a jump is a slide rather than a capture pair, so
 * `state.captures` is never written — and it therefore fell all the way through
 * to the capture count, which is zero in every position a game of checkers can
 * reach. Every move scored the same as every other, so the grade's noise and its
 * blunder rate had nothing to sit on top of and the ladder was flat: measured
 * over ten games a pairing, 級 drew level with 名人 and разряд beat both of the
 * top two. That is not a weak ladder, it is no ladder, and it is the same fault
 * as the star board where every marble scored as equally far from home.
 */
function checkersScore(state: GameState, stone: Stone): number {
  const { size } = state.settings;
  let score = 0;
  state.board.forEach((cell, index) => {
    if (!isStone(cell)) return;
    const point = pointOf(size, index);
    // A man's own crowning row is the far one from where its colour started.
    const towards = cell === STONES.black ? point.row : size - 1 - point.row;
    const worth = isKingAt(state.kings, point)
      ? EVAL_WEIGHTS.king
      : EVAL_WEIGHTS.man + towards * EVAL_WEIGHTS.crowning;
    score += cell === stone ? worth : -worth;
  });
  return score;
}

/**
 * Whether the reading below is a true enough account of a game with this spec to
 * be worth MINIMISING several plies deep — which is a higher bar than saying
 * something about it, and the bar that matters.
 *
 * Asked before any general look-ahead is spent — see `opponentLook.ts`. Two ways
 * to fail it, and both were measured rather than argued:
 *
 * - **It says nothing.** A game this reading cannot place scores every position
 *   identically, and "identically" is a number in range: a minimax over it
 *   returns whichever turn was enumerated first and looks exactly like a
 *   judgement rather than like the silence it is.
 * - **It says something untrue.** `connectScore` is the clear case, and its own
 *   comment says so: how much of an axis a colour spans is not what joining two
 *   sides means, and a real Hex player searches for the join. It is enough to
 *   aim a one-ply player at its own edges instead of at random, and it is not
 *   enough to be maximised. Measured over ten games a pairing on an eleven-point
 *   rhombus, searching it took 名人 from 8-2 against разряд to 5-5, and 段 from
 *   half the field to a third of it — which is the oldest lesson in this
 *   directory: a deeper search over a reading that misunderstands the game finds
 *   the moves that exploit the misunderstanding best.
 *
 * So a reading that is only a nudge stays a nudge. Hex keeps the one-ply
 * reading and the engine-checked guard above it, which are right there, and the
 * grades are separated at it by how often they blunder rather than by depth.
 */
export function readsPosition(spec: VariantSpec): boolean {
  return spec.flips || spec.go || racesForCamp(spec) || spec.captures || spec.checkers;
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
  if (spec.go) return goScore(state, stone);
  if (racesForCamp(spec)) return raceScore(state, stone);
  if (spec.connects) return connectScore(state, stone);
  if (spec.checkers) return checkersScore(state, stone);

  const foe = otherStone(stone);
  const captured =
    (state.captures[stone] - state.captures[foe]) * EVAL_WEIGHTS.capture;
  return captured;
}
