// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { decodeGrid, encodeGrid, lettersOf, sameLetters, type GridVerdict } from "../../puzzles/kumimoji/grid";
import { drawAll, mayDrawAll, partyFits, startParty, withSeatPlay } from "../../puzzles/kumimoji/party";
import type { PartyGame } from "../../puzzles/kumimoji/party.types";
import { decodeParty, encodeParty, readSettings } from "../../puzzles/kumimoji/partyKept";
import { endTurn, mayResign, resign, winnersOf } from "../../puzzles/kumimoji/partyTurns";
import { familyKeyOf } from "../../puzzles/kumimoji/tileFamily";
import { JAPANESE_TILE_MIX, KUMIMOJI_HANDS, KUMIMOJI_PARTY, KUMIMOJI_TRADE, TILE_MIX_TOTAL, kumimojiTileCount, kumimojiWildCount } from "../../puzzles/kumimoji/tiles.constants";

import { COMPUTER_SEAT_NAME } from "./online.constants";
import type { OnlineRules } from "./online.types";

/**
 * KUMIMOJI'S PASS AND PLAY ON SEVERAL DEVICES: each player's hand and table on
 * their own device, the bag shared.
 *
 * JOHN'S TWO DECISIONS, 2026-09-29: "yes, all hands visible and browser
 * checks to save $$$." So every seat is sent the whole game, as on one device,
 * and the words are the browser's word: the server never loads a dictionary.
 * What it checks, because it costs nothing: the move's shape, whose turn it
 * is, the game the page drew it from, and that every tile the seat now holds
 * came from its hand, its table or the pool — nothing made up, nothing lost
 * (`withSeat`). How a turn passes on — who is next, the last round, going out,
 * resigning, who wins — is the game's own pure rules (`partyTurns.ts`), run
 * on the server with the browser's word for the two things only the word list
 * knows: whether the table is sound, and whether the hand spells a word.
 *
 * A MOVE IS A TURN, OR A DRAW WITHIN ONE. What a player does between presses —
 * lay, lift, turn a wild, trade — stays on their own device, and reaches the
 * table as the seat it leaves (`KumimojiSeat`) at one of three presses: Draw
 * (everybody takes a tile, and the turn goes on), Done, or Resign. A
 * computer's turn is several stages sent at once: every Draw it made, then its
 * Done or Resign.
 */

/** A seat as a turn leaves it: its hand, its table (as `encodeGrid` writes it), and the shared pool's two counters. */
export type KumimojiSeat = { hand: string; grid: string; returned: string; taken: number };

/** One press: the seat as it stands, what was pressed, and the browser's word on the table and the hand. */
export type KumimojiStage = { seat: KumimojiSeat; then: "draw" | "done" | "resign"; sound: boolean; spells: boolean };

/** A move: one stage for a person's press, several for a computer's whole turn, every stage but the last a Draw. */
export type KumimojiMove = { stages: readonly KumimojiStage[] };

/** What the set-up sends to start a table: its settings, and the bag its browser dealt from the seed. */
type KumimojiSetUp = { settings: unknown; bag: unknown };

/** The most stages a move may carry: a computer's longest turn, with room. */
const STAGES_MOST = 16;

/** The longest a Kumimoji move may be as JSON: a large table in every stage. */
export const KUMIMOJI_MOVE_LONGEST = 60_000;

/** A seat's table read back, or null. */
function readSeat(sent: unknown): KumimojiSeat | null {
  if (typeof sent !== "object" || sent === null) return null;
  const { hand, grid, returned, taken } = sent as Record<string, unknown>;
  if (typeof hand !== "string" || typeof grid !== "string" || typeof returned !== "string" || !Number.isInteger(taken)) return null;
  if (hand.length > 400 || grid.length > 8_000 || returned.length > 400 || (taken as number) < 0) return null;
  return { hand, grid, returned, taken: taken as number };
}

/** The verdict the browser gave, as the rules read it: only `sound` is asked of it. */
function claimed(sound: boolean): GridVerdict {
  return { sound, tiles: 0, misspelt: new Set(), apart: new Set(), notWords: [] };
}

/**
 * THE SEAT A TURN LEAVES, CHECKED AGAINST THE GAME IT WAS PLAYED FROM, and put
 * in place — or null when it holds a tile it could not have. The pool only
 * grows at its end (a trade gives a tile back); its counter only moves on;
 * nothing is taken but from the pool, never more than three for each tile
 * given back (`KUMIMOJI_TRADE`); and what the seat holds, in hand and on its
 * table, is exactly what it held, plus what it took, less what it gave back —
 * counted by tile, a wild with any face being the wild.
 */
export function withSeat(game: PartyGame, seat: KumimojiSeat): PartyGame | null {
  const before = game.players[game.turn];
  if (before === undefined || game.ending !== null) return null;
  const tiles = decodeGrid(seat.grid);
  if (tiles === null || !seat.returned.startsWith(game.returned)) return null;
  const line = game.bag + seat.returned;
  if (seat.taken < game.taken || seat.taken > line.length) return null;
  const drawn = [...line.slice(game.taken, seat.taken)];
  const given = [...seat.returned.slice(game.returned.length)];
  if (drawn.length > KUMIMOJI_TRADE.take * given.length) return null;
  const family = familyKeyOf(game.settings.language);
  const had = [...before.hand, ...before.tiles.values(), ...drawn].map(family);
  const back = given.map(family);
  const holds = [...seat.hand, ...tiles.values()].map(family);
  if ([...had, ...back, ...holds].some((tile) => tile === null)) return null;
  const tally = lettersOf(had as string[]);
  for (const tile of back as string[]) tally.set(tile, (tally.get(tile) ?? 0) - 1);
  for (const [tile, count] of tally) if (count === 0) tally.delete(tile);
  if (!sameLetters(tally, lettersOf(holds as string[]))) return null;
  return withSeatPlay(game, { bag: game.bag, returned: seat.returned, taken: seat.taken, tiles, hand: [...seat.hand] });
}

