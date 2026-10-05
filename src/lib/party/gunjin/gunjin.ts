// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { acknowledgePass, createMatch, playMove, rosterForSetup, submitSetup } from "./gunjinEngine";
import { legalMovesForCurrentPlayer } from "@johnmorrisdotca/gunjin/views";

import { resigning } from "../resign";
import { GUNJIN_OFFERED_SETUPS, GUNJIN_SEATS, gunjinBoardOf } from "./gunjin.constants";
import type { GunjinGame, GunjinMatch, GunjinMove, GunjinPlacement } from "./gunjin.types";

/**
 * THE RULES OF GUNJIN AS A PARTY GAME: the package's authoritative engine
 * (`@johnmorrisdotca/gunjin`, MIT) with the site's turns put round it. A game
 * is a board, two names and moves; the engine's own match is read again from
 * them (`replayGunjin`) and every function here returns a new game, leaving
 * the one it was given alone, as the engine does.
 *
 * The engine's flow is the table's: each side arranges its pieces in secret
 * (`setup`), a pass of the device is confirmed (`pass`) before the other side
 * sees anything, and then the sides move in turn (`move`). That pass is kept
 * as a move on purpose: a table reopened on the cover is still on the cover.
 * The match holds every rank, so nothing here draws one: a table draws a
 * player what `gunjinViewFor` (`gunjinView.ts`) gives them.
 */

/** The match after one move, or null when the engine refuses it (a stale turn, a wrong place, a move no piece can make). */
function applied(match: GunjinMatch, move: GunjinMove): GunjinMatch | null {
  try {
    if (move.kind === "setup") {
      return match.phase !== "setup" ? null : submitSetup(match, match.currentPlayer, move.placements, match.setupStep);
    }
    if (move.kind === "hand") return match.phase !== "pass" ? null : acknowledgePass(match, match.currentPlayer, match.turn);
    return playMove(match, match.currentPlayer, { from: move.from, to: move.to, expectedTurn: match.turn });
  } catch {
    // The engine refuses with a thrown RangeError; here a refusal is a null, as every rule of the site answers.
    return null;
  }
}

/** A new game of this board for these two names, or null for a board there is not or a table that is not two. */
export function startGunjin(size: number, players: readonly string[]): GunjinGame | null {
  const board = gunjinBoardOf(size);
  if (board === null || players.length !== GUNJIN_SEATS) return null;
  return { size, players: [...players], moves: [], match: createMatch(board.mode, { width: board.width, height: board.height }) };
}

/**
 * An arrangement in the one order a kept game gives it back in: the kinds in
 * the order they first appear, each kind's squares in the order given. The
 * engine names a piece by its place in the list, so the same arrangement in
 * two orders is two different matches; this makes it one.
 */
export function canonicalPlacements(placements: readonly GunjinPlacement[]): GunjinPlacement[] {
  const kinds = [...new Set(placements.map((piece) => piece.kind))];
  return kinds.flatMap((kind) => placements.filter((piece) => piece.kind === kind).map(({ x, y }) => ({ kind, x, y })));
}

/** The game after the player to move makes this move, or null when it may not be made. */
export function playGunjin(game: GunjinGame, given: GunjinMove): GunjinGame | null {
  if (gunjinOver(game)) return null;
  const move: GunjinMove = given.kind === "setup" ? { kind: "setup", placements: canonicalPlacements(given.placements) } : given;
  const match = applied(game.match, move);
  return match === null ? null : { ...game, moves: [...game.moves, move], match };
}

/** A game played out again from its moves, or null if any of them is one the engine refuses: a kept game the rules cannot read back. */
export function replayGunjin(size: number, players: readonly string[], moves: readonly GunjinMove[]): GunjinGame | null {
  let game = startGunjin(size, players);
  for (const move of moves) {
    if (game === null) return null;
    game = playGunjin(game, move);
  }
  return game;
}

/** Whether the game is over: the engine has finished it, or a side resigned. */
export function gunjinOver(game: GunjinGame): boolean {
  return game.match.phase === "finished";
}

/** Every seat that won: the winner, or nobody for a game the engine ends level (none of the four boards can). */
export function gunjinWinners(game: GunjinGame): readonly number[] {
  const winner = game.match.result?.winner;
  return gunjinOver(game) && winner !== undefined && winner !== null ? [winner] : [];
}

/** The seat the device or the turn is waiting on, or null once the game is over. */
export function gunjinToPlay(game: GunjinGame): number | null {
  return gunjinOver(game) ? null : game.match.currentPlayer;
}

/** The game ended by a side resigning, in the engine's own terms: finished, the other side the winner. Whatever the phase. */
export function resignGunjin(game: GunjinGame, seat: number): GunjinGame {
  const winner = seat === 0 ? 1 : 0;
  return resigning(game, seat, { match: { ...game.match, phase: "finished", passPurpose: undefined, result: { winner, reason: "resigned" } } });
}

