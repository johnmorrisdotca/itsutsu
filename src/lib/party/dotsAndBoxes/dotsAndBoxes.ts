// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { PARTY_SPECS } from "../party.constants";
import { PARTY_NAME_MOST, cleanPartyName, partyPlayerName } from "../partyNames";
import type { PartyRules } from "../party.types";

import type { DotsGame, DotsLineEnds, DotsSeat, DotsStatus } from "./dotsAndBoxes.types";

/**
 * DOTS AND BOXES: the rules, and nothing else.
 *
 * Pure, as the engine is: every function returns a new game and leaves the
 * one it was given untouched, and nothing here draws, keeps or asks anything.
 * A game is its table (`size`, `players`, `first`) and its lines, in order;
 * the boxes, the scores, whose turn it is and who won are always read again
 * from those (`replayDots`), so a game read back out of a browser's storage
 * is exactly the game its lines make, or no game at all.
 *
 * How lines and boxes are numbered is in `dotsAndBoxes.types.ts`.
 */

export const DOTS_STATUS = { playing: "playing", finished: "finished" } as const satisfies Record<DotsStatus, DotsStatus>;

const SPEC = PARTY_SPECS.dotsAndBoxes;

/** The longest name a seat keeps, as at every party table (`partyNames.ts`). */
export const DOTS_NAME_MOST = PARTY_NAME_MOST;

/** A name as the table typed it, tidied (`cleanPartyName`). */
export const cleanDotsName = cleanPartyName;

/** A seat's name as the table reads it: the one given, or "Player 3". */
export function dotsPlayerName(game: Pick<DotsGame, "players">, seat: DotsSeat): string {
  return partyPlayerName(game, seat);
}

/** How many lines across there are on a board of `size` boxes a side; the lines down are numbered after them. */
function acrossCount(size: number): number {
  return (size + 1) * size;
}

/** Every line on the board: across and down. Twenty-four on 3×3, eighty-four on 6×6. */
export function dotsLineCount(size: number): number {
  return 2 * size * (size + 1);
}

/** Every box on the board. */
export function dotsBoxCount(size: number): number {
  return size * size;
}

/** Where a line runs, dot to dot, or null for a number that is no line on this board. */
export function dotsLineEnds(size: number, line: number): DotsLineEnds | null {
  if (!Number.isInteger(line) || line < 0 || line >= dotsLineCount(size)) return null;
  const across = acrossCount(size);
  if (line < across) {
    const row = Math.floor(line / size);
    const col = line % size;
    return { from: { row, col }, to: { row, col: col + 1 }, across: true };
  }
  const down = line - across;
  const row = Math.floor(down / (size + 1));
  const col = down % (size + 1);
  return { from: { row, col }, to: { row: row + 1, col }, across: false };
}

/** A box's four sides: the line across above it, below it, the line down on its left and on its right. */
export function dotsBoxSides(size: number, box: number): readonly [number, number, number, number] {
  const row = Math.floor(box / size);
  const col = box % size;
  const across = acrossCount(size);
  return [row * size + col, (row + 1) * size + col, across + row * (size + 1) + col, across + row * (size + 1) + col + 1];
}

/** The boxes a line is a side of: two inside the board, one along its edge. */
export function dotsBoxesBeside(size: number, line: number): number[] {
  const ends = dotsLineEnds(size, line);
  if (ends === null) return [];
  const { row, col } = ends.from;
  const boxes: number[] = [];
  if (ends.across) {
    if (row > 0) boxes.push((row - 1) * size + col);
    if (row < size) boxes.push(row * size + col);
  } else {
    if (col > 0) boxes.push(row * size + col - 1);
    if (col < size) boxes.push(row * size + col);
  }
  return boxes;
}

/** Whether a table of this size and this many players is one the game is offered for. */
export function isDotsTable(size: number, count: number): boolean {
  return SPEC.sizes.includes(size) && Number.isInteger(count) && count >= SPEC.fewestPlayers && count <= SPEC.mostPlayers;
}

/**
 * A new game: every dot, no line, the seat `first` to draw. Null for a table
 * the game is not offered for — a size not in `PARTY_SPECS`, or too few or
 * too many players — rather than a game nobody chose.
 */
export function startDots(size: number, players: readonly string[], first: DotsSeat = 0): DotsGame | null {
  if (!isDotsTable(size, players.length) || !Number.isInteger(first) || first < 0 || first >= players.length) return null;
  return {
    size,
    players: players.map(cleanDotsName),
    first,
    lines: [],
    drawnBy: new Array<DotsSeat | null>(dotsLineCount(size)).fill(null),
    owners: new Array<DotsSeat | null>(dotsBoxCount(size)).fill(null),
    scores: new Array<number>(players.length).fill(0),
    toPlay: first,
    lastClosed: [],
    status: DOTS_STATUS.playing,
    winners: [],
  };
}

