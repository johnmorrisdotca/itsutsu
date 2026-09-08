import { expect } from "vitest";
import { cellAt, forbiddenPoints, indexOf, isStone, otherStone, undoMove } from "./engine";
import { rulesFor } from "./rules/handicap";
import { stonesPlacedThisTurn } from "./rules/turns";
import {
  bruteForceWinner,
  canFlipAnywhereByHand,
  countByHand,
  flipsByHand,
  longestRunThrough,
  runWinsIndependently,
} from "./simulation.scan";
import { GAME_STATUS } from "./gomoku.constants";
import type { Cell, GameState, Point, Stone } from "./gomoku.types";

/**
 * The invariants the simulator checks after every kind of move, and the
 * independent win scan they lean on. Everything here restates the rules by
 * hand rather than reading VARIANT_SPECS, so a wrong table cannot agree with
 * itself.
 */

function checkMove(before: GameState, after: GameState, played: Point, seed: number) {
  const where =
    `${after.settings.variant} seed ${seed}, move ${after.moves.length} ` +
    `at ${played.row},${played.col}`;

  // The flipping games play by their own rules, restated by hand below.
  if (isFlipping(after.settings.variant)) {
    checkFlipMove(before, after, played, where);
    return;
  }

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
  // The colour placed is the mover's, unless the game fixes it or lets the mover choose.
  const placedStone = after.moves[after.moves.length - 1].stone;
  if (choosesColour(after.settings.variant)) {
    expect(after.moves[after.moves.length - 1].by ?? placedStone, `${where}: mover not recorded`).toBe(before.toPlay);
  } else {
    expect(seen(playedIndex), `${where}: wrong stone was placed`).toBe(before.toPlay);
  }
  expect(seen(playedIndex), `${where}: placed stone missing`).toBe(placedStone);

  const lifted = changed.filter((index) => index !== playedIndex);
  for (const index of lifted) {
    expect(before.board[index], `${where}: lifted a stone that was not the opponent's`)
      .toBe(otherStone(placedStone));
    expect(seen(index), `${where}: a lifted stone was not removed`).toBeNull();
  }

  // Captures are tallied in stones, and only groups of the sizes the variant allows.
  const taken = after.captures[placedStone] - before.captures[placedStone];
  expect(lifted.length, `${where}: stones lifted do not match stones captured`).toBe(taken);
  if (lifted.length > 0) {
    const allowed = after.settings.variant === "sannuki" ? [2, 3] : [2];
    // Every capture is one group per direction; the total is a sum of allowed sizes.
    expect(
      canBeSummedFrom(lifted.length, allowed),
      `${where}: captured a group of a size the variant does not allow`,
    ).toBe(true);
  }

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
    stones + captured + clearedStones,
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
    // The mover made the forbidden line: the other player wins.
    expect(after.winner, `${where}: trap win went to the wrong colour`).toBe(
      otherStone(before.toPlay),
    );
    if (isMisere(after.settings.variant)) {
      // In the giveaway games the forbidden line is the winning length itself.
      expect(brute, `${where}: giveaway loss without a line on the board`).toBe(placedStone);
    } else {
      expect(brute, `${where}: trap declared although a winning line is on the board`).toBeNull();
      expect(
        longestRunThrough(after.board, after.settings.size, played, before.toPlay),
        `${where}: trap declared without a three through the played point`,
      ).toBe(3);
    }
  } else if (after.status === GAME_STATUS.won && after.winBy === "full") {
    expect(after.board.includes(null), `${where}: full-board win with room left`).toBe(false);
    // The giveaway games hand a full board to the opener; the breaker game to the breaker, white.
    expect(after.winner, `${where}: full board went to the wrong player`).toBe(
      after.settings.variant === "makerBreaker" ? "white" : after.opener,
    );
  } else if (after.status === GAME_STATUS.won && after.winBy === "square") {
    expect(after.winner, `${where}: square win went to the wrong colour`).toBe(before.toPlay);
    expect(after.winningLine, `${where}: a square has four stones`).toHaveLength(4);
    for (const point of after.winningLine) {
      expect(cellAt(after, point), `${where}: square holds a wrong stone`).toBe(after.winner);
    }
  } else if (after.status === GAME_STATUS.won) {
    if (choosesColour(after.settings.variant)) {
      // A line of either colour: the board shows one, and it goes to the maker or the mover.
      expect(brute, `${where}: declared a winner the board does not show`).not.toBeNull();
      expect(after.winner, `${where}: line went to the wrong player`).toBe(
        after.settings.variant === "makerBreaker" ? "black" : before.toPlay,
      );
    } else {
      expect(after.winner, `${where}: declared a winner the board does not show`).toBe(brute);
    }
    if (choosesColour(after.settings.variant)) {
      // Handled above.
    } else if (after.settings.variant !== "hotDrop") {
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
      // In the choose-a-colour games the line may be of either colour.
      if (choosesColour(after.settings.variant)) {
        expect(isStone(held), `${where}: winning line holds a non-stone`).toBe(true);
      } else {
        expect(
          held === "hot" ? after.winner : held,
          `${where}: winning line holds a wrong stone`,
        ).toBe(after.winner);
      }
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

/** The flipping games. Restated by hand. */
function isFlipping(variant: string): boolean {
  return (
    variant === "reversi" ||
    variant === "classicReversi" ||
    variant === "antiReversi" ||
    variant === "miniReversi" ||
    variant === "grandReversi"
  );
}

/** The four centre squares of an even board, by hand. */
function centreByHand(size: number): number[] {
  const half = size / 2;
  return [
    (half - 1) * size + half - 1,
    (half - 1) * size + half,
    half * size + half - 1,
    half * size + half,
  ];
}

/**
 * What must hold after a disc is placed in a flipping game: the mover's disc
 * is down; the discs that changed colour are exactly the ones the hand scan
 * says are bracketed, and they were the other colour before; nothing was
 * removed; the turn went to whoever can move, by the hand scan; and when the
 * game is over the count decides it — the larger count, or the smaller in the
 * giveaway form, or a draw when equal.
 */
function checkFlipMove(before: GameState, after: GameState, played: Point, where: string) {
  const size = after.settings.size;
  const mover = before.toPlay;
  const playedIndex = indexOf(size, played);
  expect(cellAt(before, played), `${where}: played on an occupied square`).toBeNull();
  expect(after.board[playedIndex], `${where}: mover's disc missing`).toBe(mover);

  const laying =
    after.settings.variant === "classicReversi" &&
    centreByHand(size).some((index) => before.board[index] === null);
  const expected = laying ? [] : flipsByHand(before.board, size, mover, played);
  if (laying) {
    expect(centreByHand(size), `${where}: laid outside the centre`).toContain(playedIndex);
  } else {
    expect(expected.length, `${where}: a move that turns nothing was allowed`).toBeGreaterThan(0);
  }

  const changed = after.board.reduce<number[]>((list, cell, index) => {
    if (cell !== before.board[index]) list.push(index);
    return list;
  }, []);
  const turned = changed.filter((index) => index !== playedIndex).sort((a, b) => a - b);
  const wanted = expected.map((point) => indexOf(size, point)).sort((a, b) => a - b);
  expect(turned, `${where}: turned discs differ from the hand scan`).toEqual(wanted);
  for (const index of turned) {
    expect(before.board[index], `${where}: turned a disc that was not the other colour`).toBe(otherStone(mover));
    expect(after.board[index], `${where}: a turned disc is not the mover's`).toBe(mover);
  }
  expect(after.board.filter(isStone).length, `${where}: a disc was removed`).toBe(
    before.board.filter(isStone).length + 1,
  );
  expect(after.moves.length).toBe(before.moves.length + 1);

  const opponentCan = canFlipAnywhereByHand(after.board, size, otherStone(mover));
  const moverCan = canFlipAnywhereByHand(after.board, size, mover);
  const stillLaying =
    after.settings.variant === "classicReversi" &&
    centreByHand(size).some((index) => after.board[index] === null);
  if (stillLaying) {
    expect(after.status).toBe(GAME_STATUS.playing);
    expect(after.toPlay, `${where}: laying did not alternate`).toBe(otherStone(mover));
  } else if (opponentCan) {
    expect(after.status).toBe(GAME_STATUS.playing);
    expect(after.toPlay, `${where}: turn did not pass`).toBe(otherStone(mover));
  } else if (moverCan) {
    expect(after.status).toBe(GAME_STATUS.playing);
    expect(after.toPlay, `${where}: a forced pass was not applied`).toBe(mover);
  } else {
    const count = countByHand(after.board);
    if (count.black === count.white) {
      expect(after.status, `${where}: equal counts should draw`).toBe(GAME_STATUS.draw);
    } else {
      const more = count.black > count.white ? "black" : "white";
      const fewer = more === "black" ? "white" : "black";
      expect(after.status, `${where}: game should be over`).toBe(GAME_STATUS.won);
      expect(after.winBy, `${where}: a count win should say so`).toBe("count");
      expect(after.winner, `${where}: count went to the wrong colour`).toBe(
        after.settings.variant === "antiReversi" ? fewer : more,
      );
    }
  }

  if (after.settings.allowUndo) {
    const undone = undoMove(after);
    expect(undone.board, `${where}: undo did not turn the discs back`).toEqual(before.board);
    expect(undone.toPlay, `${where}: undo did not restore the turn`).toBe(before.toPlay);
  }
}

/** The games where the mover picks, or does not own, the colour placed. Restated by hand. */
function choosesColour(variant: string): boolean {
  return variant === "makerBreaker" || variant === "wildTicTacToe" || variant === "notakto";
}

/** The games where making the line loses. Restated by hand. */
function isMisere(variant: string): boolean {
  return variant === "giveawayDrop" || variant === "misereFive" || variant === "notakto";
}

/** Whether `total` is a sum of the given group sizes. */
function canBeSummedFrom(total: number, sizes: number[]): boolean {
  if (total === 0) return true;
  return sizes.some((size) => total - size >= 0 && canBeSummedFrom(total - size, sizes));
}

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

/** The race games, restated by hand. */
function isRace(variant: string): boolean {
  return variant === "halma";
}

/** Whether `to` is reachable from `from` by one step or a chain of jumps, worked out by hand. */
function reachableByHand(board: readonly Cell[], size: number, from: Point, to: Point): boolean {
  const at = (row: number, col: number) => (row < 0 || col < 0 || row >= size || col >= size ? undefined : board[row * size + col]);
  if (Math.max(Math.abs(from.row - to.row), Math.abs(from.col - to.col)) === 1) return true;
  const seen = new Set<number>([from.row * size + from.col]);
  const stack: Point[] = [from];
  while (stack.length > 0) {
    const here = stack.pop() as Point;
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const over = at(here.row + dr, here.col + dc);
        const beyond = at(here.row + 2 * dr, here.col + 2 * dc);
        if (over === undefined || over === null || beyond !== null) continue;
        const landing = { row: here.row + 2 * dr, col: here.col + 2 * dc };
        if (landing.row === to.row && landing.col === to.col) return true;
        const key = landing.row * size + landing.col;
        if (!seen.has(key)) {
          seen.add(key);
          stack.push(landing);
        }
      }
    }
  }
  return false;
}

