import { describe, expect, it } from "vitest";

import { CARD_GAME_RULES } from "../../cardGames/cardGameRules";
import { CARD_GAME_LIST, CARD_GAME_SPECS, type CardGameKind } from "../../cardGames/cardGames.constants";
import type { CardGameRules } from "../../cardGames/cardGames.types";
import { HIDDEN, CARD_GAMES_ONLINE, readCardMove, seenByCardSeat } from "./onlineCards";
import { readSeen } from "./onlineSeen";

/**
 * NO BROWSER RECEIVES ANOTHER PERSON'S CARDS. Every card game is played at every table
 * it offers by its own computers, and at every step, from what the server would send each
 * seat, looks for any card that seat could not see. The search is over the whole text
 * sent, not the field a page draws, so a card that leaked by a field nobody thought of
 * fails too. Only what the whole table has watched is left out of the search, because a
 * later deal uses the same pack: the cards played and a finished hand's result.
 */

type Loose = Record<string, unknown> & { hands: string[][]; players: string[]; moves: unknown[] };
const rulesOf = (kind: CardGameKind) => CARD_GAME_RULES[kind] as unknown as CardGameRules<Loose, unknown>;

/** The cards a seat may not see: everybody else's hand, the stock, and each game's own face-down lists, less what this seat knows from having handled it or seen it played. */
function secretsFrom(kind: CardGameKind, game: Loose, seat: number): string[] {
  const out = new Set<string>();
  game.hands.forEach((hand, at) => {
    if (at !== seat || kind === "war") for (const card of hand) out.add(card);
  });
  for (const card of (game.stock as string[] | undefined) ?? []) out.add(card);
  if (kind === "cribbage") {
    (game.kept as string[][]).forEach((kept, at) => {
      if (at !== seat) for (const card of kept) out.add(card);
    });
    for (const card of game.crib as string[]) out.add(card);
    if (game.starter === null) out.add(game.cut as string);
    // Pegged cards are face up, though still counted in the hand they came from.
    for (const { card } of game.pegged as { card: string }[]) out.delete(card);
    // And its own cards, set aside into the crib or kept, it has held.
    for (const card of (game.hands[seat] ?? []).concat((game.kept as string[][])[seat] ?? [])) out.delete(card);
  }
  if (kind === "hearts") {
    (game.passing as (string[] | null)[]).forEach((passing, at) => {
      if (at !== seat) for (const card of passing ?? []) out.add(card);
    });
    (game.received as string[][]).forEach((received, at) => {
      if (at !== seat) for (const card of received) out.add(card);
    });
    // What it passed and what it was passed, it has seen.
    for (const card of ((game.passing as (string[] | null)[])[seat] ?? []).concat((game.received as string[][])[seat] ?? [])) out.delete(card);
  }
  if (kind === "president") {
    for (const swap of game.swaps as { from: number; to: number; cards: string[] }[]) if (swap.from === seat || swap.to === seat) for (const card of swap.cards) out.delete(card);
  }
  // A card seen by everybody is no secret however else it is held: one turned up, or taken from the pile in sight of the table.
  for (const open of [game.upcard, game.turned]) out.delete(open as string);
  for (const picked of (game.picked as string[][] | undefined) ?? []) for (const card of picked) out.delete(card);
  return [...out];
}

/** What a seat is sent, less what the whole table has watched go down: a new deal uses the same pack, so a card in that record can be in somebody's hand now, and says nothing about it. */
function searchable(sent: Loose): string {
  const { results: _results, dealScores: _dealScores, rounds: _rounds, deals: _deals, played: _played, lastTrick: _lastTrick, trick: _trick, pile: _pile, run: _run, pegged: _pegged, discard: _discard, opening: _opening, last, ...rest } = sent;
  const turnedUp = (last as { laid?: { card: string; down: boolean }[] } | null | undefined)?.laid?.filter((one) => one.down);
  return JSON.stringify({ ...rest, down: turnedUp });
}

