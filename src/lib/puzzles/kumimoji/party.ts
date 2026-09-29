import type { GridVerdict, Tiles } from "./grid";
import type { KumimojiLength } from "./kumimoji.types";
import type { PartyGame, PartySettings } from "./party.types";
import { tilesLeft, type TilePlay } from "./play";
import { KUMIMOJI_PARTY, kumimojiTileCount } from "./tiles.constants";

/**
 * PASS AND PLAY: two to eight people round one device. John, 2026-09-28:
 * "after you finish your move, you say you're done and… the screen will cover
 * until the next person comes… then they can see their tiles and they play the
 * game and then it rotates."
 *
 * One bag for everybody, read as a line exactly as the solo game reads it
 * (`play.ts`), and a hand and a table for each player. A player's turn is
 * played with the solo game's own moves on a `TilePlay` made of the shared bag
 * and their own hand and table (`seatPlay`), and put back (`withSeatPlay`), so
 * laying, moving, swapping, sorting and trading are the one set of rules.
 * What is only the party's is here — the deal, whose turn it is, and Draw for
 * everybody — and in `partyTurns.ts`: Done, going out, the last round,
 * resigning and who won. Pure, like every rule here: each returns a new game.
 */

/** The tiles a bag must hold for this many players: a hand each and one round of draws. */
export function partyTilesNeeded(players: number, hand: number): number {
  return players * hand + players;
}

/** Whether a bag of this many tiles can be played by this many: one player can play any bag. */
export function partyFits(players: number, hand: number, tiles: number): boolean {
  return players < KUMIMOJI_PARTY.least || tiles >= partyTilesNeeded(players, hand);
}

/** A players count from the address, or 1 (the solo game) for anything that is not two to eight. */
export function partyPlayersAsked(value: unknown): number {
  const count = Number(value);
  return Number.isInteger(count) && count >= KUMIMOJI_PARTY.least && count <= KUMIMOJI_PARTY.most ? count : 1;
}

const LENGTHS: readonly KumimojiLength[] = ["short", "medium", "full"];

/**
 * The game length a set-up plays at: the one chosen where the bag holds this
 * many players, else the shortest that does, so a choice made for fewer
 * players comes back when there are fewer again. A Full bag of one set is 144
 * tiles, and eight Classic hands with a round of draws are 96, so there is
 * always one.
 */
export function partyLength(players: number, hand: number, chosen: KumimojiLength, doubleSet: boolean): KumimojiLength {
  // One player plays any length, and asks nothing of the size: the set-up screen asks this of every puzzle's.
  if (players < KUMIMOJI_PARTY.least) return chosen;
  const fits = (length: KumimojiLength) => partyFits(players, hand, kumimojiTileCount(hand, length, undefined, doubleSet));
  if (fits(chosen)) return chosen;
  return LENGTHS.find(fits) ?? "full";
}

/** The deal: each player the next hand from the bag in turn, player one first, and every table empty. */
export function startParty(settings: PartySettings, bag: string, names: readonly string[]): PartyGame {
  const count = Math.min(Math.max(names.length, KUMIMOJI_PARTY.least), KUMIMOJI_PARTY.most);
  const hand = settings.size;
  if (bag.length < partyTilesNeeded(count, hand)) throw new Error(`A bag of ${bag.length} cannot be dealt to ${count} players.`);
  const players = Array.from({ length: count }, (_, at) => ({
    name: tidyName(names[at] ?? ""),
    hand: [...bag.slice(at * hand, (at + 1) * hand)],
    tiles: new Map<string, string>(),
  }));
  return { settings, bag, returned: "", taken: count * hand, players, turn: 0, turns: 0, out: [], lastTurns: null, resigned: [], resignRun: [], ending: null, startTable: "", traded: false, passedBy: null };
}

/** A table's tiles as one string in order, wherever they stand: what a turn compares to see whether anything was laid or lifted. */
export function tableTally(tiles: Tiles): string {
  return [...tiles.values()].sort().join("");
}

