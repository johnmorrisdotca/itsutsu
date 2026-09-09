import { describe, expect, it } from "vitest";

import type { Cell, Point, Stone } from "../gomoku.types";
import {
  capturesFrom,
  crowns,
  hasMove,
  isPlayable,
  jumpsFrom,
  movesFor,
  piecesOf,
  startingPieces,
} from "./checkers";
import { indexOf } from "./board";

/**
 * Draughts on the diagonals.
 *
 * The board is written out as text in these tests rather than built by
 * placing pieces, because every one of these rules is about a shape — a
 * piece with something behind it, a chain that turns a corner, a row that
 * crowns — and a diagram is the only way to read a shape at a glance.
 *
 *   .  an empty square      b  a black man     B  a black king
 *   #  a light square       w  a white man     W  a white king
 */
const SIZE = 8;

function boardFrom(rows: string[]): { board: Cell[]; kings: Set<number> } {
  const board: Cell[] = new Array(SIZE * SIZE).fill(null);
  const kings = new Set<number>();
  rows.forEach((line, row) => {
    [...line.replace(/\s/g, "")].forEach((mark, col) => {
      const index = indexOf(SIZE, { row, col });
      if (mark === "b" || mark === "B") board[index] = "black";
      if (mark === "w" || mark === "W") board[index] = "white";
      if (mark === "B" || mark === "W") kings.add(index);
    });
  });
  return { board, kings };
}

const at = (row: number, col: number): Point => ({ row, col });
const named = (points: Point[]) => points.map((point) => `${point.row},${point.col}`).sort();

describe("the board a game of draughts is played on", () => {
  it("uses one colour of square, so half the board is never touched", () => {
    expect(isPlayable(at(0, 1))).toBe(true);
    expect(isPlayable(at(0, 0))).toBe(false);
    // A diagonal step always lands on the same colour it left.
    expect(isPlayable(at(3, 2))).toBe(isPlayable(at(4, 3)));
  });

  it("sets out twelve a side on the 8×8 board, three rows each", () => {
    const pieces = startingPieces({ size: 8 } as never);
    expect(pieces.filter((piece) => piece.stone === "black")).toHaveLength(12);
    expect(pieces.filter((piece) => piece.stone === "white")).toHaveLength(12);
    // Every one of them on a dark square, and the two rows in the middle empty.
    expect(pieces.every((piece) => isPlayable(piece.point))).toBe(true);
    expect(pieces.some((piece) => piece.point.row === 3 || piece.point.row === 4)).toBe(false);
  });

  it("crowns each colour on the far side from where it started", () => {
    expect(crowns(SIZE, "black", at(7, 2))).toBe(true);
    expect(crowns(SIZE, "black", at(0, 1))).toBe(false);
    expect(crowns(SIZE, "white", at(0, 1))).toBe(true);
    expect(crowns(SIZE, "white", at(7, 2))).toBe(false);
  });
});

describe("how a man moves", () => {
  const { board, kings } = boardFrom([
    "# . # . # . # .",
    ". # . # . # . #",
    "# . # b # . # .",
    ". # . # . # . #",
    "# . # . # . # .",
    ". # . w . # . #",
    "# . # . # . # .",
    ". # . # . # . #",
  ]);

  it("steps forward on the diagonal, and never back", () => {
    const black = movesFor(board, SIZE, kings, "black");
    expect(named(black.map((move) => move.to))).toEqual(named([at(3, 2), at(3, 4)]));
    // Black is at row 2 and every move it has is to row 3: down the board.
    expect(black.every((move) => move.to.row === 3)).toBe(true);
  });

  it("sends white the other way", () => {
    const white = movesFor(board, SIZE, kings, "white");
    expect(white.every((move) => move.to.row === 4)).toBe(true);
  });
});

