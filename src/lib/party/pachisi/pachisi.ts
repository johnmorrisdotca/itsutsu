// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { seededRandom } from "../../puzzles/random";
import { cleanPartyName } from "../partyNames";

import {
  PACHISI_ARM,
  PACHISI_ARMS,
  PACHISI_CAPTURE_BONUS,
  PACHISI_DOUBLES_LIMIT,
  PACHISI_ENTER,
  PACHISI_ENTRY_AT,
  PACHISI_HOME,
  PACHISI_HOME_BONUS,
  PACHISI_LAST_TRACK,
  PACHISI_MOST,
  PACHISI_FEWEST,
  PACHISI_NEST,
  PACHISI_PAWNS,
  PACHISI_SAFE_ALONG,
  PACHISI_TRACK,
} from "./pachisi.constants";
import type { PachisiEvent, PachisiGame, PachisiMove, PachisiSeat } from "./pachisi.types";

/**
 * PACHISI, THE RACE GAME OF THE CROSS AND CIRCLE: the rules, and nothing else.
 *
 * Pure, as the engine is: every function returns a new game and leaves the
 * one it was given untouched. A game is its table (the seed and the seats) and
 * its moves; the pawns, the dice and whose turn it is are read again from
 * those (`replayPachisi`). Every throw is drawn from the game's seed and how
 * many throws came before it, so nobody at the table knows what is coming,
 * and a reload throws exactly what it threw.
 *
 * The rules, as the cross-and-circle game is played in the West:
 *
 *  - four pawns each, in a nest; two dice a throw, each die moving a pawn on
 *    its own (the same pawn or two), in either order;
 *  - a pawn enters on a 5, or on two dice adding to five, onto its own entry
 *    square, taking any lone opponent there;
 *  - round the shared track of sixty-eight squares, then up its own home path
 *    to home, by the exact count;
 *  - land on a lone opponent off a safe square and it goes back to its nest,
 *    and you move 20 more with any pawn; bring a pawn home and move 10 more;
 *  - two pawns of one colour on a square are a blockade nothing may pass or
 *    land on; a safe square may hold two colours, one pawn each;
 *  - doubles throw again, and a third double in one turn sends the leading
 *    pawn still on the track back to its nest;
 *  - a value no pawn can use is lost; the first home with all four wins.
 */

/** A pawn's square on the shared track, 0 to 67, or null when it is not on the track (nest, home path, home). */
export function squareOf(arm: number, progress: number): number | null {
  if (progress < 0 || progress > PACHISI_LAST_TRACK) return null;
  return (arm * PACHISI_ARM + PACHISI_ENTRY_AT + progress) % PACHISI_TRACK;
}

/** Whether a square of the track is safe from capture. */
export function isSafe(square: number): boolean {
  return PACHISI_SAFE_ALONG.includes(square % PACHISI_ARM);
}

/** The throw after `thrown` throws of this game, the same in every browser. */
function throwFor(seed: number, thrown: number): [number, number] {
  const random = seededRandom((seed ^ Math.imul(thrown + 1, 0x85ebca6b)) >>> 0);
  return [1 + Math.floor(random() * 6), 1 + Math.floor(random() * 6)];
}

/**
 * A new game for two to four, the seed every throw is drawn from, and which
 * seats a computer plays. Null for a table the game is not offered for.
 */
export function startPachisi(players: readonly string[], seed = 1, computers: readonly boolean[] = players.map(() => false), size: number = PACHISI_TRACK): PachisiGame | null {
  if (size !== PACHISI_TRACK) return null;
  if (players.length < PACHISI_FEWEST || players.length > PACHISI_MOST) return null;
  if (computers.length !== players.length || !Number.isInteger(seed)) return null;
  return {
    size,
    seed,
    players: players.map(cleanPartyName),
    computers: [...computers],
    arms: PACHISI_ARMS[players.length],
    moves: [],
    thrown: 0,
    pawns: players.map(() => new Array<number>(PACHISI_PAWNS).fill(PACHISI_NEST)),
    toPlay: 0,
    phase: "roll",
    dice: [0, 0],
    pending: [],
    doubles: 0,
    turn: 0,
    winners: [],
    last: null,
  };
}

/** Every pawn on a square of the track, as seat and pawn. */
function onSquare(game: PachisiGame, square: number): { seat: PachisiSeat; pawn: number }[] {
  const found: { seat: PachisiSeat; pawn: number }[] = [];
  game.pawns.forEach((pawns, seat) =>
    pawns.forEach((progress, pawn) => {
      if (squareOf(game.arms[seat], progress) === square) found.push({ seat, pawn });
    }),
  );
  return found;
}

