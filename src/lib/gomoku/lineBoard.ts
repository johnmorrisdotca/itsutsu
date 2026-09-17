import { findWinningLine, forbiddenAt, hasHandicap, movesBeforeDraw, otherStone, rulesFor } from "./engine";
import { DIRECTIONS, GAME_STATUS, STONES } from "./gomoku.constants";
import { findsForcedWins } from "./forcedWin";
import { BLOCKED, EMPTY, OWN, leafSpanTable, openCountTable, ownCountTable } from "./lineBoardTables";
import { boardShapeScore, spanTable } from "./lineShapes";
import { tengen } from "./obstacles";
import { EVAL_WEIGHTS, LINE_WINDOW_VALUES } from "./opponent.constants";
import { CANDIDATE_RADIUS } from "./threats";
import type { Cell, GameSettings, GameState, GameStatus, Point, Stone } from "./gomoku.types";

/**
 * ONE BOARD, EDITED IN PLACE, FOR THE SEARCH TO THINK ON.
 *
 * The engine returns a new game for every move, and that is right for the
 * site: a record, an undo, a replay and a redraw all need every position to
 * stay exactly as it was. The search needs none of that. It tries a move, reads
 * what follows, and takes the move back — tens of thousands of times a second —
 * and measured on a fifteen by fifteen board mid-game, most of each position's
 * cost was work redone from nothing: 102 µs choosing the ten moves to try by
 * scoring every point afresh, 67 µs looking for threats the same way, 20 µs
 * scoring the whole board at the end of a line.
 *
 * So this board keeps those readings up to date as stones land, the way every
 * strong five-in-a-row program does. For every point, colour and direction it
 * holds the line of cells around the point as one number — the index into the
 * shape tables — and a stone changes only the numbers of the points on its four
 * lines. Each change also moves three running figures for that point: its shape
 * score, how many of its lines are one stone short of five, and how many two.
 * A point's shape is then one read, "is anything forced?" is two counters, the
 * whole board's score is a running total, and nothing is allocated.
 *
 * THE RULES STAY THE ENGINE'S. Whether a point may be played asks the engine's
 * `forbiddenAt`; whether a stone made five asks its `findWinningLine`; the
 * agreed length comes from its `movesBeforeDraw`. This board decides nothing a
 * game would — it only remembers. `lineBoard.test.ts` plays real games and
 * checks every position against the engine and the scoring functions these
 * figures replace, and the search built on it is checked to choose the same
 * moves.
 *
 * Only for the games where that is all a move does: `fitsLineBoard`.
 */

/**
 * Whether this position can be thought about on a line board: a plain line
 * game — the same gate as the finder of forced wins — with no handicap or head
 * start (one line length for both colours, and turns that simply alternate),
 * and a line short enough for the shape tables.
 */
export function fitsLineBoard(state: GameState): boolean {
  if (!findsForcedWins(state)) return false;
  const { settings } = state;
  if (hasHandicap(settings)) return false;
  const length = settings.winLength;
  if (rulesFor(settings, STONES.black).winLength !== length) return false;
  if (rulesFor(settings, STONES.white).winLength !== length) return false;
  return spanTable(length) !== null && leafSpanTable(length) !== null;
}

/** Black's figures come first in every per-colour array, white's after. */
export function sideOf(stone: Stone): 0 | 1 {
  return stone === STONES.black ? 0 : 1;
}

export class LineBoard {
  readonly size: number;
  readonly points: number;
  readonly settings: GameSettings;
  readonly winLength: number;
  /** The cells, in the engine's own form, so its rule functions can read them directly. */
  readonly cells: Cell[];
  toPlay: Stone;
  status: GameStatus = GAME_STATUS.playing;
  winner: Stone | null = null;
  /** How many moves the game holds, counting the ones the search has laid. */
  moves: number;

