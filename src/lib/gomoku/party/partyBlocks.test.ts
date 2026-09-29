import { describe, expect, it } from "vitest";

import type { Point } from "../gomoku.types";
import { indexOf } from "../rules/board";
import { seededRandom } from "../rules/random";
import {
  BLOCKS_CORNERS,
  BLOCKS_STATUS,
  againBlocksParty,
  blocksCanLay,
  blocksLeaders,
  blocksLies,
  blocksPiecesLeft,
  blocksPreviewAt,
  blocksRefusal,
  blocksScores,
  blocksStartSquares,
  cornerSquare,
  decodeBlocksParty,
  encodeBlocksParty,
  heldCells,
  layBlocks,
  startBlocksParty,
} from "./partyBlocks";
import { BLOCKS_PARTY_SIZE, BLOCKS_PIECES, BLOCKS_PIECE_KEYS, BLOCKS_REFUSALS } from "./partyBlocks.constants";
import type { BlocksMove, BlocksPieceKey, PartyBlocksState } from "./partyBlocks.types";

const p = (row: number, col: number): Point => ({ row, col });
const LAST = BLOCKS_PARTY_SIZE - 1;

/** Lay a piece that must be allowed, and hand back the game after it. */
function lay(game: PartyBlocksState, piece: BlocksPieceKey, cells: Point[]): PartyBlocksState {
  const next = layBlocks(game, piece, cells);
  if (next === null) throw new Error(`${piece} at ${JSON.stringify(cells)} was refused: ${blocksRefusal(game, piece, cells)}`);
  return next;
}

/** A game whose board and record are exactly as given, for the positions no opening reaches quickly. */
function laidOut(owners: Map<number, number | null>, moves: BlocksMove[], toPlay = 0, fill: number | null = null): PartyBlocksState {
  const board: (number | null)[] = new Array(BLOCKS_PARTY_SIZE * BLOCKS_PARTY_SIZE).fill(fill);
  for (const [index, owner] of owners) board[index] = owner;
  return { ...startBlocksParty(["Aiko", "Ben", "Chloe", "Dev"]), board, moves, toPlay };
}

/** Every lay the player to move could make now: the search the random games below choose from. */
function everyLay(game: PartyBlocksState): { piece: BlocksPieceKey; cells: Point[] }[] {
  const found = new Map<string, { piece: BlocksPieceKey; cells: Point[] }>();
  for (const start of blocksStartSquares(game, game.toPlay)) {
    for (const piece of blocksPiecesLeft(game, game.toPlay)) {
      for (const lie of blocksLies(piece)) {
        for (const pin of lie) {
          const cells = lie.map((cell) => p(start.row - pin.row + cell.row, start.col - pin.col + cell.col));
          if (blocksRefusal(game, piece, cells) === null) found.set(`${piece}:${cells.map((c) => `${c.row},${c.col}`).sort().join("|")}`, { piece, cells });
        }
      }
    }
  }
  return [...found.values()];
}

/** A whole game of random but legal lays, from a seed, to its end. */
function playOut(seed: number): PartyBlocksState {
  const random = seededRandom(seed);
  let game = startBlocksParty();
  while (game.status === BLOCKS_STATUS.playing) {
    const lays = everyLay(game);
    expect(lays.length, "the player to move always has a lay").toBeGreaterThan(0);
    const choice = lays[Math.floor(random() * lays.length)];
    game = lay(game, choice.piece, choice.cells);
  }
  return game;
}

