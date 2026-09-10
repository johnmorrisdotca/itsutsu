import { STAR_RADIUS, starCampSquares, starSize } from "./chineseCheckers";
import { campSquares } from "./camps";
import { GAME_STATUS, RULE_VARIANTS, VARIANT_SPECS } from "../gomoku.constants";
import type { GameState, Move, Point, RuleVariant, Stone } from "../gomoku.types";

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
 * How long nobody getting anywhere ends a game, and how "anywhere" is read,
 * per family.
 *
 * THE MEASURE IS DATA, deliberately. `stalled` used to ask
 * `variant !== RULE_VARIANTS.checkers` to decide which question to put, which
 * is the engine switching on a variant's NAME — the one thing AGENTS.md says
 * it never does — and a name in an `if` only looks harmless while there are
 * two families. There are three. A row here names its own measure and the
 * engine reads the row.
 *
 * MEASURED, not reasoned about. My first numbers came from imagining how long
 * a march ought to take, and one of them was low enough to end a real game of
 * Halma — an existing bot test caught it. What matters is not how long a game
 * runs but how long it runs WITHOUT anybody getting anywhere, and those are
 * different by an order of magnitude:
 *
 *     checkers    longest idle run 4 plies, in games of up to 72
 *     halma       longest idle run 18 plies, in games of up to 389
 *     squareFour  longest run of slides 232, in games of up to 240
 *
 * All measured over bot-vs-bot play with this rule lifted, or it would have
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
export const PROGRESS_MEASURES = {
  /** A capture or a man's move: draughts' own definition of irreversible. */
  taking: "taking",
  /** Getting nearer the camp you are filling than you stood a window ago. */
  racing: "racing",
  /** Putting a new piece down, in a game that places a few and then slides them. */
  placing: "placing",
} as const;

export type ProgressMeasure = (typeof PROGRESS_MEASURES)[keyof typeof PROGRESS_MEASURES];

export const NO_PROGRESS_RULES: Partial<Record<RuleVariant, { plies: number; measure: ProgressMeasure }>> = {
  [RULE_VARIANTS.checkers]: { plies: 80, measure: PROGRESS_MEASURES.taking },
  [RULE_VARIANTS.halma]: { plies: 400, measure: PROGRESS_MEASURES.racing },
  /*
   * squareFour is four pieces a side and then, as the spec puts it, "a turn
   * moves one". It was listed here from the start with the racing measure and
   * has been guarding NOTHING ever since: its board is 5×5, `CAMP_ROWS` has no
   * row for 5, so `distanceHome` correctly declined to measure and the rule
   * correctly declined to fire — while `canStall` went on answering true. A
   * guard that reports itself present and does nothing is worse than no guard,
   * because nobody looks at it again.
   *
   * MEASURED, like the others, and the measurement is why the number is so
   * large. 150 bot games over every grade pairing and six seeds: every single
   * one was WON, none drawn, none unfinished. So the bots never needed this —
   * two people shuffling do, which is exactly the case no suite was ever going
   * to catch. Slides after the last placement, in games that were won:
   *
   *     min 0, median 2, max 232, only three of 150 above 142
   *
   * 4000 is about twenty times the longest real game seen, which is the margin
   * checkers and halma already carry. Absurd for a 5×5 board, and deliberately
   * so: too generous costs a draw somewhat later, too tight takes a win off
   * somebody who was about to make it.
   */
  [RULE_VARIANTS.squareFour]: { plies: 4000, measure: PROGRESS_MEASURES.placing },
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
  [RULE_VARIANTS.chineseCheckers]: { plies: 400, measure: PROGRESS_MEASURES.racing },
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
  return NO_PROGRESS_RULES[variant as RuleVariant] !== undefined;
}

/**
 * The camp a colour is trying to fill, in whichever geometry its game uses.
 *
 * Halma lays its camps out in the corners of a square board; Chinese Checkers
 * lays them at the points of a star, from a different module, on a board size
 * the square one has never heard of. Asking the wrong one is not an error you
 * see — it answers with an empty camp.
 */
/*
 * Kept, because this is asked for every piece, four times a ply, for as long
 * as a game runs — and it builds a fresh array of points every time it is
 * asked. On a 17x17 star that was forty array builds a ply and several
 * hundred thousand short-lived points over a game, which made the bot's
 * "finish a game of anything" test three times slower and timed it out in CI
 * at 45s against a 30s budget. Local runs never saw it: 9s there, and the
 * margin hid it.
 *
 * A camp is a fact about a board size and a colour. It cannot change while
 * the process lives, the key space is a handful of sizes times two, and the
 * array is only ever read — `distanceHome` wants its last square and its
 * length. So it is worked out once and kept.
 */
const farCamps = new Map<string, Point[]>();

