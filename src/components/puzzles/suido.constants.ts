import type { Kind, Twist } from "@johnmorrisdotca/suido";

import type { SuidoReading } from "@/lib/puzzles/suido/play";

/**
 * Suido's screen: the words it says, and the two choices it offers. One
 * constants module for the Suido components.
 */

/** What each kind of board asks, as a chip on the set-up and the line under it. */
export const SUIDO_KINDS: Record<Kind, { label: string; kanji: string; blurb: string }> = {
  drains: {
    label: "Drains",
    kanji: "排水",
    blurb: "Lead the water to every drain. Pieces the water does not need are spares: leave them facing any way.",
  },
  network: {
    label: "Network",
    kanji: "網",
    blurb: "Every piece must carry water, so there are no spares: the whole board is one set of pipes.",
  },
  // Only a level has one (a board made from a seed is drains or network): the water runs one way, from the inlet to the outlet.
  "inlet-outlet": {
    label: "Inlet to outlet",
    kanji: "入口出口",
    blurb: "The water comes in at the top left and must leave at the bottom right, in one path with no branches. The other pieces are decoys and stay dry.",
  },
};

/**
 * WHAT A LEVEL'S TWISTS ARE CALLED, and the one line a chip shows on a hover or a tap (`LevelChips`): the six the
 * package declares (`declaredTwists`). A twist is a thing the board itself says, never a setting a reader chooses.
 */
export const SUIDO_TWISTS: Record<Twist, { label: string; kanji: string; says: string }> = {
  drains: { label: "Drains", kanji: "排水", says: "Reach every drain. Pieces the water does not need may stay dry, facing any way." },
  pumps: { label: "Pumps", kanji: "水源", says: "More than one pump, each feeding its own pipes." },
  locked: { label: "Locked pieces", kanji: "固定", says: "A piece with a padlock cannot be turned. It already faces the right way, so build from it." },
  walls: { label: "Walls", kanji: "壁", says: "Water cannot cross a wall: a pipe open towards one runs out." },
  wrap: { label: "Edges join", kanji: "巡", says: "The edges of the board join: water leaving the right side comes in at the left, and out of the bottom at the top. A dashed rim shows it." },
  "inlet-outlet": { label: "Inlet to outlet", kanji: "入出", says: "The water comes in at the top left and must leave at the bottom right, in one path with no branches. The other pieces are decoys and stay dry." },
  // Only a board made on request has these two (Make a board): the fixed levels do not.
  "big-pieces": { label: "Big pieces", kanji: "大駒", says: "A big piece fills four squares and has up to eight openings. One tap turns the whole piece a quarter, where it stands." },
  "block-turns": { label: "Block turns", kanji: "回転", says: "Where four pieces are ringed by a dashed line, a tap turns all four together: each moves round to the next place as it turns. They cannot be turned on their own." },
};

/** The row under a level (`LevelChips`): what its difficulty marks measure, and what a block's 15th and 16th levels are for. */
export const SUIDO_CHIPS = {
  difficulty: {
    label: "Difficulty",
    says: "How hard this level measured among boards of its size: how little is plain at the first look, how many looks it takes, and how much has to be tried.",
  },
  teaches: { says: "This block's new idea: its 15th level shows it gently." },
  tests: { label: "Block's test", kanji: "試", says: "This block's test: its 16th level uses its twist hard." },
} as const;

/** Where the two ways of playing are told apart: Levels, the fixed boards, and Make a board, a new one from a seed. */
export const SUIDO_MODES = {
  levels: { label: "Levels", kanji: "級", says: "Fixed boards at every size, easy to hard, the same for everybody: 256 at each size to 14×14, and 64 on the huge ones." },
  make: { label: "Make a board", kanji: "作る", says: "A new board each time, at a size and a level you choose." },
} as const;

/** Which way a tap turns a piece, chosen under the board. */
export const SUIDO_WAYS = {
  clockwise: { label: "Clockwise", kanji: "右回り" },
  anticlockwise: { label: "Anticlockwise", kanji: "左回り" },
} as const;

export const SUIDO_COPY = {
  /** The set-up's note under the levels' options: what a level is and what a twist is, in the words the glossary keeps. */
  levelsNote:
    "Every size has fixed levels, 256 of them up to 14×14 and 64 on the huge boards, easy to hard, and each has exactly one answer. A level can come with a twist: several pumps, locked pieces, walls, edges that join, or a single path from an inlet to an outlet. A block of 16 levels opens when the one before it is solved.",
  /** The front door's line for the levels, beside the line that says which boards it makes. */
  levelsLine: "Also fixed levels at each of 16 sizes, easy to hard: 256 at each from 5×5 to 14×14 and the long boards 5×7, 6×10 and 8×14, and 64 at each of the huge 20×20, 28×28 and 20×50.",
  /** Said on the disabled Hint press of a level, which has none to choose. */
  levelsNoHint: "A level has no hint, so a time on it is one anybody can be compared with",
  levelsNoHelp: "A level has no hint and no clock, so a time on it is one anybody can be compared with.",
  howTo: "Tap a piece to turn it a quarter. The water runs from the pump along every pipe that joins, and drips out of any open end.",
  turn: "Turn",
  /** The line under the board: how far the water has got, and how many open ends still leak. */
  status: ({ solved, reached, wanted, leaks, kind }: SuidoReading): string => {
    if (kind === "inlet-outlet") {
      // One outlet, so "0 of 1 drain reached" says less than the water does: said by how far it has run.
      if (solved) return "The water runs from the inlet to the outlet in one path, and nothing leaks.";
      return `${reached} ${reached === 1 ? "piece" : "pieces"} wet, ${leaks === 0 ? "nothing leaking" : `${leaks} ${leaks === 1 ? "open end" : "open ends"} leaking`}.`;
    }
    if (solved) return kind === "network" ? "Every piece is wet and nothing leaks." : "Every drain is reached and nothing leaks.";
    const what = kind === "network" ? `${reached} of ${wanted} ${wanted === 1 ? "piece" : "pieces"} wet` : `${reached} of ${wanted} ${wanted === 1 ? "drain" : "drains"} reached`;
    return `${what}, ${leaks === 0 ? "nothing leaking" : `${leaks} ${leaks === 1 ? "open end" : "open ends"} leaking`}.`;
  },
} as const;