/** Whether the player to move may draw this line: the game is on, the line is on the board, and nobody has drawn it. */
export function canDraw(game: DotsGame, line: number): boolean {
  return game.status === DOTS_STATUS.playing && dotsLineEnds(game.size, line) !== null && game.drawnBy[line] === null;
}

/** Every seat level on the most boxes. */
function leaders(scores: readonly number[]): DotsSeat[] {
  const most = Math.max(...scores);
  return scores.flatMap((score, seat) => (score === most ? [seat] : []));
}

/**
 * The game after the player to move draws `line`, or null when they may not.
 *
 * A line that is the fourth side of a box closes it for the mover — one line
 * can close two — and the mover draws again; a line that closes nothing
 * passes the turn to the next seat round the table. When the last line is
 * drawn the game is over, and whoever holds the most boxes wins, shared
 * between everybody level on the most.
 */
export function drawLine(game: DotsGame, line: number): DotsGame | null {
  if (!canDraw(game, line)) return null;
  const mover = game.toPlay;
  const drawnBy = [...game.drawnBy];
  drawnBy[line] = mover;
  const owners = [...game.owners];
  const scores = [...game.scores];
  const closed = dotsBoxesBeside(game.size, line).filter(
    (box) => owners[box] === null && dotsBoxSides(game.size, box).every((side) => drawnBy[side] !== null),
  );
  for (const box of closed) owners[box] = mover;
  scores[mover] += closed.length;
  const lines = [...game.lines, line];
  const finished = lines.length === dotsLineCount(game.size);
  return {
    ...game,
    lines,
    drawnBy,
    owners,
    scores,
    // The extra turn: a box closed, and the same player draws again. On the last line there is no next turn to give.
    toPlay: finished || closed.length > 0 ? mover : (mover + 1) % game.players.length,
    lastClosed: closed,
    status: finished ? DOTS_STATUS.finished : DOTS_STATUS.playing,
    winners: finished ? leaders(scores) : [],
  };
}

/** A game made again from its table and its lines, or null if any line could not have been drawn when it was. */
export function replayDots(size: number, players: readonly string[], first: DotsSeat, lines: readonly number[]): DotsGame | null {
  let game = startDots(size, players, first);
  for (const line of lines) {
    if (game === null) return null;
    game = drawLine(game, line);
  }
  return game;
}

/** The same table again, from nothing, the next seat round drawing first so that nobody always opens. */
export function dotsAgain(game: DotsGame): DotsGame {
  // The table was already one the game is offered for, so a start from it cannot be refused.
  return startDots(game.size, game.players, (game.first + 1) % game.players.length)!;
}

/** Whether the line drawn last closed a box, so the same player draws again. */
export function drawsAgain(game: DotsGame): boolean {
  return game.status === DOTS_STATUS.playing && game.lastClosed.length > 0;
}

/** The version of what `encodeDots` writes, so a later shape can refuse an older one rather than misread it. */
const KEPT_VERSION = 1;

/** A game as text to keep: its table and its lines, never the board, which the lines make again. */
export function encodeDots(game: DotsGame): string {
  return JSON.stringify({ v: KEPT_VERSION, size: game.size, players: game.players, first: game.first, lines: game.lines });
}

/**
 * A kept game read back, or null for nothing kept, or for text that is not a
 * game these rules can play out again: a browser's storage is somebody's to
 * edit, and a half-understood game is worse than none.
 */
export function decodeDots(text: string | null): DotsGame | null {
  if (text === null) return null;
  let kept: unknown;
  try {
    kept = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof kept !== "object" || kept === null) return null;
  const { v, size, players, first, lines } = kept as Record<string, unknown>;
  if (v !== KEPT_VERSION || typeof size !== "number" || typeof first !== "number") return null;
  if (!Array.isArray(players) || !players.every((name) => typeof name === "string")) return null;
  if (!Array.isArray(lines) || !lines.every((line) => typeof line === "number")) return null;
  return replayDots(size, players as string[], first, lines as number[]);
}

/** Dots and Boxes as every party game's rules are asked (`PartyRules`): a move is a line. */
export const DOTS_RULES: PartyRules<DotsGame, number> = {
  start: (size, players) => startDots(size, players),
  moves: (game) => (game.status === DOTS_STATUS.playing ? game.drawnBy.flatMap((by, line) => (by === null ? [line] : [])) : []),
  play: drawLine,
  over: (game) => game.status === DOTS_STATUS.finished,
  winners: (game) => game.winners,
  encode: encodeDots,
  decode: decodeDots,
};
