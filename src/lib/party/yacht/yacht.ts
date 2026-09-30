// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { seededRandom } from "../../puzzles/random";
import { cleanPartyName } from "../partyNames";

import { YACHT_ALL_HELD, YACHT_BOXES, YACHT_DICE, YACHT_FEWEST_ALONE, YACHT_MOST_PLAYERS, YACHT_ROLLS, YACHT_SHEET } from "./yacht.constants";
import { boxScore, sheetTotal } from "./yachtScore";
import type { YachtGame, YachtMove, YachtPhase, YachtSeat } from "./yacht.types";

/**
 * YACHT, THE DICE GAME: the rules, and nothing else.
 *
 * Pure, as the engine is: every function returns a new game and leaves the
 * one it was given untouched. A game is its table (the seed and the seats)
 * and its moves; the dice and the sheets are read again from those
 * (`replayYacht`), so a game read back out of a browser's storage is exactly
 * the game its moves make, or none.
 *
 * THE DICE ARE REALLY RANDOM AND CANNOT BE THROWN AGAIN. A game's seed is
 * drawn fresh when it starts (`freshSeed`), and each roll from that seed and
 * how many rolls the game has thrown, so nobody at the table knows what is
 * coming — and a reload throws exactly what it threw, so nobody can reload
 * for a better roll either.
 *
 * The rules, the ones the family has always played:
 *
 *  - on your turn roll all five dice, then roll any of them again, up to
 *    three rolls in all, holding the rest where they lie;
 *  - then write the dice into one empty box of your sheet, for what they
 *    score there (`boxScore`), a zero if they do not make it;
 *  - thirteen turns each fill the sheet; the upper half earns 35 more once it
 *    reaches 63, and the highest total wins.
 */

export const YACHT_PHASES = { playing: "playing", finished: "finished" } as const satisfies Record<YachtPhase, YachtPhase>;

/** The dice before a turn's first roll: none showing. */
const UNTHROWN: readonly number[] = new Array<number>(YACHT_DICE).fill(0);

/** The roll after `thrown` rolls of this game, the same in every browser: the seed and the count decide it. */
function rollFor(seed: number, thrown: number): () => number {
  return seededRandom((seed ^ Math.imul(thrown + 1, 0x9e3779b1)) >>> 0);
}

/**
 * A new game: the names at the table (one a seat), the seed every roll is
 * drawn from, which seats a computer plays, and the sheet's size (thirteen,
 * the only one). One person alone is a game too — a sheet to beat — though
 * the party game's contract, a table of at least two, asks it of
 * `YACHT_RULES` alone (`yachtRules.ts`). Null for a table the game is not
 * offered for, rather than a game nobody chose.
 */
export function startYacht(
  players: readonly string[],
  seed = 1,
  computers: readonly boolean[] = players.map(() => false),
  size: number = YACHT_SHEET,
): YachtGame | null {
  if (size !== YACHT_SHEET) return null;
  if (players.length < YACHT_FEWEST_ALONE || players.length > YACHT_MOST_PLAYERS) return null;
  if (computers.length !== players.length) return null;
  if (!Number.isInteger(seed)) return null;
  return {
    size,
    seed,
    players: players.map(cleanPartyName),
    computers: [...computers],
    moves: [],
    thrown: 0,
    dice: UNTHROWN,
    held: 0,
    rolls: 0,
    sheets: players.map(() => new Array<number | null>(YACHT_SHEET).fill(null)),
    toPlay: 0,
    turn: 0,
    phase: YACHT_PHASES.playing,
    winners: [],
    last: null,
  };
}

/** Every move the player to move may make: the first roll; then another roll holding any dice but all five, or any empty box; none once the game is over. */
export function yachtMoves(game: YachtGame): YachtMove[] {
  if (game.phase === YACHT_PHASES.finished) return [];
  if (game.rolls === 0) return [{ kind: "roll", hold: 0 }];
  const scores: YachtMove[] = game.sheets[game.toPlay].flatMap((score, box) => (score === null ? [{ kind: "score" as const, box }] : []));
  if (game.rolls >= YACHT_ROLLS) return scores;
  const rolls: YachtMove[] = Array.from({ length: YACHT_ALL_HELD }, (_, hold) => ({ kind: "roll" as const, hold }));
  return [...rolls, ...scores];
}