  /** Each point's shape score for each colour: `shapeScore`, kept up as stones land. Side × points + point. */
  readonly shapes: Int32Array;
  /** How many of each point's lines are open and one stone short of five, per colour. */
  readonly fiveLines: Uint8Array;
  /** How many of each point's lines are open and at most two stones short of five, per colour. */
  readonly fourLines: Uint8Array;
  /** Over the EMPTY points only, the sums of `fiveLines` and `fourLines`, per colour: nonzero when a point is that close. */
  readonly emptyFiveLines = new Int32Array(2);
  readonly emptyFourLines = new Int32Array(2);
  /** Each point's distance from the middle, weighted as `pointScore` weighs it. */
  readonly centre: Float64Array;

  /** For each colour, direction and point: that point's span as a base-3 number. */
  private readonly codes: Int32Array;
  private readonly pow3: Int32Array;
  private readonly reach: number;
  private readonly shapeTable: Int16Array;
  /** The board's running score for each colour, under each of the two weight lists. */
  private readonly leafToMove: Int32Array;
  private readonly leafWaiting: Int32Array;
  private readonly openTable: Uint8Array;
  private readonly ownTable: Uint8Array;
  private readonly totalsToMove = new Float64Array(2);
  private readonly totalsWaiting = new Float64Array(2);
  private readonly near: Int16Array;
  private empty = 0;
  private readonly drawAt: number | null;
  private readonly forbids: [boolean, boolean];
  private readonly laid: Int32Array;
  private depth = 0;
  private hashHigh = 0;
  private hashLow = 0;

  constructor(state: GameState) {
    const { settings } = state;
    this.settings = settings;
    this.size = settings.size;
    this.points = this.size * this.size;
    this.winLength = settings.winLength;
    this.cells = state.board.slice();
    this.toPlay = state.toPlay;
    this.moves = state.moves.length;
    this.reach = this.winLength - 1;
    this.shapeTable = spanTable(this.winLength) as Int16Array;
    const toMove = this.winLength === 5 ? LINE_WINDOW_VALUES.toMove : undefined;
    const waiting = this.winLength === 5 ? LINE_WINDOW_VALUES.waiting : undefined;
    this.leafToMove = leafSpanTable(this.winLength, toMove) as Int32Array;
    this.leafWaiting = leafSpanTable(this.winLength, waiting) as Int32Array;
    this.openTable = openCountTable(this.winLength);
    this.ownTable = ownCountTable(this.winLength);
    this.drawAt = movesBeforeDraw(settings);
    this.forbids = [
      rulesFor(settings, STONES.black).forbidden.length > 0,
      rulesFor(settings, STONES.white).forbidden.length > 0,
    ];
    const span = 2 * this.winLength - 1;
    this.pow3 = new Int32Array(span);
    for (let place = 0, value = 1; place < span; place += 1, value *= 3) this.pow3[place] = value;

    const points = this.points;
    this.codes = new Int32Array(2 * DIRECTIONS.length * points);
    this.shapes = new Int32Array(2 * points);
    this.fiveLines = new Uint8Array(2 * points);
    this.fourLines = new Uint8Array(2 * points);
    this.near = new Int16Array(points);
    this.laid = new Int32Array(points);
    this.centre = new Float64Array(points);
    const middle = tengen(this.size);

    for (let index = 0; index < points; index += 1) {
      const row = Math.floor(index / this.size);
      const col = index - row * this.size;
      const gap = Math.abs(row - middle.row) + Math.abs(col - middle.col);
      this.centre[index] = (this.size - gap) * EVAL_WEIGHTS.centre;
      const cell = this.cells[index];
      if (cell === null) this.empty += 1;
      if (cell === STONES.black || cell === STONES.white) {
        this.stampNear(index, 1);
        this.hashStone(index, cell);
      }
    }
    for (const stone of [STONES.black, STONES.white] as const) {
      const side = sideOf(stone);
      this.totalsToMove[side] = boardShapeScore(this.cells, this.size, this.winLength, stone, toMove) ?? 0;
      this.totalsWaiting[side] = boardShapeScore(this.cells, this.size, this.winLength, stone, waiting) ?? 0;
      for (let direction = 0; direction < DIRECTIONS.length; direction += 1) {
        const step = DIRECTIONS[direction];
        for (let index = 0; index < points; index += 1) {
          const row = Math.floor(index / this.size);
          const col = index - row * this.size;
          let code = 0;
          for (let place = 0; place < span; place += 1) {
            const shift = place - this.reach;
            const r = row + step.row * shift;
            const c = col + step.col * shift;
            const cell = r < 0 || c < 0 || r >= this.size || c >= this.size ? undefined : this.cells[r * this.size + c];
            const digit = cell === stone ? OWN : cell === null ? EMPTY : BLOCKED;
            code += digit * this.pow3[place];
          }
          this.codes[(side * 4 + direction) * points + index] = code;
          this.count(side, index, code, 1);
        }
      }
    }
  }