describe("the pieces", () => {
  it("are twenty-one shapes of one to five squares, eighty-nine squares a player", () => {
    expect(BLOCKS_PIECE_KEYS).toHaveLength(21);
    const bySize = [1, 2, 3, 4, 5].map((size) => BLOCKS_PIECE_KEYS.filter((key) => BLOCKS_PIECES[key].length === size).length);
    expect(bySize).toEqual([1, 1, 2, 5, 12]);
    expect(BLOCKS_PIECE_KEYS.reduce((sum, key) => sum + BLOCKS_PIECES[key].length, 0)).toBe(89);
  });

  it("are all different, however they are turned or mirrored, and every one is joined along its sides", () => {
    const shapes = BLOCKS_PIECE_KEYS.map((key) =>
      blocksLies(key)
        .map((lie) => lie.map((cell) => `${cell.row},${cell.col}`).join("|"))
        .sort()[0],
    );
    expect(new Set(shapes).size).toBe(21);
    for (const key of BLOCKS_PIECE_KEYS) {
      const cells = BLOCKS_PIECES[key];
      const reached = new Set([0]);
      for (let grew = true; grew; ) {
        grew = false;
        cells.forEach((cell, index) => {
          if (reached.has(index)) return;
          if ([...reached].some((at) => Math.abs(cells[at].row - cell.row) + Math.abs(cells[at].col - cell.col) === 1)) {
            reached.add(index);
            grew = true;
          }
        });
      }
      expect(reached.size, `${key} is in one piece`).toBe(cells.length);
    }
  });

  it("turn and mirror as the two-player game's pieces do: a quarter turn stands a line up, a flip mirrors the L", () => {
    expect(heldCells({ piece: "fiveI", turns: 1, flipped: false })).toEqual([p(0, 0), p(1, 0), p(2, 0), p(3, 0), p(4, 0)]);
    expect(heldCells({ piece: "fiveL", turns: 0, flipped: true })).toEqual([p(0, 1), p(1, 1), p(2, 1), p(3, 0), p(3, 1)]);
    // The cross is the same every way round, and the Z has four ways once mirrored.
    expect(blocksLies("fiveX")).toHaveLength(1);
    expect(blocksLies("fiveZ")).toHaveLength(4);
    expect(blocksLies("fiveF")).toHaveLength(8);
  });
});

describe("the table", () => {
  it("seats four, a corner each, clockwise from the top left, on a board of twenty", () => {
    const game = startBlocksParty(["Aiko", " Ben  ", "", "Dev"]);
    expect(game.players.map((player) => player.corner)).toEqual(["topLeft", "topRight", "bottomRight", "bottomLeft"]);
    expect(game.players.map((player) => player.name)).toEqual(["Aiko", "Ben", "", "Dev"]);
    expect(game.board).toHaveLength(400);
    expect(BLOCKS_CORNERS.map(cornerSquare)).toEqual([p(0, 0), p(0, LAST), p(LAST, LAST), p(LAST, 0)]);
    expect(game.toPlay).toBe(0);
    expect(blocksPiecesLeft(game, 3)).toHaveLength(21);
  });
});

