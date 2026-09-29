// Relative: the engine boundary (`boundary.coverage.test.ts`) allows no alias under src/lib/gomoku.
import { RULE_VARIANTS, STONES } from "../gomoku.constants";
import type { Piece, Point } from "../gomoku.types";
import { indexOf, pointOf } from "../rules/board";
import { orientCells, orientations } from "../rules/queue";

import { BLOCKS_PARTY_PLAYERS, BLOCKS_PARTY_SIZE, BLOCKS_PIECES, BLOCKS_PIECE_KEYS, BLOCKS_REFUSALS } from "./partyBlocks.constants";
import type {
  BlocksCorner,
  BlocksHold,
  BlocksPieceKey,
  BlocksPreview,
  BlocksRefusal,
  BlocksScore,
  PartyBlocksState,
  PartyBlocksStatus,
} from "./partyBlocks.types";
import { HALMA_CORNERS } from "./partyHalma";
import { cleanPartyName } from "./partyRace";

/**
 * BLOCK FIVE FOR FOUR, PASSED ROUND ONE DEVICE.
 *
 * Block Five for two is a line game: the players share one queue of
 * four-square shapes, each coloured two and two, and five in a row wins. This
 * is the other thing a set of shapes and a square board make — the party game
 * for four, a territory race. Each player holds their own twenty-one shapes
 * of one to five squares, in their own colour, and starts from their own
 * corner of a twenty-square board:
 *
 * - A player's first piece must cover their own corner square.
 * - Every piece after that must touch at least one of the player's own pieces
 *   corner to corner, and may never touch one of their own along a side.
 *   Touching another player's pieces, either way, is allowed.
 * - A player with no piece that fits anywhere passes for the rest of the game.
 *   When nobody can lay a piece, the game is over.
 * - The score is the squares each player's pieces cover; the most wins, and
 *   players level at the top share it.
 *
 * The two-player game has no rule for any of this — its pieces go anywhere
 * they fit, and nothing is counted but a line of five — so these are the
 * rules the four-player game has always had. What is the two-player game's is
 * how a piece is turned and mirrored: `orientCells` and `orientations` from
 * its own queue, asked of a shape in one colour, so R and F turn a piece here
 * exactly as they turn one there.
 */

/** The game whose page offers this table. */
export const BLOCKS_PARTY_VARIANT = RULE_VARIANTS.blockFive;

/** The four corners in turn order: clockwise round the board from the top left, as Halma's table seats four. */
export const BLOCKS_CORNERS: readonly BlocksCorner[] = HALMA_CORNERS;

/** Where a game stands, compared through these rather than as strings. */
export const BLOCKS_STATUS = { playing: "playing", over: "over" } as const satisfies Record<PartyBlocksStatus, PartyBlocksStatus>;

/** A shape as the two-player queue's turning reads it: every square one colour, which it carries round unused. */
function asPiece(key: BlocksPieceKey): Piece {
  return { cells: BLOCKS_PIECES[key].map((cell) => ({ ...cell, stone: STONES.black })) };
}

/** Every distinct way each shape can lie, turned and mirrored, worked out once. */
const LIES = {} as Record<BlocksPieceKey, readonly (readonly Point[])[]>;
for (const key of BLOCKS_PIECE_KEYS) LIES[key] = orientations(asPiece(key)).map((cells) => cells.map(({ row, col }) => ({ row, col })));

/** How many squares a shape covers. */
export function blocksPieceSize(key: BlocksPieceKey): number {
  return BLOCKS_PIECES[key].length;
}

/** Every distinct way a shape can lie on the board. */
export function blocksLies(key: BlocksPieceKey): readonly (readonly Point[])[] {
  return LIES[key];
}

/** The squares of a held piece, turned and mirrored as it is held, from the top left of the box round it. */
export function heldCells(hold: BlocksHold): Point[] {
  return orientCells(asPiece(hold.piece), hold.turns, hold.flipped).map(({ row, col }) => ({ row, col }));
}

