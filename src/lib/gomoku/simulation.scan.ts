import type { Cell, GameSettings, Point, Stone } from "./gomoku.types";
import { indexOf, isStone } from "./engine";
import { rulesFor } from "./rules/handicap";

/**
 * A second, independent reading of the board for the simulator: a plain scan
 * in every direction that knows nothing of the engine's incremental checks.
 * Every rule it needs — wrapping, wormholes, what a run is — is restated here
 * by hand, so that a mistake in the engine cannot also be a mistake here.
 */

/**
 * Whether a run of `length` wins for `stone`, restated from each variant's
 * published rules rather than read from VARIANT_SPECS.
 *
 * Sharing the engine's own table would make the cross-check below a tautology,
 * so these are written out by hand. `openEnds` counts how many ends of the run
 * are neither an opposing stone nor the edge of the board.
 */
export function runWinsIndependently(
  variant: string,
  stone: Stone,
  length: number,
  blockedEnds: number,
  winLength: number,
): boolean {
  switch (variant) {
    // Exactly five; an overline is not a win for either colour.
    case "standard":
      return length === winLength;
    // Black must be exact, because an overline is forbidden to black.
    case "renju":
      return stone === "black" ? length === winLength : length >= winLength;
    /*
     * Five or more. This project's omok forbids the double three to both
     * colours but does not forbid an overline, so a six wins.
     */
    case "omok":
      return length >= winLength;
    /*
     * Exactly five, and not sealed at both ends. Only an enemy stone or an
     * obstacle seals a line here — the board edge does not, which is this
     * project's reading and is worth knowing, because plenty of caro rule
     * sets treat the edge as a block.
     */
    case "caro":
      return length === winLength && blockedEnds < 2;
    // Six or more.
    case "connect6":
      return length >= winLength;
    /*
     * The small games: a line of the variant's length or longer wins. The
     * trap game's losing three and the square game's 2×2 are checked
     * separately in checkMove; here only lines count.
     */
    case "tictactoe":
    case "trapThree":
    case "dropFour":
    case "ringDrop":
    case "holeDrop":
    case "hotDrop":
    case "clearDrop":
    case "giveawayDrop":
    case "edgeDrop":
    case "twistFive":
    case "twistFour":
    case "squareFour":
    case "dominoFive":
    case "blockFive":
    case "sannuki":
    case "wormDrop":
    case "misereFive":
    case "makerBreaker":
    case "wildTicTacToe":
    case "notakto":
      return length >= winLength;
    // Five or more in a row, as freestyle.
    case "ninuki":
    case "freestyle":
    default:
      return length >= winLength;
  }
}

/**
 * An independent, deliberately naive win scan.
 *
 * The engine only looks along the lines through the stone just played, which
 * is the whole reason it is fast. This walks the entire board every time.
 *
 * The four directions are written out here rather than imported from
 * gomoku.constants on purpose. Sharing that constant made the cross-check a
 * tautology: deleting a direction from it broke the engine and this scanner
 * identically, and the test stayed green. Independent means independent.
 */
const SCAN_DIRECTIONS: Point[] = [
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: -1 },
];

/** The ring game joins the left and right edges; nothing else wraps. Restated by hand. */
export function wrapsColumns(variant: string): boolean {
  return variant === "ringDrop";
}

/**
 * The wormhole game's mouths, paired by hand from the board rather than the
 * engine's link map: the first two "worm" cells in reading order are a pair,
 * which is also how the engine draws them.
 */
function wormPairs(board: Cell[]): Map<number, number> {
  const mouths: number[] = [];
  board.forEach((cell, index) => {
    if (cell === "worm") mouths.push(index);
  });
  const pairs = new Map<number, number>();
  for (let i = 0; i + 1 < mouths.length; i += 2) {
    pairs.set(mouths[i], mouths[i + 1]);
    pairs.set(mouths[i + 1], mouths[i]);
  }
  return pairs;
}

export function bruteForceWinner(board: Cell[], settings: GameSettings): Stone | null {
  const { size } = settings;
  const wrap = wrapsColumns(settings.variant);
  const worms = settings.variant === "wormDrop" ? wormPairs(board) : new Map<number, number>();
  const at = (row: number, col: number): Cell | "edge" => {
    const c = wrap ? ((col % size) + size) % size : col;
    return row < 0 || row >= size || c < 0 || c >= size
      ? "edge"
      : board[indexOf(size, { row, col: c })];
  };
  /*
   * Where a step lands after passing through a wormhole mouth: the cell past
   * the partner mouth, in the same direction. Restated here on purpose.
   */
  const through = (row: number, col: number, step: Point): [number, number] => {
    if (worms.size === 0 || row < 0 || row >= size || col < 0 || col >= size) return [row, col];
    const partner = worms.get(indexOf(size, { row, col }));
    if (partner === undefined) return [row, col];
    return [Math.floor(partner / size) + step.row, (partner % size) + step.col];
  };
  // A hotspot is both colours at once, so it extends either colour's run.
  const matches = (cell: Cell | "edge", stone: Stone) => cell === stone || cell === "hot";

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const cell = at(row, col);
      if (cell === "edge" || (!isStone(cell) && cell !== "hot")) continue;
      // A hotspot can start a run for either colour.
      const colours: Stone[] = isStone(cell) ? [cell] : ["black", "white"];

      for (const stone of colours) for (const step of SCAN_DIRECTIONS) {
        // Only measure from the start of a run, so each run is counted once.
        if (matches(at(row - step.row, col - step.col), stone) && !wrap) continue;
        if (wrap && matches(at(row - step.row, col - step.col), stone) && step.row !== 0) continue;

        let length = 0;
        let [r, c] = [row, col];
        while (matches(at(r, c), stone) && length < size) {
          length += 1;
          [r, c] = through(r + step.row, c + step.col, step);
        }

        const [br, bc] = through(row - step.row, col - step.col, { row: -step.row, col: -step.col });
        const ends = [at(br, bc), at(r, c)];
        // Empty and the edge both leave a line open; a stone or obstacle seals it.
        const blockedEnds = ends.filter(
          (end) => end !== null && end !== "edge",
        ).length;

        const winLength = rulesFor(settings, stone).winLength;
        if (
          runWinsIndependently(settings.variant, stone, length, blockedEnds, winLength)
        ) {
          return stone;
        }
      }
    }
  }
  return null;
}

/** Every invariant that must hold after any legal move. */
/** The longest unbroken run of `stone` through `point`, in any direction. */
export function longestRunThrough(board: Cell[], size: number, point: Point, stone: Stone): number {
  const at = (row: number, col: number): Cell | "edge" =>
    row < 0 || row >= size || col < 0 || col >= size ? "edge" : board[indexOf(size, { row, col })];
  let longest = 0;
  for (const step of SCAN_DIRECTIONS) {
    let length = 1;
    for (let k = 1; at(point.row + step.row * k, point.col + step.col * k) === stone; k += 1) length += 1;
    for (let k = 1; at(point.row - step.row * k, point.col - step.col * k) === stone; k += 1) length += 1;
    longest = Math.max(longest, length);
  }
  return longest;
}

/** What must hold after a quadrant turns: same stones, moved together, read by the whole board. */