/** A name as kept: trimmed, one line, and no longer than a line holds. */
export function tidyName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, KUMIMOJI_PARTY.nameMost);
}

/** What a player is called: their name, or "Player 2". */
export function nameOf(game: PartyGame, at: number): string {
  const name = game.players[at]?.name ?? "";
  return name === "" ? `Player ${at + 1}` : name;
}

/** The player whose turn it is, as the solo game's moves take a game: the shared bag, and their own hand and table. */
export function seatPlay(game: PartyGame): TilePlay {
  const player = game.players[game.turn]!;
  return { bag: game.bag, returned: game.returned, taken: game.taken, tiles: player.tiles, hand: player.hand };
}

/** A move made on `seatPlay` put back: the bag as it left it, and the hand and table to the player whose turn it is. */
export function withSeatPlay(game: PartyGame, play: TilePlay): PartyGame {
  if (game.ending !== null) return game;
  const players = game.players.map((player, at) => (at === game.turn ? { ...player, hand: play.hand, tiles: play.tiles } : player));
  const traded = game.traded || play.returned.length > game.returned.length;
  return { ...game, returned: play.returned, taken: play.taken, players, traded };
}

/** Tiles still in the shared bag. */
export function partyTilesLeft(game: PartyGame): number {
  return tilesLeft(seatPlay(game));
}

/** The players still in — not resigned — by place, in turn order. Somebody who went out is still in until the game ends. */
export function stillIn(game: PartyGame): number[] {
  return game.players.flatMap((_, at) => (game.resigned.includes(at) ? [] : [at]));
}

/** The next player still in after `from`, round the table; `from` itself when nobody else is. */
export function nextIn(game: PartyGame, from: number): number {
  const count = game.players.length;
  for (let step = 1; step <= count; step += 1) {
    const at = (from + step) % count;
    if (!game.resigned.includes(at)) return at;
  }
  return from;
}

/**
 * Whether Draw may be pressed: the hand of the player whose turn it is used,
 * their grid sound, and a tile in the bag for every player still in. Never in
 * the last round, when the bag already holds fewer than that.
 */
export function mayDrawAll(game: PartyGame, verdict: GridVerdict): boolean {
  return game.ending === null && game.lastTurns === null && game.players[game.turn]!.hand.length === 0 && verdict.sound && partyTilesLeft(game) >= stillIn(game).length;
}

/**
 * DRAW: every player still in takes one tile, in turn order from the one who
 * pressed it — the race game's rule that when one player uses their hand,
 * everybody draws.
 */
export function drawAll(game: PartyGame): PartyGame {
  const count = game.players.length;
  const order = stillIn(game).sort((a, b) => ((a - game.turn + count) % count) - ((b - game.turn + count) % count));
  if (partyTilesLeft(game) < order.length) return game;
  const coming = (game.bag + game.returned).slice(game.taken, game.taken + order.length);
  const players = game.players.map((player, at) => (order.includes(at) ? { ...player, hand: [...player.hand, coming[order.indexOf(at)]!] } : player));
  return { ...game, taken: game.taken + order.length, players };
}

/**
 * WHOSE TABLE IS SHOWN. Nothing in a pass-and-play game is secret — John,
 * 2026-09-28: "there are no secrets because they are face up" — so every
 * table and every hand can be looked at by anybody, read-only. The pass
 * screen opens on the table of whoever has just played (the first player's,
 * before anybody has), and a swipe steps round every player in seat order,
 * resigned ones included.
 */
export function passViewStart(game: PartyGame): number {
  return game.passedBy ?? game.turn;
}

/** The player a swipe or an arrow shows next: `by` seats on, round the table. */
export function stepView(game: PartyGame, from: number, by: number): number {
  const count = game.players.length;
  return (((from + by) % count) + count) % count;
}
