import { describe, expect, it } from "vitest";

import { TENKA_NEUTRAL, TENKA_PHASES, TENKA_WORLD_ROUNDS } from "./tenka.constants";
import type { TenkaGame, TenkaMove } from "./tenka.types";
import { mustTrade, playTenka } from "./tenka";
import { battleLosses, defendDice, throwDice } from "./tenkaDice";
import { decodeTenka, encodeTenka } from "./tenkaKeep";
import { TENKA_CONTINENTS, TENKA_TERRITORIES, TENKA_TERRITORY_COUNT } from "./tenkaMap";
import { tenkaMoves } from "./tenkaMoves";
import { TENKA_RULES } from "./tenkaRules";
import { startTenka } from "./tenkaStart";
import { reinforcementFor } from "./tenkaTurn";

/**
 * TENKA'S RULES, a turn at a time: reinforcements, the attack and the move
 * in, fortifying, cards and their schedule, knocking a player out, the win
 * and the count — and a game kept and read back exactly.
 *
 * Each case sets out the world it needs (owners, armies, hands) on a real
 * start, since a game is plain data, then plays moves through `playTenka`
 * as the table would. Dice come from the game's own random; where a case
 * needs to know how they fell, it throws them from the same state first.
 */

const at = (key: string) => TENKA_TERRITORIES.findIndex((territory) => territory.key === key);
const continent = (key: string) => TENKA_CONTINENTS.find((one) => one.key === key)!;

/** A game of three with the world set out as given: everything else seat 2's with one army, seat 0 to attack. */
function world(set: { owners?: Record<string, number>; armies?: Record<string, number>; phase?: TenkaGame["phase"]; hands?: number[][]; rounds?: number; players?: number }): TenkaGame {
  const count = set.players ?? 3;
  const base = startTenka(set.rounds ?? TENKA_WORLD_ROUNDS, Array.from({ length: count }, (_, seat) => `P${seat + 1}`), 2024)!;
  const owners = new Array<number>(TENKA_TERRITORY_COUNT).fill(count - 1);
  const armies = new Array<number>(TENKA_TERRITORY_COUNT).fill(1);
  for (const [key, owner] of Object.entries(set.owners ?? {})) owners[at(key)] = owner;
  for (const [key, count2] of Object.entries(set.armies ?? {})) armies[at(key)] = count2;
  return {
    ...base,
    first: 0,
    toPlay: 0,
    owners,
    armies,
    phase: set.phase ?? TENKA_PHASES.attack,
    reserve: 0,
    hands: set.hands ?? base.hands,
    out: base.out.map((_, seat) => !owners.includes(seat)),
  };
}

function play(game: TenkaGame, ...moves: TenkaMove[]): TenkaGame {
  return moves.reduce((now, move) => {
    const next = playTenka(now, move);
    if (next === null) throw new Error(`refused: ${JSON.stringify(move)} in ${now.phase}`);
    return next;
  }, game);
}

