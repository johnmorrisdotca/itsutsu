// Relative: the engine boundary (`boundary.coverage.test.ts`) allows no alias under src/lib/gomoku.
import { BLOCKED } from "../gomoku.constants";
import type { Cell, Point } from "../gomoku.types";
import { indexOf, pointOf } from "../rules/board";
import { STAR_RADIUS, STAR_TIPS, inStar, oppositeTip, starMoves, starSize, starTipCells, type StarTip } from "../rules/chineseCheckers";

import type { PartyCheckersState, PartyMove, PartyPlayer, PartyPlayerCount, PartyStatus } from "./partyCheckers.types";

/**
 * CHINESE CHECKERS FOR TWO TO SIX, PASSED ROUND ONE DEVICE.
 *
 * John, 2026-09-28: "the Chinese checkers is a game for six people I believe
 * and we should also allow people to play that in a pass and play sort of
 * way." The rated game is for two and stays exactly as it is; this is the
 * same board and the same moves for a table of friends, kept in the browser
 * and never written anywhere.
 *
 * NOTHING ABOUT HOW A PIECE MOVES IS WRITTEN HERE. The star, its six points
 * and the step-or-chain-of-jumps are the two-player game's own functions in
 * `rules/chineseCheckers.ts`, asked of a board that says only which holes are
 * taken — a move there has never cared whose piece it jumps. What is new is
 * only what more players need: where each sits, whose turn follows whose, and
 * who has won.
 */

/** Where a game stands, compared through these rather than as strings. */
export const PARTY_STATUS = { playing: "playing", won: "won", stuck: "stuck" } as const satisfies Record<PartyStatus, PartyStatus>;

/** The star every party game is played on: the standard 121 holes. */
export const PARTY_RADIUS = STAR_RADIUS;
export const PARTY_SIZE = starSize(PARTY_RADIUS);

/** The counts the game is sold for. Five is not one of them: it leaves one point with nobody racing into it and one player with nobody to race against. */
export const PARTY_PLAYER_COUNTS: readonly PartyPlayerCount[] = [2, 3, 4, 6];

/**
 * WHERE EACH PLAYER SITS, in turn order, which goes round the star clockwise.
 *
 * The standard layouts: two face each other; three sit on every other point,
 * so each races into an empty one; four are two facing pairs, leaving the top
 * and bottom points empty so the four sit to either side of whoever holds the
 * phone; six fill the star.
 */
export const PARTY_SEATS: Record<PartyPlayerCount, readonly StarTip[]> = {
  2: ["top", "bottom"],
  3: ["top", "lowerRight", "lowerLeft"],
  4: ["upperRight", "lowerRight", "lowerLeft", "upperLeft"],
  6: STAR_TIPS,
};

/** The longest name a player may give, so a turn line still fits on a phone. */
export const PARTY_NAME_MOST = 20;

export function isPartyPlayerCount(value: unknown): value is PartyPlayerCount {
  return PARTY_PLAYER_COUNTS.includes(value as PartyPlayerCount);
}

/** A player's name as the table reads it: the one they gave, or "Player 3". */
export function partyPlayerName(players: readonly PartyPlayer[], player: number): string {
  const given = players[player]?.name.trim() ?? "";
  return given === "" ? `Player ${player + 1}` : given;
}

/** A new game: each player's ten pieces in their own point, the first player to move. */
export function startPartyGame(count: PartyPlayerCount, names: readonly string[] = []): PartyCheckersState {
  const players = PARTY_SEATS[count].map((tip, index) => ({ tip, name: cleanName(names[index] ?? "") }));
  const board: (number | null)[] = new Array(PARTY_SIZE * PARTY_SIZE).fill(null);
  players.forEach((player, index) => {
    for (const point of starTipCells(PARTY_RADIUS, player.tip)) board[indexOf(PARTY_SIZE, point)] = index;
  });
  return { players, board, toPlay: 0, moves: [], status: PARTY_STATUS.playing, winner: null };
}

function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, PARTY_NAME_MOST);
}

/**
 * The board as the two-player rules read it: the holes off the star sealed,
 * and every piece the same, because a step or a jump asks only whether a hole
 * is taken.
 */
function occupancy(board: readonly (number | null)[]): Cell[] {
  return board.map((owner, index) => {
    if (!inStar(PARTY_RADIUS, pointOf(PARTY_SIZE, index))) return BLOCKED;
    return owner === null ? null : "black";
  });
}

/** Where the piece at `from` may go this turn: nowhere unless it is the mover's own and the game is still on. */
export function partyDestinations(state: PartyCheckersState, from: Point): Point[] {
  if (state.status !== PARTY_STATUS.playing) return [];
  if (!onStar(from) || state.board[indexOf(PARTY_SIZE, from)] !== state.toPlay) return [];
  return starMoves(occupancy(state.board), PARTY_SIZE, from);
}

function onStar(point: Point): boolean {
  return point.row >= 0 && point.col >= 0 && point.row < PARTY_SIZE && point.col < PARTY_SIZE && inStar(PARTY_RADIUS, point);
}

/** Whether `player` has any move at all on this board. */
function canMove(board: readonly (number | null)[], player: number): boolean {
  const cells = occupancy(board);
  return board.some((owner, index) => owner === player && starMoves(cells, PARTY_SIZE, pointOf(PARTY_SIZE, index)).length > 0);
}

