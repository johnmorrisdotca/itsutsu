// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { PARTY_SPECS } from "../party.constants";
import type { PartyRules } from "../party.types";
import { cleanPartyName } from "../partyNames";

import { MANCALA_BOARDS } from "./mancala.constants";
import type { MancalaEnding, MancalaGame, MancalaRuleSet, MancalaSeat, MancalaStatus } from "./mancala.types";
import { MANCALA_HOLES, pitsOf, seedsInRow, sowKalah, sowOware, storeOf, type Sown } from "./sowing";

/**
 * MANCALA, THE SOWING GAME: the rules, and nothing else.
 *
 * Two rule sets on one board of two rows of six pits: Kalah, the default, and
 * Oware by the Abapa rules. The sowing itself, and what the last seed decides,
 * is `sowing.ts`; this is the turn, the end, and the keeping.
 *
 * Pure, as the engine is: every function returns a new game and leaves the
 * one it was given untouched. A game is its table (`board`, `players`,
 * `first`) and its sowings, in order; the seeds, whose turn it is and who won
 * are always read again from those (`replayMancala`), so a game read back out
 * of a browser's storage is exactly the game its sowings make, or none.
 */

export const MANCALA_STATUS = { playing: "playing", finished: "finished" } as const satisfies Record<MancalaStatus, MancalaStatus>;

export const MANCALA_RULE_SETS = { kalah: "kalah", oware: "oware" } as const satisfies Record<MancalaRuleSet, MancalaRuleSet>;

/** Seeds in every pit at the start: four, as both rule sets are most often played. */
export const MANCALA_SEEDS = 4;

/** Every seed on the board: 48. */
export const MANCALA_SEED_TOTAL = MANCALA_SEEDS * 12;

/** Oware is won by taking more than half: 25. */
export const OWARE_TO_WIN = MANCALA_SEED_TOTAL / 2 + 1;

/** The same position reached this many times ends an Oware game: the third time round. */
export const OWARE_REPEATS = 3;

const SPEC = PARTY_SPECS.mancala;

/** The rule set a board is played by, or null for a number that is neither board. */
export function ruleSetOf(board: number): MancalaRuleSet | null {
  if (board === MANCALA_BOARDS.kalah) return MANCALA_RULE_SETS.kalah;
  if (board === MANCALA_BOARDS.oware) return MANCALA_RULE_SETS.oware;
  return null;
}

function otherSeat(seat: MancalaSeat): MancalaSeat {
  return seat === 0 ? 1 : 0;
}

/** Oware's record of a position: every hole, and whose turn it is. */
function positionKey(holes: readonly number[], toPlay: MancalaSeat): string {
  return `${holes.join(",")}|${toPlay}`;
}

/**
 * A new game: four seeds in every pit, both stores empty, `first` to sow.
 * Null for a table the game is not offered for — a board not in
 * `PARTY_SPECS`, or anything but two players — rather than a game nobody chose.
 */
export function startMancala(board: number, players: readonly string[], first: MancalaSeat = 0): MancalaGame | null {
  const ruleSet = ruleSetOf(board);
  if (ruleSet === null || !SPEC.sizes.includes(board)) return null;
  if (players.length < SPEC.fewestPlayers || players.length > SPEC.mostPlayers) return null;
  if (first !== 0 && first !== 1) return null;
  const holes = Array.from({ length: MANCALA_HOLES }, (_, hole) => (hole === storeOf(0) || hole === storeOf(1) ? 0 : MANCALA_SEEDS));
  return {
    board,
    ruleSet,
    players: players.map(cleanPartyName),
    first,
    moves: [],
    holes,
    toPlay: first,
    last: null,
    status: MANCALA_STATUS.playing,
    winners: [],
    ending: null,
    seen: ruleSet === MANCALA_RULE_SETS.oware ? [positionKey(holes, first)] : [],
  };
}

/** What sowing from `pit` would do under this game's rules, before anything is settled. */
function sowFor(ruleSet: MancalaRuleSet, holes: readonly number[], pit: number, by: MancalaSeat): Sown {
  return ruleSet === MANCALA_RULE_SETS.kalah ? sowKalah(holes, pit, by) : sowOware(holes, pit, by);
}

