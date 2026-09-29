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

/** Where this browser keeps its game of Mancala: one at a time, apart from every other table's. */
export const MANCALA_STORAGE_KEY = "itsutsu.mancala";

/**
 * How long a sowing takes to draw: one step a seed, never slower than this a
 * step, and the whole of it about half a second whatever its length — well
 * under a second, so a table is never kept waiting. Under
 * `prefers-reduced-motion` it is not drawn at all (`useSowing`).
 */
export const MANCALA_SOW_STEP_MS = 90;
export const MANCALA_SOW_TOTAL_MS = 520;

/** The seeds' own colours, a handful of pale stones: no seed belongs to anybody, so none carries a player's colour. */
export const MANCALA_SEED_TONES: readonly string[] = ["#f4efe4", "#dcd3c1", "#c9b99b", "#e9dcc3", "#d2c7b5"];

/** What Mancala's table says, beyond what every table says (`PARTY_COPY`). */
export const MANCALA_COPY = {
  lead: "Mancala for two, passed across one phone or tablet: Kalah, the default, or Oware. Take your turn, then pass it on. Nothing here is rated or kept anywhere but this browser.",
  rules: "Which rules?",
  names: "Names, if you like",
  /** Each rule set in a line, on its set-up tile. */
  ruleLine: { kalah: "Sow into your store. Last seed home: sow again. Last in an empty pit: capture across.", oware: "Stores keep captures only. Make 2 or 3 on their side: take them. 25 wins." },
  tap: "Tap one of your pits, ringed in your colour, to sow its seeds.",
  feed: (hungry: string) => `${hungry} has no seeds: you must sow into their row if you can.`,
  again: (name: string) => `Another turn: ${name}'s last seed fell in their store.`,
  captured: (name: string, seeds: number) => `${name} captured ${seeds}.`,
  grandSlam: (name: string, other: string) => `Grand slam: it would take all ${other}'s seeds, so ${name} takes none.`,
  seeds: (count: number) => `${count} ${count === 1 ? "seed" : "seeds"}`,
  sowings: (count: number) => `${count} ${count === 1 ? "sowing" : "sowings"}`,
  /** Why the game ended, for the winner's line. */
  ending: {
    rowEmpty: "A row ran out of seeds, and each player took what was left on their side.",
    majority: "More than half the seeds were taken.",
    even: "Twenty-four each.",
    cannotFeed: "One row was empty and nothing could be sown into it, so each player took the seeds on their side.",
    repeated: "The same position came round a third time, so each player took the seeds on their side.",
  },
  store: "store",
  taken: "taken",
  play: "Play →",
  continue: "Continue →",
  about: "About Mancala and its rules",
} as const;

/** Where this browser keeps its game of Mexican Train: one at a time, apart from every other table's. */
export const TRAIN_STORAGE_KEY = "itsutsu.mexicanTrain";

/**
 * EACH NUMBER'S PIPS IN A COLOUR OF ITS OWN, as most double-twelve and
 * double-fifteen sets print them, so a nine and a twelve are told apart at a
 * glance on a phone as well as by their shape (`pipSpots`). Dark enough to
 * read on the tile's ivory in either theme, since a tile is a light object on
 * the table whatever the page is (`surface-light`). Indexed by the number;
 * blank has no pips.
 */
export const TRAIN_PIP_COLOURS: readonly string[] = [
  "#22231f",
  "#1f6fb0",
  "#2e7d4a",
  "#b2302f",
  "#7a4a1f",
  "#233f8f",
  "#9d6c1f",
  "#6f3b8f",
  "#11706e",
  "#22231f",
  "#8a1f3f",
  "#3d4a57",
  "#c2540f",
  "#546f14",
  "#a8327a",
  "#4b4a44",
];

/** How long a computer takes over a move, so the table can watch it lay: a fixed pause, never a poll. Shorter under reduced motion. */
export const TRAIN_COMPUTER_PAUSE_MS = 650;
export const TRAIN_COMPUTER_PAUSE_REDUCED_MS = 150;

