// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { seededRandom, shuffled } from "../../puzzles/random";
import { PARTY_SPECS } from "../party.constants";
import { cleanPartyName } from "../partyNames";

import { everyTile, fits, isDouble, laidAgainst, laidEnds, pipsOf, tileOf } from "./dominoes";
import { TRAIN_DEFAULT_OPTIONS, TRAIN_DOUBLES, TRAIN_MEXICAN, handSizeFor, roundsFor } from "./mexicanTrain.constants";
import type { Domino, RoundEnding, TrainGame, TrainHistory, TrainMove, TrainOptions, TrainPhase, TrainSeat } from "./mexicanTrain.types";

/**
 * MEXICAN TRAIN, THE DOMINO GAME: the rules, and nothing else.
 *
 * Pure, as the engine is: every function returns a new game and leaves the
 * one it was given untouched. A game is its table (the set, the options, the
 * seed, the seats) and its moves, in order; hands, trains, the boneyard and
 * whose turn it is are always read again from those (`replayTrain`), so a game
 * read back out of a browser's storage is exactly the game its moves make,
 * or none. Every shuffle is drawn from the game's seed and the round's
 * number, so a reload deals exactly what it dealt before.
 *
 * The rules as the site plays them, most published rules' own:
 *
 *  - a round is dealt round the engine double, the set's highest in the
 *    first round and one fewer each round after, which sits in the hub;
 *  - every player has a train of their own out of the hub, and there is one
 *    more, the Mexican Train, anybody may play on;
 *  - on your turn lay one tile against the open end of your own train, the
 *    Mexican Train, or any player's train whose marker is out;
 *  - nothing to lay: draw one tile; lay it if it goes, or put your marker out
 *    and pass (with nothing to draw, just put it out); lay on your own train
 *    and your marker comes in;
 *  - a double must be covered before anything else is played anywhere, and
 *    whoever lays one lays again to cover it (`DoublesRule` for the house
 *    rule that lets doubles be chained);
 *  - a round ends when somebody lays their last tile, or when nobody can lay
 *    and there is nothing left to draw; every player scores the pips left in
 *    their hand, and after the last round the lowest total wins.
 */

export const TRAIN_PHASES = { playing: "playing", roundOver: "roundOver", finished: "finished" } as const satisfies Record<TrainPhase, TrainPhase>;

const SPEC = PARTY_SPECS.mexicanTrain;

/** The Mexican Train's number among a game's trains: after every seat's own. */
export function mexicanOf(game: Pick<TrainGame, "players">): number {
  return game.players.length;
}

/** The number a train's next tile must match: its last tile's open end, or the engine double's when nothing is laid on it yet. */
export function openEnd(game: TrainGame, train: number): number {
  const laid = game.trains[train].laid;
  return laid.length === 0 ? game.engine : laidEnds(laid[laid.length - 1])[1];
}

/** A shuffle for this round of this game, the same in every browser: the seed and the round decide it. */
function shuffleFor(seed: number, round: number): () => number {
  return seededRandom((seed ^ Math.imul(round + 1, 0x9e3779b1)) >>> 0);
}

/**
 * Deal round `round` of a game at this table: the engine double to the hub,
 * a hand each from the rest, shuffled, and the rest face down to draw from.
 * The first round is led by the first player, and each round after by the
 * next player round the table.
 */
function dealRound(table: TrainGame, round: number): TrainGame {
  const count = table.players.length;
  const engine = table.set - round;
  const random = shuffleFor(table.seed, round);
  const deck = shuffled(everyTile(table.set).filter((tile) => tile !== tileOf(engine, engine)), random);
  const each = handSizeFor(table.set, count);
  const hands = table.players.map((_, seat) => deck.slice(seat * each, (seat + 1) * each));
  return {
    ...table,
    round,
    engine,
    hands,
    trains: [...table.players.map(() => ({ laid: [], open: false })), { laid: [], open: true }],
    boneyard: deck.slice(count * each),
    toPlay: round % count,
    uncovered: [],
    chaining: false,
    drew: false,
    passes: 0,
    turn: table.turn + (round === 0 ? 0 : 1),
    phase: TRAIN_PHASES.playing,
  };
}

/**
 * A new game: the set (its highest double), the names at the table (one a
 * seat), which seats a computer plays, the options, and the seed every
 * shuffle is drawn from. Null for a table the game is not offered for — a set
 * not in `PARTY_SPECS`, or too few or too many players — rather than a game
 * nobody chose.
 */
export function startTrain(
  set: number,
  players: readonly string[],
  seed = 1,
  options: TrainOptions = TRAIN_DEFAULT_OPTIONS,
  computers: readonly boolean[] = players.map(() => false),
): TrainGame | null {
  if (!SPEC.sizes.includes(set)) return null;
  if (players.length < SPEC.fewestPlayers || players.length > SPEC.mostPlayers) return null;
  if (computers.length !== players.length) return null;
  if (!Number.isInteger(seed)) return null;
  const table: TrainGame = {
    set,
    options: { ...options },
    seed,
    players: players.map(cleanPartyName),
    computers: [...computers],
    history: null,
    rounds: roundsFor(set, options.length),
    round: 0,
    engine: set,
    hands: [],
    trains: [],
    boneyard: [],
    toPlay: 0,
    uncovered: [],
    chaining: false,
    drew: false,
    passes: 0,
    turn: 0,
    phase: TRAIN_PHASES.playing,
    results: [],
    winners: [],
    last: null,
  };
  return dealRound(table, 0);
}

