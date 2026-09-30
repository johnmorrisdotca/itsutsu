import { describe, expect, it } from "vitest";

import { battleLosses, defendDice, mostAttackDice, nextRandom, randomBelow, shuffled, throwDice } from "./tenkaDice.ts";

/**
 * Tenka's dice: EVERY throw of every number of dice against every other,
 * resolved and counted, against the odds the classic game is known by — and
 * the random they are thrown with, the same every time from the same seed.
 */

/** Every way `count` dice can fall, each in the order thrown. */
function everyThrow(count: number): number[][] {
  if (count === 0) return [[]];
  return everyThrow(count - 1).flatMap((rest) => [1, 2, 3, 4, 5, 6].map((die) => [die, ...rest]));
}

const highestFirst = (dice: number[]) => [...dice].sort((a, b) => b - a);

describe("the battle", () => {
  it("compares highest with highest, then the next pair, and a tie goes to the defender", () => {
    expect(battleLosses([6, 5, 1], [6, 4])).toEqual({ attackerLost: 1, defenderLost: 1 });
    expect(battleLosses([6, 5, 1], [5, 4])).toEqual({ attackerLost: 0, defenderLost: 2 });
    expect(battleLosses([3, 3, 3], [3, 3])).toEqual({ attackerLost: 2, defenderLost: 0 });
    expect(battleLosses([2], [1, 1])).toEqual({ attackerLost: 0, defenderLost: 1 });
    expect(battleLosses([4, 4], [4])).toEqual({ attackerLost: 1, defenderLost: 0 });
  });

  /*
   * EXHAUSTIVELY: every one of the 6^(a+d) ways each of the six match-ups
   * can fall, resolved and counted, compared with the known odds of the
   * classic game (1 against 1: the attacker wins 15 in 36; 3 against 2:
   * 2890, 2611 and 2275 in 7776 for the defender losing two, one each, and
   * the attacker losing two).
   */
  it.each([
    [1, 1, { attacker0: 15, split: 0, defender0: 21 }],
    [2, 1, { attacker0: 125, split: 0, defender0: 91 }],
    [3, 1, { attacker0: 855, split: 0, defender0: 441 }],
    [1, 2, { attacker0: 55, split: 0, defender0: 161 }],
    [2, 2, { attacker0: 295, split: 420, defender0: 581 }],
    [3, 2, { attacker0: 2890, split: 2611, defender0: 2275 }],
  ])("%i dice against %i: every throw, and the known odds", (attack, defend, expected) => {
    let attacker0 = 0;
    let split = 0;
    let defender0 = 0;
    const pairs = Math.min(attack, defend);
    for (const a of everyThrow(attack)) {
      for (const d of everyThrow(defend)) {
        const lost = battleLosses(highestFirst(a), highestFirst(d));
        expect(lost.attackerLost + lost.defenderLost).toBe(pairs);
        if (lost.attackerLost === 0) attacker0 += 1;
        else if (lost.defenderLost === 0) defender0 += 1;
        else split += 1;
      }
    }
    // "attacker0": the attacker lost nothing; "defender0": the defender lost nothing.
    expect({ attacker0, split, defender0 }).toEqual(expected);
  });

  it("lets an attacker throw up to three dice and one fewer than the armies there; a defender up to two", () => {
    expect([1, 2, 3, 4, 5, 10].map(mostAttackDice)).toEqual([0, 1, 2, 3, 3, 3]);
    expect([0, 1, 2, 3, 10].map(defendDice)).toEqual([0, 1, 2, 2, 2]);
  });
});

describe("the random", () => {
  it("answers the same from the same state, and moves on", () => {
    const one = nextRandom(12345);
    expect(nextRandom(12345)).toEqual(one);
    expect(one.state).not.toBe(12345);
    expect(one.value).toBeGreaterThanOrEqual(0);
    expect(one.value).toBeLessThan(1);
  });

  it("throws dice from 1 to 6, highest first, about evenly", () => {
    const counts = [0, 0, 0, 0, 0, 0];
    let state = 7;
    for (let i = 0; i < 6000; i += 1) {
      const thrown = throwDice(state, 3);
      state = thrown.state;
      expect(thrown.value).toEqual(highestFirst(thrown.value));
      for (const die of thrown.value) counts[die - 1] += 1;
    }
    for (const count of counts) expect(Math.abs(count - 3000)).toBeLessThan(250);
  });

  it("shuffles into an order of the same things, and leaves the list given alone", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const once = shuffled(99, items);
    expect([...once.value].sort((a, b) => a - b)).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(shuffled(99, items)).toEqual(once);
    expect(randomBelow(5, 10).value).toBeLessThan(10);
  });
});