function tables(kind: CardGameKind): [number, number][] {
  const spec = CARD_GAME_SPECS[kind];
  return Array.from({ length: spec.mostPlayers - spec.fewestPlayers + 1 }, (_, at): [number, number] => [spec.defaultSize, spec.fewestPlayers + at]);
}

const CASES = CARD_GAME_LIST.flatMap((kind) => tables(kind).map(([size, count]): [CardGameKind, number, number] => [kind, size, count]));

describe.each(CASES)("%s to %i for %i", (kind, size, count) => {
  const rules = rulesOf(kind);
  const online = CARD_GAMES_ONLINE[kind];
  const flags = Array.from({ length: count }, () => true);
  const STEPS = 240;

  it("sends no seat a card it may not see, nor the seed, nor the moves, at any step", () => {
    let game = rules.start(size, new Array<string>(count).fill(""), undefined, 20261031 + count, flags)!;
    for (let step = 0; step < STEPS && !rules.over(game); step += 1) {
      for (let seat = 0; seat < count; seat += 1) {
        const text = online.seatState!(rules.encode(game), seat);
        const sent = readSeen<Loose>(kind, text)!;
        expect(sent.seed).toBe(0);
        expect(sent.moves).toEqual([]);
        const shown = searchable(sent);
        for (const card of secretsFrom(kind, game, seat)) expect(shown.includes(`"${card}"`), `${kind} step ${step}: seat ${seat} was sent ${card}`).toBe(false);
        // Every hand keeps its size, so the table can say how many each holds.
        expect(sent.hands.map((hand) => hand.length)).toEqual(game.hands.map((hand) => hand.length));
      }
      game = rules.play(game, rules.computer(game))!;
    }
  });

  it("gives a seat its own hand, and the same moves from what it was sent as the whole game offers", () => {
    let game = rules.start(size, new Array<string>(count).fill(""), undefined, 777 + count, flags)!;
    for (let step = 0; step < STEPS && !rules.over(game); step += 1) {
      const seat = rules.toPlay(game)!;
      const sent = readSeen<Loose>(kind, online.seatState!(rules.encode(game), seat))!;
      if (kind !== "war") {
        expect(sent.hands[seat]).toEqual(game.hands[seat]);
        expect(sent.hands.filter((_, at) => at !== seat).flat().every((card) => card === HIDDEN)).toBe(true);
      }
      if (kind !== "war") expect(rules.moves(sent), `${kind} step ${step}`).toEqual(rules.moves(game));
      // And a move offered is one the rules take from what the seat holds, without looking at anything hidden.
      for (const move of rules.moves(sent).slice(0, 4)) expect(() => rules.play(sent, move)).not.toThrow();
      game = rules.play(game, rules.computer(game))!;
    }
  });

  it("has a computer that chooses the same from its own seat's view as from the whole game", () => {
    let game = rules.start(size, new Array<string>(count).fill(""), undefined, 4242 + count, flags)!;
    for (let step = 0; step < STEPS && !rules.over(game); step += 1) {
      const seat = rules.toPlay(game)!;
      const sent = seenByCardSeat(kind, game, seat) as Loose;
      expect(rules.computer(sent), `${kind} step ${step}`).toEqual(rules.computer(game));
      game = rules.play(game, rules.computer(game))!;
    }
  });
});