/** A seeded random number in [0, 1), the same sequence for the same seed: the gate must never pass or fail by luck. */
export function seededRandom(start: number): () => number {
  let seed = start >>> 0;
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(seed ^ (seed >>> 15), seed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** How many tries a random arrangement gets before it is a bug: the strictest board (Luzhanqi's flag, mines and bombs) needs a few hundred. */
const MOST_TRIES = 20_000;

/** The squares a side's pieces may stand on: its own rows, nearest the edge first. */
export function homeSquares(size: number, seat: number): { x: number; y: number }[] {
  const board = gunjinBoardOf(size)!;
  const rows = Array.from({ length: board.homeRows }, (_, at) => (seat === 0 ? board.height - 1 - at : at));
  return rows.flatMap((y) => Array.from({ length: board.width }, (_, x) => ({ x, y })));
}

/** Whether the engine takes this arrangement for the side now arranging: every piece placed, each in its own home square, and the board's own placing rules kept. */
export function arrangementIsValid(game: GunjinGame, placements: readonly GunjinPlacement[]): boolean {
  return game.match.phase === "setup" && applied(game.match, { kind: "setup", placements }) !== null;
}

/**
 * A random arrangement for the side now arranging, one the engine takes: the
 * roster shuffled over its home squares (all of them, or a random choice of
 * as many as there are pieces), tried again until the board's own rules —
 * which squares a mine may stand on, where Luzhanqi's flag goes — are met.
 */
export function randomArrangement(game: GunjinGame, random: () => number): GunjinPlacement[] {
  const seat = game.match.currentPlayer;
  const roster = [...rosterForSetup(game.match, seat)];
  const squares = homeSquares(game.size, seat);
  for (let tries = 0; tries < MOST_TRIES; tries += 1) {
    const kinds = shuffled(roster, random);
    const where = shuffled(squares, random);
    const placements = kinds.map((kind, at) => ({ kind, x: where[at].x, y: where[at].y }));
    if (arrangementIsValid(game, placements)) return placements;
  }
  throw new Error(`no arrangement of ${game.size} squares was accepted in ${MOST_TRIES} tries`);
}

/** A copy of a list in a random order (Fisher–Yates). */
function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let at = out.length - 1; at > 0; at -= 1) {
    const other = Math.floor(random() * (at + 1));
    [out[at], out[other]] = [out[other], out[at]];
  }
  return out;
}

/**
 * Every move the side to move may make now: while arranging, a few random
 * arrangements the engine takes (a person chooses their own through
 * `playGunjin`; these are what the gate and any program play), while a device
 * is passed, the pass, and in play every move of every piece.
 */
export function gunjinMoves(game: GunjinGame): readonly GunjinMove[] {
  const { match } = game;
  if (gunjinOver(game)) return [];
  if (match.phase === "setup") {
    return Array.from({ length: GUNJIN_OFFERED_SETUPS }, (_, at): GunjinMove => ({ kind: "setup", placements: randomArrangement(game, seededRandom(game.size * 1009 + game.moves.length * 31 + at)) }));
  }
  if (match.phase === "pass") return [{ kind: "hand" }];
  return legalMovesForCurrentPlayer(match, match.currentPlayer).map(({ from, to }): GunjinMove => ({ kind: "move", from, to }));
}

/** The kind a piece shows as in a match as a seat sees it: not in any roster, so no rule can mistake it for a rank. */
export const HIDDEN_KIND = "hidden";

/**
 * THE MATCH AS ONE SEAT MAY KNOW IT: every piece of the other side with its
 * rank and its name taken out, and its arrangement forgotten, so nothing
 * hidden is in it to be found — which is how a table on two devices is sent a
 * game without the secrets the server holds. Where a piece stands, whose it is
 * and the public record are all that is left of the other side, and they are
 * all the engine's own legal-move and redacted-view functions read of it (a
 * piece's moves depend on its own kind and on which squares are taken). Once
 * the game is over nothing is hidden and the match is returned whole.
 */
export function matchSeenBy(match: GunjinMatch, seat: number): GunjinMatch {
  if (match.phase === "finished") return match;
  const privateSetups: [readonly GunjinMatch["pieces"][number][], readonly GunjinMatch["pieces"][number][]] = seat === 0 ? [match.privateSetups[0], []] : [[], match.privateSetups[1]];
  return {
    ...match,
    privateSetups,
    pieces: match.pieces.map((piece) => (piece.owner === seat ? piece : { ...piece, id: `${HIDDEN_KIND}:${piece.x}:${piece.y}`, kind: HIDDEN_KIND })),
  };
}
