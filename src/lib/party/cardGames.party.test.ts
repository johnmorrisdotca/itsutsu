import { describe, expect, it } from "vitest";

import { CARD_GAME_LIST } from "../cardGames/cardGames.constants";
import { CARD_GAME_RULES } from "../cardGames/cardGameRules";

import { PARTY_KIND_LIST, PARTY_SPECS } from "./party.constants";
import { PARTY_RULES } from "./partyRules";
import { warEnding, warWords } from "../cardGames/war/warWords";
import type { PartyRules } from "./party.types";

/**
 * THE FAMILY CARD GAMES AS PARTY GAMES: hearts, spades, bigTwo, president,
 * goFish, crazyEights, ginRummy, euchre, cribbage, ohHell and war are party kinds, their rules the party table's rules, and what
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

/**
 * WAR, at the party table: two players, one move, and nothing to choose, so a
 * computer's turn is exactly a person's. The rules are Toranpu's; what the
 * site decides is who may sit, which lengths it offers, and what the table says.
 */
describe("war at the party table", () => {
  const rules = CARD_GAME_RULES.war;
  const names = ["Ann", "Ben"];

  it("seats exactly two, and refuses a length the table does not offer", () => {
    expect(rules.start(100, ["Ann"], undefined, 1)).toBeNull();
    expect(rules.start(100, ["Ann", "Ben", "Cy"], undefined, 1)).toBeNull();
    expect(rules.start(7, names, undefined, 1)).toBeNull();
    for (const size of PARTY_SPECS.war.sizes) expect(rules.start(size, names, undefined, 1)).not.toBeNull();
  });

  it("offers four lengths, the usual one 100, never more than a set-up shows", () => {
    expect(PARTY_SPECS.war.sizes).toEqual([50, 100, 200, 1000]);
    expect(PARTY_SPECS.war.defaultSize).toBe(100);
    expect(PARTY_SPECS.war.defaultPlayers).toBe(2);
  });

  it("is played by turning the cards over, and the computer makes that very move", () => {
    const game = rules.start(100, names, undefined, 4, [false, true])!;
    expect(rules.moves(game)).toEqual([{ turn: true }]);
    expect(rules.toPlay(game)).toBe(0);
    expect(rules.computer(game)).toEqual({ turn: true });
    // Both seats computers: the table still waits on somebody, the first seat, and a computer's move is the same.
    const both = rules.start(100, names, undefined, 4, [true, true])!;
    expect(rules.toPlay(both)).toBe(0);
    expect(rules.play(both, rules.computer(both))).not.toBeNull();
  });

  it("deals twenty-six cards each and keeps all fifty-two cards through every turn of a game", () => {
    let game = rules.start(50, names, undefined, 9, [false, false])!;
    expect(game.hands.map((hand) => hand.length)).toEqual([26, 26]);
    while (!rules.over(game)) {
      const next = rules.play(game, { turn: true })!;
      expect(next.hands[0].length + next.hands[1].length).toBe(52);
      game = next;
    }
    expect(rules.winners(game).length).toBeGreaterThan(0);
    expect(rules.moves(game)).toEqual([]);
    expect(game.ended).not.toBeNull();
  });

  it("reads a kept game back as the same game, and plays on from it exactly as the first would have", () => {
    let game = rules.start(200, names, undefined, 12, [false, true])!;
    for (let turn = 0; turn < 30; turn += 1) game = rules.play(game, { turn: true })!;
    const back = rules.decode(rules.encode(game))!;
    expect(back).toEqual(game);
    expect(rules.play(back, { turn: true })).toEqual(rules.play(game, { turn: true }));
  });

  it("says each turn in words, a war and how the game ended", () => {
    const name = (seat: number) => names[seat];
    expect(warWords(rules.start(100, names, undefined, 1)!, name)).toBe("Turn the cards over to begin.");
    let game = rules.start(1000, names, undefined, 5, [false, false])!;
    let sawWar = false;
    let sawPlain = false;
    while (!rules.over(game)) {
      game = rules.play(game, { turn: true })!;
      const said = warWords(game, name);
      if (game.last !== null && game.last.wars > 0 && game.last.winner !== null) {
        sawWar = true;
        expect(said).toMatch(/^Both turned \w+: war! Ann turned .* and Ben turned .*\. (Ann|Ben) takes all \d+ cards\.$/);
      } else if (game.last !== null && game.last.winner !== null) {
        sawPlain = true;
        expect(said).toMatch(/^Ann turned .* and Ben turned .*\. (Ann|Ben) takes both\.$/);
      }
    }
    expect(sawWar && sawPlain).toBe(true);
    const ending = warEnding(game, name);
    expect(ending.line.length).toBeGreaterThan(0);
    // A game turned to its last card says who holds every one; one cut off at its turn limit says the turns ran out.
    const cut = rules.start(50, names, undefined, 3, [false, false])!;
    let at = cut;
    while (!rules.over(at)) at = rules.play(at, { turn: true })!;
    if (at.ended === "limit") expect(warEnding(at, name).line).toMatch(/turns have run out/);
  });
});
