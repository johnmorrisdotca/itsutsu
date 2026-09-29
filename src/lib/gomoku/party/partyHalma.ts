// Relative: the engine boundary (`boundary.coverage.test.ts`) allows no alias under src/lib/gomoku.
import { RULE_VARIANTS } from "../gomoku.constants";
import type { Cell, Point } from "../gomoku.types";
import { indexOf, pointOf } from "../rules/board";
import { CAMP_ROWS, campMoves } from "../rules/camps";

import type { HalmaCorner, PartyHalmaCount, PartyHalmaState } from "./partyHalma.types";
import { PARTY_STATUS, cleanPartyName, decodePartyRace, encodePartyRace, settlePartyMove } from "./partyRace";
import type { PartyRaceRules } from "./partyRace.types";

/**
 * HALMA FOR FOUR, PASSED ROUND ONE DEVICE — and for two, the same way.
 *
 * Halma was made in 1883 for two or four players. The rated game here is the
 * two-player one and stays exactly as it is; this is the four-player game for
 * a table of friends on one phone or tablet, kept in the browser and never
 * written anywhere, beside Chinese Checkers' table in the Party games shelf.
 *
 * NOTHING ABOUT HOW A PIECE MOVES IS WRITTEN HERE. A step to any of the eight
 * neighbouring squares, or a chain of jumps over any single piece into the
 * empty square beyond, is the two-player game's own `campMoves`, asked of a
 * board that says only which squares are taken — it has never cared whose
 * piece it jumps. What is new is where four players sit, and the camp four
 * players start with.
 *
 * THE BOARD IS HALMA'S OWN SIXTEEN, and the camps are the ones the game was
 * published with for each count: nineteen pieces a side for two, in the two
 * opposite corners — the rated game's own camp, `CAMP_ROWS[16]` — and
 * thirteen a side for four, one in each corner. The thirteen-piece camp is
 * rows of 4, 4, 3 and 2, which is the camp this site already lays out on
 * Halma's ten-board (`CAMP_ROWS[10]`), so no new shape is invented for it.
 * Three is not offered: Halma was sold for two or four, and three would leave
 * one player racing into an empty corner the others race into full ones.
 */

/** Halma's own board: the sixteen the rated game opens on. */
export const HALMA_PARTY_SIZE = 16;

/** The counts Halma is played by. */
export const HALMA_PARTY_COUNTS: readonly PartyHalmaCount[] = [2, 4];

/** The four corners in turn order, which goes round the board clockwise from the top left. */
export const HALMA_CORNERS: readonly HalmaCorner[] = ["topLeft", "topRight", "bottomRight", "bottomLeft"];

/**
 * WHERE EACH PLAYER SITS, in turn order. Two sit in opposite corners, as the
 * rated game does — the first at the top left, where its first player
 * starts — and four take a corner each, round the board.
 */
export const HALMA_PARTY_SEATS: Record<PartyHalmaCount, readonly HalmaCorner[]> = {
  2: ["topLeft", "bottomRight"],
  4: HALMA_CORNERS,
};

/** Each camp's rows, counted from its corner: how many squares of each row it holds. */
export const HALMA_PARTY_CAMP_ROWS: Record<PartyHalmaCount, readonly number[]> = {
  2: CAMP_ROWS[16],
  4: CAMP_ROWS[10],
};

const OPPOSITE: Record<HalmaCorner, HalmaCorner> = {
  topLeft: "bottomRight",
  topRight: "bottomLeft",
  bottomRight: "topLeft",
  bottomLeft: "topRight",
};

/** The corner diagonally across the board: where a player starting in `corner` is racing to. */
export function oppositeCorner(corner: HalmaCorner): HalmaCorner {
  return OPPOSITE[corner];
}

export function isHalmaPartyCount(value: unknown): value is PartyHalmaCount {
  return HALMA_PARTY_COUNTS.includes(value as PartyHalmaCount);
}

/**
 * The squares of a corner's camp in a game for `count`. Each is the top-left
 * camp turned into its corner, and every camp shape here is its own mirror
 * along the diagonal, so turning and reflecting it come to the same squares.
 */
export function halmaCampSquares(count: PartyHalmaCount, corner: HalmaCorner): Point[] {
  const last = HALMA_PARTY_SIZE - 1;
  const bottom = corner === "bottomLeft" || corner === "bottomRight";
  const right = corner === "topRight" || corner === "bottomRight";
  const points: Point[] = [];
  HALMA_PARTY_CAMP_ROWS[count].forEach((width, row) => {
    for (let col = 0; col < width; col += 1) points.push({ row: bottom ? last - row : row, col: right ? last - col : col });
  });
  return points;
}

/** A new game: each player's pieces filling their own corner, the first player to move. */
export function startHalmaParty(count: PartyHalmaCount, names: readonly string[] = []): PartyHalmaState {
  const players = HALMA_PARTY_SEATS[count].map((corner, index) => ({ corner, name: cleanPartyName(names[index] ?? "") }));
  const board: (number | null)[] = new Array(HALMA_PARTY_SIZE * HALMA_PARTY_SIZE).fill(null);
  players.forEach((player, index) => {
    for (const point of halmaCampSquares(count, player.corner)) board[indexOf(HALMA_PARTY_SIZE, point)] = index;
  });
  return { players, board, toPlay: 0, moves: [], status: PARTY_STATUS.playing, winner: null };
}

