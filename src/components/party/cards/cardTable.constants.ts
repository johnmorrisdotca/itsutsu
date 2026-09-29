import type { CardGameKind } from "@/lib/cardGames/cardGames.constants";

/** Where this browser keeps each card game: one of each at a time, apart from every other table's. */
export const CARD_TABLE_KEYS: Record<CardGameKind, string> = {
  hearts: "itsutsu.cards.hearts",
  bigTwo: "itsutsu.cards.bigTwo",
  president: "itsutsu.cards.president",
  goFish: "itsutsu.cards.goFish",
  crazyEights: "itsutsu.cards.crazyEights",
};

/**
 * How long a computer waits before it plays: long enough to see a card land,
 * short enough that a table of three computers is not a wait. A browser timer
 * on this page and nothing else; no server is asked anything.
 */
export const COMPUTER_PAUSE_MS = 650;

/** The seed a set-up's preview is dealt from: always the same deal, so a choice does not reshuffle the picture for nothing. */
export const PREVIEW_SEED = 2026;

/** The widest a card in a hand is drawn, in pixels: a phone's row of thirteen overlaps, a desk's barely does. */
export const HAND_CARD_PX = 64;

/**
 * THE TABLE IN THE MIDDLE: a board of the reader's own wood, as every table on
 * the site is (`BoardFrame`), wider than tall — eight across to five down —
 * laid out, like Solitaire's, in hundredths of its own width.
 */
export const CARD_TABLE_BOARD = { across: 8, down: 5, inset: 0.025, card: 15 } as const;

export const CARD_TABLE_COPY = {
  howMany: "How many are playing?",
  length: "How long",
  seats: "Who sits where",
  person: "Person",
  computer: "Computer",
  computerName: (seat: number) => `Computer ${seat + 1}`,
  onePerson: "Every table needs a person: at least one seat is yours.",
  start: "Start",
  kept: "Kept in this browser: leave and come back, and it is here.",
  passTo: (name: string) => `Pass the device to ${name}`,
  passNote: "Nobody's cards are shown until they have it.",
  ready: (name: string) => `I am ${name}: show my cards`,
  yourHand: "Your hand",
  handOf: (name: string) => `${name}'s hand`,
  thinking: (name: string) => `${name} is thinking…`,
  over: "Game over",
  won: (names: string) => `${names} won.`,
  again: "Play again, same table",
  newGame: "New game",
  confirmNew: "Start a new game? This one will be gone.",
  confirmYes: "Yes, start again",
  confirmNo: "Keep playing",
  cards: (count: number) => `${count} ${count === 1 ? "card" : "cards"}`,
  computerTag: "computer",
  scores: "Scores",
  lead: (game: string) => `${game} round one phone or tablet: a person or a computer in every seat. Nothing here is rated or kept anywhere but this browser.`,
  play: "Play",
  continue: "Continue",
  card: "Cards on this device",
  about: (game: string) => `About ${game}, its rules and its family`,
  idleDetail: "Nothing has moved at this table for a couple of minutes. There is no clock here; the game simply waits.",
  idleKept: "This game is kept in this browser. It will be here when you come back.",
} as const;
