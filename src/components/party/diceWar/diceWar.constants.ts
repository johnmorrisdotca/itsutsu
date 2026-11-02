/** Where this browser keeps its game of Dice War: one at a time, apart from every other table's. */
export const DICE_WAR_STORAGE_KEY = "itsutsu.diceWar";

/** How long the dice tumble after a throw: Korokoro's own length, long enough to watch each land. */
export const DICE_WAR_TUMBLE_MS = 600;

/** How long the computers wait before they throw for themselves, so a table can watch the last throw before the next. */
export const DICE_WAR_PAUSE_MS = 1200;
export const DICE_WAR_PAUSE_REDUCED_MS = 250;

/** How wide a die is drawn, in pixels, by how many a player throws: a lone die is big, ten fit a phone's row. */
export function dieWidth(dice: number): number {
  return dice === 1 ? 52 : dice <= 3 ? 40 : dice <= 5 ? 32 : 24;
}

export const DICE_WAR_COPY = {
  lead: "Dice War for two to eight round one phone or tablet, with a computer in any seat you like: everybody rolls, the highest total scores, and a tie is war. Nothing here is rated or kept anywhere but this browser.",
  play: "Play Dice War",
  howMany: "How many are playing?",
  seats: "Who sits where",
  person: "Person",
  computer: "Computer",
  computerHelp: "A computer rolls for this seat, in this browser.",
  dice: "Dice each",
  diceHelp: "Each player rolls this many dice, added up.",
  sides: "Sides on each die",
  goal: "Play to",
  points: (count: number) => `${count} points`,
  rounds: (count: number) => `${count} rounds`,
  odds: (win: string, war: string) => `Each throw: ${win} somebody wins outright, ${war} it is war.`,
  onePerson: "Every table needs a person: at least one seat is yours.",
  start: "Start",
  roll: "Roll",
  rollDice: "Roll the dice",
  rolling: "Rolling…",
  yourTurn: "Press Roll.",
  thinking: "The computers roll next.",
  war: "War",
  stake: (count: number) => (count === 1 ? "1 point at stake" : `${count} points at stake`),
  scoreHeading: "Points",
  total: (count: number) => `total ${count}`,
  notIn: "not in this war",
  over: "Game over",
  won: (names: string) => `${names} won.`,
  again: "Play again, same table",
  soundOn: "Dice sound on",
  soundOff: "Dice sound off",
  kept: "Kept in this browser: leave and come back, and it is here.",
  card: "Dice on this device",
  about: "About Dice War, its rules and its family",
  idleDetail: "Nothing has moved at this table for a couple of minutes. There is no clock here; the game simply waits.",
  idleKept: "This game is kept in this browser. It will be here when you come back.",
} as const;
