import { TENKA_ATTACK_DICE, TENKA_DEFEND_DICE } from "./tenka.constants.ts";

/**
 * THE DICE AND THE RANDOM THEY ARE THROWN WITH.
 *
 * Every shuffle, deal and die of a game is drawn from one small random of its
 * own, started from the game's seed (Tommy Ettinger's Mulberry32: one number
 * of state, the same answers in every browser). Its state is part of the
 * game, so a kept game — its seed and its moves — is thrown again exactly as
 * it fell, and nobody can reload a page to roll again.
 */

/** The next number from the random at `state`, in [0, 1), and the state after it. */
export function nextRandom(state: number): { value: number; state: number } {
  const next = (state + 0x6d2b79f5) >>> 0;
  let mixed = Math.imul(next ^ (next >>> 15), 1 | next);
  mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
  return { value: ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296, state: next };
}

/** A whole number from 0 to `below - 1`, and the state after it. */
export function randomBelow(state: number, below: number): { value: number; state: number } {
  const drawn = nextRandom(state);
  return { value: Math.floor(drawn.value * below), state: drawn.state };
}

/** A list in a random order (Fisher and Yates), and the state after it; the list given is left alone. */
export function shuffled<T>(state: number, items: readonly T[]): { value: T[]; state: number } {
  const out = [...items];
  let at = state;
  for (let i = out.length - 1; i > 0; i -= 1) {
    const drawn = randomBelow(at, i + 1);
    at = drawn.state;
    [out[i], out[drawn.value]] = [out[drawn.value], out[i]];
  }
  return { value: out, state: at };
}

/** `count` dice, highest first, and the state after them. */
export function throwDice(state: number, count: number): { value: number[]; state: number } {
  const dice: number[] = [];
  let at = state;
  for (let i = 0; i < count; i += 1) {
    const drawn = randomBelow(at, 6);
    at = drawn.state;
    dice.push(drawn.value + 1);
  }
  return { value: dice.sort((a, b) => b - a), state: at };
}

/** The most dice an attacker may throw from a territory holding `armies`: one army always stays behind. */
export function mostAttackDice(armies: number): number {
  return Math.max(0, Math.min(TENKA_ATTACK_DICE, armies - 1));
}

/** The dice a defender holding `armies` throws: as many as allowed, since more never hurts the defence. */
export function defendDice(armies: number): number {
  return Math.max(0, Math.min(TENKA_DEFEND_DICE, armies));
}

/**
 * WHO LOSES WHAT: the highest die of each side compared, then the next
 * highest, as many pairs as the side with fewer dice threw. The higher die
 * wins its pair; a tie goes to the defender. Each lost pair is one army.
 * Both lists are highest first.
 */
export function battleLosses(attack: readonly number[], defend: readonly number[]): { attackerLost: number; defenderLost: number } {
  let attackerLost = 0;
  let defenderLost = 0;
  for (let pair = 0; pair < Math.min(attack.length, defend.length); pair += 1) {
    if (attack[pair] > defend[pair]) defenderLost += 1;
    else attackerLost += 1;
  }
  return { attackerLost, defenderLost };
}