describe("taking a piece", () => {
  it("jumps an enemy into the empty square beyond it", () => {
    const { board, kings } = boardFrom([
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # b # . # .",
      ". # . # w # . #",
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
    ]);
    const jumps = jumpsFrom(board, SIZE, kings, at(2, 3), "black");
    expect(jumps).toHaveLength(1);
    expect(jumps[0].to).toEqual(at(4, 5));
    expect(jumps[0].over).toEqual(at(3, 4));
  });

  it("will not jump its own side, and will not land on an occupied square", () => {
    const { board, kings } = boardFrom([
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # b # . # .",
      ". # . # b # . #",
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
    ]);
    expect(jumpsFrom(board, SIZE, kings, at(2, 3), "black")).toHaveLength(0);

    const blocked = boardFrom([
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # b # . # .",
      ". # . # w # . #",
      "# . # . # w # .",
      ". # . # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
    ]);
    expect(jumpsFrom(blocked.board, SIZE, blocked.kings, at(2, 3), "black")).toHaveLength(0);
  });

  /*
   * The rule that makes it a game of forcing rather than shuffling: with a
   * capture available, the quiet move is not on offer at all.
   */
  it("is compulsory: nothing else is offered while a capture is there", () => {
    const { board, kings } = boardFrom([
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # b # . # .",
      ". # . # w # . #",
      "# . # . # . # .",
      ". # . # . # . #",
      "# b # . # . # .",
      ". # . # . # . #",
    ]);
    const moves = movesFor(board, SIZE, kings, "black");
    // Two black men on the board. One can take; the other has two quiet steps
    // and is not offered a single one of them while the take is there.
    expect(moves.every((move) => move.taken.length > 0)).toBe(true);
    expect(moves.every((move) => move.from.row === 2)).toBe(true);
    expect(moves.some((move) => move.from.row === 6)).toBe(false);
  });

  it("takes the whole chain in one move, not the first leg of it", () => {
    const { board, kings } = boardFrom([
      "# . # . # . # .",
      ". # . # . # . #",
      "# b # . # . # .",
      ". # w # . # . #",
      "# . # . # . # .",
      ". # w # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
    ]);
    const chains = capturesFrom(board, SIZE, kings, at(2, 1), "black");
    expect(chains).toHaveLength(1);
    expect(chains[0].taken).toHaveLength(2);
    expect(named(chains[0].taken)).toEqual(named([at(3, 2), at(5, 2)]));
    // Down-right over the first, then down-left over the second: a chain may
    // turn a corner, and it is the far end of it that the move lands on.
    expect(chains[0].landings).toEqual([at(4, 3), at(6, 1)]);
  });
});

describe("becoming a king", () => {
  it("turns a man that reaches the far row, and lets it go backwards after", () => {
    const { board, kings } = boardFrom([
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
      "# b # . # . # .",
      ". # . # . # . #",
    ]);
    const moves = movesFor(board, SIZE, kings, "black");
    expect(moves.every((move) => move.crowned)).toBe(true);

    // The same piece, now a king, may go back the way it came.
    const crowned = boardFrom([
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # B # . # .",
      ". # . # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
    ]);
    const kingMoves = movesFor(crowned.board, SIZE, crowned.kings, "black");
    expect(named(kingMoves.map((move) => move.to))).toEqual(
      named([at(3, 2), at(3, 4), at(5, 2), at(5, 4)]),
    );
  });

  /*
   * Where the English game and the international one part company: a man
   * crowned by a jump stops there, even when the king it has just become
   * could carry on taking.
   */
  it("stops the turn when the crown comes from a jump", () => {
    const { board, kings } = boardFrom([
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # . # . # .",
      ". # b # . # . #",
      "# . # w # . # .",
      ". # . # . # . #",
    ]);
    const chains = capturesFrom(board, SIZE, kings, at(5, 2), "black");
    expect(chains).toHaveLength(1);
    expect(chains[0].taken).toHaveLength(1);
    expect(chains[0].crowned).toBe(true);
    expect(chains[0].landings[chains[0].landings.length - 1]).toEqual(at(7, 4));
  });

  it("lets a king jump backwards, which a man may not", () => {
    const backwards = (mark: string) =>
      boardFrom([
        "# . # . # . # .",
        ". # . # . # . #",
        "# . # . # . # .",
        `. # . # w # . #`,
        `# . # . # ${mark} # .`,
        ". # . # . # . #",
        "# . # . # . # .",
        ". # . # . # . #",
      ]);
    const man = backwards("b");
    expect(jumpsFrom(man.board, SIZE, man.kings, at(4, 5), "black")).toHaveLength(0);
    const king = backwards("B");
    expect(jumpsFrom(king.board, SIZE, king.kings, at(4, 5), "black")).toHaveLength(1);
  });
});

describe("running out of moves", () => {
  it("counts a colour with nothing to play as having none", () => {
    /*
     * Black is in the corner with a white man on each square ahead of it. The
     * left jump runs off the board and the right one has nowhere to land, so
     * there is no step and no take: black is stuck, which loses the game.
     */
    const { board, kings } = boardFrom([
      "# b # . # . # .",
      "w # w # . # . #",
      "# . # w # . # .",
      ". # . # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
    ]);
    expect(hasMove(board, SIZE, kings, "black")).toBe(false);

    // Empty the square the right-hand jump would land on and it is a move again.
    board[indexOf(SIZE, at(2, 3))] = null;
    expect(hasMove(board, SIZE, kings, "black")).toBe(true);
  });

  it("finds every piece of a colour, and only that colour", () => {
    const { board } = boardFrom([
      "# b # b # . # .",
      ". # w # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
      "# . # . # . # .",
      ". # . # . # . #",
    ]);
    expect(piecesOf(board, SIZE, "black" as Stone)).toHaveLength(2);
    expect(piecesOf(board, SIZE, "white" as Stone)).toHaveLength(1);
  });
});