/**
 * The pits `seat` may sow from in these holes: any of theirs holding a seed.
 * And in Oware, when the opponent's row is empty, only a sowing that gives
 * them seeds — the must-feed rule. That may leave none.
 */
function pitsToSow(ruleSet: MancalaRuleSet, holes: readonly number[], seat: MancalaSeat): number[] {
  const loaded = pitsOf(seat).filter((pit) => holes[pit] > 0);
  const opponent = otherSeat(seat);
  if (ruleSet === MANCALA_RULE_SETS.kalah || seedsInRow(holes, opponent) > 0) return loaded;
  return loaded.filter((pit) => seedsInRow(sowFor(ruleSet, holes, pit, seat).holes, opponent) > 0);
}

/** The pits the player to move may sow from now; none once the game is over. */
export function legalPits(game: MancalaGame): number[] {
  return game.status === MANCALA_STATUS.playing ? pitsToSow(game.ruleSet, game.holes, game.toPlay) : [];
}

/** Whether the player to move must feed an empty row (Oware), so the turn line can say why some pits are not offered. */
export function mustFeed(game: MancalaGame): boolean {
  return game.status === MANCALA_STATUS.playing && game.ruleSet === MANCALA_RULE_SETS.oware && seedsInRow(game.holes, otherSeat(game.toPlay)) === 0;
}

/** Each player takes the seeds left on their own side into their store. */
function eachTakesTheirSide(before: readonly number[]): number[] {
  const holes = [...before];
  for (const seat of [0, 1]) {
    for (const pit of pitsOf(seat)) {
      holes[storeOf(seat)] += holes[pit];
      holes[pit] = 0;
    }
  }
  return holes;
}

/** The seat with more in its store, or both when level. */
function leaders(holes: readonly number[]): MancalaSeat[] {
  const [near, far] = [holes[storeOf(0)], holes[storeOf(1)]];
  if (near === far) return [0, 1];
  return near > far ? [0] : [1];
}

type Settled = Pick<MancalaGame, "holes" | "toPlay" | "status" | "winners" | "ending" | "seen">;

function finished(holes: readonly number[], toPlay: MancalaSeat, ending: MancalaEnding): Settled {
  return { holes, toPlay, status: MANCALA_STATUS.finished, winners: leaders(holes), ending, seen: [] };
}

/**
 * KALAH, after a sowing: over the moment either row is empty, each player
 * then adding what is left on their side to their own store. Otherwise the
 * turn passes — unless the last seed fell in the sower's store, and they sow
 * again.
 */
function settleKalah(sown: Sown, by: MancalaSeat): Settled {
  const { holes, sowing } = sown;
  if (seedsInRow(holes, 0) === 0 || seedsInRow(holes, 1) === 0) return finished(eachTakesTheirSide(holes), by, "rowEmpty");
  return { holes, toPlay: sowing.again ? by : otherSeat(by), status: MANCALA_STATUS.playing, winners: [], ending: null, seen: [] };
}

/**
 * OWARE, after a sowing, in this order:
 *
 * 1. 25 taken is more than half the seeds: that player has won.
 * 2. 24 each: a draw.
 * 3. The same position (every pit, and the same player to move) reached for
 *    the third time since the last capture: the seeds are going round for
 *    ever, and each player takes what is on their side. The Abapa rules leave
 *    this to the players' agreement; a table passing one phone is given the
 *    rule instead, so no game can fail to end.
 * 4. The player now to move has no sowing they may make — their opponent's
 *    row is empty and nothing of theirs reaches it: they take the seeds on
 *    their own side, and the game is over.
 */
function settleOware(sown: Sown, by: MancalaSeat, seenBefore: readonly string[]): Settled {
  const { holes, sowing } = sown;
  const toPlay = otherSeat(by);
  if (holes[storeOf(by)] >= OWARE_TO_WIN) return finished(holes, by, "majority");
  if (holes[storeOf(0)] === OWARE_TO_WIN - 1 && holes[storeOf(1)] === OWARE_TO_WIN - 1) return finished(holes, by, "even");
  const key = positionKey(holes, toPlay);
  const history = sowing.captured > 0 ? [] : seenBefore;
  if (history.filter((one) => one === key).length + 1 >= OWARE_REPEATS) return finished(eachTakesTheirSide(holes), by, "repeated");
  if (pitsToSow(MANCALA_RULE_SETS.oware, holes, toPlay).length === 0) return finished(eachTakesTheirSide(holes), toPlay, "cannotFeed");
  return { holes, toPlay, status: MANCALA_STATUS.playing, winners: [], ending: null, seen: [...history, key] };
}

