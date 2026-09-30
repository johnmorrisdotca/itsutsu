// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { YACHT_BOXES, YACHT_DICE, YACHT_ROLLS, YACHT_UPPER } from "./yacht.constants";
import { yachtMoves } from "./yacht";
import { boxScore } from "./yachtScore";
import type { YachtGame, YachtMove } from "./yacht.types";

/**
 * THE COMPUTER AT THE TABLE: a steady player, not a perfect one.
 *
 * It values a box as what the dice score there, less what that box usually
 * scores (`PAR`), so a zero goes where a zero costs least, and a number in the
 * upper half earns a little more for three or better of it, which is how the
 * bonus is reached. Before each roll it weighs every way of holding the dice
 * by the best box the one roll after it could make, counted exactly over
 * every way the free dice can fall; if writing the dice down now is worth as
 * much, it writes them down. It reads nothing hidden, because nothing is:
 * every die is on the table.
 */

/** What each box usually scores over a game, roughly: a zero in a box costs its par. */
const PAR: readonly number[] = [2, 5, 8, 12, 15, 18, 15, 6, 16, 20, 14, 12, 22];

/** A little more for a number in the upper half held three or more times: the way to the bonus. */
const UPPER_ON_TRACK = 6;

/** A roll with two still to come is worth a little more than one step of looking ahead says. */
const TWO_LEFT = 2;

/** Every way `count` free dice can fall, as faces and the chance of that fall. */
const FALLS: readonly (readonly { faces: readonly number[]; chance: number }[])[] = Array.from({ length: YACHT_DICE + 1 }, (_, count) => fallsOf(count));

function fallsOf(count: number): { faces: number[]; chance: number }[] {
  const out: { faces: number[]; chance: number }[] = [];
  const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
  const walk = (from: number, faces: number[]) => {
    if (faces.length === count) {
      const counts = [0, 0, 0, 0, 0, 0, 0];
      for (const face of faces) counts[face] += 1;
      const ways = counts.reduce((total, one) => total / factorial(one), factorial(count));
      out.push({ faces: [...faces], chance: ways / 6 ** count });
      return;
    }
    for (let face = from; face <= 6; face += 1) walk(face, [...faces, face]);
  };
  walk(1, []);
  return out;
}

/** What writing these dice into this box is worth to this sheet. */
function worth(box: number, dice: readonly number[]): number {
  const score = boxScore(YACHT_BOXES[box], dice);
  const onTrack = box < YACHT_UPPER && score >= 3 * (box + 1) ? UPPER_ON_TRACK : 0;
  return score + onTrack - PAR[box];
}

/** The best empty box for these dice, and what it is worth. */
function bestBox(open: readonly number[], dice: readonly number[]): { box: number; worth: number } {
  let best = { box: open[0], worth: -Infinity };
  for (const box of open) {
    const value = worth(box, dice);
    if (value > best.worth) best = { box, worth: value };
  }
  return best;
}

/** The move the computer makes now; always one `yachtMoves` offers. */
export function yachtComputerMove(game: YachtGame): YachtMove {
  const offered = yachtMoves(game);
  if (game.rolls === 0) return offered[0];
  const open = game.sheets[game.toPlay].flatMap((score, box) => (score === null ? [box] : []));
  const now = bestBox(open, game.dice);
  if (game.rolls >= YACHT_ROLLS) return { kind: "score", box: now.box };

  let best = { hold: -1, worth: now.worth };
  const weighed = new Set<string>();
  for (const move of offered) {
    if (move.kind !== "roll") continue;
    const kept = game.dice.filter((_, at) => (move.hold & (1 << at)) !== 0);
    const key = [...kept].sort().join("");
    if (weighed.has(key)) continue;
    weighed.add(key);
    let expected = 0;
    for (const fall of FALLS[YACHT_DICE - kept.length]) expected += fall.chance * bestBox(open, [...kept, ...fall.faces]).worth;
    if (game.rolls === 1) expected += TWO_LEFT;
    if (expected > best.worth) best = { hold: move.hold, worth: expected };
  }
  return best.hold < 0 ? { kind: "score", box: now.box } : { kind: "roll", hold: best.hold };
}