describe("where a piece may go", () => {
  it("must cover the player's own corner the first time", () => {
    const game = startBlocksParty();
    expect(blocksRefusal(game, "fourSquare", [p(1, 1), p(1, 2), p(2, 1), p(2, 2)])).toBe(BLOCKS_REFUSALS.firstCorner);
    // Another player's corner is not yours.
    expect(blocksRefusal(game, "one", [p(0, LAST)])).toBe(BLOCKS_REFUSALS.firstCorner);
    const after = lay(game, "fourSquare", [p(0, 0), p(0, 1), p(1, 0), p(1, 1)]);
    expect(after.toPlay).toBe(1);
    expect(blocksRefusal(after, "one", [p(0, LAST)])).toBeNull();
  });

  it("then touches the player's own at a corner, never along a side, and may lean on anybody else's", () => {
    let game = startBlocksParty();
    game = lay(game, "fourSquare", [p(0, 0), p(0, 1), p(1, 0), p(1, 1)]);
    game = lay(game, "one", [p(0, LAST)]);
    game = lay(game, "one", [p(LAST, LAST)]);
    game = lay(game, "one", [p(LAST, 0)]);
    expect(game.toPlay).toBe(0);

    // Corner to corner with her square: yes.
    expect(blocksRefusal(game, "two", [p(2, 2), p(2, 3)])).toBeNull();
    // Along a side of it: no, even though (2,2) also meets it at a corner.
    expect(blocksRefusal(game, "threeLine", [p(2, 1), p(2, 2), p(2, 3)])).toBe(BLOCKS_REFUSALS.sideTouch);
    // Touching nothing of hers: no.
    expect(blocksRefusal(game, "two", [p(5, 5), p(5, 6)])).toBe(BLOCKS_REFUSALS.noCorner);
    // Over a square already taken, or off the edge: no.
    expect(blocksRefusal(game, "two", [p(1, 1), p(2, 2)])).toBe(BLOCKS_REFUSALS.taken);
    expect(blocksRefusal(game, "two", [p(-1, 2), p(0, 2)])).toBe(BLOCKS_REFUSALS.offBoard);
    // A shape she has laid already: no.
    expect(blocksRefusal(game, "fourSquare", [p(2, 2), p(2, 3), p(3, 2), p(3, 3)])).toBe(BLOCKS_REFUSALS.used);
    // Squares that are not the shape named: refused outright.
    expect(layBlocks(game, "two", [p(2, 2), p(3, 3)])).toBeNull();

    game = lay(game, "two", [p(2, 2), p(2, 3)]);
    // Ben's piece may lie along the side of Aiko's: only your own pieces keep their distance.
    game = lay(game, "fiveI", [p(1, LAST - 1), p(2, LAST - 1), p(3, LAST - 1), p(4, LAST - 1), p(5, LAST - 1)]);
    expect(game.board[indexOf(BLOCKS_PARTY_SIZE, p(1, LAST - 1))]).toBe(1);
  });

  it("is found for a tap: the held piece slides over the tapped square until the rules allow it, or shows refused", () => {
    const game = startBlocksParty();
    // A line of five held flat, tapped four squares from the corner: its last square is the one that fits.
    const preview = blocksPreviewAt(game, { piece: "fiveI", turns: 0, flipped: false }, p(0, 3));
    expect(preview).toEqual({ refusal: null, cells: [p(0, 0), p(0, 1), p(0, 2), p(0, 3), p(0, 4)] });
    // Tapped out in the middle of the board, nothing fits, and the piece shows where it would go, refused.
    const far = blocksPreviewAt(game, { piece: "fiveI", turns: 0, flipped: false }, p(10, 10));
    expect(far.refusal).toBe(BLOCKS_REFUSALS.firstCorner);
    expect(far.cells).toEqual([p(10, 10), p(10, 11), p(10, 12), p(10, 13), p(10, 14)]);
    // Near the edge, only the squares on the board are drawn.
    const edge = blocksPreviewAt(game, { piece: "fiveI", turns: 0, flipped: false }, p(10, 18));
    expect(edge).toEqual({ refusal: BLOCKS_REFUSALS.offBoard, cells: [p(10, 18), p(10, 19)] });
  });
});