/** What must hold after a race move: one piece went from `from` to `to` by a step or jumps, nothing else changed. */
function checkRaceMove(before: GameState, after: GameState, from: Point, to: Point, seed: number) {
  const where = `${after.settings.variant} seed ${seed}, move ${from.row},${from.col} to ${to.row},${to.col}`;
  expect(cellAt(before, to), `${where}: landed on a piece`).toBeNull();
  expect(cellAt(after, from), `${where}: piece still at its origin`).toBeNull();
  expect(cellAt(after, to), `${where}: piece did not arrive`).toBe(before.toPlay);
  // A step is one square; anything further must be a chain of jumps over pieces on the board before the move.
  expect(reachableByHand(before.board, after.settings.size, from, to), `${where}: not a step or a jump chain`).toBe(true);
  const changed = after.board.filter((cell, index) => cell !== before.board[index]).length;
  expect(changed, `${where}: more than two cells changed`).toBe(2);
  expect(after.moves[after.moves.length - 1], `${where}: move not recorded`).toMatchObject({ kind: "move", from });
  if (after.status === GAME_STATUS.playing) expect(after.toPlay).toBe(otherStone(before.toPlay));
  if (after.settings.allowUndo) {
    expect(undoMove(after).board, `${where}: undo did not move the piece back`).toEqual(before.board);
  }
}

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
  checkRaceMove,
  isRace,
  checkPiece,
  checkSlide,
  checkTwist,
  longestRunThrough,
  runWinsIndependently,
  SLIDE_CAP,
};