/** Every seat with the highest total: more than one when it is shared. */
function leaders(sheets: YachtGame["sheets"]): YachtSeat[] {
  const totals = sheets.map(sheetTotal);
  const best = Math.max(...totals);
  return totals.flatMap((total, seat) => (total === best ? [seat] : []));
}

/** The game after this move, or null for a move that may not be made now; the game given is left untouched. */
export function playYacht(game: YachtGame, move: YachtMove): YachtGame | null {
  if (game.phase === YACHT_PHASES.finished) return null;
  const seat = game.toPlay;
  if (move.kind === "roll") {
    if (game.rolls >= YACHT_ROLLS) return null;
    if (!Number.isInteger(move.hold) || move.hold < 0 || move.hold >= YACHT_ALL_HELD) return null;
    if (game.rolls === 0 && move.hold !== 0) return null;
    const random = rollFor(game.seed, game.thrown);
    const dice = game.dice.map((die, at) => (move.hold & (1 << at) ? die : 1 + Math.floor(random() * 6)));
    return {
      ...game,
      moves: [...game.moves, move],
      thrown: game.thrown + 1,
      dice,
      held: move.hold,
      rolls: game.rolls + 1,
      last: { seat, move },
    };
  }
  if (game.rolls === 0) return null;
  if (!Number.isInteger(move.box) || move.box < 0 || move.box >= YACHT_SHEET) return null;
  if (game.sheets[seat][move.box] !== null) return null;
  const score = boxScore(YACHT_BOXES[move.box], game.dice);
  const sheets = game.sheets.map((sheet, at) => (at === seat ? sheet.map((was, box) => (box === move.box ? score : was)) : sheet));
  const full = sheets.every((sheet) => sheet.every((one) => one !== null));
  return {
    ...game,
    moves: [...game.moves, move],
    dice: UNTHROWN,
    held: 0,
    rolls: 0,
    sheets,
    toPlay: full ? seat : (seat + 1) % game.players.length,
    turn: full ? game.turn : game.turn + 1,
    phase: full ? YACHT_PHASES.finished : YACHT_PHASES.playing,
    winners: full ? leaders(sheets) : [],
    last: { seat, move, score },
  };
}

/** A game made again from its table and its moves, or null when any move is not one the rules allow there. */
export function replayYacht(players: readonly string[], seed: number, computers: readonly boolean[], moves: readonly YachtMove[], size: number = YACHT_SHEET): YachtGame | null {
  let game = startYacht(players, seed, computers, size);
  for (const move of moves) {
    if (game === null) return null;
    game = playYacht(game, move);
  }
  return game;
}

/** The same table again, a new seed for the dice. */
export function yachtAgain(game: YachtGame, seed: number): YachtGame {
  return startYacht(game.players, seed, game.computers, game.size)!;
}

/** A seat's name as the table says it: the one given, or "Computer 2" or "Player 2". */
export function yachtPlayerName(game: Pick<YachtGame, "players" | "computers">, seat: YachtSeat): string {
  const given = game.players[seat]?.trim() ?? "";
  if (given !== "") return given;
  return `${game.computers[seat] ? "Computer" : "Player"} ${seat + 1}`;
}

/** The seats a person plays. */
export function yachtPeople(game: Pick<YachtGame, "computers">): YachtSeat[] {
  return game.computers.flatMap((computer, seat) => (computer ? [] : [seat]));
}

/** How many boxes a seat has filled: the turn of theirs this is, less one. */
export function boxesFilled(game: YachtGame, seat: YachtSeat): number {
  return game.sheets[seat].filter((score) => score !== null).length;
}

/** Whether this die is held where it lies by the last roll. */
export function isHeld(hold: number, die: number): boolean {
  return (hold & (1 << die)) !== 0;
}