/** The square a corner's first piece must cover. */
export function cornerSquare(corner: BlocksCorner): Point {
  const last = BLOCKS_PARTY_SIZE - 1;
  return {
    row: corner === "bottomLeft" || corner === "bottomRight" ? last : 0,
    col: corner === "topRight" || corner === "bottomRight" ? last : 0,
  };
}

/** A new game: four players, a corner each, nothing on the board, the top left to lay first. */
export function startBlocksParty(names: readonly string[] = []): PartyBlocksState {
  return {
    players: BLOCKS_CORNERS.map((corner, index) => ({ corner, name: cleanPartyName(names[index] ?? "") })),
    board: new Array(BLOCKS_PARTY_SIZE * BLOCKS_PARTY_SIZE).fill(null),
    toPlay: 0,
    moves: [],
    out: new Array(BLOCKS_PARTY_PLAYERS).fill(false),
    status: BLOCKS_STATUS.playing,
  };
}

/** The same four in the same corners, a clear board: "play again". */
export function againBlocksParty(game: PartyBlocksState): PartyBlocksState {
  return startBlocksParty(game.players.map((player) => player.name));
}

/** The shapes `player` has not laid yet, in the tray's order. */
export function blocksPiecesLeft(game: Pick<PartyBlocksState, "moves">, player: number): BlocksPieceKey[] {
  const laid = new Set(game.moves.filter((move) => move.player === player).map((move) => move.piece));
  return BLOCKS_PIECE_KEYS.filter((key) => !laid.has(key));
}

function onBoard(point: Point): boolean {
  return point.row >= 0 && point.col >= 0 && point.row < BLOCKS_PARTY_SIZE && point.col < BLOCKS_PARTY_SIZE;
}

const SIDES: readonly Point[] = [{ row: -1, col: 0 }, { row: 1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 1 }];
const CORNERS: readonly Point[] = [{ row: -1, col: -1 }, { row: -1, col: 1 }, { row: 1, col: -1 }, { row: 1, col: 1 }];

/** Whether any square a step in `steps` from `point` holds a piece of `player`'s. */
function touches(board: readonly (number | null)[], point: Point, player: number, steps: readonly Point[]): boolean {
  return steps.some((step) => {
    const next = { row: point.row + step.row, col: point.col + step.col };
    return onBoard(next) && board[indexOf(BLOCKS_PARTY_SIZE, next)] === player;
  });
}

/** Whether `player` has laid anything yet. */
function hasLaid(game: Pick<PartyBlocksState, "moves">, player: number): boolean {
  return game.moves.some((move) => move.player === player);
}

/**
 * Why the player to move may not lay `piece` over `cells`, or null when they
 * may. The rules of the whole game are here and nowhere else: the board and
 * the tray only ask.
 */
export function blocksRefusal(game: PartyBlocksState, piece: BlocksPieceKey, cells: readonly Point[]): BlocksRefusal | null {
  if (game.status !== BLOCKS_STATUS.playing) return BLOCKS_REFUSALS.over;
  const player = game.toPlay;
  if (!blocksPiecesLeft(game, player).includes(piece)) return BLOCKS_REFUSALS.used;
  if (!cells.every(onBoard)) return BLOCKS_REFUSALS.offBoard;
  if (cells.some((cell) => game.board[indexOf(BLOCKS_PARTY_SIZE, cell)] !== null)) return BLOCKS_REFUSALS.taken;
  if (cells.some((cell) => touches(game.board, cell, player, SIDES))) return BLOCKS_REFUSALS.sideTouch;
  if (!hasLaid(game, player)) {
    const corner = cornerSquare(game.players[player].corner);
    return cells.some((cell) => cell.row === corner.row && cell.col === corner.col) ? null : BLOCKS_REFUSALS.firstCorner;
  }
  return cells.some((cell) => touches(game.board, cell, player, CORNERS)) ? null : BLOCKS_REFUSALS.noCorner;
}

