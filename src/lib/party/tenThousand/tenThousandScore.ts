/**
 * WHAT DICE SCORE AT TEN THOUSAND, the table most tables play:
 *
 *   a single 1, 100; a single 5, 50; three 1s, 1000; three of any other number,
 *   a hundred times it; four of a kind, 1000; five, 2000; six, 3000; a straight
 *   of one to six, 1500; three pairs, 1500; two sets of three, 2500.
 *
 * Dice are set aside only when every one of them scores.
 */

/** How many of each face, indexed by the face. */
function tally(dice: readonly number[]): number[] {
  const counts = new Array<number>(7).fill(0);
  for (const die of dice) counts[die] = counts[die]! + 1;
  return counts;
}

/** What `n` of one face score on their own, or null when some of them score nothing. */
function ofOneFace(face: number, n: number): number | null {
  if (n === 0) return 0;
  const single = face === 1 ? 100 : face === 5 ? 50 : 0;
  const three = face === 1 ? 1000 : face * 100;
  const options: number[] = [];
  if (single > 0) options.push(n * single);
  if (n >= 3) options.push(three + (n - 3) * single);
  if (n === 4) options.push(1000);
  if (n === 5) options.push(2000);
  if (n === 6) options.push(3000);
  // A two or a pair of twos scores nothing: only a set takes them.
  return options.length === 0 ? null : Math.max(...options);
}

/** What these dice score set aside together, or null when any of them does not. */
export function tenThousandScore(dice: readonly number[]): number | null {
  if (dice.length === 0) return null;
  const counts = tally(dice);
  if (dice.length === 6) {
    if (counts.slice(1).every((n) => n === 1)) return 1500;
    const sets = counts.filter((n) => n === 3).length;
    if (sets === 2) return 2500;
    if (counts.filter((n) => n === 2).length === 3) return 1500;
  }
  let total = 0;
  for (let face = 1; face <= 6; face += 1) {
    const score = ofOneFace(face, counts[face]!);
    if (score === null) return null;
    total += score;
  }
  return total;
}

/** The dice a mask chooses. */
export function diceInMask(dice: readonly number[], mask: number): number[] {
  return dice.filter((_, at) => (mask & (1 << at)) !== 0);
}

/** Every way of setting aside some of these dice that scores: none means the throw is a bust. */
export function scoringMasks(dice: readonly number[]): number[] {
  const masks: number[] = [];
  for (let mask = 1; mask < 1 << dice.length; mask += 1) if (tenThousandScore(diceInMask(dice, mask)) !== null) masks.push(mask);
  return masks;
}