/** Whether a place a pawn of `seat` would pass or stop on holds a blockade: two pawns of one colour. */
function blockadeAt(game: PachisiGame, seat: PachisiSeat, progress: number): boolean {
  const square = squareOf(game.arms[seat], progress);
  if (square !== null) {
    const here = onSquare(game, square);
    return here.length === 2 && here[0].seat === here[1].seat;
  }
  // The home path is the player's own: only their own two pawns can block it; home holds any number.
  return progress < PACHISI_HOME && game.pawns[seat].filter((one) => one === progress).length >= 2;
}

/** Where a pawn moved `by` would land, and whom it would take, or null for a move the rules do not allow. */
function landing(game: PachisiGame, seat: PachisiSeat, from: number, by: number): { to: number; took: { seat: PachisiSeat; pawn: number } | null } | null {
  if (from === PACHISI_NEST || from >= PACHISI_HOME) return null;
  const to = from + by;
  if (to > PACHISI_HOME) return null;
  for (let step = from + 1; step <= to; step += 1) if (blockadeAt(game, seat, step)) return null;
  const square = squareOf(game.arms[seat], to);
  if (square === null) return { to, took: null };
  const here = onSquare(game, square);
  if (here.length >= 2) return null;
  if (here.length === 1 && here[0].seat !== seat) return isSafe(square) ? { to, took: null } : { to, took: here[0] };
  return { to, took: null };
}

/** Where a pawn entering would land, and whom it would take: a lone opponent on the entry square goes home, safe square or not. */
function entering(game: PachisiGame, seat: PachisiSeat): { took: { seat: PachisiSeat; pawn: number } | null } | null {
  const here = onSquare(game, squareOf(game.arms[seat], 0)!);
  const others = here.filter((one) => one.seat !== seat);
  if (here.length >= 2 && others.length === 0) return null;
  return { took: others.at(-1) ?? null };
}

/** The first pawn of a seat at this progress: pawns at one place are the same pawn to move. */
const firstAt = (pawns: readonly number[], progress: number) => pawns.indexOf(progress);

/** Every move the player to move may make now; none once the game is over. */
export function pachisiMoves(game: PachisiGame): PachisiMove[] {
  if (game.phase === "finished") return [];
  if (game.phase === "roll") return [{ kind: "roll" }];
  const seat = game.toPlay;
  const pawns = game.pawns[seat];
  const moves: PachisiMove[] = [];
  const seen = new Set<string>();
  game.pending.forEach((value, use) => {
    pawns.forEach((progress, pawn) => {
      if (firstAt(pawns, progress) !== pawn) return;
      const key = `${progress}:${value}`;
      if (seen.has(key)) return;
      const legal = progress === PACHISI_NEST ? value === PACHISI_ENTER && entering(game, seat) !== null : landing(game, seat, progress, value) !== null;
      if (!legal) return;
      seen.add(key);
      moves.push({ kind: "move", pawn, use });
    });
  });
  const nest = firstAt(pawns, PACHISI_NEST);
  if (nest >= 0 && bothDiceWaiting(game) && game.dice[0] + game.dice[1] === PACHISI_ENTER && entering(game, seat) !== null) moves.push({ kind: "enter", pawn: nest });
  return moves;
}

/** Whether both of this throw's dice are still waiting, unused: what entering with the two together needs. */
function bothDiceWaiting(game: PachisiGame): boolean {
  return game.pending.length >= 2 && game.pending[0] === game.dice[0] && game.pending[1] === game.dice[1] && game.dice[0] !== game.dice[1];
}

/** The same player throws again after doubles; otherwise the next player round the table throws. */
function endTurn(game: PachisiGame): PachisiGame {
  const again = game.doubles > 0 && game.doubles < PACHISI_DOUBLES_LIMIT && game.dice[0] === game.dice[1];
  if (again) return { ...game, phase: "roll", pending: [] };
  return { ...game, phase: "roll", pending: [], doubles: 0, toPlay: (game.toPlay + 1) % game.players.length, turn: game.turn + 1 };
}

/** After a value is used: the game over, the turn on, or the values left to use (lost when no pawn can use them). */
function settle(game: PachisiGame): PachisiGame {
  const seat = game.toPlay;
  if (game.pawns[seat].every((progress) => progress === PACHISI_HOME)) return { ...game, phase: "finished", pending: [], winners: [seat] };
  if (game.pending.length === 0) return endTurn(game);
  if (pachisiMoves(game).length === 0) return endTurn(stuck(game));
  return game;
}

/** The event said with "and nothing else could move". */
function stuck(game: PachisiGame): PachisiGame {
  return game.last === null || game.last.kind === "thirdDouble" ? game : { ...game, last: { ...game.last, stuck: true } as PachisiEvent };
}

