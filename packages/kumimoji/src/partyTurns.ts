import type { GridVerdict } from "./grid.ts";
import { wordsInHand } from "./help.ts";
import { nextIn, partyTilesLeft, seatPlay, stillIn, tableTally } from "./party.ts";
import type { PartyGame } from "./party.types.ts";
import { mayTrade } from "./play.ts";
import { KUMIMOJI_TRADE } from "./tiles.constants.ts";
import type { TileWords } from "./tileWords.ts";

/**
 * HOW A PASS-AND-PLAY TURN ENDS, AND HOW THE GAME DOES: Done, going out, the
 * last round, resigning, and who won. The rules of the table itself are the
 * solo game's (`play.ts`), and the deal and the draw are `party.ts`'s. Pure:
 * each returns a new game, or the one it was given where the move is refused.
 */

/** Whether the game is over. */
export function isOver(game: PartyGame): boolean {
  return game.ending !== null;
}

/**
 * Whether the player whose turn it is would go out with Done: their hand
 * used, their grid sound, and too few tiles in the bag for everybody still in
 * to draw.
 */
export function goesOut(game: PartyGame, verdict: GridVerdict): boolean {
  return !isOver(game) && game.players[game.turn]!.hand.length === 0 && verdict.sound && partyTilesLeft(game) < stillIn(game).length;
}

/** Whether the player whose turn it is has laid a tile on their table this turn: more tiles there than when it began. */
export function laidThisTurn(game: PartyGame): boolean {
  return game.players[game.turn]!.tiles.size > [...game.startTable].length;
}

/** Whether the player whose turn it is is the only one still in: everybody else has resigned. */
export function lastStanding(game: PartyGame): boolean {
  return !isOver(game) && game.lastTurns === null && stillIn(game).length === 1;
}

/**
 * A HAND THAT SPELLS NOTHING MUST BE TRADED. John, 2026-09-28: "If no words
 * can be formed which is possible, they must dump a tile to get 3 more. Easy
 * rule." So Done waits while the player whose turn it is holds tiles that
 * spell no word, has laid nothing on (or lifted nothing from) their table this
 * turn, and has not traded — unless the bag cannot give three, when there is
 * nothing to trade for. `handSpells` answers for a hand (`handCanSpell`).
 */
export function mustTradeFirst(game: PartyGame, handSpells: (hand: readonly string[]) => boolean): boolean {
  if (isOver(game) || game.traded) return false;
  const play = seatPlay(game);
  if (play.hand.length === 0 || tableTally(play.tiles) !== game.startTable || !mayTrade(play)) return false;
  return !handSpells(play.hand);
}

/** Whether a hand can spell a word from the list: any word of two tiles or more, a wild counting as able to be anything. */
export function handCanSpell(hand: readonly string[], words: TileWords): boolean {
  return hand.some(words.isWild) || wordsInHand(hand, words).length > 0;
}

/**
 * Why Done cannot be pressed now, or null when it can: a hand to trade first,
 * or, for the last one standing, no tile laid on a sound grid yet (a hand
 * already used on a sound grid has nothing left to lay, and wins as it is).
 */
export function doneRefused(game: PartyGame, verdict: GridVerdict, handSpells: (hand: readonly string[]) => boolean): "trade" | "standing" | null {
  if (mustTradeFirst(game, handSpells)) return "trade";
  const used = game.players[game.turn]!.hand.length === 0;
  if (lastStanding(game) && !(verdict.sound && (laidThisTurn(game) || used))) return "standing";
  return null;
}

/** The game passed to `turn`, a new turn with nothing traded and its table as it stands. */
function passTo(game: PartyGame, turn: number, rest: Partial<PartyGame>): PartyGame {
  return { ...game, ...rest, turns: game.turns + 1, turn, traded: false, startTable: tableTally(game.players[turn]!.tiles), passedBy: game.turn };
}

