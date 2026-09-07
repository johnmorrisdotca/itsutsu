import { expect } from "vitest";
import {
  cellAt,
  createGame,
  otherStone,
  emptyPoints,
  forbiddenPoints,
  inMovePhase,
  indexOf,
  isStone,
  legalPoints,
  movePiece,
  pieceMoves,
  playMove,
  twistBoard,
  undoMove,
} from "./engine";
import { rulesFor } from "./rules/handicap";
import { stonesPlacedThisTurn } from "./rules/turns";
import { GAME_STATUS } from "./gomoku.constants";
import type { Cell, GameSettings, GameState, Point, Stone } from "./gomoku.types";

/**
 * The whole-game simulation harness, shared by the simulation specs.
 *
 * Whole games, played end to end, checked against invariants.
 *
 * The unit tests elsewhere check positions someone thought to write down.
 * This plays complete random games instead, so it reaches positions nobody
 * would think of — and it is cheap, because the engine is pure and needs no
 * browser. A failure prints the seed, and replaying that seed reproduces the
 * game exactly.
 */

/** Small, fast, and reproducible. The seed is the whole bug report. */
function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Whether a run of `length` wins for `stone`, restated from each variant's
 * published rules rather than read from VARIANT_SPECS.
 *
 * Sharing the engine's own table would make the cross-check below a tautology,
 * so these are written out by hand. `openEnds` counts how many ends of the run
 * are neither an opposing stone nor the edge of the board.
 */
