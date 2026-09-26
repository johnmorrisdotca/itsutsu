import { inHex, layoutCells, LINK_BLOCKED, LINK_BRIDGE, LINK_WALLS, tailWord } from "./code.ts";
import { TSUNAGI_BLOCK } from "./levelBlocks.ts";
import type { Challenge, TwistRole } from "./ladder.types.ts";
import { TSUNAGI_MARKS, TSUNAGI_ROLES } from "./levels/marks.data.ts";

export type { Challenge, TwistRole };

/**
 * WHAT A TSUNAGI LEVEL ASKS OF A PLAYER, read from its board: the challenges
 * on it, where it sits in its block's lesson, and how hard it measured. John,
 * 2026-09-26: "at the bottom of every map, show the obstacles or difficulty
 * level in one row… so the user can see that the level they are on has certain
 * challenges", and of the block's last two: "users should know that the ninth
 * [now 15th] would be a sort of experience and the 10th [16th] is the hardest".
 *
 * Imports carry their `.ts` so the level script can read the same rules.
 */

export const CHALLENGES: readonly Challenge[] = ["bridges", "walls", "waypoints", "wrap", "explosions", "strokes", "hexagon", "sparse"];

/** The challenges on a board, in the order the ladder teaches them. */
export function challengesOf(layout: string): Challenge[] {
  const cells = layoutCells(layout);
  const tail = layout.slice(cells.length).split(LINK_WALLS).filter(Boolean);
  const out: Challenge[] = [];
  if (cells.includes(LINK_BRIDGE)) out.push("bridges");
  const words = tail.map(tailWord);
  const hex = words.some((word) => word?.word === "hex");
  // A hexagon's corners are off the board, not blocked: only a `#` inside it is a wall.
  const size = Math.round(Math.sqrt(cells.length));
  const blocked = [...cells].some((cell, at) => cell === LINK_BLOCKED && (!hex || inHex(size, at)));
  if (words.some((word) => word === null) || blocked) out.push("walls");
  if (/[a-p]/.test(cells)) out.push("waypoints");
  if (words.some((word) => word?.word === "wrap")) out.push("wrap");
  if (words.some((word) => word?.word === "explosion")) out.push("explosions");
  if (words.some((word) => word?.word === "strokes")) out.push("strokes");
  if (hex) out.push("hexagon");
  if (words.some((word) => word?.word === "sparse")) out.push("sparse");
  return out;
}

/** Whether a board is a twist: any challenge on it. */
export function isTwist(layout: string): boolean {
  return challengesOf(layout).length > 0;
}

/**
 * A level's part in its block's lesson, or null for a level that has none (1 to
 * 14, or a 15th or 16th left plain because somebody had played it). `newOnes`
 * are the challenges no earlier level of the size has: what a 15th introduces.
 */
export function twistRole(layouts: readonly string[], level: number): TwistRole | null {
  const slot = ((level - 1) % TSUNAGI_BLOCK) + 1;
  const layout = layouts[level - 1];
  if (layout === undefined || slot < TSUNAGI_BLOCK - 1) return null;
  const challenges = challengesOf(layout);
  if (challenges.length === 0) return null;
  const before = new Set(layouts.slice(0, level - 1).flatMap(challengesOf));
  return { role: slot === TSUNAGI_BLOCK - 1 ? "teaches" : "tests", challenges, newOnes: challenges.filter((each) => !before.has(each)) };
}

/** A level's measured difficulty, 1 (easiest) to 5, or null for a level the marks do not have. */
export function tsunagiMarks(size: number, level: number): number | null {
  const digit = TSUNAGI_MARKS[size]?.[level - 1];
  return digit === undefined ? null : Number(digit);
}

/** A level's part in its block's lesson, from the data the level script wrote (`marks.data.ts`), without its size's boards; null for none. */
export function tsunagiRole(size: number, level: number): TwistRole | null {
  return TSUNAGI_ROLES[size]?.[level] ?? null;
}
