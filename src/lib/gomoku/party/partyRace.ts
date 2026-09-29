// Relative: the engine boundary (`boundary.coverage.test.ts`) allows no alias under src/lib/gomoku.
import type { Point } from "../gomoku.types";
import { indexOf, pointOf } from "../rules/board";

import type { PartyRaceState, PartyStatus } from "./partyRace.types";

/**
 * WHAT EVERY RACE TABLE ON ONE DEVICE SHARES, whichever race is on it.
 *
 * Chinese Checkers came first (John, 2026-09-28), and Halma for four followed
 * it the same day. Their boards differ and so do their seats, but a table of
 * friends racing for the far camp round one device is the same thing in both:
 * players named or numbered, a turn that goes round and passes over anybody
 * boxed in, a first to fill their far camp, and a game written down as its
 * seating and its moves so this browser can keep it. (Pair Go is a table too,
 * but not a race: its game is the engine's own, `pairGo.ts`.) That is here, once; each game's module
 * says only where its players sit and how its pieces move.
 */

/** Where a game stands, compared through these rather than as strings. */
export const PARTY_STATUS = { playing: "playing", won: "won", stuck: "stuck" } as const satisfies Record<PartyStatus, PartyStatus>;

/** The longest name a player may give, so a turn line still fits on a phone. */
export const PARTY_NAME_MOST = 20;

export function cleanPartyName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, PARTY_NAME_MOST);
}

/** A player's name as the table reads it: the one they gave, or "Player 3". */
export function partyPlayerName(players: readonly { name: string }[], player: number): string {
  const given = players[player]?.name.trim() ?? "";
  return given === "" ? `Player ${player + 1}` : given;
}

/**
 * The game after the player to move takes the piece at `from` to `to` — a
 * move the caller has already found legal. A new state; the old one is left
 * as it was.
 *
 * The first to fill their far camp wins and the game ends there, as the
 * two-player games do. The turn then goes to the next player round the table
 * who has a move — a player boxed in with none is passed over rather than
 * left holding a turn nobody can take — and a board where nobody can move at
 * all is `stuck`, which no real game reaches.
 */
export function settlePartyMove<S extends PartyRaceState>(
  game: S,
  from: Point,
  to: Point,
  size: number,
  rules: { hasWon: (game: S, player: number) => boolean; canMove: (board: readonly (number | null)[], player: number) => boolean },
): S {
  const board = game.board.slice();
  board[indexOf(size, from)] = null;
  board[indexOf(size, to)] = game.toPlay;
  const moved: S = { ...game, board, moves: [...game.moves, { player: game.toPlay, from, to }] };
  if (rules.hasWon(moved, game.toPlay)) return { ...moved, status: PARTY_STATUS.won, winner: game.toPlay };
  for (let step = 1; step <= game.players.length; step += 1) {
    const next = (game.toPlay + step) % game.players.length;
    if (rules.canMove(board, next)) return { ...moved, toPlay: next };
  }
  return { ...moved, status: PARTY_STATUS.stuck };
}

/**
 * THE GAME AS TEXT, for this browser to keep: who sat where, under what name,
 * and the moves — never the board, which the moves make again. Kept small and
 * versioned, so a later shape can refuse an older one rather than misread it.
 *
 * `seatField` is what the game calls a seat in the text (`tip` for a point of
 * the star, `corner` for Halma's), so a kept Chinese Checkers game reads the
 * same as it did before Halma joined it.
 */
export function encodePartyRace<S extends PartyRaceState>(game: S, size: number, seatField: string, seatOf: (player: number) => string): string {
  return JSON.stringify({
    v: 1,
    players: game.players.map((player, index) => ({ [seatField]: seatOf(index), name: player.name })),
    moves: game.moves.map((move) => [indexOf(size, move.from), indexOf(size, move.to)]),
  });
}

/**
 * A kept game, played out again move by move — or null for anything that is
 * not one: bad text, another version, a count of players the game is not
 * played by, a seating it does not have, or a move the rules refuse. Null
 * rather than as much as could be read, because a game resumed from half its
 * moves is a different game wearing its name.
 */
export function decodePartyRace<S extends PartyRaceState, C extends number>(
  text: string | null,
  table: {
    size: number;
    seatField: string;
    /** The count this many players is, or null for a count the game is not played by. */
    countOf: (players: number) => C | null;
    seats: (count: C) => readonly string[];
    start: (count: C, names: readonly string[]) => S;
    move: (game: S, from: Point, to: Point) => S | null;
  },
): S | null {
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
  const count = table.countOf(players.length);
  if (count === null) return null;
  const seats = table.seats(count);
  const names: string[] = [];
  for (const [index, player] of players.entries()) {
    if (typeof player !== "object" || player === null) return null;
    const { name } = player as { name?: unknown };
    if ((player as Record<string, unknown>)[table.seatField] !== seats[index] || typeof name !== "string") return null;
    names.push(name);
  }
  const cells = table.size * table.size;
  let game: S | null = table.start(count, names);
  for (const move of moves) {
    if (!Array.isArray(move) || move.length !== 2 || !move.every((one) => Number.isInteger(one))) return null;
    const [from, to] = move as [number, number];
    if (from < 0 || to < 0 || from >= cells || to >= cells) return null;
    game = table.move(game, pointOf(table.size, from), pointOf(table.size, to));
    if (game === null) return null;
  }
  return game;
}
