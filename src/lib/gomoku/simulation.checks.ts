import { expect } from "vitest";
import { cellAt, forbiddenPoints, indexOf, isStone, otherStone, undoMove } from "./engine";
import { rulesFor } from "./rules/handicap";
import { stonesPlacedThisTurn } from "./rules/turns";
import { GAME_STATUS } from "./gomoku.constants";
import type { Cell, GameSettings, GameState, Point, Stone } from "./gomoku.types";

/**
 * The invariants the simulator checks after every kind of move, and the
 * independent win scan they lean on. Everything here restates the rules by
 * hand rather than reading VARIANT_SPECS, so a wrong table cannot agree with
 * itself.
 */

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
function wrapsColumns(variant: string): boolean {
  return variant === "ringDrop";
}

function bruteForceWinner(board: Cell[], settings: GameSettings): Stone | null {
  const { size } = settings;
  const wrap = wrapsColumns(settings.variant);
  const at = (row: number, col: number): Cell | "edge" => {
    const c = wrap ? ((col % size) + size) % size : col;
    return row < 0 || row >= size || c < 0 || c >= size
      ? "edge"
      : board[indexOf(size, { row, col: c })];
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
        while (
          matches(at(row + step.row * length, col + step.col * length), stone) &&
          length < size
        ) {
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
   * A cleared row moves everything, so the placed-stone checks are made on
   * the board as it was before the row went, which the move remembers.
   */
  const lastMove = after.moves[after.moves.length - 1];
  const afterBoard =
    lastMove.cleared !== undefined
      ? after.board.slice(after.settings.size).concat(lastMove.cleared)
      : after.board;
  const seen = (index: number) => afterBoard[index];

  /*
   * The played intersection changed, and every other change is a captured
   * stone: an opposing stone that became empty. Nothing else may move, and
   * the number lifted must be exactly two per pair the mover was credited.
   */
  const changed = afterBoard.reduce<number[]>((list, cell, index) => {
    if (cell !== before.board[index]) list.push(index);
    return list;
  }, []);
  const playedIndex = indexOf(after.settings.size, played);
  expect(changed, `${where}: the played point did not change`).toContain(playedIndex);
  expect(seen(playedIndex), `${where}: wrong stone was placed`).toBe(before.toPlay);

  const lifted = changed.filter((index) => index !== playedIndex);
  for (const index of lifted) {
    expect(before.board[index], `${where}: lifted a stone that was not the opponent's`)
      .toBe(otherStone(before.toPlay));
    expect(seen(index), `${where}: a lifted stone was not removed`).toBeNull();
  }

  const pairs =
    after.captures[before.toPlay] - before.captures[before.toPlay];
  expect(lifted.length, `${where}: stones lifted do not match pairs captured`).toBe(
    pairs * 2,
  );

  /*
   * Stones on the board equal moves played, less any lifted by a capture.
   * Ninuki removes the opponent's stones, so the two only match once the
   * captures are accounted for. The clearing game throws whole rows away,
   * which the record notes on the move that did it.
   */
  const stones = after.board.filter(isStone).length;
  const captured = after.captures.black + after.captures.white;
  const clearedStones = after.moves.reduce(
    (total, move) => total + (move.cleared?.filter(isStone).length ?? 0),
    0,
  );
  // Each move laid one stone, a piece's worth of stones, or none at all.
  const laid = after.moves.reduce(
    (total, move) => total + (move.kind === "pass" ? 0 : (move.cells?.length ?? 1)),
    0,
  );
  expect(
    stones + captured * 2 + clearedStones,
    `${where}: stones on board do not match moves less captures and clears`,
  ).toBe(laid);

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
    // The mover made the forbidden line: the other colour wins.
    expect(after.winner, `${where}: trap win went to the wrong colour`).toBe(
      otherStone(before.toPlay),
    );
    if (after.settings.variant === "giveawayDrop") {
      // In the giveaway game the forbidden line is the winning length itself.
      expect(brute, `${where}: giveaway loss without a line on the board`).toBe(before.toPlay);
    } else {
      expect(brute, `${where}: trap declared although a winning line is on the board`).toBeNull();
      expect(
        longestRunThrough(after.board, after.settings.size, played, before.toPlay),
        `${where}: trap declared without a three through the played point`,
      ).toBe(3);
    }
  } else if (after.status === GAME_STATUS.won && after.winBy === "full") {
    expect(after.board.includes(null), `${where}: full-board win with room left`).toBe(false);
    expect(after.winner, `${where}: full board went to the wrong player`).toBe(after.opener);
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
    if (after.settings.variant !== "hotDrop") {
      // Through a hotspot, a stone can finish the other colour's line.
      expect(after.winner, `${where}: winner is not the player who moved`).toBe(
        before.toPlay,
      );
    }
    expect(
      after.winningLine.length,
      `${where}: winning line is too short`,
    ).toBeGreaterThanOrEqual(after.settings.winLength);
    for (const point of after.winningLine) {
      const held = cellAt(after, point);
      expect(
        held === "hot" ? after.winner : held,
        `${where}: winning line holds a wrong stone`,
      ).toBe(after.winner);
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

/** What must hold after a piece is laid: every cell placed with its colour, nothing else. */
function checkPiece(before: GameState, after: GameState, cells: readonly { row: number; col: number; stone: Stone }[], seed: number) {
  const where = `${after.settings.variant} seed ${seed}, piece after move ${after.moves.length}`;
  for (const cell of cells) {
    expect(cellAt(before, cell), `${where}: laid on an occupied point`).toBeNull();
    expect(cellAt(after, cell), `${where}: cell holds the wrong colour`).toBe(cell.stone);
  }
  const changed = after.board.filter((cell, index) => cell !== before.board[index]).length;
  expect(changed, `${where}: more cells changed than the piece has`).toBe(cells.length);
  expect(after.moves[after.moves.length - 1].cells, `${where}: cells not recorded`).toHaveLength(cells.length);
  const brute = bruteForceWinner(after.board, after.settings);
  if (after.status === GAME_STATUS.won) {
    expect(after.winner, `${where}: won without a line`).toBe(brute);
  } else if (after.status === GAME_STATUS.playing) {
    expect(brute, `${where}: missed a line a piece made`).toBeNull();
    expect(after.toPlay).toBe(otherStone(before.toPlay));
  }
  if (after.settings.allowUndo) {
    expect(undoMove(after).board, `${where}: undo did not lift the piece`).toEqual(before.board);
  }
}

/** What must hold after a pass: nothing on the board changed, and it is on the record. */
function checkPass(before: GameState, after: GameState, seed: number) {
  const where = `${after.settings.variant} seed ${seed}, pass after move ${after.moves.length}`;
  expect(after.board, `${where}: a pass changed the board`).toEqual(before.board);
  expect(after.moves[after.moves.length - 1].kind, `${where}: pass not recorded`).toBe("pass");
  if (after.status === GAME_STATUS.playing) expect(after.toPlay).toBe(otherStone(before.toPlay));
}


export {
  bruteForceWinner,
  checkMove,
  checkPass,
  checkPiece,
  checkSlide,
  checkTwist,
  longestRunThrough,
  runWinsIndependently,
  SLIDE_CAP,
};