describe("reinforcements", () => {
  it("are one for every three territories, never fewer than three, and each continent held whole adds its bonus", () => {
    const owners = new Array<number>(TENKA_TERRITORY_COUNT).fill(1);
    expect(reinforcementFor(owners, 0)).toBe(3);
    const eleven = TENKA_TERRITORIES.map((_, territory) => territory).filter((territory) => TENKA_TERRITORIES[territory].continent === "asia");
    for (const territory of eleven) owners[territory] = 0;
    // Eleven territories: three, and Asia's seven.
    expect(reinforcementFor(owners, 0)).toBe(3 + 7);
    for (const territory of continent("oceania").territories) owners[territory] = 0;
    // Sixteen: five, Asia's seven and Oceania's two.
    expect(reinforcementFor(owners, 0)).toBe(5 + 7 + 2);
    owners[continent("asia").territories[0]] = 1;
    expect(reinforcementFor(owners, 0)).toBe(5 + 2);
  });

  it("are placed on the player's own territories, one at a time or all the rest at once, and then the attack begins", () => {
    const game = { ...world({ owners: { brazil: 0, colombia: 0 }, phase: TENKA_PHASES.reinforce }), reserve: 5 };
    expect(playTenka(game, { kind: "place", territory: at("china"), armies: 1 })).toBeNull();
    expect(playTenka(game, { kind: "place", territory: at("brazil"), armies: 6 })).toBeNull();
    expect(playTenka(game, { kind: "place", territory: at("brazil"), armies: 3 })).toBeNull();
    const placed = play(game, { kind: "place", territory: at("brazil"), armies: 1 }, { kind: "place", territory: at("brazil"), armies: 1 });
    expect(placed.armies[at("brazil")]).toBe(3);
    expect(placed.reserve).toBe(3);
    expect(placed.phase).toBe(TENKA_PHASES.reinforce);
    expect(tenkaMoves(placed).filter((move) => move.kind === "place").map((move) => (move.kind === "place" ? move.armies : 0))).toEqual([1, 3, 1, 3]);
    const done = play(placed, { kind: "place", territory: at("colombia"), armies: 3 });
    expect(done.phase).toBe(TENKA_PHASES.attack);
    // The game given is left as it was.
    expect(game.armies[at("brazil")]).toBe(1);
  });

  it("wait for cards to be traded when five are held, and a set traded adds armies on the schedule", () => {
    const hand = [0, 3, 6, 1, 4]; // three land, two sea: one set, five cards
    const game = { ...world({ owners: { alaska: 0 }, phase: TENKA_PHASES.reinforce, hands: [hand, [], []] }), reserve: 3 };
    expect(mustTrade(game)).toBe(true);
    expect(playTenka(game, { kind: "place", territory: at("alaska"), armies: 1 })).toBeNull();
    expect(tenkaMoves(game).every((move) => move.kind === "trade")).toBe(true);
    const traded = play(game, { kind: "trade", cards: [0, 3, 6] });
    expect(traded.reserve).toBe(3 + 4);
    expect(traded.hands[0]).toEqual([1, 4]);
    expect(traded.trades).toBe(1);
    expect(traded.discards).toEqual([0, 3, 6]);
    // Not a set, or not in hand: refused.
    expect(playTenka(game, { kind: "trade", cards: [0, 3, 1] })).toBeNull();
    expect(playTenka(game, { kind: "trade", cards: [9, 12, 15] })).toBeNull();
  });

  it("put two more straight onto a territory held that a traded card shows, and the next set is worth more whoever trades it", () => {
    // Card 0 is Alaska's.
    const game = { ...world({ owners: { alaska: 0 }, phase: TENKA_PHASES.reinforce, hands: [[0, 3, 6], [], []] }), reserve: 3, trades: 5 };
    const traded = play(game, { kind: "trade", cards: [6, 0, 3] });
    expect(traded.reserve).toBe(3 + 15);
    expect(traded.armies[at("alaska")]).toBe(1 + 2);
    expect(traded.lastTrade).toEqual({ seat: 0, cards: [0, 3, 6], armies: 15, bonusTerritory: at("alaska") });
  });
});