describe("passing and the end", () => {
  const done = (player: number, piece: BlocksPieceKey, at: Point): BlocksMove => ({ player, piece, cells: [at] });

  it("passes over a player with nothing that fits, for the rest of the game", () => {
    // Ben's one piece in his corner is walled in: the squares diagonal to it are taken by Chloe.
    const owners = new Map<number, number>([
      [indexOf(BLOCKS_PARTY_SIZE, p(0, 0)), 0],
      [indexOf(BLOCKS_PARTY_SIZE, p(0, LAST)), 1],
      [indexOf(BLOCKS_PARTY_SIZE, p(1, LAST - 1)), 2],
      [indexOf(BLOCKS_PARTY_SIZE, p(LAST, LAST)), 2],
      [indexOf(BLOCKS_PARTY_SIZE, p(LAST, 0)), 3],
    ]);
    const moves = [done(0, "one", p(0, 0)), done(1, "one", p(0, LAST)), done(2, "one", p(LAST, LAST)), done(3, "one", p(LAST, 0))];
    const game = laidOut(owners, moves);
    expect(blocksCanLay(game, 1)).toBe(false);
    expect(blocksCanLay(game, 2)).toBe(true);

    const after = lay(game, "two", [p(1, 1), p(1, 2)]);
    expect(after.toPlay).toBe(2);
    expect(after.out).toEqual([false, true, false, false]);
    expect(after.status).toBe(BLOCKS_STATUS.playing);
  });

  it("ends when nobody can lay a piece, and counts the squares each covered", () => {
    // Every square but one is Ben's; Aiko fills the last, diagonal to her piece at (9,9).
    const owners = new Map<number, number | null>([
      [indexOf(BLOCKS_PARTY_SIZE, p(9, 9)), 0],
      [indexOf(BLOCKS_PARTY_SIZE, p(10, 10)), null],
    ]);
    const moves = [done(0, "two", p(9, 9)), done(1, "two", p(0, LAST)), done(2, "two", p(LAST, LAST)), done(3, "two", p(LAST, 0))];
    const game = laidOut(owners, moves, 0, 1);
    const after = lay(game, "one", [p(10, 10)]);
    expect(after.status).toBe(BLOCKS_STATUS.over);
    expect(after.out).toEqual([true, true, true, true]);
    expect(blocksRefusal(after, "fiveX", [p(0, 0)])).toBe(BLOCKS_REFUSALS.over);
    const scores = blocksScores(after);
    expect(scores.map((score) => score.squares)).toEqual([2, 398, 0, 0]);
    expect(scores[0].piecesLeft).toBe(19);
    expect(blocksLeaders(after)).toEqual([1]);
  });

  it("shares the win between players level at the top", () => {
    let game = startBlocksParty();
    game = lay(game, "one", [p(0, 0)]);
    game = lay(game, "one", [p(0, LAST)]);
    expect(blocksLeaders(game)).toEqual([0, 1]);
  });

  it("plays out to the end from any seed, every lay legal, every square counted once", () => {
    for (const seed of [1, 2, 3]) {
      const game = playOut(seed);
      const scores = blocksScores(game);
      expect(game.out.every(Boolean)).toBe(true);
      expect(scores.reduce((sum, score) => sum + score.squares, 0)).toBe(game.board.filter((owner) => owner !== null).length);
      for (const score of scores) {
        const laid = game.moves.filter((move) => move.player === score.player);
        expect(score.squares).toBe(laid.reduce((sum, move) => sum + move.cells.length, 0));
        expect(score.piecesLeft).toBe(21 - laid.length);
      }
      // Kept and read back, the whole game is the same game.
      expect(decodeBlocksParty(encodeBlocksParty(game))).toEqual(game);
    }
  });
});

describe("kept in this browser", () => {
  it("is read back move by move to the same board and the same turn", () => {
    let game = startBlocksParty(["Aiko", "Ben", "", "Dev"]);
    game = lay(game, "fiveL", [p(0, 0), p(1, 0), p(2, 0), p(3, 0), p(3, 1)]);
    game = lay(game, "fourT", [p(0, LAST - 2), p(0, LAST - 1), p(0, LAST), p(1, LAST - 1)]);
    const back = decodeBlocksParty(encodeBlocksParty(game));
    expect(back).toEqual(game);
    expect(back?.toPlay).toBe(2);
    expect(back?.players[2].name).toBe("");
  });

  it("is refused whole when it is not a game this table could have played", () => {
    const game = lay(startBlocksParty(), "one", [p(0, 0)]);
    const text = encodeBlocksParty(game);
    const kept = JSON.parse(text);
    expect(decodeBlocksParty(null)).toBeNull();
    expect(decodeBlocksParty("not a game")).toBeNull();
    expect(decodeBlocksParty(JSON.stringify({ ...kept, v: 2 }))).toBeNull();
    expect(decodeBlocksParty(JSON.stringify({ ...kept, players: kept.players.slice(0, 3) }))).toBeNull();
    expect(decodeBlocksParty(JSON.stringify({ ...kept, players: [...kept.players].reverse() }))).toBeNull();
    // A piece laid where the rules refuse it: the whole game goes, not the half before it.
    expect(decodeBlocksParty(JSON.stringify({ ...kept, moves: [...kept.moves, ["one", [indexOf(BLOCKS_PARTY_SIZE, p(5, 5))]]] }))).toBeNull();
    expect(decodeBlocksParty(JSON.stringify({ ...kept, moves: [["nine", [0]]] }))).toBeNull();
  });

  it("starts again with the same four in the same corners", () => {
    const game = lay(startBlocksParty(["Aiko", "Ben", "Chloe", "Dev"]), "one", [p(0, 0)]);
    const again = againBlocksParty(game);
    expect(again.moves).toHaveLength(0);
    expect(again.players).toEqual(game.players);
  });
});