/** Whether `seat` may lay on this train at all now, before asking whether a tile fits it. */
function mayLayOn(game: TrainGame, seat: TrainSeat, train: number): boolean {
  if (train === seat) return true;
  const mexican = mexicanOf(game);
  if (train === mexican) return game.options.mexican !== TRAIN_MEXICAN.ownFirst || game.trains[seat].laid.length > 0;
  return game.trains[train].open;
}

/**
 * Every tile the player to move may lay, and where: what `moves` offers, and
 * what the table lights up. While a double is uncovered anywhere the only
 * lay is to cover the last of them, on whoever's train it is — or, under the
 * chained-doubles rule, another double laid by the player still laying them.
 */
export function legalPlays(game: TrainGame): { tile: Domino; train: number }[] {
  if (game.phase !== TRAIN_PHASES.playing) return [];
  const seat = game.toPlay;
  const hand = game.hands[seat];
  const plays: { tile: Domino; train: number }[] = [];
  const lastOpen = game.uncovered.length === 0 ? null : game.uncovered[game.uncovered.length - 1];
  if (lastOpen !== null) {
    const end = openEnd(game, lastOpen);
    for (const tile of hand) if (fits(tile, end)) plays.push({ tile, train: lastOpen });
    if (!game.chaining) return plays;
  }
  const trains = game.trains.length;
  for (let train = 0; train < trains; train += 1) {
    if (lastOpen !== null && game.uncovered.includes(train)) continue;
    if (!mayLayOn(game, seat, train)) continue;
    const end = openEnd(game, train);
    for (const tile of hand) {
      if (lastOpen !== null && !isDouble(tile)) continue;
      if (fits(tile, end)) plays.push({ tile, train });
    }
  }
  return plays;
}

/**
 * Whether the player to move may lay this tile on this train now: the same
 * answer `legalPlays` gives, for one tile, without listing every other.
 */
export function mayLay(game: TrainGame, tile: Domino, train: number): boolean {
  if (game.phase !== TRAIN_PHASES.playing || train < 0 || train >= game.trains.length) return false;
  const seat = game.toPlay;
  if (!game.hands[seat].includes(tile) || !fits(tile, openEnd(game, train))) return false;
  const lastOpen = game.uncovered.length === 0 ? null : game.uncovered[game.uncovered.length - 1];
  if (lastOpen === train) return true;
  if (lastOpen !== null && (!game.chaining || !isDouble(tile) || game.uncovered.includes(train))) return false;
  return mayLayOn(game, seat, train);
}

/** Whether the player to move has any tile to lay: what decides between laying, drawing and passing. */
function canLay(game: TrainGame): boolean {
  const hand = game.hands[game.toPlay];
  for (let train = 0; train < game.trains.length; train += 1) {
    const end = openEnd(game, train);
    for (const tile of hand) if (fits(tile, end) && mayLay(game, tile, train)) return true;
  }
  return false;
}

/** Every move the player to move may make now; none once the game is over. */
export function trainMoves(game: TrainGame): TrainMove[] {
  if (game.phase === TRAIN_PHASES.finished) return [];
  if (game.phase === TRAIN_PHASES.roundOver) return [{ kind: "next" }];
  const plays = legalPlays(game).map(({ tile, train }): TrainMove => ({ kind: "play", tile, train }));
  if (plays.length > 0) return plays;
  return game.boneyard.length > 0 && !game.drew ? [{ kind: "draw" }] : [{ kind: "pass" }];
}

/** Every move a game has made, first to last. */
export function movesOf(game: Pick<TrainGame, "history">): TrainMove[] {
  const moves: TrainMove[] = [];
  for (let link = game.history; link !== null; link = link.before) moves.push(link.move);
  return moves.reverse();
}

/** How many moves a game has made. */
export function moveCount(game: Pick<TrainGame, "history">): number {
  return game.history?.count ?? 0;
}

/** Each seat's total over every round played: the lowest wins. */
export function trainTotals(game: Pick<TrainGame, "players" | "results">): number[] {
  return game.players.map((_, seat) => game.results.reduce((sum, result) => sum + result.pips[seat], 0));
}

/** The pips in a hand, which count against its holder when the round ends. */
export function handPips(hand: readonly Domino[]): number {
  return hand.reduce((sum, tile) => sum + pipsOf(tile), 0);
}

