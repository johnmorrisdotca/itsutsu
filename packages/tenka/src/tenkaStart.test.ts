import { describe, expect, it } from "vitest";

import { TENKA_NEUTRAL, TENKA_PHASES, TENKA_PLACING, TENKA_STARTING_ARMIES, TENKA_WORLD_ROUNDS } from "./tenka.constants.ts";
import { playTenka } from "./tenka.ts";
import { TENKA_TERRITORY_COUNT } from "./tenkaMap.ts";
import { startTenka, tenkaAgain } from "./tenkaStart.ts";
import { armiesHeld, reinforcementFor, territoriesHeld } from "./tenkaTurn.ts";

/** How a game of tenka starts, at every table it is offered for. */

const names = (count: number) => Array.from({ length: count }, (_, at) => `P${at + 1}`);

describe("the start of a game of tenka", () => {
  it.each([2, 3, 4, 5, 6])("deals the world round a table of %i and gives each player the standard armies", (count) => {
    const game = startTenka(TENKA_WORLD_ROUNDS, names(count), 1234)!;
    expect(game).not.toBeNull();
    expect(game.owners.length).toBe(TENKA_TERRITORY_COUNT);
    expect(game.armies.every((armies) => armies >= 1)).toBe(true);
    const shares = names(count).map((_, seat) => territoriesHeld(game.owners, seat));
    const dealtTo = count === 2 ? [...shares, territoriesHeld(game.owners, TENKA_NEUTRAL)] : shares;
    // Dealt one at a time round the table: nobody has more than one territory more than anybody else.
    expect(Math.max(...dealtTo) - Math.min(...dealtTo)).toBeLessThanOrEqual(1);
    expect(dealtTo.reduce((sum, held) => sum + held, 0)).toBe(TENKA_TERRITORY_COUNT);
    // Placed at random: every player's starting armies are on the map, all of them.
    for (let seat = 0; seat < count; seat += 1) expect(armiesHeld(game, seat)).toBe(TENKA_STARTING_ARMIES[count]);
    // The first turn begins at once for the player drawn to go first, with their reinforcements waiting.
    expect(game.phase).toBe(TENKA_PHASES.reinforce);
    expect(game.toPlay).toBe(game.first);
    expect(game.first).toBeGreaterThanOrEqual(0);
    expect(game.first).toBeLessThan(count);
    expect(game.reserve).toBe(reinforcementFor(game.owners, game.first));
    expect(game.round).toBe(1);
    expect(game.deck.length).toBe(44);
    expect(game.hands.every((hand) => hand.length === 0)).toBe(true);
  });

  it("gives a table of two a neutral army of forty, holding a third of the world", () => {
    const game = startTenka(TENKA_WORLD_ROUNDS, names(2), 77)!;
    expect(territoriesHeld(game.owners, TENKA_NEUTRAL)).toBe(14);
    expect(territoriesHeld(game.owners, 0)).toBe(14);
    expect(armiesHeld(game, TENKA_NEUTRAL)).toBe(40);
  });

  it("draws everything from its seed: the same seed, the same game; another seed, another", () => {
    expect(startTenka(20, names(4), 5)).toEqual(startTenka(20, names(4), 5));
    expect(startTenka(20, names(4), 5)!.owners).not.toEqual(startTenka(20, names(4), 6)!.owners);
  });

  it("places by hand one army at a time round the table, then the first turn begins", () => {
    let game = startTenka(10, names(3), 42, TENKA_PLACING.hand)!;
    expect(game.phase).toBe(TENKA_PHASES.setUp);
    expect(game.setUpLeft).toEqual(names(3).map((_, seat) => TENKA_STARTING_ARMIES[3] - territoriesHeld(game.owners, seat)));
    const order: number[] = [];
    while (game.phase === TENKA_PHASES.setUp) {
      order.push(game.toPlay);
      const mine = game.owners.indexOf(game.toPlay);
      // Two at once, or on somebody else's territory: refused.
      expect(playTenka(game, { kind: "place", territory: mine, armies: 2 })).toBeNull();
      expect(playTenka(game, { kind: "place", territory: game.owners.findIndex((owner) => owner !== game.toPlay), armies: 1 })).toBeNull();
      game = playTenka(game, { kind: "place", territory: mine, armies: 1 })!;
    }
    expect(order.slice(0, 3)).toEqual([game.first, (game.first + 1) % 3, (game.first + 2) % 3]);
    for (let seat = 0; seat < 3; seat += 1) expect(armiesHeld(game, seat)).toBe(TENKA_STARTING_ARMIES[3]);
    expect(game.phase).toBe(TENKA_PHASES.reinforce);
    expect(game.toPlay).toBe(game.first);
  });

  it("is offered only for two to six, for the lengths of game on offer, from a seed that is one", () => {
    expect(startTenka(TENKA_WORLD_ROUNDS, names(1), 1)).toBeNull();
    expect(startTenka(TENKA_WORLD_ROUNDS, names(7), 1)).toBeNull();
    expect(startTenka(15, names(3), 1)).toBeNull();
    expect(startTenka(TENKA_WORLD_ROUNDS, names(3), -1)).toBeNull();
    expect(startTenka(TENKA_WORLD_ROUNDS, names(3), 1.5)).toBeNull();
  });

  it("tidies the names it is given", () => {
    const game = startTenka(10, ["  Ann   Lee ", "", "x".repeat(40)], 3)!;
    expect(game.players).toEqual(["Ann Lee", "", "x".repeat(20)]);
  });

  it("plays again at the same table from a new seed", () => {
    const game = startTenka(20, names(4), 9)!;
    const again = tenkaAgain(game, 10)!;
    expect(again.players).toEqual(game.players);
    expect(again.rounds).toBe(20);
    expect(again.seed).toBe(10);
    expect(again.moves).toEqual([]);
  });
});
