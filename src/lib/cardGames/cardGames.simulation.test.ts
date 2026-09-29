import { describe, expect, it } from "vitest";

import { seededRandom } from "../puzzles/random";

import { CARD_GAME_RULES } from "./cardGameRules";
import { CARD_GAME_LIST, CARD_GAME_SPECS } from "./cardGames.constants";
import type { CardGameKind } from "./cardGames.constants";
import type { CardGameRules } from "./cardGames.types";

/**
 * THE FAMILY CARD GAMES PLAYED OUT, many times, at every table they offer:
 * the simulator's questions (`simulation.test.ts` asks them of every board
 * game) asked of a card game, with its computer players at the table.
 *
 * - Computers alone, at every size and number of players, finish every game,
 *   and every seat wins some of them.
 * - A computer never makes a move the rules would refuse, and never finds
 *   itself with nothing to do.
 * - A computer beats players who choose at random, far more often than a
 *   random player would: a strategy, not a coin.
 * - A game kept half way reads back as exactly that game, and reloading it
 *   can never re-deal: the same seed and moves make the same cards.
 *
 * The party gate (`party.coverage.test.ts`) plays every one of them at random
 * as well, as it does every party game.
 */

type AnyRules = CardGameRules<unknown, unknown>;
const rulesOf = (kind: CardGameKind) => CARD_GAME_RULES[kind] as AnyRules;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** One game played to its end, each seat by its computer or at random; the winners, and the game. */
function playOut(rules: AnyRules, size: number, count: number, seed: number, random: readonly boolean[]) {
  const pick = seededRandom(seed * 7 + 3);
  let game = rules.start(size, new Array<string>(count).fill(""), undefined, seed, random.map((chance) => !chance));
  if (game === null) throw new Error(`no table of ${count} at size ${size}`);
  let mid: unknown = null;
  for (let step = 0; !rules.over(game); step += 1) {
    if (step > 20_000) throw new Error("a game that does not end");
    const seat = rules.toPlay(game);
    expect(seat).not.toBeNull();
    const offered = rules.moves(game);
    expect(offered.length, "a game not over offers no move").toBeGreaterThan(0);
    const move = random[seat as number] ? offered[Math.floor(pick() * offered.length)] : rules.computer(game);
    if (!random[seat as number]) expect(offered.some((allowed) => same(allowed, move)), `the computer chose ${JSON.stringify(move)}, which the rules do not offer`).toBe(true);
    const next = rules.play(game, move);
    expect(next, `the rules refused ${JSON.stringify(move)}`).not.toBeNull();
    game = next;
    if (step === 40) mid = game;
  }
  return { winners: rules.winners(game), game, mid };
}

describe("the family card games, played out", () => {
  it.each(CARD_GAME_LIST)("%s: computers alone finish every game at every table, and every seat wins some", (kind) => {
    const rules = rulesOf(kind);
    const spec = CARD_GAME_SPECS[kind];
    for (const size of spec.sizes) {
      for (let count = spec.fewestPlayers; count <= spec.mostPlayers; count += 1) {
        const won = new Set<number>();
        // Enough games that a seat with a fair share of the wins is all but sure to take one: eight a seat.
        for (let game = 0; game < Math.max(24, count * 8); game += 1) {
          const { winners } = playOut(rules, size, count, 1000 * size + 100 * count + game, new Array<boolean>(count).fill(false));
          expect(winners.length).toBeGreaterThan(0);
          winners.forEach((seat) => won.add(seat));
        }
        expect(won.size, `${kind} ${size} for ${count}: a seat never won`).toBe(count);
      }
    }
  });

  it.each(CARD_GAME_LIST)("%s: a computer beats players choosing at random", (kind) => {
    const rules = rulesOf(kind);
    const spec = CARD_GAME_SPECS[kind];
    const count = spec.defaultPlayers;
    let wins = 0;
    const games = 60;
    for (let game = 0; game < games; game += 1) {
      // The computer takes each seat in turn, so no seat's advantage is counted as skill.
      const seat = game % count;
      const random = Array.from({ length: count }, (_, at) => at !== seat);
      const { winners } = playOut(rules, spec.defaultSize, count, 50_000 + game, random);
      if (winners.includes(seat)) wins += 1;
    }
    // Chance alone wins one game in `count`; a strategy should win at least half as often again.
    expect(wins / games, `${kind}: the computer won ${wins} of ${games}`).toBeGreaterThan((1.5 / count));
  });

  it.each(CARD_GAME_LIST)("%s: a game kept half way reads back exactly, and deals the same cards again", (kind) => {
    const rules = rulesOf(kind);
    const spec = CARD_GAME_SPECS[kind];
    const random = new Array<boolean>(spec.defaultPlayers).fill(false);
    const { mid, game } = playOut(rules, spec.defaultSize, spec.defaultPlayers, 99, random);
    expect(mid).not.toBeNull();
    expect(rules.decode(rules.encode(mid))).toEqual(mid);
    expect(rules.decode(rules.encode(game))).toEqual(game);
    expect(rules.decode(null)).toBeNull();
    expect(rules.decode("{}")).toBeNull();
    const again = rules.start(spec.defaultSize, new Array<string>(spec.defaultPlayers).fill(""), undefined, 99);
    const other = rules.start(spec.defaultSize, new Array<string>(spec.defaultPlayers).fill(""), undefined, 100);
    expect(same(again, rules.start(spec.defaultSize, new Array<string>(spec.defaultPlayers).fill(""), undefined, 99))).toBe(true);
    expect(same(again, other)).toBe(false);
  });

  it.each(CARD_GAME_LIST)("%s: remembers which seats a computer plays", (kind) => {
    const rules = rulesOf(kind);
    const spec = CARD_GAME_SPECS[kind];
    const computers = Array.from({ length: spec.defaultPlayers }, (_, seat) => seat > 0);
    const game = rules.start(spec.defaultSize, new Array<string>(spec.defaultPlayers).fill(""), undefined, 5, computers);
    expect(rules.seats(rules.decode(rules.encode(game))!).computers).toEqual(computers);
  });
});
