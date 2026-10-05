import { TOBIISHI_LEVELS_A_SIZE } from "@/lib/puzzles/tobiishi/levelCounts";
import { TOBIISHI_SIZES, tobiishiJumpsWord } from "@/lib/puzzles/tobiishi/sizes";

import type { LevelChipsCopy } from "./LevelChips";

/**
 * Tobiishi's screen: the words it says. One constants module for the Tobiishi
 * components, in the plain English of the glossary
 * (`docs/plans/plain-english/GLOSSARY.md`). The package's own words for its boards
 * and goal holes (`TOBIISHI_CHALLENGE_PACKS`) are read from the package, not copied here.
 */

/** The row of chips under a level (`LevelChips`): what its difficulty mark measures. A level is never a block's lesson or test. */
export const TOBIISHI_CHIPS: LevelChipsCopy = {
  difficulty: {
    label: "Difficulty",
    says: "How many jumps the shortest way to the goal has: 3 is one mark, 6 is three and 9 is five. More jumps means more pegs, and more ways to get stuck.",
  },
  teaches: { says: "" },
  tests: { label: "", kanji: "", says: "" },
};

/** A level's difficulty mark, 1 to 5, from its length: the shortest is one and the longest five. */
export function tobiishiMarks(size: number): number {
  return size <= 3 ? 1 : size <= 6 ? 3 : 5;
}

export const TOBIISHI_COPY = {
  /** The set-up's note under the levels' options: what a level is. */
  levelsNote:
    "A level is a board with a few pegs on it and a goal hole, the same for everybody. Pick a length, then any level of it: Start plays the first one you have not solved. A level has no hint and no clock, so a time on it is one anybody can be compared with.",
  /** The front door's line for the levels: how many there are of each length, read from the sizes and never typed. */
  levelsLine: `${TOBIISHI_SIZES.map((size) => `${TOBIISHI_LEVELS_A_SIZE} of ${tobiishiJumpsWord(size)}`).join(", ")}: nine boards, three goal holes each.`,
  /** The line under the board before the first jump. */
  howTo: "Tap a peg, then the empty hole it should jump to, or drag it there. Leave one peg, in the goal.",
  /** The line under the board once there are jumps: how far it has got. */
  status: (pegs: number, jumps: number): string => `${pegs} ${pegs === 1 ? "peg" : "pegs"} left after ${jumps} ${jumps === 1 ? "jump" : "jumps"}.`,
  /** The line under the board when no jump is left and it is not solved. */
  stuck: "No jump is left. Undo a jump and try another order.",
  /** The line under the board when one peg is left, though not in the goal. */
  wrongHole: "One peg is left, but not in the goal. Undo and try another order.",
} as const;

/**
 * THE PACKAGE DRAWS ITS BOARD ON A TRAY of its own, a cream rounded rectangle with a brass edge, behind the
 * holes. Here the wood is the board's frame and the paper inside it is where the pegs stand, as on every puzzle
 * (`PuzzleBoard`), so the tray would be a second frame inside the first with the paper showing at its corners.
 * CSS beats an SVG's presentation attributes, so it is made clear here and the package's drawing is used as it
 * comes. `levels.test.ts` holds that the package draws exactly one rect, the tray.
 */
export const PACKAGE_TRAY_OFF = "[&_svg>rect]:fill-transparent [&_svg>rect]:stroke-transparent";