/** The round over, scored; the game over too after its last round, its lowest totals the winners. */
function endRound(game: TrainGame, ending: RoundEnding, out: TrainSeat | null): TrainGame {
  const result = { engine: game.engine, pips: game.hands.map(handPips), ending, out };
  const results = [...game.results, result];
  const finished = results.length >= game.rounds;
  const totals = trainTotals({ players: game.players, results });
  const lowest = Math.min(...totals);
  return {
    ...game,
    results,
    uncovered: [],
    chaining: false,
    phase: finished ? TRAIN_PHASES.finished : TRAIN_PHASES.roundOver,
    winners: finished ? totals.flatMap((total, seat) => (total === lowest ? [seat] : [])) : [],
  };
}

/** The turn passes to the next seat round the table. */
function nextSeat(game: TrainGame): TrainGame {
  return { ...game, toPlay: (game.toPlay + 1) % game.players.length, turn: game.turn + 1, drew: false, chaining: false };
}

/** A tile laid: from the hand to the train, turned to fit, and what it leaves to be done this turn. */
function lay(game: TrainGame, tile: Domino, train: number): TrainGame {
  const seat = game.toPlay;
  const end = openEnd(game, train);
  const hands = game.hands.map((hand, at) => (at === seat ? hand.filter((one) => one !== tile) : hand));
  const trains = game.trains.map((one, at) =>
    at === train ? { laid: [...one.laid, laidAgainst(tile, end)], open: at === seat ? false : one.open } : one,
  );
  const covering = game.uncovered.length > 0 && game.uncovered[game.uncovered.length - 1] === train;
  const uncovered = covering ? game.uncovered.slice(0, -1) : game.uncovered;
  const laid: TrainGame = { ...game, hands, trains, uncovered, passes: 0, drew: false };
  if (hands[seat].length === 0) return endRound(laid, "domino", seat);
  if (isDouble(tile)) return { ...laid, uncovered: [...uncovered, train], chaining: game.options.doubles === TRAIN_DOUBLES.chain };
  // Covering one of several doubles: the same player goes on covering the rest.
  if (covering && uncovered.length > 0) return { ...laid, chaining: false };
  return nextSeat(laid);
}

/** Whether a move is one `trainMoves` offers now, asked of that move alone. */
function allowedNow(game: TrainGame, move: TrainMove): boolean {
  if (move.kind === "next") return game.phase === TRAIN_PHASES.roundOver;
  if (game.phase !== TRAIN_PHASES.playing) return false;
  if (move.kind === "play") return mayLay(game, move.tile, move.train);
  if (canLay(game)) return false;
  const mayDraw = game.boneyard.length > 0 && !game.drew;
  return move.kind === "draw" ? mayDraw : !mayDraw;
}

/**
 * The game after that move, or null for a move that may not be made now.
 * The game given is left untouched, and the move is added to its record.
 */
export function playTrain(game: TrainGame, move: TrainMove): TrainGame | null {
  if (!allowedNow(game, move)) return null;
  const seat = game.toPlay;
  const history: TrainHistory = { move, before: game.history, count: (game.history?.count ?? 0) + 1 };
  const recorded = { ...game, history, last: { seat, move } };
  switch (move.kind) {
    case "next":
      return dealRound(recorded, game.round + 1);
    case "draw": {
      const [drawn, ...boneyard] = game.boneyard;
      const hands = game.hands.map((hand, at) => (at === seat ? [...hand, drawn] : hand));
      return { ...recorded, hands, boneyard, drew: true };
    }
    case "pass": {
      const trains = game.trains.map((one, at) => (at === seat ? { ...one, open: true } : one));
      const passes = game.passes + 1;
      const passed = { ...recorded, trains, passes };
      if (game.boneyard.length === 0 && passes >= game.players.length) return endRound(passed, "blocked", null);
      return nextSeat(passed);
    }
    case "play":
      return lay(recorded, move.tile, move.train);
  }
}

/**
 * A game played again from its table and its moves: what reading a kept game
 * back does. Null if any move is one the rules would not have taken.
 */
export function replayTrain(
  set: number,
  players: readonly string[],
  seed: number,
  options: TrainOptions,
  computers: readonly boolean[],
  moves: readonly TrainMove[],
): TrainGame | null {
  let game = startTrain(set, players, seed, options, computers);
  for (const move of moves) {
    if (game === null) return null;
    game = playTrain(game, move);
  }
  return game;
}

/** The same table again, the same seats and options, with a fresh shuffle. */
export function trainAgain(game: TrainGame, seed: number): TrainGame {
  return startTrain(game.set, game.players, seed, game.options, game.computers)!;
}

/** A seat's name as the table reads it: the one given, or "Computer 3" for a computer's seat left blank, "Player 3" for a person's. */
export function trainPlayerName(game: Pick<TrainGame, "players" | "computers">, seat: TrainSeat): string {
  const given = game.players[seat]?.trim() ?? "";
  if (given !== "") return given;
  return `${game.computers[seat] ? "Computer" : "Player"} ${seat + 1}`;
}

/** The seats a person plays: a table with two or more of them passes the device, and covers each hand between turns. */
export function peopleAt(game: Pick<TrainGame, "computers">): TrainSeat[] {
  return game.computers.flatMap((computer, seat) => (computer ? [] : [seat]));
}
