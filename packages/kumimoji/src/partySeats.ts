import { seededRandom, shuffled } from "./random.ts";
import { computerName, isComputer, nextIn, partyTilesLeft, stillIn, tableTally, tidyName } from "./party.ts";
import type { PartyGame, PartyPlayer, PartySeat } from "./party.types.ts";
import { tileFace } from "./tileFace.ts";
import { KUMIMOJI_PARTY } from "./tiles.constants.ts";

/**
 * JUMPING IN AND OUT OF A PASS-AND-PLAY GAME. John, 2026-09-28: "People can
 * jump in and out of a game at which point all their tiles go back to the
 * pot. Also you can add computer bots."
 *
 * Both happen from the pass screen, between turns, never on somebody's desk.
 * Pure, like every rule here: each returns a new game, or the one it was
 * given where the change is refused.
 *
 * JOINING: a new player, or a computer, takes the next seat after the last
 * and a hand of the game's size from the bag, and plays when the turn comes
 * round to them. Offered while there are fewer than eight, the last round has
 * not begun (a player who sat down then could never catch up, and would only
 * be dealt tiles to lose with), and the bag holds a whole hand.
 *
 * LEAVING: every tile in the leaver's hand and on their table goes back into
 * the bag, which is shuffled with them in, and play goes on with the next
 * player. A player who has gone out has finished, and stays at the table until
 * the game ends; and the last person at the table cannot leave it to the
 * computers — they end the game instead.
 *
 * Fewer than two left is no new rule: the one still in is the last one
 * standing (`lastStanding`), and wins by laying a tile on a sound grid, as
 * when everybody else resigns — unless somebody joins first.
 */

/** Why nobody can join now, or null when a hand can be dealt. */
export type JoinRefusal = "over" | "full" | "lastRound" | "bag";

export function joinRefused(game: PartyGame): JoinRefusal | null {
  if (game.ending !== null) return "over";
  if (game.players.length >= KUMIMOJI_PARTY.most) return "full";
  if (game.lastTurns !== null) return "lastRound";
  if (partyTilesLeft(game) < game.settings.size) return "bag";
  return null;
}

/** A player, or a computer, sat down after the last seat with the next hand out of the bag. */
export function joinParty(game: PartyGame, seat: PartySeat): PartyGame {
  if (joinRefused(game) !== null) return game;
  const hand = [...(game.bag + game.returned).slice(game.taken, game.taken + game.settings.size)];
  const tiles = new Map<string, string>();
  const player: PartyPlayer =
    seat.computer === true ? { name: computerName(game.players), computer: true, hand, tiles } : { name: tidyName(seat.name) || freePlayerName(game.players), hand, tiles };
  return { ...game, players: [...game.players, player], taken: game.taken + hand.length };
}

/** "Player" and the next seat's number, or the lowest number nobody at the table goes by. */
function freePlayerName(players: readonly PartyPlayer[]): string {
  const taken = new Set(players.map((player, at) => player.name || `Player ${at + 1}`));
  const next = `Player ${players.length + 1}`;
  if (!taken.has(next)) return next;
  for (let number = 1; ; number += 1) if (!taken.has(`Player ${number}`)) return `Player ${number}`;
}

/** Why this player cannot leave now, or null when they can. */
export type LeaveRefusal = "over" | "out" | "lastPerson";

export function leaveRefused(game: PartyGame, at: number): LeaveRefusal | null {
  if (game.ending !== null || game.players[at] === undefined) return "over";
  if (game.out.includes(at)) return "out";
  if (!isComputer(game, at) && game.players.filter((player) => player.computer !== true).length <= 1) return "lastPerson";
  return null;
}

/** How many tiles a player would put back in the bag by leaving: their hand and their table. */
export function tilesHeldBy(game: PartyGame, at: number): number {
  const player = game.players[at];
  return player === undefined ? 0 : player.hand.length + player.tiles.size;
}

/**
 * A PLAYER LEAVES. Their tiles go back into the bag and the bag is shuffled
 * — with the game's own seed and how far it has gone, so the same game left
 * the same way deals the same tiles after a reload. A wild goes back blank.
 *
 * The bag is kept as a line whose first `taken` tiles are the ones held, less
 * what was traded back (`holdsItsBag`); after a leave it is written afresh as
 * exactly that: the tiles everybody still holds, then the shuffled rest, with
 * nothing traded back. Every seat after the leaver's moves up one, and the
 * unnamed players keep the names they were shown ("Player 3" stays Player 3).
 *
 * If it was their turn, the turn passes to the next still in, or in the last
 * round to the next still to have their last turn; a last round with nobody
 * left to play ends. With nobody still in — everybody left has resigned —
 * the game ends tied between them.
 */
export function leaveParty(game: PartyGame, at: number): PartyGame {
  if (leaveRefused(game, at) !== null) return game;
  const leaver = game.players[at]!;
  const back = [...leaver.hand, ...leaver.tiles.values()].map((tile) => (tileFace(tile).wild ? "*" : tile));
  const players = game.players.flatMap((player, seat) => (seat === at ? [] : [{ ...player, name: player.name || `Player ${seat + 1}` }]));
  const seatOf = (seat: number) => (seat > at ? seat - 1 : seat);
  const without = (seats: readonly number[]) => seats.filter((seat) => seat !== at).map(seatOf);

  const held = players.flatMap((player) => [...player.hand, ...player.tiles.values()]);
  const rest = [...(game.bag + game.returned).slice(game.taken), ...back];
  const pot = shuffled(rest, seededRandom(potSeed(game)));
  const lastTurns = game.lastTurns === null ? null : without(game.lastTurns);

  let turn = seatOf(game.turn);
  let ending: PartyGame["ending"] = null;
  if (at === game.turn) {
    if (lastTurns !== null) {
      // The leaver was first of the last round's list: the next on it plays, or the round is over.
      if (lastTurns.length > 0) turn = lastTurns[0]!;
      else {
        turn = seatOf(game.out[0] ?? 0);
        ending = "out";
      }
    } else {
      const next = nextIn(game, at);
      turn = next === at ? 0 : seatOf(next);
    }
  }
  const after: PartyGame = {
    ...game,
    bag: held.join("") + pot.join(""),
    returned: "",
    taken: held.length,
    players,
    turn,
    turns: game.turns + 1,
    out: without(game.out),
    lastTurns,
    resigned: without(game.resigned),
    resignRun: without(game.resignRun),
    ending,
    passedBy: game.passedBy === null || game.passedBy === at ? null : seatOf(game.passedBy),
  };
  const moved = at === game.turn ? { startTable: tableTally(players[turn]!.tiles), traded: false } : {};
  if (ending === null && lastTurns === null && stillIn(after).length === 0) {
    // Only players who resigned are left: tied, the last run of them, or all of them where that run has left.
    return { ...after, ...moved, ending: "tied", resignRun: after.resignRun.length > 0 ? after.resignRun : after.resigned };
  }
  return { ...after, ...moved };
}

/** The seed a leave shuffles with: the game's own, stirred by how far it has gone. */
function potSeed(game: PartyGame): number {
  return (game.settings.seed ^ Math.imul(game.turns + 1, 0x9e3779b1) ^ Math.imul(game.taken + 1, 0x85ebca6b)) >>> 0;
}