/** How near together two taps on one tile must be to count as a double-tap, and how far a finger must move to start a drag. */
export const TRAIN_DOUBLE_TAP_MS = 380;
export const TRAIN_DRAG_PX = 8;

/** What Mexican Train's table says, beyond what every table says (`PARTY_COPY`). */
export const TRAIN_COPY = {
  lead: "Mexican Train for two to eight round one phone or tablet, with a computer in any seat you like. Hands are secret: the table covers yours between turns. Nothing here is rated or kept anywhere but this browser.",
  set: "Which set?",
  setLine: { 9: "55 tiles, 10 rounds. Quicker, with fewer pips.", 12: "91 tiles, 13 rounds. The set the game is sold with.", 15: "136 tiles, 16 rounds. A long evening." } as Record<number, string>,
  howMany: "How many are playing?",
  seats: "Who is at the table",
  computer: "Computer",
  computerHelp: "A computer plays this seat",
  house: "House rules",
  lengthLabel: "Rounds",
  lengths: { full: "Every round", short: "A short game" },
  lengthLine: { full: "One for every double, the highest down to blank.", short: "Half as many, from the highest double." },
  doublesLabel: "Doubles",
  doubles: { one: "One at a time", chain: "Chained" },
  doublesLine: { one: "Cover a double before anything else.", chain: "Lay more doubles, then cover the last first." },
  mexicanLabel: "Mexican Train",
  mexican: { any: "Open from the start", ownFirst: "After your own" },
  mexicanLine: { any: "Anybody may lay on it at any time.", ownFirst: "Only once your own train has begun." },
  hub: "Hub",
  mexicanTrain: "Mexican Train",
  boneyard: (count: number) => `${count} to draw`,
  round: (round: number, rounds: number) => `Round ${round} of ${rounds}`,
  engine: (engine: number) => `Double ${engine} in the hub`,
  tiles: (count: number) => `${count} ${count === 1 ? "tile" : "tiles"}`,
  more: (count: number) => `+${count}`,
  pass: (name: string) => `Pass the device to ${name}`,
  passNote: "Their tiles are hidden until they say it is them.",
  iAm: (name: string) => `I’m ${name}`,
  hide: "Hide my tiles",
  yourTiles: (name: string) => `${name}’s tiles`,
  tap: "Drag a tile onto a lit train, or tap it and then the train. Tap a tile twice to lay it where it alone fits.",
  pick: (tile: string) => `${tile} chosen: tap a lit train to lay it.`,
  nowhere: "That tile goes nowhere now.",
  draw: "Draw a tile",
  passTurn: "Pass: marker out",
  mustDraw: "Nothing to lay: draw a tile.",
  mustPass: (drew: boolean) => (drew ? "The tile drawn will not go: pass, and your marker goes out." : "Nothing to lay and nothing to draw: pass, and your marker goes out."),
  cover: (tile: string, owner: string) => `The double ${tile} on ${owner} must be covered first.`,
  thinking: (name: string) => `${name} is thinking…`,
  turn: (name: string) => `${name} to play`,
  laid: (name: string, tile: string, where: string) => `${name} laid ${tile} on ${where}.`,
  drew: (name: string) => `${name} drew a tile.`,
  passed: (name: string) => `${name} passed, and put their marker out.`,
  roundOver: (round: number) => `Round ${round} is over`,
  wentOut: (name: string) => `${name} went out.`,
  blocked: "Nobody could lay a tile and there was nothing left to draw.",
  nextRound: "Deal the next round",
  scores: "Scores",
  pips: (count: number) => `${count} ${count === 1 ? "pip" : "pips"}`,
  total: "Total",
  lowestWins: "Lowest total wins.",
  wins: (names: string) => `${names} wins with the lowest total.`,
  share: (names: string) => `${names} share the win with the lowest total.`,
  their: (name: string) => `${name}’s train`,
  play: "Play →",
  continue: "Continue →",
  about: "About Mexican Train and its rules",
} as const;