describe.each(CARD_GAME_LIST)("%s on the server", (kind) => {
  const rules = rulesOf(kind);
  const online = CARD_GAMES_ONLINE[kind];

  it("takes a seed of its own for every table, and reads back exactly what it stored", () => {
    const spec = CARD_GAME_SPECS[kind];
    const games = Array.from({ length: 8 }, () => online.start(spec.defaultSize, spec.defaultPlayers) as unknown as { seed: number; players: string[] });
    expect(new Set(games.map((game) => game.seed)).size).toBeGreaterThan(5);
    expect(online.encode(online.decode(online.encode(games[0] as never))! as never)).toBe(online.encode(games[0] as never));
  });

  it("refuses a move with a card the mover does not hold: another seat's, or one that is no card", () => {
    if (kind === "war" || kind === "goFish") return;
    const spec = CARD_GAME_SPECS[kind];
    let game = rules.start(spec.defaultSize, new Array<string>(spec.defaultPlayers).fill(""), undefined, 99, new Array<boolean>(spec.defaultPlayers).fill(true))!;
    // On to where a card is played: a pass, a bid or a crib comes first in some.
    for (let step = 0; step < 60 && !rules.moves(game).some((move) => "play" in (move as object) || "discard" in (move as object)); step += 1) game = rules.play(game, rules.computer(game))!;
    const seat = rules.toPlay(game);
    expect(seat).not.toBeNull();
    const theirs = game.hands.find((_, at) => at !== seat)!.find((card) => !game.hands[seat!]!.includes(card))!;
    const key = rules.moves(game).some((move) => "play" in (move as object)) ? "play" : "discard";
    for (const card of [theirs, HIDDEN, "nonsense"]) {
      const value = kind === "bigTwo" || kind === "president" ? [card] : card;
      const read = readCardMove({ [key]: value });
      expect(read === null || online.play(game as never, read as object) === null, `${kind} took ${card}`).toBe(true);
    }
  });
});

describe("what is kept from a seat in particular", () => {
  it("President: the cards swapped are known to the two who swapped them", () => {
    const game = { hands: [["AS"], ["2S"], ["3S"]], toPlay: 0, swaps: [{ from: 0, to: 1, cards: ["KS"] }], seed: 1, moves: [] };
    expect((seenByCardSeat("president", game, 0) as typeof game).swaps[0]!.cards).toEqual(["KS"]);
    expect((seenByCardSeat("president", game, 1) as typeof game).swaps[0]!.cards).toEqual(["KS"]);
    expect((seenByCardSeat("president", game, 2) as typeof game).swaps[0]!.cards).toEqual([HIDDEN]);
  });

  it("Crazy Eights and Gin Rummy: a card just drawn is the drawer's", () => {
    const crazy = { hands: [["AS"], ["2S"]], stock: ["3S"], toPlay: 0, drawn: "AS", seed: 1, moves: [] };
    expect((seenByCardSeat("crazyEights", crazy, 0) as typeof crazy).drawn).toBe("AS");
    expect((seenByCardSeat("crazyEights", crazy, 1) as typeof crazy).drawn).toBe(HIDDEN);
    const gin = { hands: [["AS"], ["2S"]], stock: ["3S"], toPlay: 0, taken: "AS", seed: 1, moves: [] };
    expect((seenByCardSeat("ginRummy", gin, 1) as typeof gin).taken).toBe(HIDDEN);
  });

  it("War: a card laid face down in a war stays face down", () => {
    const war = { hands: [["AS"], ["2S"]], toPlay: 0, last: { laid: [{ seat: 0, card: "KS", down: true }, { seat: 1, card: "QS", down: false }], wars: 1, winner: 1 }, seed: 1, moves: [] };
    const sent = seenByCardSeat("war", war, 0) as typeof war;
    expect(sent.last.laid.map((one) => one.card)).toEqual([HIDDEN, "QS"]);
    expect(sent.hands).toEqual([[HIDDEN], [HIDDEN]]);
  });
});

describe("what a browser sends", () => {
  it("is read for its shape only", () => {
    expect(readCardMove({ play: "AS" })).toEqual({ play: "AS" });
    expect(readCardMove({ play: ["AS", "AH"] })).toEqual({ play: ["AS", "AH"] });
    expect(readCardMove({ ask: 1, rank: "A" })).toEqual({ ask: 1, rank: "A" });
    expect(readCardMove({ pass: true })).toEqual({ pass: true });
    for (const sent of [null, "AS", [], {}, { play: { a: 1 } }, { play: "x".repeat(40) }, { a: 1, b: 2, c: 3 }, { play: new Array(40).fill("AS") }]) expect(readCardMove(sent)).toBeNull();
  });
});
