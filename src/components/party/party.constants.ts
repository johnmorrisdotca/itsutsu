import type { PartyMarble } from "./party.types";

/**
 * THE SIX MARBLES, one per player in turn order: Player 1 is always red,
 * Player 2 blue, and so on round the table.
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

/** A marble's round face: the colour lit from the top left, as the board's own stones are. */
export function marbleFace(marble: PartyMarble): string {
  return `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${marble.fill} 45%, white) 0%, ${marble.fill} 48%, color-mix(in srgb, ${marble.fill} 72%, black) 100%)`;
}

/** How strongly a player's home point is tinted in their colour on the board. */
export const HOME_TINT_OPACITY = 0.32;

/** Where this browser keeps the game: one game at a time, like the practice board's. */
export const PARTY_STORAGE_KEY = "itsutsu.partyCheckers";

export const PARTY_COPY = {
  title: "Pass and play",
  kanji: "回し打ち",
  /** On the game's own page, the way in. */
  offer: "Pass and play: 2–6 players on this device",
  resume: "Continue the pass-and-play game",
  lead: "Chinese Checkers for two, three, four or six people round one phone or tablet. Take your turn, then pass it on. Nothing here is rated or kept anywhere but this browser.",
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
} as const;
