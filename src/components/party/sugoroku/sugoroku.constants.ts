import { GAME_ENDING_COPY } from "@/components/play/gameEnding.constants";

/** The board lying across the page, with the rail for the cube: the package's own drawing (`boardSize`), in its own units. */
export const SUGOROKU_LANDSCAPE = { width: 976, height: 552 } as const;

/** Narrower than this a board stands up, as the package's own "auto" does: a phone's width, where lying down is half the size. */
export const SUGOROKU_STAND_UP_BELOW_PX = 640;

/** How long the computer waits before it plays, so a table can watch the last move land, and a reader who asked for less motion gets a quarter of it. */
export const SUGOROKU_PAUSE_MS = 700;

/** The set-up's computer seat. */
export const SUGOROKU_COMPUTER_SEAT = 1;

export const SUGOROKU_COPY = {
  lead: (label: string) =>
    `${label} for two round one phone or tablet, against the computer at four strengths, or on two devices, each on their own. The dice are thrown for you. Nothing here is rated.`,
  play: "Play",
  card: "Tables on this device",
  matchLength: "How long",
  seats: "Who plays",
  youAre: "Player",
  person: "Person",
  computer: "Computer",
  strength: "Strength",
  start: "Start",
  startOnline: "Start the table",
  onePerson: "Every table needs a person: at least one seat is yours.",
  nameOf: (seat: number) => `Player ${seat + 1}`,
  white: "White",
  black: "Black",
  roll: "Roll the dice",
  rolling: "Waiting…",
  done: "Done",
  undo: "Undo",
  double: "Double",
  take: "Take",
  drop: "Drop",
  /** Resigning, in the one set of words every game uses (`GAME_ENDING_COPY`); asked in place in the stage's fixed row of three presses, which cannot grow a question beside it. */
  giveUp: GAME_ENDING_COPY.resign,
  giveUpAsk: GAME_ENDING_COPY.resignAsk,
  giveUpYes: GAME_ENDING_COPY.resign,
  giveUpNo: GAME_ENDING_COPY.keepPlaying,
  noMove: "No legal move: press Done.",
  chooseChecker: "Tap a checker to move it, then the point it goes to.",
  moreToPlay: (left: number) => (left === 1 ? "One die left to play." : `${left} dice left to play.`),
  thinking: (name: string) => `${name} is thinking…`,
  over: "Match over",
  gameOver: "Game over",
  again: "Play again, same table",
  kept: "Kept in this browser: leave and come back, and it is here.",
  about: "About this game, its rules and its family",
  soundOn: "Dice sound on",
  soundOff: "Dice sound off",
  idleDetail: "Nothing has moved at this table for a couple of minutes. There is no clock here; the game simply waits.",
  idleKept: "This game is kept in this browser. It will be here when you come back.",
  boardLabel: (label: string) => `The ${label} board`,
} as const;