  /** Adds (or with -1 removes) what one line's code says about a point to its running figures. */
  private count(side: number, index: number, code: number, sign: 1 | -1): void {
    const at = side * this.points + index;
    this.shapes[at] += sign * this.shapeTable[code];
    const open = this.openTable[code];
    const five = open >= this.winLength - 1 ? sign : 0;
    const four = open >= this.winLength - 2 ? sign : 0;
    this.fiveLines[at] += five;
    this.fourLines[at] += four;
    if (this.cells[index] === null) {
      this.emptyFiveLines[side] += five;
      this.emptyFourLines[side] += four;
    }
  }

  /** The point at an index, for the engine functions that take one. */
  pointAt(index: number): Point {
    const row = Math.floor(index / this.size);
    return { row, col: index - row * this.size };
  }

  /**
   * Lays the colour to move's stone at `index`, or answers false and changes
   * nothing when the engine's rules refuse the point. Settles a five, a full
   * board and the agreed length exactly as the engine's placement does.
   */
  place(index: number): boolean {
    if (this.status !== GAME_STATUS.playing || this.cells[index] !== null) return false;
    const stone = this.toPlay;
    if (!this.isLegal(index)) return false;
    this.lay(index, stone);
    this.stampNear(index, 1);
    this.hashStone(index, stone);
    this.empty -= 1;
    this.moves += 1;
    this.laid[this.depth] = index;
    this.depth += 1;

    if (this.longEnoughRun(index, stone) && findWinningLine(this.cells, this.settings, this.pointAt(index)).length > 0) {
      this.status = GAME_STATUS.won;
      this.winner = stone;
    } else if (this.empty === 0 || (this.drawAt !== null && this.moves >= this.drawAt)) {
      this.status = GAME_STATUS.draw;
    }
    this.toPlay = otherStone(stone);
    return true;
  }

  /** Takes back the last stone `place` laid. */
  undo(): void {
    this.depth -= 1;
    const index = this.laid[this.depth];
    const stone = this.cells[index] as Stone;
    this.lift(index);
    this.stampNear(index, -1);
    this.hashStone(index, stone);
    this.empty += 1;
    this.moves -= 1;
    this.toPlay = stone;
    this.status = GAME_STATUS.playing;
    this.winner = null;
  }

  /**
   * A stone's cell and every figure its lines touch, and nothing about the game
   * — no turn, no result. `place` is this and the game; a reading that only
   * needs to ask "what if a stone were here" lays and lifts with this alone.
   */
  lay(index: number, stone: Stone): void {
    // The point stops being empty: what it contributed to the empty sums leaves with it.
    for (let side = 0; side < 2; side += 1) {
      this.emptyFiveLines[side] -= this.fiveLines[side * this.points + index];
      this.emptyFourLines[side] -= this.fourLines[side * this.points + index];
    }
    this.cells[index] = stone;
    this.shift(index, stone, 1);
  }

  lift(index: number): void {
    const stone = this.cells[index] as Stone;
    this.shift(index, stone, -1);
    this.cells[index] = null;
    for (let side = 0; side < 2; side += 1) {
      this.emptyFiveLines[side] += this.fiveLines[side * this.points + index];
      this.emptyFourLines[side] += this.fourLines[side * this.points + index];
    }
  }