/** The count a table was set for: always one of the two, because only `startHalmaParty` seats one. */
function countOf(game: PartyHalmaState): PartyHalmaCount {
  const count = game.players.length;
  if (!isHalmaPartyCount(count)) throw new Error(`A Halma table of ${count} is not one this game seats.`);
  return count;
}

/** The board as the two-player rules read it: every piece the same, because a step or a jump asks only whether a square is taken. */
function occupancy(board: readonly (number | null)[]): Cell[] {
  return board.map((owner) => (owner === null ? null : "black"));
}

function onBoard(point: Point): boolean {
  return point.row >= 0 && point.col >= 0 && point.row < HALMA_PARTY_SIZE && point.col < HALMA_PARTY_SIZE;
}

/** Where the piece at `from` may go this turn: nowhere unless it is the mover's own and the game is still on. */
export function halmaPartyDestinations(game: PartyHalmaState, from: Point): Point[] {
  if (game.status !== PARTY_STATUS.playing) return [];
  if (!onBoard(from) || game.board[indexOf(HALMA_PARTY_SIZE, from)] !== game.toPlay) return [];
  return campMoves(occupancy(game.board), HALMA_PARTY_SIZE, from);
}

/** Whether `player` has any move at all on this board. */
function canMove(board: readonly (number | null)[], player: number): boolean {
  const cells = occupancy(board);
  return board.some((owner, index) => owner === player && campMoves(cells, HALMA_PARTY_SIZE, pointOf(HALMA_PARTY_SIZE, index)).length > 0);
}

/**
 * Whether `player` has won: the corner opposite their own is full, at least
 * one piece in it is theirs, and every other piece there belongs to the
 * player who started in it.
 *
 * THE TWO-PLAYER RULE, READ FOR FOUR, as Chinese Checkers' table reads it.
 * `campFilled` says full and at least one yours, because in a game for two
 * the only other pieces that can be in your far camp are your opponent's,
 * left at home to block — and a piece that never leaves cannot be allowed to
 * stop you winning. With four, a third player's piece only passing through
 * the corner must not count towards somebody else's win.
 */
export function halmaPartyHasWon(game: Pick<PartyHalmaState, "players" | "board">, player: number): boolean {
  const seat = game.players[player];
  if (seat === undefined) return false;
  const count = game.players.length;
  if (!isHalmaPartyCount(count)) return false;
  const target = oppositeCorner(seat.corner);
  const owner = game.players.findIndex((one) => one.corner === target);
  let own = 0;
  for (const point of halmaCampSquares(count, target)) {
    const standing = game.board[indexOf(HALMA_PARTY_SIZE, point)];
    if (standing === null) return false;
    if (standing === player) own += 1;
    else if (standing !== owner) return false;
  }
  return own > 0;
}

/** How many of `player`'s pieces stand in the corner they are racing to. */
export function halmaPartyPiecesHome(game: PartyHalmaState, player: number): number {
  const seat = game.players[player];
  if (seat === undefined) return 0;
  return halmaCampSquares(countOf(game), oppositeCorner(seat.corner)).filter(
    (point) => game.board[indexOf(HALMA_PARTY_SIZE, point)] === player,
  ).length;
}

/**
 * The game after the player to move takes the piece at `from` to `to`, or
 * null when that is not a move they may make. A new state; the old one is
 * left as it was. The first to fill the corner opposite wins, and the turn
 * goes round the board as it goes round every table (`settlePartyMove`).
 */
export function halmaPartyMove(game: PartyHalmaState, from: Point, to: Point): PartyHalmaState | null {
  if (!halmaPartyDestinations(game, from).some((point) => point.row === to.row && point.col === to.col)) return null;
  return settlePartyMove(game, from, to, HALMA_PARTY_SIZE, { hasWon: halmaPartyHasWon, canMove });
}

/** The game as text for this browser to keep, its seats named by corner. */
export function encodeHalmaParty(game: PartyHalmaState): string {
  return encodePartyRace(game, HALMA_PARTY_SIZE, "corner", (player) => game.players[player].corner);
}

/** A kept game played out again, or null for anything that is not one (`decodePartyRace`). */
export function decodeHalmaParty(text: string | null): PartyHalmaState | null {
  return decodePartyRace(text, {
    size: HALMA_PARTY_SIZE,
    seatField: "corner",
    countOf: (players) => (isHalmaPartyCount(players) ? players : null),
    seats: (count) => HALMA_PARTY_SEATS[count],
    start: startHalmaParty,
    move: halmaPartyMove,
  });
}

/** Halma's rules as a pass-and-play page asks them. Four is the game this table is for, so the set-up opens on it. */
export const PARTY_HALMA_RULES: PartyRaceRules<PartyHalmaState, PartyHalmaCount> = {
  variant: RULE_VARIANTS.halma,
  size: HALMA_PARTY_SIZE,
  counts: HALMA_PARTY_COUNTS,
  firstCount: 4,
  start: startHalmaParty,
  again: (game) => startHalmaParty(countOf(game), game.players.map((player) => player.name)),
  destinations: halmaPartyDestinations,
  move: halmaPartyMove,
  piecesHome: halmaPartyPiecesHome,
  piecesEach: (game) => halmaCampSquares(countOf(game), game.players[0].corner).length,
  seatOf: (game, player) => game.players[player].corner,
  encode: encodeHalmaParty,
  decode: decodeHalmaParty,
};