describe("the attack", () => {
  const set = () => world({ owners: { brazil: 0 }, armies: { brazil: 10, westAfrica: 3 } });

  it("is from a territory of your own with two armies or more, into a neighbour by land or sea somebody else holds", () => {
    const game = set();
    expect(playTenka(game, { kind: "attack", from: at("brazil"), to: at("westAfrica"), dice: 3 })).not.toBeNull(); // by sea
    expect(playTenka(game, { kind: "attack", from: at("brazil"), to: at("andes"), dice: 3 })).not.toBeNull(); // by land
    expect(playTenka(game, { kind: "attack", from: at("brazil"), to: at("china"), dice: 1 })).toBeNull(); // not a neighbour
    expect(playTenka(game, { kind: "attack", from: at("andes"), to: at("brazil"), dice: 1 })).toBeNull(); // not theirs
    expect(playTenka(game, { kind: "attack", from: at("brazil"), to: at("andes"), dice: 4 })).toBeNull(); // four dice
    expect(playTenka({ ...game, phase: TENKA_PHASES.reinforce }, { kind: "attack", from: at("brazil"), to: at("andes"), dice: 1 })).toBeNull();
    const thin = world({ owners: { brazil: 0 }, armies: { brazil: 2 } });
    expect(playTenka(thin, { kind: "attack", from: at("brazil"), to: at("andes"), dice: 2 })).toBeNull(); // one army must stay
  });

  it("throws the game's own dice and takes off what each side lost", () => {
    const game = set();
    const thrown = throwDice(game.rng, 3);
    const defending = throwDice(thrown.state, defendDice(3));
    const lost = battleLosses(thrown.value, defending.value);
    const after = play(game, { kind: "attack", from: at("brazil"), to: at("westAfrica"), dice: 3 });
    expect(after.lastRoll).toMatchObject({ attackDice: thrown.value, defendDice: defending.value, attackerLost: lost.attackerLost, defenderLost: lost.defenderLost, throws: 1 });
    expect(after.armies[at("brazil")]).toBe(10 - lost.attackerLost);
    expect(after.armies[at("westAfrica")]).toBe(3 - lost.defenderLost);
    expect(after.rng).toBe(defending.state);
  });

  it("takes a territory it empties, and moves in at least as many armies as dice thrown, leaving one behind", () => {
    let game = world({ owners: { brazil: 0 }, armies: { brazil: 10 } });
    // Andes has one army: attack until it falls.
    while (game.phase === TENKA_PHASES.attack) game = play(game, { kind: "attack", from: at("brazil"), to: at("andes"), dice: 3 });
    expect(game.phase).toBe(TENKA_PHASES.occupy);
    expect(game.owners[at("andes")]).toBe(0);
    expect(game.conquered).toBe(true);
    const { least } = game.occupying!;
    expect(least).toBe(3);
    const from = game.armies[at("brazil")];
    expect(playTenka(game, { kind: "occupy", armies: least - 1 })).toBeNull();
    expect(playTenka(game, { kind: "occupy", armies: from })).toBeNull();
    expect(playTenka(game, { kind: "endAttack" })).toBeNull();
    const moved = play(game, { kind: "occupy", armies: from - 1 });
    expect(moved.armies[at("andes")]).toBe(from - 1);
    expect(moved.armies[at("brazil")]).toBe(1);
    expect(moved.phase).toBe(TENKA_PHASES.attack);
    expect(tenkaMoves(game).map((move) => (move.kind === "occupy" ? move.armies : -1))).toEqual(Array.from({ length: from - 1 - least + 1 }, (_, step) => least + step));
  });

  it("can be thrown again and again until it is decided", () => {
    const game = world({ owners: { brazil: 0 }, armies: { brazil: 30, westAfrica: 4 } });
    const after = play(game, { kind: "blitz", from: at("brazil"), to: at("westAfrica") });
    // With thirty against four the territory falls, and the run of throws is counted.
    expect(after.owners[at("westAfrica")]).toBe(0);
    expect(after.lastRoll!.took).toBe(true);
    expect(after.lastRoll!.defenderLost).toBe(4);
    expect(after.lastRoll!.throws).toBeGreaterThanOrEqual(2);
    expect(after.armies[at("brazil")]).toBe(30 - after.lastRoll!.attackerLost);
    // And a run that fails stops with one army left behind to attack with.
    const hopeless = play(world({ owners: { brazil: 0 }, armies: { brazil: 3, westAfrica: 40 } }), { kind: "blitz", from: at("brazil"), to: at("westAfrica") });
    expect(hopeless.armies[at("brazil")]).toBe(1);
    expect(hopeless.phase).toBe(TENKA_PHASES.attack);
  });
});