  /**
   * A stone at `index` changes one digit in the span of every point on its four
   * lines: empty to own for its colour, empty to blocked for the other. The
   * running board totals move by what the stone's own spans were worth before
   * and after, since those are exactly the windows it touches.
   */
  private shift(index: number, stone: Stone, sign: 1 | -1): void {
    const row = Math.floor(index / this.size);
    const col = index - row * this.size;
    const stoneSide = sideOf(stone);
    for (let side = 0; side < 2; side += 1) {
      const digit = side === stoneSide ? OWN : BLOCKED;
      for (let direction = 0; direction < DIRECTIONS.length; direction += 1) {
        const step = DIRECTIONS[direction];
        const base = (side * 4 + direction) * this.points;
        const before = this.codes[base + index];
        for (let shift = -this.reach; shift <= this.reach; shift += 1) {
          // The point whose span holds this stone `shift` places past its centre.
          const r = row - step.row * shift;
          const c = col - step.col * shift;
          if (r < 0 || c < 0 || r >= this.size || c >= this.size) continue;
          const point = r * this.size + c;
          const old = this.codes[base + point];
          const next = old + sign * digit * this.pow3[shift + this.reach];
          this.codes[base + point] = next;
          this.count(side, point, old, -1);
          this.count(side, point, next, 1);
        }
        const after = this.codes[base + index];
        this.totalsToMove[side] += this.leafToMove[after] - this.leafToMove[before];
        this.totalsWaiting[side] += this.leafWaiting[after] - this.leafWaiting[before];
      }
    }
  }

  private stampNear(index: number, by: 1 | -1): void {
    const row = Math.floor(index / this.size);
    const col = index - row * this.size;
    const rowFrom = Math.max(0, row - CANDIDATE_RADIUS);
    const rowTo = Math.min(this.size - 1, row + CANDIDATE_RADIUS);
    const colFrom = Math.max(0, col - CANDIDATE_RADIUS);
    const colTo = Math.min(this.size - 1, col + CANDIDATE_RADIUS);
    for (let r = rowFrom; r <= rowTo; r += 1) {
      for (let c = colFrom; c <= colTo; c += 1) this.near[r * this.size + c] += by;
    }
  }

  private hashStone(index: number, stone: Stone): void {
    const at = (index * 2 + sideOf(stone)) * 2;
    this.hashHigh ^= ZOBRIST[at];
    this.hashLow ^= ZOBRIST[at + 1];
  }

  /** Whether an unbroken run of `stone` through `index` is long enough to win — the first thing a five needs. */
  private longEnoughRun(index: number, stone: Stone): boolean {
    const row = Math.floor(index / this.size);
    const col = index - row * this.size;
    for (const step of DIRECTIONS) {
      let run = 1;
      for (let sign = 1; sign >= -1; sign -= 2) {
        for (let k = 1; k < this.winLength && run < this.winLength; k += 1) {
          const r = row + step.row * k * sign;
          const c = col + step.col * k * sign;
          if (r < 0 || c < 0 || r >= this.size || c >= this.size || this.cells[r * this.size + c] !== stone) break;
          run += 1;
        }
      }
      if (run >= this.winLength) return true;
    }
    return false;
  }

  /** Whether `index` is a point the search considers: empty, near a stone. */
  isCandidate(index: number): boolean {
    return this.near[index] > 0 && this.cells[index] === null;
  }

  /** Whether the colour to move may play `index` — empty, and not a shape its rules forbid. */
  isLegal(index: number): boolean {
    return this.mayPlay(index, this.toPlay);
  }

  /** Whether `stone` may play `index`, whoever is to move. */
  mayPlay(index: number, stone: Stone): boolean {
    if (this.cells[index] !== null) return false;
    const side = sideOf(stone);
    return (
      !this.forbids[side] ||
      !this.mayBeForbidden(index, side) ||
      forbiddenAt(this.cells, this.settings, stone, this.pointAt(index)) === null
    );
  }