function farCamp(size: number, stone: Stone): Point[] {
  const key = `${size}|${stone}`;
  const known = farCamps.get(key);
  if (known !== undefined) return known;
  const other: Stone = stone === "black" ? "white" : "black";
  const camp = size === starSize(STAR_RADIUS) ? starCampSquares(STAR_RADIUS, other) : campSquares(size, other);
  farCamps.set(key, camp);
  return camp;
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
 * The single square `distanceHome` measures to, for a colour on a board, or
 * null where this board has no camps this rule can read.
 *
 * The same answer `distanceHome` works out, taken once instead of per point.
 * `farCamp` is memoised, but the lookup still builds a key, and a loop of
 * four hundred moves asking twice each is eight hundred throwaway strings a
 * call in a rule the engine asks on every node of the bot's search.
 */
function homeCorner(size: number, stone: Stone): Point | null {
  const far = farCamp(size, stone);
  return far.length === 0 ? null : far[far.length - 1];
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
 * Whether a racing game has gone `window` plies with neither side ever
 * getting nearer than it stood at the start of them.
 *
 * WINDOWED, AND ADDED UP RATHER THAN REPLAYED. The first version of this was
 * quadratic: it walked the whole move list from the opening on every single
 * move, recomputing every piece's distance each time, and a Halma game of a
 * few hundred plies took four hundred seconds instead of thirty. The second
 * bounded that to a window and rewound the board instead of replaying it —
 * still far too much work, and for a reason I had not looked for. The engine
 * settles a draw after every move, and the bot's search moves thousands of
 * times per turn it actually plays, so this is asked on every node of the
 * search. A cost that looks fine "once per move" is multiplied by the width
 * of the search before it reaches a clock.
 *
 * So nothing is rebuilt or rewound here. What the board comparison was
 * working out the long way round is a sum: a race has no captures, so every
 * move is one piece stepping, and how much nearer home a side stands than it
 * did a window ago is just how far each of its steps in that window went. Add
 * the steps up and the two boards cancel — the pieces that never moved
 * contributed the same distance at both ends. Same answer, no board, no
 * allocation, a window of plain arithmetic.
 *
 * It is also closer to the rule it is named after. The fifty-move rule counts
 * since the last capture or pawn move — a window on recent play, not a
 * ledger of the whole game — and "nobody has got anywhere lately" is the
 * question actually being asked.
 */
function racingStalled(state: GameState, window: number): boolean {
  const { size } = state.settings;
  if (state.moves.length < window) return false;

  const black = homeCorner(size, "black");
  const white = homeCorner(size, "white");
  if (black === null || white === null) return false;

  let blackGained = 0;
  let whiteGained = 0;
  for (let at = state.moves.length - 1; at >= state.moves.length - window; at -= 1) {
    const move = state.moves[at];
    if (move.from === undefined) return false;
    const corner = move.stone === "black" ? black : white;
    // Negative is nearer: the step ended closer to the camp than it started.
    const gained =
      Math.abs(move.row - corner.row) +
      Math.abs(move.col - corner.col) -
      Math.abs(move.from.row - corner.row) -
      Math.abs(move.from.col - corner.col);
    if (move.stone === "black") blackGained += gained;
    else whiteGained += gained;
  }
  // Anybody nearer than they stood a window ago has got somewhere.
  return blackGained >= 0 && whiteGained >= 0;
}

/**
 * How long a game has gone since the last move that could not be taken back,
 * for the families measured that way, or null where the question is asked as
 * a window instead.
 *
 * Two families answer a count, and they are the same rule with two definitions
 * of irreversible:
 *
 *   TAKING (checkers)     since the last capture or man's move. Draughts'
 *                         own rule, and both halves are one-way: a captured
 *                         piece does not come back and a king never becomes
 *                         a man again.
 *
 *   PLACING (squareFour)  since the last piece went down. Four each, then
 *                         "a turn moves one" — and from that ply on nothing
 *                         can change what is ACHIEVABLE, because there are
 *                         no captures and every slide can be slid back.
 *
 * The placing count never resets, and that is a fact about the game rather
 * than a fault in the measure: the position space closes when the last piece
 * lands and stays closed. It is worth saying out loud, because a counter that
 * only grows is the worst possible thing to compute by walking backwards. All
 * the placements come first — the phase is monotonic and no piece is ever
 * removed — so the count is arithmetic rather than a search, and stays O(1)
 * however long the shuffle runs. See `racingStalled` for what walking this
 * kind of thing on every node of the bot's search costs.
 */
export function pliesWithoutProgress(state: GameState): number | null {
  const measure = NO_PROGRESS_RULES[state.settings.variant as RuleVariant]?.measure;
  if (measure === PROGRESS_MEASURES.placing) {
    const laid = 2 * (VARIANT_SPECS[state.settings.variant].pieces ?? 0);
    return Math.max(0, state.moves.length - laid);
  }
  if (measure !== PROGRESS_MEASURES.taking) return null;
  let idle = 0;
  for (let at = state.moves.length - 1; at >= 0; at -= 1) {
    if (tookOrPromoted(state.moves[at])) break;
    idle += 1;
  }
  return idle;
}

/**
 * Whether this game has gone nowhere for long enough to call it a draw.
 *
 * Which question to ask is read from the table, not from the variant's name.
 * This used to say `variant !== RULE_VARIANTS.checkers`, which is the engine
 * switching on a name — the thing AGENTS.md says it never does — and it was
 * wrong as well as irregular the moment a third family wanted a count.
 */
export function stalled(state: GameState): boolean {
  const rule = NO_PROGRESS_RULES[state.settings.variant as RuleVariant];
  if (rule === undefined) return false;
  if (rule.measure === PROGRESS_MEASURES.racing) return racingStalled(state, rule.plies);
  const idle = pliesWithoutProgress(state);
  return idle !== null && idle >= rule.plies;
}