/** One seat's pawns with one moved, and any taken pawn sent back. */
function withPawn(game: PachisiGame, seat: PachisiSeat, pawn: number, to: number, took: { seat: PachisiSeat; pawn: number } | null): PachisiGame["pawns"] {
  return game.pawns.map((pawns, at) =>
    pawns.map((progress, which) => (at === seat && which === pawn ? to : took !== null && at === took.seat && which === took.pawn ? PACHISI_NEST : progress)),
  );
}

/** The game after this move, or null for a move that may not be made now; the game given is left untouched. */
export function playPachisi(game: PachisiGame, move: PachisiMove): PachisiGame | null {
  if (game.phase === "finished") return null;
  const seat = game.toPlay;
  const moved = [...game.moves, move];
  if (move.kind === "roll") {
    if (game.phase !== "roll") return null;
    const dice = throwFor(game.seed, game.thrown);
    const doubles = dice[0] === dice[1] ? game.doubles + 1 : 0;
    const thrown = { ...game, moves: moved, thrown: game.thrown + 1, dice, doubles };
    if (doubles === PACHISI_DOUBLES_LIMIT) {
      // The leading pawn still on the shared track goes back; one on its home path is safe.
      const pawns = game.pawns[seat];
      const lead = pawns.reduce<number | null>((best, progress, pawn) => (progress >= 0 && progress <= PACHISI_LAST_TRACK && (best === null || progress > pawns[best]) ? pawn : best), null);
      const sent = lead === null ? game.pawns : withPawn(game, seat, lead, PACHISI_NEST, null);
      return endTurn({ ...thrown, pawns: sent, last: { kind: "thirdDouble", seat, pawn: lead } });
    }
    return settle({ ...thrown, phase: "move", pending: dice, last: { kind: "rolled", seat, dice, stuck: false } });
  }
  if (game.phase !== "move") return null;
  const offered = pachisiMoves(game);
  if (!offered.some((one) => one.kind === move.kind && one.pawn === move.pawn && (one.kind !== "move" || move.kind !== "move" || one.use === move.use))) return null;
  const from = game.pawns[seat][move.pawn];
  if (move.kind === "enter" || from === PACHISI_NEST) {
    const entry = entering(game, seat)!;
    const pending = move.kind === "enter" ? game.pending.slice(2) : game.pending.filter((_, at) => at !== (move as { use: number }).use);
    return settle({
      ...game,
      moves: moved,
      pawns: withPawn(game, seat, move.pawn, 0, entry.took),
      pending: entry.took === null ? pending : [...pending, PACHISI_CAPTURE_BONUS],
      last: { kind: "entered", seat, pawn: move.pawn, took: entry.took?.seat ?? null, stuck: false },
    });
  }
  const by = game.pending[move.use];
  const land = landing(game, seat, from, by)!;
  const home = land.to === PACHISI_HOME;
  const pending = [...game.pending.filter((_, at) => at !== move.use), ...(land.took === null ? [] : [PACHISI_CAPTURE_BONUS]), ...(home ? [PACHISI_HOME_BONUS] : [])];
  return settle({
    ...game,
    moves: moved,
    pawns: withPawn(game, seat, move.pawn, land.to, land.took),
    pending,
    last: { kind: "moved", seat, pawn: move.pawn, by, took: land.took?.seat ?? null, home, stuck: false },
  });
}

/** A game made again from its table and its moves, or null when any move is not one the rules allow there. */
export function replayPachisi(players: readonly string[], seed: number, computers: readonly boolean[], moves: readonly PachisiMove[], size: number = PACHISI_TRACK): PachisiGame | null {
  let game = startPachisi(players, seed, computers, size);
  for (const move of moves) {
    if (game === null) return null;
    game = playPachisi(game, move);
  }
  return game;
}

/** The same table again, a new seed for the dice. */
export function pachisiAgain(game: PachisiGame, seed: number): PachisiGame {
  return startPachisi(game.players, seed, game.computers, game.size)!;
}

/** A seat's name as the table says it. */
export function pachisiPlayerName(game: Pick<PachisiGame, "players" | "computers">, seat: PachisiSeat): string {
  const given = game.players[seat]?.trim() ?? "";
  if (given !== "") return given;
  return `${game.computers[seat] ? "Computer" : "Player"} ${seat + 1}`;
}

/** How many of a seat's pawns are home. */
export function pawnsHome(game: PachisiGame, seat: PachisiSeat): number {
  return game.pawns[seat].filter((progress) => progress === PACHISI_HOME).length;
}
