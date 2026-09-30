// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { YACHT_BONUS, YACHT_BONUS_AT, YACHT_BOXES, YACHT_FIXED, YACHT_UPPER } from "./yacht.constants";
import type { YachtBox } from "./yacht.types";

/**
 * WHAT A THROW SCORES IN EACH BOX, the one place the sheet's arithmetic is
 * written. A throw that does not make a box's combination scores nothing
 * there, and may still be written into it: every box is filled once, and a
 * zero is sometimes the best a turn can do.
 */

/** How many of each face, 1 to 6, at index 1 to 6. */
export function faceCounts(dice: readonly number[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const die of dice) counts[die] += 1;
  return counts;
}

const sum = (dice: readonly number[]) => dice.reduce((total, die) => total + die, 0);

/** The longest run of faces in a row the throw holds: 5 for 1–5 or 2–6. */
function longestRun(counts: readonly number[]): number {
  let best = 0;
  let run = 0;
  for (let face = 1; face <= 6; face += 1) {
    run = counts[face] > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/** What these five dice score written into this box. */
export function boxScore(box: YachtBox, dice: readonly number[]): number {
  const counts = faceCounts(dice);
  const most = Math.max(...counts);
  const upper = YACHT_BOXES.indexOf(box);
  if (upper < YACHT_UPPER) return counts[upper + 1] * (upper + 1);
  switch (box) {
    case "threeKind":
      return most >= 3 ? sum(dice) : 0;
    case "fourKind":
      return most >= 4 ? sum(dice) : 0;
    case "fullHouse":
      return counts.includes(3) && counts.includes(2) ? YACHT_FIXED.fullHouse : 0;
    case "smallStraight":
      return longestRun(counts) >= 4 ? YACHT_FIXED.smallStraight : 0;
    case "largeStraight":
      return longestRun(counts) === 5 ? YACHT_FIXED.largeStraight : 0;
    case "yacht":
      return most === 5 ? YACHT_FIXED.yacht : 0;
    default:
      return sum(dice);
  }
}

/** A sheet's upper half: the six numbers' boxes added up. */
export function upperTotal(sheet: readonly (number | null)[]): number {
  return sheet.slice(0, YACHT_UPPER).reduce<number>((total, score) => total + (score ?? 0), 0);
}

/** The upper half's bonus: 35 once it reaches 63, nothing before. */
export function upperBonus(sheet: readonly (number | null)[]): number {
  return upperTotal(sheet) >= YACHT_BONUS_AT ? YACHT_BONUS : 0;
}

/** A sheet's total so far: every box written, and the bonus once earned. */
export function sheetTotal(sheet: readonly (number | null)[]): number {
  return sheet.reduce<number>((total, score) => total + (score ?? 0), 0) + upperBonus(sheet);
}