/** A seat as the game holds it now, for a stage. */
export function seatOf(game: PartyGame): KumimojiSeat {
  const player = game.players[game.turn]!;
  return { hand: player.hand.join(""), grid: encodeGrid(player.tiles), returned: game.returned, taken: game.taken };
}

/**
 * THE BAG A SET-UP SENT, checked for what can be checked without the lists:
 * settings the game offers, at the table's hand size; every tile one of the
 * set's; as many tiles, and as many wilds, as that game is dealt from; and a
 * bag that deals to this many. Which letters it holds is the set-up browser's
 * word, as the words are.
 */
function readSetUp(sent: unknown, size: number, count: number): { settings: PartyGame["settings"]; bag: string } | null {
  if (typeof sent !== "object" || sent === null) return null;
  const { settings: raw, bag } = sent as KumimojiSetUp;
  const settings = readSettings(raw);
  if (settings === null || settings.size !== size || typeof bag !== "string" || bag.length > 1_000) return null;
  const family = familyKeyOf(settings.language);
  const tiles = [...bag].map(family);
  if (tiles.some((tile) => tile === null)) return null;
  const english = settings.language === "english";
  const setSize = english ? TILE_MIX_TOTAL : Object.values(JAPANESE_TILE_MIX).reduce((sum, one) => sum + one, 0);
  const expected = kumimojiTileCount(size, settings.gameLength, setSize, english && settings.doubleSet);
  if (tiles.length !== expected || tiles.filter((tile) => tile === "*").length !== kumimojiWildCount(size, settings.level, expected)) return null;
  return partyFits(count, size, tiles.length) ? { settings, bag } : null;
}

export const KUMIMOJI_ONLINE: OnlineRules<PartyGame, KumimojiMove> = {
  sizes: Object.values(KUMIMOJI_HANDS),
  counts: Array.from({ length: KUMIMOJI_PARTY.most - KUMIMOJI_PARTY.least + 1 }, (_, at) => KUMIMOJI_PARTY.least + at),
  start: (size, count, extra) => {
    const setUp = readSetUp(extra?.setup, size, count);
    if (setUp === null) return null;
    const computers = new Set(extra?.computers ?? []);
    const game = startParty(setUp.settings, setUp.bag, Array.from({ length: count }, (_, seat) => ({ name: "", computer: computers.has(seat) })));
    // A game its own rules cannot keep is not started: every later move is read back through them.
    return decodeParty(encodeParty(game), familyKeyOf(setUp.settings.language)) === null ? null : game;
  },
  encode: encodeParty,
  decode: (text) => decodeParty(text),
  toPlay: (game) => (game.ending === null ? game.turn : null),
  winners: winnersOf,
  // Turns ended, and tiles taken since the deal: each accepted move moves one of them on, so it never repeats.
  moveCount: (game) => game.turns + game.taken - game.dealt * game.settings.size,
  moveLongest: KUMIMOJI_MOVE_LONGEST,
  readMove: (sent) => {
    if (typeof sent !== "object" || sent === null) return null;
    const { stages } = sent as { stages?: unknown };
    if (!Array.isArray(stages) || stages.length === 0 || stages.length > STAGES_MOST) return null;
    const read: KumimojiStage[] = [];
    for (const stage of stages) {
      if (typeof stage !== "object" || stage === null) return null;
      const { seat, then, sound, spells } = stage as Record<string, unknown>;
      const table = readSeat(seat);
      if (table === null || (then !== "draw" && then !== "done" && then !== "resign") || typeof sound !== "boolean" || typeof spells !== "boolean") return null;
      read.push({ seat: table, then, sound, spells });
    }
    return { stages: read };
  },
  play: (game, move) => {
    let now = game;
    for (const [at, stage] of move.stages.entries()) {
      const last = at === move.stages.length - 1;
      if (!last && stage.then !== "draw") return null;
      const seated = withSeat(now, stage.seat);
      if (seated === null) return null;
      const verdict = claimed(stage.sound);
      if (stage.then === "draw") {
        if (!mayDrawAll(seated, verdict)) return null;
        now = drawAll(seated);
        continue;
      }
      if (stage.then === "resign") return mayResign(seated) ? resign(seated) : null;
      const next = endTurn(seated, verdict, () => stage.spells);
      return next === seated ? null : next;
    }
    return now;
  },
  // A person's seat is named by the table; a computer keeps the name the deal gave it ("Computer 1").
  named: (game, names) => ({
    ...game,
    players: game.players.map((player, seat) => (player.computer === true ? player : { ...player, name: names[seat] ?? player.name })),
  }),
  computers: {
    levels: ["computer"],
    seat: () => ({ memberId: null, name: COMPUTER_SEAT_NAME }),
    levelOf: (seat) => (seat.memberId === null ? "computer" : null),
  },
};