describe("the end of a turn", () => {
  it("fortifies once, only through the player's own territories, and passes the turn by table order", () => {
    const game = world({ owners: { usWest: 0, usEast: 0, mexico: 0, alaska: 0, brazil: 1 }, armies: { usWest: 6 }, phase: TENKA_PHASES.fortify });
    // Alaska touches only Western Canada (seat 2's) and the Far East by sea: not joined to the United States through their own land.
    expect(playTenka(game, { kind: "fortify", from: at("usWest"), to: at("alaska") })).toBeNull();
    const chosen = play(game, { kind: "fortify", from: at("usWest"), to: at("mexico") });
    expect(chosen.phase).toBe(TENKA_PHASES.shift);
    expect(playTenka(chosen, { kind: "shift", armies: 6 })).toBeNull();
    const shifted = play(chosen, { kind: "shift", armies: 5 });
    expect(shifted.armies[at("mexico")]).toBe(6);
    expect(shifted.armies[at("usWest")]).toBe(1);
    expect(shifted.toPlay).toBe(1);
    expect(shifted.phase).toBe(TENKA_PHASES.reinforce);
    expect(shifted.reserve).toBe(reinforcementFor(shifted.owners, 1));
    // No card: nothing was taken.
    expect(shifted.hands[0]).toEqual([]);
  });

  it("gives a card at the end of a turn that took a territory, and only one however many were taken", () => {
    let game = world({ owners: { brazil: 0 }, armies: { brazil: 20 } });
    game = play(game, { kind: "blitz", from: at("brazil"), to: at("andes") });
    game = play(game, { kind: "occupy", armies: 10 });
    game = play(game, { kind: "blitz", from: at("brazil"), to: at("southernCone") });
    game = play(game, { kind: "occupy", armies: game.occupying!.least });
    const top = game.deck[0];
    const ended = play(game, { kind: "endAttack" }, { kind: "endTurn" });
    expect(ended.hands[0]).toEqual([top]);
    expect(ended.lastDraw).toEqual({ seat: 0, card: top });
    expect(ended.deck.length).toBe(game.deck.length - 1);
  });

  it("knocks a player out with their last territory, and their cards pass to the taker, who trades at once at six or more", () => {
    const game = world({ owners: { brazil: 0, andes: 1 }, armies: { brazil: 30 }, hands: [[0, 3, 6, 1], [4, 7, 2], []] });
    const taken = play(game, { kind: "blitz", from: at("brazil"), to: at("andes") });
    expect(taken.out[1]).toBe(true);
    expect(taken.lastOut).toEqual({ seat: 1, by: 0 });
    expect(taken.hands[0]).toEqual([0, 3, 6, 1, 4, 7, 2]);
    expect(taken.hands[1]).toEqual([]);
    const moved = play(taken, { kind: "occupy", armies: 3 });
    expect(moved.phase).toBe(TENKA_PHASES.reinforce);
    expect(mustTrade(moved)).toBe(true);
    const once = play(moved, { kind: "trade", cards: [0, 3, 6] });
    expect(mustTrade(once)).toBe(false); // four left
    const placed = play(once, { kind: "place", territory: at("andes"), armies: once.reserve });
    expect(placed.phase).toBe(TENKA_PHASES.attack);
    // And the player knocked out takes no more turns.
    const passed = play(placed, { kind: "endAttack" }, { kind: "endTurn" });
    expect(passed.toPlay).toBe(2);
  });

  it("is won by taking the whole world: every other player out, the neutral army never counted", () => {
    // A table of two: seat 1 holds only the Andes, the neutral army everything but Brazil and the Andes.
    const base = world({ players: 2, owners: { brazil: 0, andes: 1 }, armies: { brazil: 30 } });
    const neutral = { ...base, owners: base.owners.map((owner, territory) => (territory === at("brazil") ? 0 : territory === at("andes") ? 1 : TENKA_NEUTRAL)), out: [false, false] };
    const won = play(neutral, { kind: "blitz", from: at("brazil"), to: at("andes") });
    expect(won.phase).toBe(TENKA_PHASES.over);
    expect(won.winners).toEqual([0]);
    expect(tenkaMoves(won)).toEqual([]);
    expect(playTenka(won, { kind: "endAttack" })).toBeNull();
  });

  it("counts a game of so many rounds at the end of the last: most territories wins, most armies breaking a tie", () => {
    let game = startTenka(10, ["A", "B", "C"], 31)!;
    // Nobody attacks: every turn places its armies and ends, round after round.
    while (game.phase !== TENKA_PHASES.over) {
      const mine = game.owners.indexOf(game.toPlay);
      game = play(game, { kind: "place", territory: mine, armies: game.reserve }, { kind: "endAttack" }, { kind: "endTurn" });
    }
    expect(game.round).toBe(10);
    expect(game.moves.length).toBe(10 * 3 * 3);
    const held = [0, 1, 2].map((seat) => game.owners.filter((owner) => owner === seat).length);
    const most = Math.max(...held);
    expect(game.winners.every((seat) => held[seat] === most)).toBe(true);
    expect(game.winners.length).toBeGreaterThan(0);
  });
});