/**
 * Whether `player` has won: the point opposite their own is full, at least
 * one piece in it is theirs, and every other piece there belongs to the player
 * who started in it.
 *
 * THE TWO-PLAYER RULE, READ FOR MORE PLAYERS. `starFilled` says full and at
 * least one yours, because in a game for two the only other pieces that can
 * be in your far point are your opponent's, left at home — and a piece that
 * never leaves cannot be allowed to stop you winning. With more players that
 * reading would let a third player's piece, only passing through, count
 * towards somebody else's win; so the pieces that may fill the gaps are the
 * owner's, as they are for two, and nobody else's.
 */
export function partyHasWon(state: Pick<PartyCheckersState, "players" | "board">, player: number): boolean {
  const seat = state.players[player];
  if (seat === undefined) return false;
  const target = oppositeTip(seat.tip);
  const owner = state.players.findIndex((one) => one.tip === target);
  let own = 0;
  for (const point of starTipCells(PARTY_RADIUS, target)) {
    const standing = state.board[indexOf(PARTY_SIZE, point)];
    if (standing === null) return false;
    if (standing === player) own += 1;
    else if (standing !== owner) return false;
  }
  return own > 0;
}

/** How many of `player`'s pieces stand in the point they are racing to. */
export function partyPiecesHome(state: PartyCheckersState, player: number): number {
  const seat = state.players[player];
  if (seat === undefined) return 0;
  return starTipCells(PARTY_RADIUS, oppositeTip(seat.tip)).filter(
    (point) => state.board[indexOf(PARTY_SIZE, point)] === player,
  ).length;
}

/**
 * The game after the player to move takes the piece at `from` to `to`, or
 * null when that is not a move they may make. A new state; the old one is
 * left as it was.
 *
 * The first to fill the point opposite wins and the game ends there, as the
 * two-player game does. The turn then goes to the next player round the star
 * who has a move — a player boxed in with none is passed over rather than
 * left holding a turn nobody can take — and a board where nobody can move at
 * all is `stuck`, which no real game reaches.
 */
export function partyMove(state: PartyCheckersState, from: Point, to: Point): PartyCheckersState | null {
  if (!partyDestinations(state, from).some((point) => point.row === to.row && point.col === to.col)) return null;
  const board = state.board.slice();
  board[indexOf(PARTY_SIZE, from)] = null;
  board[indexOf(PARTY_SIZE, to)] = state.toPlay;
  const move: PartyMove = { player: state.toPlay, from, to };
  const moved = { ...state, board, moves: [...state.moves, move] };
  if (partyHasWon(moved, state.toPlay)) return { ...moved, status: PARTY_STATUS.won, winner: state.toPlay };
  for (let step = 1; step <= state.players.length; step += 1) {
    const next = (state.toPlay + step) % state.players.length;
    if (canMove(board, next)) return { ...moved, toPlay: next };
  }
  return { ...moved, status: PARTY_STATUS.stuck };
}

/**
 * THE GAME AS TEXT, for this browser to keep: who sat where, under what name,
 * and the moves — never the board, which the moves make again. Kept small and
 * versioned, so a later shape can refuse an older one rather than misread it.
 */
export function encodePartyGame(state: PartyCheckersState): string {
  return JSON.stringify({
    v: 1,
    players: state.players.map((player) => ({ tip: player.tip, name: player.name })),
    moves: state.moves.map((move) => [indexOf(PARTY_SIZE, move.from), indexOf(PARTY_SIZE, move.to)]),
  });
}

/**
 * A kept game, played out again move by move — or null for anything that is
 * not one: bad text, another version, a seating the game does not have, or a
 * move the rules refuse. Null rather than as much as could be read, because a
 * game resumed from half its moves is a different game wearing its name.
 */
export function decodePartyGame(text: string | null): PartyCheckersState | null {
  if (text === null) return null;
  let kept: unknown;
  try {
    kept = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof kept !== "object" || kept === null) return null;
  const { v, players, moves } = kept as { v?: unknown; players?: unknown; moves?: unknown };
  if (v !== 1 || !Array.isArray(players) || !Array.isArray(moves)) return null;
  if (!isPartyPlayerCount(players.length)) return null;
  const seats = PARTY_SEATS[players.length];
  const names: string[] = [];
  for (const [index, player] of players.entries()) {
    if (typeof player !== "object" || player === null) return null;
    const { tip, name } = player as { tip?: unknown; name?: unknown };
    if (tip !== seats[index] || typeof name !== "string") return null;
    names.push(name);
  }
  let state: PartyCheckersState | null = startPartyGame(players.length, names);
  for (const move of moves) {
    if (!Array.isArray(move) || move.length !== 2 || !move.every((one) => Number.isInteger(one))) return null;
    const [from, to] = move as [number, number];
    if (from < 0 || to < 0 || from >= PARTY_SIZE * PARTY_SIZE || to >= PARTY_SIZE * PARTY_SIZE) return null;
    state = partyMove(state, pointOf(PARTY_SIZE, from), pointOf(PARTY_SIZE, to));
    if (state === null) return null;
  }
  return state;
}