/** Whether `cells` are one of the ways `piece` can lie. */
function isShapeOf(piece: BlocksPieceKey, cells: readonly Point[]): boolean {
  if (cells.length !== blocksPieceSize(piece)) return false;
  const top = Math.min(...cells.map((cell) => cell.row));
  const left = Math.min(...cells.map((cell) => cell.col));
  const laid = new Set(cells.map((cell) => `${cell.row - top},${cell.col - left}`));
  return blocksLies(piece).some((lie) => lie.every((cell) => laid.has(`${cell.row},${cell.col}`)));
}

/**
 * THE SQUARES A NEW PIECE OF `player`'s CAN GROW FROM: before their first,
 * their own corner; after it, every empty square touching one of theirs at a
 * corner and none of theirs along a side. Every lay the rules allow covers
 * one of these, which is what lets the search below look only here.
 */
export function blocksStartSquares(game: Pick<PartyBlocksState, "players" | "board" | "moves">, player: number): Point[] {
  if (!hasLaid(game, player)) {
    const corner = cornerSquare(game.players[player].corner);
    return game.board[indexOf(BLOCKS_PARTY_SIZE, corner)] === null ? [corner] : [];
  }
  const found: Point[] = [];
  game.board.forEach((owner, index) => {
    if (owner !== null) return;
    const point = pointOf(BLOCKS_PARTY_SIZE, index);
    if (touches(game.board, point, player, CORNERS) && !touches(game.board, point, player, SIDES)) found.push(point);
  });
  return found;
}

/** Whether `player`, holding what they hold, can lay any piece anywhere on this board. */
export function blocksCanLay(game: Pick<PartyBlocksState, "players" | "board" | "moves">, player: number): boolean {
  const pieces = blocksPiecesLeft(game, player);
  if (pieces.length === 0) return false;
  const fits = (cells: readonly Point[]) =>
    cells.every((cell) => onBoard(cell) && game.board[indexOf(BLOCKS_PARTY_SIZE, cell)] === null) &&
    !cells.some((cell) => touches(game.board, cell, player, SIDES));
  for (const start of blocksStartSquares(game, player)) {
    for (const piece of pieces) {
      for (const lie of blocksLies(piece)) {
        for (const pin of lie) {
          const cells = lie.map((cell) => ({ row: start.row - pin.row + cell.row, col: start.col - pin.col + cell.col }));
          if (fits(cells)) return true;
        }
      }
    }
  }
  return false;
}

/**
 * The game after the player to move lays `piece` over `cells`, or null when
 * they may not. A new state; the one given is left as it was.
 *
 * The turn then goes round the table to the next player who can still lay a
 * piece. One who cannot is out — they pass for the rest of the game, since a
 * board only fills and a tray only empties — and when nobody can, the game is
 * over and counted.
 */
export function layBlocks(game: PartyBlocksState, piece: BlocksPieceKey, cells: readonly Point[]): PartyBlocksState | null {
  if (!isShapeOf(piece, cells) || blocksRefusal(game, piece, cells) !== null) return null;
  const board = game.board.slice();
  for (const cell of cells) board[indexOf(BLOCKS_PARTY_SIZE, cell)] = game.toPlay;
  const laid = { ...game, board, moves: [...game.moves, { player: game.toPlay, piece, cells: cells.map(({ row, col }) => ({ row, col })) }] };
  const out = game.out.slice();
  for (let step = 1; step <= game.players.length; step += 1) {
    const next = (game.toPlay + step) % game.players.length;
    if (out[next]) continue;
    if (blocksCanLay(laid, next)) return { ...laid, out, toPlay: next };
    out[next] = true;
  }
  return { ...laid, out, status: BLOCKS_STATUS.over };
}

/**
 * WHERE THE HELD PIECE WOULD LIE with a square of it on `point`. Of the ways
 * of putting one of its squares there, the first the rules allow — so a tap
 * near a corner finds the fit rather than asking the player to find the one
 * square that works — and when none is allowed, the piece with its first
 * square on `point`, marked as refused.
 */