describe("keeping a game", () => {
  it("reads back exactly the game its moves make, dice and all", () => {
    let game = startTenka(20, ["Ann", "Ben", ""], 8080)!;
    const random = (() => {
      let seed = 3;
      return () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
      };
    })();
    for (let step = 0; step < 300 && game.phase !== TENKA_PHASES.over; step += 1) game = play(game, TENKA_RULES.sensible!(game, random));
    const text = encodeTenka(game);
    expect(decodeTenka(text)).toEqual(game);
    expect(text.length).toBeLessThan(10_000);
  });

  it("refuses what it cannot play out again", () => {
    const kept = JSON.parse(encodeTenka(startTenka(10, ["A", "B"], 1)!));
    expect(decodeTenka(null)).toBeNull();
    expect(decodeTenka("{")).toBeNull();
    expect(decodeTenka(JSON.stringify({ ...kept, v: 2 }))).toBeNull();
    expect(decodeTenka(JSON.stringify({ ...kept, moves: [["z"]] }))).toBeNull();
    // Attacking before placing the turn's armies is not a move these rules can play.
    expect(decodeTenka(JSON.stringify({ ...kept, moves: [["e"]] }))).toBeNull();
    expect(playTenka(startTenka(10, ["A", "B"], 1)!, { kind: "endAttack" })).toBeNull();
  });
});

describe("the armies", () => {
  it("are never made or lost but by the rules: placed from the reserve, lost to the dice, moved without loss", () => {
    const random = (() => {
      let seed = 17;
      return () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
      };
    })();
    let game = startTenka(TENKA_WORLD_ROUNDS, ["A", "B", "C", "D"], 20260928)!;
    const total = (one: TenkaGame) => one.armies.reduce((sum, armies) => sum + armies, 0);
    for (let step = 0; step < 3000 && game.phase !== TENKA_PHASES.over; step += 1) {
      const move = TENKA_RULES.sensible!(game, random);
      const next = play(game, move);
      const change = total(next) - total(game);
      if (move.kind === "place") expect(change).toBe(move.armies);
      else if (move.kind === "trade") expect(change).toBe(next.lastTrade!.bonusTerritory === null ? 0 : 2);
      else if (move.kind === "attack" || move.kind === "blitz") expect(change).toBe(-(next.lastRoll!.attackerLost + next.lastRoll!.defenderLost));
      else expect(change).toBe(0);
      // A territory held always has an army on it, but for the moment between taking it and moving in.
      next.armies.forEach((armies, territory) => {
        if (next.phase !== TENKA_PHASES.occupy || next.occupying!.to !== territory) expect(armies).toBeGreaterThanOrEqual(1);
      });
      game = next;
    }
  });
});
