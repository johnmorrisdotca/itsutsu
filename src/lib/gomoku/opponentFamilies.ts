import { discCount, isStone, legalPoints, otherStone, pointOf } from "./engine";
import { STONES, VARIANT_SPECS } from "./gomoku.constants";
import { farCampSquares } from "./rules/farCamp";
import { isKingAt } from "./rules/checkers";
import { EVAL_WEIGHTS } from "./opponent.constants";
import { scoreArea } from "./rules/go";
import { komiFor } from "./rules/headStart";
import type { GameState, Point, Stone, VariantSpec } from "./gomoku.types";

/**
 * THE FAMILIES OF GAME THAT ARE NOT READ BY THEIR LINES.
 *
 * Split out of `opponentEval.ts`, which reached the file-size gate holding two
 * jobs: reading a line game's shape, and scoring every other family of game by
 * the thing that family is about. This is the second job — the discs and the
 * corners where stones turn, the area where Go is scored, the pieces home where
 * they race, the axis spanned where two sides are joined, and the men and kings
 * of checkers. `positionScore` in `opponentEval.ts` still decides which of these
 * a game's spec puts it in; nothing here asks a variant's name.
 *
 * Pure, like everything the opponent reads: each function takes a state and
 * returns a number, and none of them writes to what it was given.
 */

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
export function flipScore(state: GameState, stone: Stone, spec: VariantSpec): number {
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
export function goScore(state: GameState, stone: Stone): number {
  const area = scoreArea(state.board, state.settings.size);
  const foe = otherStone(stone);
  // The komi this game is counted with: less where handicap stones were given.
  const komi = komiFor(state.settings);
  const mine = area[stone] + (stone === STONES.white ? komi : 0);
  const theirs = area[foe] + (foe === STONES.white ? komi : 0);
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
export function raceScore(state: GameState, stone: Stone): number {
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
export function connectScore(state: GameState, stone: Stone): number {
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
export function checkersScore(state: GameState, stone: Stone): number {
  const { size } = state.settings;
  // Read from the game's rules, never its name: a king is worth what it can do.
  const king = VARIANT_SPECS[state.settings.variant].checkersRules?.flyingKings
    ? EVAL_WEIGHTS.flyingKing
    : EVAL_WEIGHTS.king;
  let score = 0;
  state.board.forEach((cell, index) => {
    if (!isStone(cell)) return;
    const point = pointOf(size, index);
    // A man's own crowning row is the far one from where its colour started.
    const towards = cell === STONES.black ? point.row : size - 1 - point.row;
    const worth = isKingAt(state.kings, point)
      ? king
      : EVAL_WEIGHTS.man + towards * EVAL_WEIGHTS.crowning;
    score += cell === stone ? worth : -worth;
  });
  return score;
}