/**
 * The game after the player to move sows from `pit`, or null when they may
 * not: the game is over, the pit is not theirs, it is empty, or (Oware) it
 * would leave an empty row unfed while another sowing would feed it.
 */
export function sowMancala(game: MancalaGame, pit: number): MancalaGame | null {
  if (!legalPits(game).includes(pit)) return null;
  const by = game.toPlay;
  const sown = sowFor(game.ruleSet, game.holes, pit, by);
  const settled = game.ruleSet === MANCALA_RULE_SETS.kalah ? settleKalah(sown, by) : settleOware(sown, by, game.seen);
  return { ...game, ...settled, moves: [...game.moves, pit], last: sown.sowing };
}

/** A game made again from its table and its sowings, or null if any could not have been made when it was. */
export function replayMancala(board: number, players: readonly string[], first: MancalaSeat, moves: readonly number[]): MancalaGame | null {
  let game = startMancala(board, players, first);
  for (const pit of moves) {
    if (game === null) return null;
    game = sowMancala(game, pit);
  }
  return game;
}

/** The same table and rules again, from nothing, the other player sowing first so that nobody always opens. */
export function mancalaAgain(game: MancalaGame): MancalaGame {
  // The table was already one the game is offered for, so a start from it cannot be refused.
  return startMancala(game.board, game.players, otherSeat(game.first))!;
}

/**
 * The board seed by seed, for the table to draw a sowing as it happens:
 * first with the pit lifted, then after each seed falls, and last the game as
 * it stands after the sowing (with anything captured taken, and, at the end,
 * the rows cleared). Empty when `after` is not one sowing on from `before`.
 */
export function sowingFrames(before: MancalaGame, after: MancalaGame): number[][] {
  const sowing = after.last;
  if (sowing === null || after.moves.length !== before.moves.length + 1) return [];
  const holes = [...before.holes];
  holes[sowing.pit] = 0;
  const frames: number[][] = [[...holes]];
  for (const hole of sowing.path) {
    holes[hole] += 1;
    frames.push([...holes]);
  }
  frames.push([...after.holes]);
  return frames;
}

/** The version of what `encodeMancala` writes, so a later shape can refuse an older one rather than misread it. */
const KEPT_VERSION = 1;

/** A game as text to keep: its table and its sowings, never the seeds, which the sowings make again. */
export function encodeMancala(game: MancalaGame): string {
  return JSON.stringify({ v: KEPT_VERSION, board: game.board, players: game.players, first: game.first, moves: game.moves });
}

/**
 * A kept game read back, or null for nothing kept, or for text that is not a
 * game these rules can play out again: a browser's storage is somebody's to
 * edit, and a half-understood game is worse than none.
 */
export function decodeMancala(text: string | null): MancalaGame | null {
  if (text === null) return null;
  let kept: unknown;
  try {
    kept = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof kept !== "object" || kept === null) return null;
  const { v, board, players, first, moves } = kept as Record<string, unknown>;
  if (v !== KEPT_VERSION || typeof board !== "number" || typeof first !== "number") return null;
  if (!Array.isArray(players) || !players.every((name) => typeof name === "string")) return null;
  if (!Array.isArray(moves) || !moves.every((pit) => typeof pit === "number")) return null;
  return replayMancala(board, players as string[], first, moves as number[]);
}

/** Mancala as every party game's rules are asked (`PartyRules`): a move is the pit sown from. */
export const MANCALA_RULES: PartyRules<MancalaGame, number> = {
  start: (board, players) => startMancala(board, players),
  moves: legalPits,
  play: sowMancala,
  over: (game) => game.status === MANCALA_STATUS.finished,
  winners: (game) => game.winners,
  encode: encodeMancala,
  decode: decodeMancala,
};