  /**
   * Whether a forbidden shape is possible at `index` at all, counted before the
   * engine is asked. Every shape `forbiddenAt` refuses needs stones of the
   * colour's own on the lines through the point, inside its span: an overline
   * or a double four needs a line holding at least `winLength − 2` of them (a
   * double four can lie on one line), and a double three needs two lines with
   * at least `winLength − 3` each. Where neither is there the answer is no, and
   * the engine's full reading — measured at nearly two milliseconds a point in
   * renju, asked of every candidate — is not needed to say so.
   */
  private mayBeForbidden(index: number, side: number): boolean {
    let linesWithTwo = 0;
    for (let direction = 0; direction < DIRECTIONS.length; direction += 1) {
      const own = this.ownTable[this.codes[(side * 4 + direction) * this.points + index]];
      if (own >= this.winLength - 2) return true;
      if (own >= this.winLength - 3) linesWithTwo += 1;
    }
    return linesWithTwo >= 2;
  }

  /** The most of `stone`'s stones in any open window through the empty point `index`, read from its codes. */
  openCount(index: number, stone: Stone): number {
    let best = 0;
    for (let direction = 0; direction < DIRECTIONS.length; direction += 1) {
      const count = this.openTable[this.codes[(sideOf(stone) * 4 + direction) * this.points + index]];
      if (count > best) best = count;
    }
    return best;
  }

  /**
   * The points on the lines through `index` where `stone` would now complete a
   * winning line, in the order `completionsThrough` finds them — or only
   * whether there is one, with `first`. Read with the board as it stands: lay a
   * stone at `index` first to ask what it would make.
   */
  completions(index: number, stone: Stone, first = false): number[] {
    const found: number[] = [];
    const row = Math.floor(index / this.size);
    const col = index - row * this.size;
    const side = sideOf(stone);
    for (const step of DIRECTIONS) {
      for (let k = -this.reach; k <= this.reach; k += 1) {
        if (k === 0) continue;
        const r = row + step.row * k;
        const c = col + step.col * k;
        if (r < 0 || c < 0 || r >= this.size || c >= this.size) continue;
        const point = r * this.size + c;
        // One stone short of five on some open line, or it cannot be a five: the engine reads only these.
        if (this.cells[point] !== null || this.fiveLines[side * this.points + point] === 0) continue;
        this.cells[point] = stone;
        const wins = findWinningLine(this.cells, this.settings, { row: r, col: c }).length > 0;
        this.cells[point] = null;
        if (wins) {
          found.push(point);
          if (first) return found;
        }
      }
    }
    return found;
  }

  /** Whether `stone` laid at the empty point `index` makes a winning line, by the engine's reading. */
  completes(index: number, stone: Stone): boolean {
    this.cells[index] = stone;
    const wins = findWinningLine(this.cells, this.settings, this.pointAt(index)).length > 0;
    this.cells[index] = null;
    return wins;
  }

  /**
   * `boardScore` for `stone`: its shape less the other colour's, each read under
   * the weights for the side it is on — the colour about to move and the colour
   * waiting are worth different things. See `LINE_WINDOW_VALUES`.
   */
  boardScore(stone: Stone): number {
    const side = sideOf(stone);
    const other = 1 - side;
    return stone === this.toPlay
      ? this.totalsToMove[side] - this.totalsWaiting[other]
      : this.totalsWaiting[side] - this.totalsToMove[other];
  }

  /** The position as one number, for the search's memory: the stones, and whose turn it is. */
  key(): number {
    const turn = Math.imul(this.moves * 2 + sideOf(this.toPlay) + 1, 0x9e3779b1);
    return ((this.hashHigh ^ turn) >>> 11) * 4_294_967_296 + (this.hashLow >>> 0);
  }
}

/** Random keys for the position number, two words a stone a point, from a fixed seed. */
const ZOBRIST = (() => {
  const keys = new Int32Array(32 * 32 * 2 * 2);
  let x = 0x1b873593;
  for (let at = 0; at < keys.length; at += 1) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    keys[at] = x;
  }
  return keys;
})();
