import { describe, expect, it } from "vitest";
import {
  cellAt,
  createGame,
  otherStone,
  emptyPoints,
  forbiddenPoints,
  indexOf,
  isStone,
  legalPoints,
  playMove,
  pointOf,
  replayMoves,
  undoMove,
} from "./engine";
import { rulesFor } from "./rules/handicap";
import { stonesPlacedThisTurn } from "./rules/turns";
import { GAME_STATUS, RULE_VARIANTS } from "./gomoku.constants";
import type { Cell, GameSettings, GameState, Point, Stone } from "./gomoku.types";

/**
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

/** Plays one game to its end, checking every move on the way. */
function playOut(settings: Partial<GameSettings>, seed: number): GameState {
  const random = rng(seed);
  let state = createGame({ allowUndo: true, ...settings }, random());
  let guard = 0;

  while (state.status === GAME_STATUS.playing) {
    const open = emptyPoints(state);
    if (open.length === 0) break;

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

    guard += 1;
    expect(guard, `seed ${seed}: game did not terminate`).toBeLessThanOrEqual(
      settings.size! * settings.size! + 1,
    );
  }

  return state;
}

describe("simulated games", () => {
  const GAMES = 120;

  it(`plays ${GAMES} full games on a 9x9 board without breaking an invariant`, () => {
    const outcomes = { won: 0, draw: 0, playing: 0 };
    for (let seed = 1; seed <= GAMES; seed += 1) {
      const final = playOut({ size: 9 }, seed);
      outcomes[final.status] += 1;
    }
    // Random play on a small board should reach a real end almost every time.
    expect(outcomes.won + outcomes.draw).toBe(GAMES);
  });

  it("plays full games on every board size", () => {
    for (const size of [9, 13, 15, 19]) {
      for (let seed = 1; seed <= 8; seed += 1) {
        playOut({ size }, seed * 31 + size);
      }
    }
  });

  it("plays full games under every rule variant", () => {
    for (const variant of Object.values(RULE_VARIANTS)) {
      for (let seed = 1; seed <= 25; seed += 1) {
        playOut({ size: 9, variant }, seed * 7 + variant.length);
      }
    }
  });

  it("plays full games with the star points sealed", () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const final = playOut({ size: 9, obstacles: "hoshi" }, seed * 13);
      // Obstacles are never played on and never disappear.
      expect(final.board.filter((cell) => cell === "blocked")).toHaveLength(4);
    }
  });

  it("plays full games with undo switched off", () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      playOut({ size: 9, allowUndo: false }, seed * 17);
    }
  });

  it("never lets a standard game be won by an overline", () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const final = playOut({ size: 9, variant: RULE_VARIANTS.standard }, seed * 3);
      if (final.status !== GAME_STATUS.won) continue;

      // The winning line must be exactly five, never six or more.
      expect(final.winningLine).toHaveLength(final.settings.winLength);
    }
  });

  it("never gives a colour more stones in a turn than its variant allows", () => {
    for (const variant of Object.values(RULE_VARIANTS)) {
      for (let seed = 1; seed <= 12; seed += 1) {
        const final = playOut({ size: 9, variant }, seed * 11 + variant.length);

        // Walk the record counting each unbroken run of one colour.
        let run = 0;
        let previous: Stone | null = null;
        for (const move of final.moves) {
          run = move.stone === previous ? run + 1 : 1;
          previous = move.stone;
          expect(
            run,
            `${variant} seed ${seed}: ${run} stones in one turn`,
          ).toBeLessThanOrEqual(rulesFor(final.settings, move.stone).stonesPerTurn);
        }
      }
    }
  });

  it("can replay every game from its move list alone", () => {
    for (const variant of Object.values(RULE_VARIANTS)) {
      for (let seed = 1; seed <= 10; seed += 1) {
        const final = playOut({ size: 9, variant }, seed * 19 + variant.length);

        /*
         * A stored game is its settings plus its moves, nothing else — that is
         * the whole reason history stores a move list and never a board. If a
         * replay could diverge, a saved game and the game that was played
         * would be different games.
         */
        const start = createGame({ ...final.settings, firstPlayer: final.opener });
        const timeline = replayMoves(
          start,
          final.moves.map((move) => ({ row: move.row, col: move.col })),
          final.opening.choices,
        );
        const replayed = timeline[timeline.length - 1];

        expect(replayed.board, `${variant} seed ${seed}: replayed board differs`)
          .toEqual(final.board);
        expect(replayed.status).toBe(final.status);
        expect(replayed.winner).toBe(final.winner);
        expect(replayed.captures).toEqual(final.captures);
      }
    }
  });

  it("refuses every illegal move by returning the very same state", () => {
    for (const variant of Object.values(RULE_VARIANTS)) {
      const state = playOut({ size: 9, variant }, 909 + variant.length);
      const size = state.settings.size;

      // Off the board, and on a point that is already taken.
      for (const point of [
        { row: -1, col: 0 },
        { row: 0, col: size },
        { row: size, col: size },
      ]) {
        expect(playMove(state, point), `${variant}: off-board move was accepted`)
          .toBe(state);
      }
      const taken = state.moves[0];
      if (taken !== undefined) {
        expect(playMove(state, { row: taken.row, col: taken.col })).toBe(state);
      }
    }
  });

  it("only ever forbids empty points, and only where a variant says so", () => {
    for (const variant of Object.values(RULE_VARIANTS)) {
      const state = playOut({ size: 9, variant }, 555 + variant.length);
      const empties = new Set(
        emptyPoints(state).map((point) => `${point.row},${point.col}`),
      );

      for (const point of forbiddenPoints(state)) {
        expect(
          empties.has(`${point.row},${point.col}`),
          `${variant}: forbade a point that is not empty`,
        ).toBe(true);
      }
    }
  });

  it("reports the same result for the same seed every time", () => {
    const once = playOut({ size: 9 }, 4242);
    const twice = playOut({ size: 9 }, 4242);
    expect(twice.moves).toEqual(once.moves);
    expect(twice.winner).toBe(once.winner);
  });
});

/** A sanity check on the checker itself, so a silent no-op cannot pass. */
describe("the brute force scanner", () => {
  it("finds a win the engine would also find", () => {
    let state = createGame({ size: 9 });
    for (const [row, col] of [[4, 0], [0, 0], [4, 1], [0, 1], [4, 2], [0, 2], [4, 3], [0, 3], [4, 4]]) {
      state = playMove(state, { row, col });
    }
    expect(state.winner).toBe("black");
    expect(bruteForceWinner(state.board, state.settings)).toBe("black");
  });

  it("finds nothing on an empty board", () => {
    const game = createGame({ size: 9 });
    expect(bruteForceWinner(game.board, game.settings)).toBeNull();
    expect(pointOf(9, 0)).toEqual({ row: 0, col: 0 });
  });
});