function runWinsIndependently(
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
    case "twistFive":
    case "twistFour":
    case "squareFour":
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

function bruteForceWinner(board: Cell[], settings: GameSettings): Stone | null {
  const { size } = settings;
  const at = (row: number, col: number): Cell | "edge" =>
    row < 0 || row >= size || col < 0 || col >= size
      ? "edge"
      : board[indexOf(size, { row, col })];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const cell = at(row, col);
      if (cell === "edge" || !isStone(cell)) continue;
      const stone: Stone = cell;

      for (const step of SCAN_DIRECTIONS) {
        // Only measure from the start of a run, so each run is counted once.
        if (at(row - step.row, col - step.col) === stone) continue;

        let length = 0;
        while (at(row + step.row * length, col + step.col * length) === stone) {
          length += 1;
        }

        const ends = [
          at(row - step.row, col - step.col),
          at(row + step.row * length, col + step.col * length),
        ];
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
function checkMove(before: GameState, after: GameState, played: Point, seed: number) {
  const where =
    `${after.settings.variant} seed ${seed}, move ${after.moves.length} ` +
    `at ${played.row},${played.col}`;

  // The previous state is untouched: the engine returns new states, never edits.
  expect(cellAt(before, played), `${where}: input state was mutated`).toBeNull();
  expect(before.moves.length, `${where}: input move list grew`).toBe(
    after.moves.length - 1,
  );

  /*
   * The played intersection changed, and every other change is a captured
   * stone: an opposing stone that became empty. Nothing else may move, and
   * the number lifted must be exactly two per pair the mover was credited.
   */
  const changed = after.board.reduce<number[]>((list, cell, index) => {
    if (cell !== before.board[index]) list.push(index);
    return list;
  }, []);
  const playedIndex = indexOf(after.settings.size, played);
  expect(changed, `${where}: the played point did not change`).toContain(playedIndex);
  expect(cellAt(after, played), `${where}: wrong stone was placed`).toBe(before.toPlay);

  const lifted = changed.filter((index) => index !== playedIndex);
  for (const index of lifted) {
    expect(before.board[index], `${where}: lifted a stone that was not the opponent's`)
      .toBe(otherStone(before.toPlay));
    expect(after.board[index], `${where}: a lifted stone was not removed`).toBeNull();
  }

  const pairs =
    after.captures[before.toPlay] - before.captures[before.toPlay];
  expect(lifted.length, `${where}: stones lifted do not match pairs captured`).toBe(
    pairs * 2,
  );

  /*
   * Stones on the board equal moves played, less any lifted by a capture.
   * Ninuki removes the opponent's stones, so the two only match once the
   * captures are accounted for.
   */
  const stones = after.board.filter(isStone).length;
  const captured = after.captures.black + after.captures.white;
  expect(
    stones + captured * 2,
    `${where}: stones on board do not match moves less captures`,
  ).toBe(after.moves.length);

  // A colour never places more stones in a turn than the variant allows.
  const perTurn = rulesFor(after.settings, before.toPlay).stonesPerTurn;
  expect(
    stonesPlacedThisTurn(after.moves, before.toPlay),
    `${where}: placed more stones in a turn than the variant allows`,
  ).toBeLessThanOrEqual(perTurn);

  // Forbidden points are always empty points, and absent when nothing is forbidden.
  const forbidden = forbiddenPoints(after);
  for (const point of forbidden) {
    expect(cellAt(after, point), `${where}: a forbidden point is not empty`).toBeNull();
  }
  if (rulesFor(after.settings, after.toPlay).forbidden.length === 0) {
    expect(forbidden, `${where}: forbade a shape this variant allows`).toEqual([]);
  }

  // The engine's incremental scan agrees with a full-board scan.
  const brute = bruteForceWinner(after.board, after.settings);
  if (after.status === GAME_STATUS.won && after.winBy === "captures") {
    // Won by lifting pairs off the board; there is no line to corroborate.
    expect(after.winner, `${where}: capture win without a winner`).not.toBeNull();
  } else if (after.status === GAME_STATUS.won && after.winBy === "trap") {
    // The mover made the forbidden three: the other colour wins, and no line of four exists.
    expect(after.winner, `${where}: trap win went to the wrong colour`).toBe(
      otherStone(before.toPlay),
    );
    expect(brute, `${where}: trap declared although a winning line is on the board`).toBeNull();
    expect(
      longestRunThrough(after.board, after.settings.size, played, before.toPlay),
      `${where}: trap declared without a three through the played point`,
    ).toBe(3);
  } else if (after.status === GAME_STATUS.won && after.winBy === "square") {
    expect(after.winner, `${where}: square win went to the wrong colour`).toBe(before.toPlay);
    expect(after.winningLine, `${where}: a square has four stones`).toHaveLength(4);
    for (const point of after.winningLine) {
      expect(cellAt(after, point), `${where}: square holds a wrong stone`).toBe(after.winner);
    }
  } else if (after.status === GAME_STATUS.won) {
    expect(after.winner, `${where}: declared a winner the board does not show`).toBe(
      brute,
    );
    expect(after.winner, `${where}: winner is not the player who moved`).toBe(
      before.toPlay,
    );
    expect(
      after.winningLine.length,
      `${where}: winning line is too short`,
    ).toBeGreaterThanOrEqual(after.settings.winLength);
    for (const point of after.winningLine) {
      expect(cellAt(after, point), `${where}: winning line holds a wrong stone`).toBe(
        after.winner,
      );
    }
  } else {
    expect(brute, `${where}: missed a win that is on the board`).toBeNull();
  }

  if (after.status === GAME_STATUS.draw) {
    expect(after.board.includes(null), `${where}: drew with room left`).toBe(false);
    expect(after.winner).toBeNull();
  }
  if (after.status === GAME_STATUS.playing && after.pendingTwist) {
    // A twist game does not pass the turn until the quadrant has turned.
    expect(after.toPlay, `${where}: turn passed before the twist`).toBe(before.toPlay);
  }

  // Undo is an exact inverse.
  if (after.settings.allowUndo) {
    const undone = undoMove(after);
    expect(undone.board, `${where}: undo did not restore the board`).toEqual(
      before.board,
    );
    expect(undone.toPlay, `${where}: undo did not restore the turn`).toBe(
      before.toPlay,
    );
    expect(undone.moves.length).toBe(before.moves.length);
  }
}

/** The longest unbroken run of `stone` through `point`, in any direction. */
function longestRunThrough(board: Cell[], size: number, point: Point, stone: Stone): number {
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
function checkTwist(before: GameState, after: GameState, seed: number) {
  const where = `${after.settings.variant} seed ${seed}, twist after move ${after.moves.length}`;
  const count = (board: Cell[], stone: Stone) => board.filter((cell) => cell === stone).length;
  expect(count(after.board, "black"), `${where}: black stones changed`).toBe(count(before.board, "black"));
  expect(count(after.board, "white"), `${where}: white stones changed`).toBe(count(before.board, "white"));
  expect(after.pendingTwist, `${where}: twist still owed`).toBe(false);
  expect(after.moves.length).toBe(before.moves.length);
  expect(after.moves[after.moves.length - 1].twist, `${where}: twist not recorded`).toBeDefined();

  const brute = bruteForceWinner(after.board, after.settings);
  if (after.status === GAME_STATUS.won) {
    expect(after.winner, `${where}: winner not on the board`).not.toBeNull();
    // A full scan finds a line for the winner; it may also find one for the loser only when it is a draw, so the winner's line must exist.
    expect(
      after.winningLine.every((point) => cellAt(after, point) === after.winner),
      `${where}: winning line holds a wrong stone`,
    ).toBe(true);
    expect(brute, `${where}: no line on the board after a declared win`).not.toBeNull();
  } else if (after.status === GAME_STATUS.playing) {
    expect(brute, `${where}: missed a line made by the twist`).toBeNull();
    expect(after.toPlay, `${where}: turn did not pass after the twist`).toBe(otherStone(before.toPlay));
  }
  if (after.settings.allowUndo) {
    const undone = undoMove(after);
    expect(undone.board, `${where}: undo did not turn the quadrant back`).toEqual(
      undoMove(before).board,
    );
  }
}

/** What must hold after a piece slides: one stone moved one step, nothing else. */
function checkSlide(before: GameState, after: GameState, from: Point, to: Point, seed: number) {
  const where = `${after.settings.variant} seed ${seed}, slide ${from.row},${from.col} to ${to.row},${to.col}`;
  expect(cellAt(after, from), `${where}: piece still at its origin`).toBeNull();
  expect(cellAt(after, to), `${where}: piece did not arrive`).toBe(before.toPlay);
  expect(Math.max(Math.abs(from.row - to.row), Math.abs(from.col - to.col)), `${where}: slid more than one step`).toBe(1);
  const changed = after.board.filter((cell, index) => cell !== before.board[index]).length;
  expect(changed, `${where}: more than two cells changed`).toBe(2);
  expect(after.moves[after.moves.length - 1], `${where}: slide not recorded`).toMatchObject({ kind: "move", from });
  if (after.status === GAME_STATUS.playing) {
    expect(after.toPlay).toBe(otherStone(before.toPlay));
    expect(bruteForceWinner(after.board, after.settings), `${where}: missed a line`).toBeNull();
  }
  if (after.settings.allowUndo) {
    expect(undoMove(after).board, `${where}: undo did not slide the piece back`).toEqual(before.board);
  }
}

/** How many slides a random sliding game is allowed before it is called off. */
const SLIDE_CAP = 80;

/** Plays one game to its end, checking every move on the way. */
function playOut(settings: Partial<GameSettings>, seed: number): GameState {
  const random = rng(seed);
  let state = createGame({ allowUndo: true, ...settings }, random());
  let guard = 0;
  let slides = 0;

  while (state.status === GAME_STATUS.playing) {
    const open = emptyPoints(state);
    if (open.length === 0) break;

    /*
     * The sliding games: every piece is down, so a turn moves one. Random
     * sliding need not ever end, so it is called off after a while.
     */
    if (inMovePhase(state)) {
      const pieces = emptyPoints(state).length === 0 ? [] : ownPieces(state);
      const movable = pieces.filter((piece) => pieceMoves(state, piece).length > 0);
      expect(movable.length, `seed ${seed}: no piece can move`).toBeGreaterThan(0);
      const from = movable[Math.floor(random() * movable.length)];
      const options = pieceMoves(state, from);
      const to = options[Math.floor(random() * options.length)];
      const before = state;
      const after = movePiece(state, from, to);
      expect(after, `seed ${seed}: a legal slide was refused`).not.toBe(before);
      checkSlide(before, after, from, to, seed);
      state = after;
      slides += 1;
      if (slides >= SLIDE_CAP) break;
      continue;
    }

    const legal = legalPoints(state);
    /*
     * A live game with room on the board and nothing legal to play is a
     * deadlock: the engine refuses a forbidden move rather than losing on it,
     * so a colour with every empty point forbidden would never move again.
     * Whether that is reachable is exactly the sort of thing a simulator is
     * for, so it is an assertion rather than a `break`.
     */
    expect(
      legal.length,
      `seed ${seed}: no legal move with ${open.length} empty points ` +
        `(${settings.variant ?? "freestyle"}, move ${state.moves.length})`,
    ).toBeGreaterThan(0);

    // Everything the engine calls legal must actually be accepted, and nothing else.
    const rejected = legal.find((p) => playMove(state, p) === state);
    expect(rejected, `seed ${seed}: legalPoints offered a move playMove refused`)
      .toBeUndefined();

    const point = legal[Math.floor(random() * legal.length)];
    const before = state;
    const after = playMove(state, point);

    expect(after, `seed ${seed}: a legal move was refused`).not.toBe(before);
    checkMove(before, after, point, seed);
    state = after;

    // A twist game owes a quarter turn before the move is complete.
    if (state.pendingTwist) {
      const quadrants = (state.settings.size / (quadrantSizeOf(state) ?? 1)) ** 2;
      const quadrant = Math.floor(random() * quadrants);
      const clockwise = random() < 0.5;
      const turned = twistBoard(state, quadrant, clockwise);
      expect(turned, `seed ${seed}: a twist was refused`).not.toBe(state);
      checkTwist(state, turned, seed);
      state = turned;
    }

    guard += 1;
    expect(guard, `seed ${seed}: game did not terminate`).toBeLessThanOrEqual(
      state.settings.size * state.settings.size + 1,
    );
  }

  return state;
}

/** The points holding the mover's pieces. */
function ownPieces(state: GameState): Point[] {
  const points: Point[] = [];
  state.board.forEach((cell, index) => {
    if (cell === state.toPlay) {
      points.push({ row: Math.floor(index / state.settings.size), col: index % state.settings.size });
    }
  });
  return points;
}

/** The quadrant side of a twist game, read by hand from the board rather than the spec: 3 on 6×6, 2 on 4×4. */
function quadrantSizeOf(state: GameState): number | null {
  if (state.settings.variant === "twistFive") return 3;
  if (state.settings.variant === "twistFour") return 2;
  return null;
}


export { rng, bruteForceWinner, runWinsIndependently, checkMove, playOut };
