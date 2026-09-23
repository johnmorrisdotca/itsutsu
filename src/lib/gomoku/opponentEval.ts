import { shapeScore } from "./analysis";
import { otherStone } from "./engine";
import { DIRECTIONS, GAME_STATUS, STONES, VARIANT_SPECS } from "./gomoku.constants";
import { SHAPE_BASE } from "./analysis.constants";
import { boardShapeScore } from "./lineShapes";
import { rulesFor } from "./engine";
import { racesForCamp } from "./rules/farCamp";
import { DECIDED_SCORE, DRAW_SCORE, EVAL_WEIGHTS, LINE_WINDOW_VALUES } from "./opponent.constants";
import { checkersScore, connectScore, flipScore, goScore, raceScore } from "./opponentFamilies";
import { threatAt } from "./threats";
import { tengen } from "./obstacles";
import type { Cell, GameState, Point, Stone, VariantSpec } from "./gomoku.types";

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
 *
 * Read from a table where one exists — this runs at every leaf of the search,
 * over the whole board, twice — and by the scan below where the line is longer
 * than any table covers. `boardShapeScore` answers null rather than a number it
 * cannot stand behind; see `lineShapes.ts`.
 */
function windowScore(
  board: readonly Cell[],
  size: number,
  winLength: number,
  stone: Stone,
  values?: readonly number[],
): number {
  const tabled = boardShapeScore(board, size, winLength, stone, values);
  if (tabled !== null) return tabled;

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
        if (usable && own > 0) total += values?.[own] ?? SHAPE_BASE ** own;
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
  const mine = windowScore(board, settings.size, rulesFor(settings, stone).winLength, stone, lineValues(state, stone, spec));
  const theirs = windowScore(board, settings.size, rulesFor(settings, foe).winLength, foe, lineValues(state, foe, spec));
  // The maker wants a line of either colour; the breaker wants neither.
  if (spec.makerBreaker) return (stone === STONES.black ? 1 : -1) * (mine + theirs);
  return lineSign(spec, stone) * (mine - theirs);
}

/**
 * What a window is worth to `stone` here: the list for the colour about to move
 * or the one for the colour waiting — see `LINE_WINDOW_VALUES`. The games where
 * a line is not simply a good thing keep the plain powers of four for both
 * sides: in a giveaway game a line loses, and in the maker-breaker game one
 * player wants a line of either colour, so a reading built on whose turn it is
 * says nothing true about them.
 */
export function lineValues(state: GameState, stone: Stone, spec: VariantSpec): readonly number[] | undefined {
  if (spec.misere || spec.makerBreaker) return undefined;
  if (rulesFor(state.settings, stone).winLength !== 5) return undefined;
  return stone === state.toPlay ? LINE_WINDOW_VALUES.toMove : LINE_WINDOW_VALUES.waiting;
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
/**
 * Whether a point's SHAPE is what matters in this game.
 *
 * True for the line-and-grid games, where a stone's own point carries most of
 * the information: the shape it makes and the shape it takes away. False where
 * a turn has no single point to read or where shape is not the game — the
 * flipping boards, the races, the connection games and Go, whose position
 * scores already say what a move was worth.
 *
 * Exported because two callers must agree. `baseScore` uses it to decide
 * whether to read a point at all, and `tiersFor` uses it to decide whether a
 * player whose whole difference is a SHAPE preference has any difference here
 * — an attacker at Halma is the grade it is built on under another name and a
 * different flag, which is the same thing this codebase already refuses to do
 * with the specialists. Two copies of this rule would drift, and the one that
 * drifted would be whichever nobody was looking at.
 */
/**
 * The style this player is in RIGHT NOW.
 *
 * A fixed `defence` for most characters; for one with `moods`, the weight its
 * current run calls for. Taken from how many moves are on the board, so it is
 * a property of the position rather than of a die — the same position always
 * answers the same way, on the server and in the browser alike, which is what
 * keeps a moody player checkable. See TierSpec.moods.
 */
export function defenceNow(
  spec: { defence?: number; moods?: readonly number[]; moodMoves?: number },
  movesPlayed: number,
): number | undefined {
  const moods = spec.moods;
  if (moods === undefined || moods.length === 0) return spec.defence;
  const runLength = Math.max(1, spec.moodMoves ?? 6);
  return moods[Math.floor(movesPlayed / runLength) % moods.length];
}

export function shapeIsRead(spec: VariantSpec): boolean {
  return !spec.flips && !racesForCamp(spec) && !spec.connects && !spec.go;
}

export function pointScore(
  before: GameState,
  point: Point,
  stone: Stone,
  spec: VariantSpec,
  /**
   * How much denying the other side's shape here is worth, against making your
   * own. A bot's style, and the only thing that separates an attacker from a
   * defender of the same strength. Left off, it is the even-handed weight
   * every grade played before styles existed.
   */
  defenceWeight: number = EVAL_WEIGHTS.defence,
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
    sign * denied * EVAL_WEIGHTS.shape * defenceWeight +
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
  defenceWeight: number = EVAL_WEIGHTS.defence,
): number {
  let total = 0;
  for (const cell of cells) {
    const point = { row: cell.row, col: cell.col };
    const worth = pointScore(before, point, cell.stone, spec, defenceWeight);
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
 * - **It says something untrue.** `connectScore` (in `opponentFamilies.ts`) is
 *   the clear case, and its own comment says so: how much of an axis a colour spans is not what joining two
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
  return spec.flips || spec.go || racesForCamp(spec) || spec.captures || spec.checkers || readsWindows(spec);
}

/**
 * The line games the incremental line search refuses — a turn lays several
 * stones at once (the piece games) or turns a quarter of the board (the twist
 * games) — and which `boardScore` reads anyway. It reads a still board of
 * stones, every window of a line, whatever put the stones there; and each of
 * these games ends every turn as a still board of stones. Until this, they were
 * answered below with the capture difference, which is nought in a game with no
 * captures, and so nothing searched them. See `lookable`.
 */
export function readsWindows(spec: VariantSpec): boolean {
  return spec.queue !== null || spec.quadrantSize !== null;
}

/**
 * The whole position, from `stone`'s side. A settled game is read straight off
 * the engine's verdict; an unsettled one is read through whichever of the
 * families the game's spec puts it in — the line reading above, or one of the
 * families in `opponentFamilies.ts`.
 */
export function positionScore(state: GameState, stone: Stone): number {
  if (state.status !== GAME_STATUS.playing) return settledScore(state, stone);
  const spec = VARIANT_SPECS[state.settings.variant];
  if (spec.flips) return flipScore(state, stone, spec);
  if (spec.go) return goScore(state, stone);
  if (racesForCamp(spec)) return raceScore(state, stone);
  if (spec.connects) return connectScore(state, stone);
  if (spec.checkers) return checkersScore(state, stone);
  if (readsWindows(spec)) return boardScore(state, stone, spec);

  const foe = otherStone(stone);
  const captured =
    (state.captures[stone] - state.captures[foe]) * EVAL_WEIGHTS.capture;
  return captured;
}
