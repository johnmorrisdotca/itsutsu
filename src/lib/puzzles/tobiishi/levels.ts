import {
  TOBIISHI_CHALLENGE_PACKS,
  generateTobiishiChallenge,
  type ChallengeDifficulty,
  type ChallengePack,
  type GoalChallenge,
  type GoalHole,
  type Shape,
} from "@johnmorrisdotca/tobiishi";

import type { Puzzle } from "../puzzles.types";
import { isTobiishiLevelAt, TOBIISHI_GOALS_A_BOARD } from "./levelCounts";
import { isTobiishiSize, tobiishiBand } from "./sizes";
import { encodeAnswer } from "./way";

export { nextLevelLabel } from "../fixedLevel";

/**
 * TOBIISHI'S LEVELS ON THE SITE: the package's own named challenges
 * (`@johnmorrisdotca/tobiishi`, an open-source package,
 * github.com/johnmorrisdotca/tobiishi), handed to the site as puzzles.
 *
 * A level is not made from a seed as a board is: level 5 at Medium is one
 * starting position for every player on every day, so a time on it can be
 * compared with anybody's. The address still says `seed`, because that is where
 * every puzzle's address, kept run and race carry which puzzle it is; for
 * Tobiishi the seed IS the level's number in its length, 1 to 27.
 *
 * A LENGTH IS THE LEVELS OF ONE DIFFICULTY (3, 6 or 9 jumps), and its levels are
 * the package's nine boards in the package's order, three goal holes each: level
 * 1 is the first board's first goal, 4 the second board's first. A level's CODE is
 * `board:goal:jumps` (`english:centre:3`), 25 characters at the longest: the
 * starting position is made again from it, in every browser and on the server, by
 * the package, which makes the same one every time (a challenge is seeded from
 * its own name). A position is never stored.
 *
 * Making one takes a fraction of a millisecond, so there is no list to fetch:
 * the package is read where it is wanted.
 */
export type TobiishiLevelRef = { pack: Shape; goal: string; jumps: number };

/** The package's boards, in the package's order. */
const PACKS = Object.keys(TOBIISHI_CHALLENGE_PACKS) as Shape[];

/** A board's own words and goal holes: its title in the package's English, and the holes a level may finish in. */
export function tobiishiPackOf(pack: Shape): ChallengePack {
  return TOBIISHI_CHALLENGE_PACKS[pack];
}

/** The boards the levels are made on, in order. */
export function tobiishiPacks(): readonly Shape[] {
  return PACKS;
}

/** The board, goal and length of level `level` at a length, or null for a level that length has not. */
export function tobiishiRefOf(size: number, level: number): TobiishiLevelRef | null {
  if (!isTobiishiLevelAt(size, level)) return null;
  const pack = PACKS[Math.floor((level - 1) / TOBIISHI_GOALS_A_BOARD)];
  const goal = pack === undefined ? undefined : TOBIISHI_CHALLENGE_PACKS[pack].goals[(level - 1) % TOBIISHI_GOALS_A_BOARD];
  return pack === undefined || goal === undefined ? null : { pack, goal: goal.id, jumps: size };
}

/** A level's code, as its solves keep it (`english:centre:3`). */
export function tobiishiCodeOf(ref: TobiishiLevelRef): string {
  return `${ref.pack}:${ref.goal}:${ref.jumps}`;
}

/** What a code says: the board, the goal and the length, only if they are a level the package has; null for any other text. */
export function tobiishiRefOfCode(code: string): TobiishiLevelRef | null {
  const [pack, goal, jumps, ...rest] = code.split(":");
  if (pack === undefined || goal === undefined || jumps === undefined || rest.length > 0) return null;
  if (!Object.prototype.hasOwnProperty.call(TOBIISHI_CHALLENGE_PACKS, pack)) return null;
  const size = Number(jumps);
  if (!isTobiishiSize(size) || String(size) !== jumps) return null;
  return TOBIISHI_CHALLENGE_PACKS[pack as Shape].goals.some((hole) => hole.id === goal) ? { pack: pack as Shape, goal, jumps: size } : null;
}

/** The level a code is, at a length, or null for a code that is no level of it. */
export function tobiishiLevelOfBoard(size: number, code: string): number | null {
  const ref = tobiishiRefOfCode(code);
  if (ref === null || ref.jumps !== size) return null;
  const board = PACKS.indexOf(ref.pack);
  const goal = TOBIISHI_CHALLENGE_PACKS[ref.pack].goals.findIndex((hole) => hole.id === ref.goal);
  return board * TOBIISHI_GOALS_A_BOARD + goal + 1;
}

/** The goal hole of a level, with its words. */
export function tobiishiGoalOf(ref: TobiishiLevelRef): GoalHole {
  return TOBIISHI_CHALLENGE_PACKS[ref.pack].goals.find((hole) => hole.id === ref.goal)!;
}

/** The package's challenge for a level: its starting position, its goal and a witness answer. Seeded, so the same every time. */
export function tobiishiChallengeOf(ref: TobiishiLevelRef): GoalChallenge {
  return generateTobiishiChallenge(ref.pack, ref.goal, tobiishiBand(ref.jumps) as ChallengeDifficulty);
}

/** Level `level` of a length, as a puzzle; the level number travels as its seed. */
export function tobiishiLevelPuzzle(size: number, level: number): Puzzle {
  // An address naming no level is read as the first, never as an error in render.
  const number = isTobiishiLevelAt(size, level) ? level : 1;
  const ref = tobiishiRefOf(size, number) ?? tobiishiRefOf(3, 1)!;
  const challenge = tobiishiChallengeOf(ref);
  const solution = encodeAnswer(challenge.game, challenge.answer);
  if (solution === null) throw new Error(`Tobiishi level ${number} at ${ref.jumps} jumps (${tobiishiCodeOf(ref)}) has no legal answer.`);
  return { kind: "tobiishi", size: ref.jumps, level: tobiishiBand(ref.jumps), seed: number, givens: tobiishiCodeOf(ref), solution };
}
