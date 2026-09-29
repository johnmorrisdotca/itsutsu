import type { RaceVariant } from "@/lib/gomoku/party/partyRace.types";
import type { PartyLanguage } from "@/lib/party/party.types";

import type { PartyGameCopy, PartyMarble } from "./party.types";

/**
 * THE MARBLES, one per player in turn order: Player 1 is always red, Player 2
 * blue, and so on round the table — at Chinese Checkers' star and Halma's
 * square board alike.
 *
 * The colours are Okabe and Ito's set, chosen to stay apart for the commonest
 * kinds of colour blindness, and each marble carries its letter as well, so
 * that no player ever has to tell two pieces apart by colour alone. White is
 * the sixth rather than a second blue or a black, because a black marble and
 * the dark blue one are the pair that would fall together in a dim room.
 *
 * Seventh and eighth, for Superghost's table of up to eight (2026-09-28), the
 * two of Okabe and Ito's set still unused — orange and sky blue — each with a
 * letter no other marble carries. The six games that seat six never reach them.
 */
export const PARTY_MARBLES: readonly PartyMarble[] = [
  { label: "Red", letter: "R", fill: "#d55e00", ink: "#ffffff" },
  { label: "Blue", letter: "B", fill: "#0072b2", ink: "#ffffff" },
  { label: "Yellow", letter: "Y", fill: "#f0e442", ink: "#1a1a1a" },
  { label: "Green", letter: "G", fill: "#009e73", ink: "#ffffff" },
  { label: "Purple", letter: "P", fill: "#cc79a7", ink: "#1a1a1a" },
  { label: "White", letter: "W", fill: "#f4f1ea", ink: "#1a1a1a" },
  { label: "Orange", letter: "O", fill: "#e69f00", ink: "#1a1a1a" },
  { label: "Sky blue", letter: "S", fill: "#56b4e9", ink: "#1a1a1a" },
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
    lead: "Chinese Checkers for two, three, four or six people round one phone or tablet. Take your turn, then pass it on. Nothing here is rated or kept anywhere but this browser.",
    farCamp: "the far point",
    about: "About Chinese Checkers, its rules and its rated game for two",
  },
  halma: {
    offer: "Pass and play: 2 or 4 players on this device",
    lead: "Halma for four people round one phone or tablet, or for two: each races their pieces from their own corner into the corner opposite, thirteen each when four play and nineteen when two do. Take your turn, then pass it on. Nothing here is rated or kept anywhere but this browser.",
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
  lead: "Dots and Boxes for two to six people round one phone or tablet. Take your turn, then pass it on. Nothing here is rated or kept anywhere but this browser.",
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

/** Where this browser keeps its game of Superghost: one at a time, apart from every other table's. */
export const GHOST_STORAGE_KEY = "itsutsu.superghost";

/** A run of the game's letters as the table reads them: English in capitals, Japanese as its kana. */
export function ghostShown(letters: string, language: PartyLanguage): string {
  return language === "english" ? letters.toUpperCase() : letters;
}

/** What Superghost's table says, beyond what every table says (`PARTY_COPY`). */
export const GHOST_COPY = {
  lead: "Superghost for two to eight people round one phone or tablet, in English or Japanese. Take your turn, then pass it on. Nothing here is rated or kept anywhere but this browser.",
  language: "Which language?",
  languages: {
    english: { name: "English", letters: "A–Z", words: "SCOWL's English words" },
    japanese: { name: "日本語", letters: "かな", words: "JMdict's readings, in Kumimoji's kana" },
  },
  table: "At the table",
  loading: "Fetching the word list…",
  failed: "The word list could not be fetched. Check the connection, then reload the page.",
  pick: "Tap a letter, then Add before or Add after — or challenge.",
  pickJapanese: "Tap a kana, then Add before or Add after — or challenge. が is played as か, ゃ as や.",
  addBefore: (letter: string | null) => (letter === null ? "Add before" : `Add ${letter} before`),
  addAfter: (letter: string | null) => (letter === null ? "Add after" : `Add ${letter} after`),
  challenge: (name: string | null) => (name === null ? "Challenge" : `Challenge ${name}`),
  noChallenge: "Nothing to challenge until somebody adds a letter.",
  empty: "No letters yet",
  answer: (name: string, challenger: string) => `${challenger} challenged ${name}. ${name}, type the word you had in mind, then Enter.`,
  typed: "Your word",
  cannot: "I can't name one",
  problems: {
    letters: "Only the game's letters, please.",
    short: (shortest: number) => `A word of ${shortest} letters or more.`,
    missing: (fragment: string) => `The word must have ${fragment} in it, its letters together and in order.`,
    unknown: (word: string) => `${word} is not in the site's word list. Try another, or give up the round.`,
  },
  lost: {
    spelled: (loser: string, word: string) => `${loser} finished ${word}, a word, and takes a letter.`,
    named: (answerer: string, word: string, challenger: string) => `${answerer} named ${word}, so ${challenger} takes a letter.`,
    caught: (loser: string) => `${loser} could not name a word, and takes a letter.`,
    /** After a round given up: a word the list has with the fragment in it, or that it has none. */
    example: (word: string | null) => (word === null ? "Nor could the word list." : `The list had ${word}.`),
  },
  out: "Out",
  isOut: (name: string) => `${name} is out.`,
  turn: "’s turn",
  answering: " must name a word",
  wins: (name: string) => `${name} wins: the last player left.`,
  rounds: (count: number) => `${count} ${count === 1 ? "round" : "rounds"} played.`,
  outAt: "Take every letter and you are out.",
  lettersLeft: (name: string, letters: string) => (letters === "" ? `${name}: no letters` : `${name}: ${letters}`),
  play: "Play →",
  continue: "Continue →",
  about: "About Superghost and its rules",
} as const;
