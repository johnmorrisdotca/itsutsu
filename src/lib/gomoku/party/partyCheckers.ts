// Relative: the engine boundary (`boundary.coverage.test.ts`) allows no alias under src/lib/gomoku.
import { BLOCKED, RULE_VARIANTS } from "../gomoku.constants";
import type { Cell, Point } from "../gomoku.types";
import { indexOf, pointOf } from "../rules/board";
import { STAR_RADIUS, STAR_TIPS, inStar, oppositeTip, starCampSize, starMoves, starSize, starTipCells, type StarTip } from "../rules/chineseCheckers";

import type { PartyCheckersState, PartyPlayerCount } from "./partyCheckers.types";
import { PARTY_STATUS, cleanPartyName, decodePartyRace, encodePartyRace, settlePartyMove } from "./partyRace";
import type { PartyRaceRules } from "./partyRace.types";

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
 * only what more players need: where each sits and who has won. Whose turn
 * follows whose, and how a game is kept, every table shares (`partyRace.ts`).
 */

/** The star the table is played on: the standard 121 holes. */
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

export function isPartyPlayerCount(value: unknown): value is PartyPlayerCount {
  return PARTY_PLAYER_COUNTS.includes(value as PartyPlayerCount);
}

/** A new game: each player's ten pieces in their own point, the first player to move. */
export function startPartyGame(count: PartyPlayerCount, names: readonly string[] = []): PartyCheckersState {
  const players = PARTY_SEATS[count].map((tip, index) => ({ tip, name: cleanPartyName(names[index] ?? "") }));
  const board: (number | null)[] = new Array(PARTY_SIZE * PARTY_SIZE).fill(null);
  players.forEach((player, index) => {
    for (const point of starTipCells(PARTY_RADIUS, player.tip)) board[indexOf(PARTY_SIZE, point)] = index;
  });
  return { players, board, toPlay: 0, moves: [], status: PARTY_STATUS.playing, winner: null };
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
 * left as it was. The first to fill the point opposite wins, and the turn
 * goes round the star as it goes round every table (`settlePartyMove`).
 */
export function partyMove(state: PartyCheckersState, from: Point, to: Point): PartyCheckersState | null {
  if (!partyDestinations(state, from).some((point) => point.row === to.row && point.col === to.col)) return null;
  return settlePartyMove(state, from, to, PARTY_SIZE, { hasWon: partyHasWon, canMove });
}

/** The game as text for this browser to keep: its seats by point of the star, as it was first written. */
export function encodePartyGame(state: PartyCheckersState): string {
  return encodePartyRace(state, PARTY_SIZE, "tip", (player) => state.players[player].tip);
}

/** A kept game played out again, or null for anything that is not one (`decodePartyRace`). */
export function decodePartyGame(text: string | null): PartyCheckersState | null {
  return decodePartyRace(text, {
    size: PARTY_SIZE,
    seatField: "tip",
    countOf: (players) => (isPartyPlayerCount(players) ? players : null),
    seats: (count) => PARTY_SEATS[count],
    start: startPartyGame,
    move: partyMove,
  });
}

/** The count a table of this game was set for: it is always one of the four, because only `startPartyGame` seats one. */
function countOf(state: PartyCheckersState): PartyPlayerCount {
  const count = state.players.length;
  if (!isPartyPlayerCount(count)) throw new Error(`A Chinese Checkers table of ${count} is not one this game seats.`);
  return count;
}

/** Chinese Checkers' rules as a pass-and-play page asks them. */
export const PARTY_CHECKERS_RULES: PartyRaceRules<PartyCheckersState, PartyPlayerCount> = {
  variant: RULE_VARIANTS.chineseCheckers,
  size: PARTY_SIZE,
  counts: PARTY_PLAYER_COUNTS,
  firstCount: 3,
  start: startPartyGame,
  again: (game) => startPartyGame(countOf(game), game.players.map((player) => player.name)),
  destinations: partyDestinations,
  move: partyMove,
  piecesHome: partyPiecesHome,
  piecesEach: () => starCampSize(PARTY_RADIUS),
  seatOf: (game, player) => game.players[player].tip,
  encode: encodePartyGame,
  decode: decodePartyGame,
};
