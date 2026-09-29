import type { RaceVariant } from "@/lib/gomoku/party/partyRace.types";

import type { PartyGameCopy, PartyMarble } from "./party.types";

/**
 * THE SIX MARBLES, one per player in turn order: Player 1 is always red,
 * Player 2 blue, and so on round the table — at Chinese Checkers' star and
 * Halma's square board alike.
 *
 * The colours are Okabe and Ito's set, chosen to stay apart for the commonest
 * kinds of colour blindness, and each marble carries its letter as well, so
 * that no player ever has to tell two pieces apart by colour alone. White is
 * the sixth rather than a second blue or a black, because a black marble and
 * the dark blue one are the pair that would fall together in a dim room.
 */
export const PARTY_MARBLES: readonly PartyMarble[] = [
  { label: "Red", letter: "R", fill: "#d55e00", ink: "#ffffff" },
  { label: "Blue", letter: "B", fill: "#0072b2", ink: "#ffffff" },
  { label: "Yellow", letter: "Y", fill: "#f0e442", ink: "#1a1a1a" },
  { label: "Green", letter: "G", fill: "#009e73", ink: "#ffffff" },
  { label: "Purple", letter: "P", fill: "#cc79a7", ink: "#1a1a1a" },
  { label: "White", letter: "W", fill: "#f4f1ea", ink: "#1a1a1a" },
];

/** Where this browser keeps each race table's game: one of each at a time, apart from each other and from the board for two's. */
export const PARTY_STORAGE_KEY = "itsutsu.partyCheckers";
export const PARTY_HALMA_STORAGE_KEY = "itsutsu.partyHalma";

/** A marble's round face: the colour lit from the top left, as the board's own stones are. */
export function marbleFace(marble: PartyMarble): string {
  return `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${marble.fill} 45%, white) 0%, ${marble.fill} 48%, color-mix(in srgb, ${marble.fill} 72%, black) 100%)`;
}

/** How strongly a player's home point is tinted in their colour on the board. */
export const HOME_TINT_OPACITY = 0.32;

export const PARTY_COPY = {
  title: "Pass and play",
  kanji: "回し打ち",
  resume: "Continue the pass-and-play game",
  howMany: "How many are playing?",
  names: "Names, if you like",
  start: "Start",
  newGame: "New game",
  confirmNew: "Start a new game? This one will be gone.",
  confirmYes: "Yes, start again",
  confirmNo: "Keep playing",
  again: "Play again, same table",
  pick: "Tap one of your pieces, then where it should go. A jump can chain: tap where the last jump lands.",
  stuck: "Nobody can move. The game is over with no winner.",
  kept: "Kept in this browser: leave and come back, and it is here.",
  /** On My games' Pass and play tab. */
  card: "Pass and play on this device",
  /** The "are you still there?" question at a table: nothing runs while nobody moves. */
  idleDetail: "Nothing has moved at this table for a couple of minutes. There is no clock here; the game simply waits.",
  idleKept: "This game is kept in this browser. It will be here when you come back.",
} as const;

/** What each race table says that is its game's own. */
export const PARTY_GAME_COPY: Record<RaceVariant, PartyGameCopy> = {
  chineseCheckers: {
    offer: "Pass and play: 2–6 players on this device",
    lead: "Chinese Checkers for two, three, four or six people round one phone or tablet. Take your turn, then pass it on — or choose Several devices, and each plays on their own. Nothing here is rated.",
    farCamp: "the far point",
    about: "About Chinese Checkers, its rules and its rated game for two",
  },
  halma: {
    offer: "Pass and play: 2 or 4 players on this device",
    lead: "Halma for four people round one phone or tablet, or for two: each races their pieces from their own corner into the corner opposite, thirteen each when four play and nineteen when two do. Take your turn, then pass it on — or choose Several devices, and each plays on their own. Nothing here is rated.",
    farCamp: "the far corner",
    about: "About Halma, its rules and its rated game for two",
  },
};

/** Where this browser keeps its game of Dots and Boxes: one at a time, apart from every other table's. */
export const DOTS_STORAGE_KEY = "itsutsu.dotsAndBoxes";

/** How strongly a claimed box is filled in its owner's colour: enough to read at a glance, never so much the letter is lost. */
export const DOTS_BOX_FILL_OPACITY = 0.82;

/** What Dots and Boxes' table says, beyond what every table says (`PARTY_COPY`). */
export const DOTS_COPY = {
  lead: "Dots and Boxes for two to six people round one phone or tablet. Take your turn, then pass it on — or choose Several devices, and each plays on their own. Nothing here is rated.",
  board: "Which board?",
  lines: (count: number) => `${count} lines`,
  tap: "Tap between two dots to draw a line. Close a box and it is yours, and you draw again.",
  closed: (boxes: number) => (boxes === 2 ? "Closed two boxes: draw again." : "Closed a box: draw again."),
  boxes: (count: number) => `${count} ${count === 1 ? "box" : "boxes"}`,
  drawn: (drawn: number, of: number) => `${drawn} of ${of} lines drawn.`,
  play: "Play →",
  continue: "Continue →",
  about: "About Dots and Boxes and its rules",
} as const;