export function blocksPreviewAt(game: PartyBlocksState, hold: BlocksHold, point: Point): BlocksPreview {
  const lie = heldCells(hold);
  const at = (pin: Point) => lie.map((cell) => ({ row: point.row - pin.row + cell.row, col: point.col - pin.col + cell.col }));
  for (const pin of lie) {
    const cells = at(pin);
    if (blocksRefusal(game, hold.piece, cells) === null) return { cells, refusal: null };
  }
  const cells = at(lie[0]);
  return { cells: cells.filter(onBoard), refusal: blocksRefusal(game, hold.piece, cells) };
}

/** Each player's standing: squares covered and pieces still in hand, in seat order. */
export function blocksScores(game: PartyBlocksState): BlocksScore[] {
  return game.players.map((_, player) => ({
    player,
    squares: game.board.filter((owner) => owner === player).length,
    piecesLeft: blocksPiecesLeft(game, player).length,
  }));
}

/** Who has covered the most squares: one player, or all those level at the top. */
export function blocksLeaders(game: PartyBlocksState): number[] {
  const scores = blocksScores(game);
  const most = Math.max(...scores.map((score) => score.squares));
  return scores.filter((score) => score.squares === most).map((score) => score.player);
}

/** The kept form's own shape, read back only through `decodeBlocksParty`. */
type KeptBlocks = { v: 1; players: { corner: BlocksCorner; name: string }[]; moves: [BlocksPieceKey, number[]][] };

/**
 * THE GAME AS TEXT, for this browser to keep: who sat where, under what name,
 * and each piece laid with its squares — never the board, which the moves
 * make again, so a kept game is always one the rules could have produced.
 */
export function encodeBlocksParty(game: PartyBlocksState): string {
  const kept: KeptBlocks = {
    v: 1,
    players: game.players.map((player) => ({ corner: player.corner, name: player.name })),
    moves: game.moves.map((move) => [move.piece, move.cells.map((cell) => indexOf(BLOCKS_PARTY_SIZE, cell))]),
  };
  return JSON.stringify(kept);
}

/**
 * A kept game, played out again piece by piece — or null for anything that
 * is not one: bad text, another version, a seating this table does not have,
 * or a piece the rules refuse. Null rather than as much as could be read,
 * because a game resumed from half its moves is a different game wearing its
 * name.
 */
export function decodeBlocksParty(text: string | null): PartyBlocksState | null {
  if (text === null) return null;
  let kept: unknown;
  try {
    kept = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof kept !== "object" || kept === null) return null;
  const { v, players, moves } = kept as Partial<Record<keyof KeptBlocks, unknown>>;
  if (v !== 1 || !Array.isArray(players) || !Array.isArray(moves) || players.length !== BLOCKS_PARTY_PLAYERS) return null;
  const names: string[] = [];
  for (const [index, player] of players.entries()) {
    if (typeof player !== "object" || player === null) return null;
    const { corner, name } = player as { corner?: unknown; name?: unknown };
    if (corner !== BLOCKS_CORNERS[index] || typeof name !== "string") return null;
    names.push(name);
  }
  const cells = BLOCKS_PARTY_SIZE * BLOCKS_PARTY_SIZE;
  let game: PartyBlocksState | null = startBlocksParty(names);
  for (const move of moves) {
    if (!Array.isArray(move) || move.length !== 2) return null;
    const [piece, squares] = move as [unknown, unknown];
    if (typeof piece !== "string" || !(piece in BLOCKS_PIECES) || !Array.isArray(squares)) return null;
    if (!squares.every((square) => Number.isInteger(square) && square >= 0 && square < cells)) return null;
    game = layBlocks(game, piece as BlocksPieceKey, (squares as number[]).map((square) => pointOf(BLOCKS_PARTY_SIZE, square)));
    if (game === null) return null;
  }
  return game;
}