/**
 * DONE: the end of a turn, and the device passed on. Before anybody is out,
 * to the next player still in. A player who goes out with it starts the last
 * round: everybody else still in, in order from the next, has one last turn,
 * and any of them who goes out on it shares the win (John, 2026-09-28:
 * "Sharing the win is correct"). After the last of those, the game is over.
 *
 * The last one standing, everybody else resigned, wins by laying a tile on a
 * sound grid and pressing Done. `verdict` is the grid of the player whose turn
 * it is. Refused, the game given back as it was, while `doneRefused` says so.
 */
export function endTurn(game: PartyGame, verdict: GridVerdict, handSpells: (hand: readonly string[]) => boolean): PartyGame {
  if (isOver(game) || doneRefused(game, verdict, handSpells) !== null) return game;
  if (lastStanding(game)) return passTo(game, game.turn, { ending: "standing", resignRun: [] });
  const out = goesOut(game, verdict) ? [...game.out, game.turn] : game.out;
  if (game.lastTurns === null) {
    if (out.length === 0) return passTo(game, nextIn(game, game.turn), { resignRun: [] });
    const lastTurns = stillIn(game).filter((at) => at !== game.turn).sort((a, b) => fromTurn(game, a) - fromTurn(game, b));
    if (lastTurns.length === 0) return passTo(game, game.turn, { out, lastTurns, ending: "out" });
    return passTo(game, lastTurns[0]!, { out, lastTurns, resignRun: [] });
  }
  return nextLastTurn(game, out);
}

/** How far round the table from the player whose turn it is. */
function fromTurn(game: PartyGame, at: number): number {
  return (at - game.turn + game.players.length) % game.players.length;
}

/** The last round moved on past the player whose turn it was: to the next still to play, or the end. */
function nextLastTurn(game: PartyGame, out: readonly number[], rest: Partial<PartyGame> = {}): PartyGame {
  const lastTurns = (game.lastTurns ?? []).filter((at) => at !== game.turn);
  if (lastTurns.length === 0) return passTo(game, game.turn, { ...rest, out, lastTurns, ending: "out" });
  return passTo(game, lastTurns[0]!, { ...rest, out, lastTurns });
}

/**
 * Whether the player whose turn it is may resign: only once the bag cannot
 * give a trade, so nothing more can be got from it. John, 2026-09-28:
 * "Perhaps we offer a resign button only when there are no remaining tiles
 * they can get from the bag."
 */
export function mayResign(game: PartyGame): boolean {
  return !isOver(game) && partyTilesLeft(game) < KUMIMOJI_TRADE.take;
}

/**
 * RESIGN: the player whose turn it is is out of the game, their table kept
 * for the finish, and their turn passed over from then on. In the last round
 * it is their last turn ended without going out. Otherwise the game goes on
 * with whoever is still in; and when nobody is — the last one standing
 * resigned too — it ends tied between everybody who resigned since a player
 * still in last pressed Done. John: "if you resign, as the turns pass, if
 * someone else can't go and has to resign then they are tied."
 */
export function resign(game: PartyGame): PartyGame {
  if (!mayResign(game)) return game;
  const resigned = [...game.resigned, game.turn];
  const resignRun = [...game.resignRun, game.turn];
  const after = { ...game, resigned, resignRun };
  if (game.lastTurns !== null) return nextLastTurn(after, game.out);
  if (stillIn(after).length === 0) return passTo(after, game.turn, { ending: "tied" });
  return passTo(after, nextIn(after, game.turn), {});
}

/**
 * The winners of a finished game, by place: everybody who went out; the last
 * one standing; or, tied, the final run of resignations. Empty while it is
 * played.
 */
export function winnersOf(game: PartyGame): readonly number[] {
  if (game.ending === "out") return game.out;
  if (game.ending === "standing") return stillIn(game);
  if (game.ending === "tied") return game.resignRun;
  return [];
}

/** Whether the turn now being played is a player's last. */
export function isLastTurn(game: PartyGame): boolean {
  return !isOver(game) && game.lastTurns !== null;
}
