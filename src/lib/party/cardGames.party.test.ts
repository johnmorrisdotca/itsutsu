import { describe, expect, it } from "vitest";

import { CARD_GAME_LIST } from "../cardGames/cardGames.constants";
import { CARD_GAME_RULES } from "../cardGames/cardGameRules";

import { PARTY_KIND_LIST, PARTY_SPECS } from "./party.constants";
import { PARTY_RULES } from "./partyRules";
import type { PartyRules } from "./party.types";

/**
 * THE FAMILY CARD GAMES AS PARTY GAMES: hearts, spades, bigTwo, president,
 * goFish, crazyEights, ginRummy, euchre, cribbage and ohHell are party kinds, their rules the party table's rules, and what
 * makes a card game at the party table — a deal shuffled from the seed, and a
 * computer in any seat — holds through the party contract. The rules of each
 * game are tested beside them (`src/lib/cardGames/*`).
 */
describe("the family card games at the party table", () => {
  it.each(CARD_GAME_LIST)("%s is a party kind whose rules are its own", (kind) => {
    expect(PARTY_KIND_LIST).toContain(kind);
    expect(PARTY_RULES[kind]).toBe(CARD_GAME_RULES[kind]);
  });

  it.each(CARD_GAME_LIST)("%s deals the same hands from the same seed, and other hands from another", (kind) => {
    const rules = PARTY_RULES[kind] as PartyRules<unknown, unknown>;
    const spec = PARTY_SPECS[kind];
    const names = new Array<string>(spec.defaultPlayers).fill("");
    const one = rules.encode(rules.start(spec.defaultSize, names, undefined, 7));
    expect(rules.encode(rules.start(spec.defaultSize, names, undefined, 7))).toBe(one);
    const a = CARD_GAME_RULES[kind].start(spec.defaultSize, names, undefined, 7) as unknown as { hands: string[][] };
    const b = CARD_GAME_RULES[kind].start(spec.defaultSize, names, undefined, 8) as unknown as { hands: string[][] };
    expect(a.hands).not.toEqual(b.hands);
  });

  it.each(CARD_GAME_LIST)("%s seats a computer where the table says, and its computer's move is one the rules offer", (kind) => {
    const rules = CARD_GAME_RULES[kind] as unknown as {
      start: (size: number, players: readonly string[], language: undefined, seed: number, computers: readonly boolean[]) => unknown;
      seats: (game: unknown) => { computers: readonly boolean[] };
      computer: (game: unknown) => unknown;
      play: (game: unknown, move: unknown) => unknown;
    };
    const spec = PARTY_SPECS[kind];
    const computers = Array.from({ length: spec.defaultPlayers }, (_, seat) => seat > 0);
    const game = rules.start(spec.defaultSize, new Array<string>(spec.defaultPlayers).fill(""), undefined, 3, computers);
    expect(rules.seats(game).computers).toEqual(computers);
    expect(rules.play(game, rules.computer(game))).not.toBeNull();
  });
});
