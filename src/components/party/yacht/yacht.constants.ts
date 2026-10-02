import type { YachtBox } from "@/lib/party/yacht/yacht.types";

/** Where this browser keeps its game of Yacht: one at a time, apart from every other table's. */
export const YACHT_STORAGE_KEY = "itsutsu.yacht";

/** Where this browser remembers whether the dice make a sound: off until somebody turns it on. */
export const DICE_SOUND_KEY = "itsutsu.diceSound";

/** How long the dice tumble after a roll (Korokoro's die, `PartyDie`). */
export const DICE_TUMBLE_MS = 650;

/** How long a computer waits before its move: long enough to watch the dice land. */
export const YACHT_COMPUTER_PAUSE_MS = 1000;
export const YACHT_COMPUTER_PAUSE_REDUCED_MS = 200;


export const YACHT_COPY = {
  lead: "Yacht for one to eight round one phone or tablet, with a computer in any seat you like: five dice, three rolls, a sheet of thirteen boxes. Nothing here is rated or kept anywhere but this browser.",
  play: "Play Yacht",
  howMany: "How many are playing?",
  alone: "Alone: fill the sheet and beat your best.",
  seats: "Who is at the table",
  computer: "Computer",
  computerHelp: "A computer plays this seat, in this browser.",
  roll: "Roll",
  rollFirst: "Roll the dice",
  rollsLeft: (left: number) => (left === 1 ? "1 roll left" : `${left} rolls left`),
  noRolls: "No rolls left: choose a box",
  tapToHold: "Tap a die to hold it; tap a box to score.",
  tapTray: "Tap the tray or press Roll to throw.",
  held: "Held",
  turn: (name: string, roll: number) => (roll === 0 ? `${name} to roll` : `${name}: roll ${roll} of 3`),
  thinking: (name: string) => `${name} is rolling…`,
  wrote: (name: string, score: number, box: string) => `${name} scored ${score} for ${box}.`,
  sheet: "Score sheet",
  box: "Box",
  upper: "Upper total",
  bonus: "Bonus (63 or more)",
  total: "Total",
  highestWins: "Highest total wins.",
  wins: (name: string) => `${name} wins!`,
  share: (names: string) => `${names} share the win.`,
  aloneScored: (total: number) => `Your sheet is full: ${total} points.`,
  sound: "Sound",
  soundOn: "Dice sound on",
  soundOff: "Dice sound off",
  about: "About Yacht and its rules",
} as const;

/** Each box as the sheet names it, and what it asks for, in a few words. */
export const YACHT_BOX_WORDS: Record<YachtBox, { name: string; hint: string }> = {
  ones: { name: "Ones", hint: "every 1" },
  twos: { name: "Twos", hint: "every 2" },
  threes: { name: "Threes", hint: "every 3" },
  fours: { name: "Fours", hint: "every 4" },
  fives: { name: "Fives", hint: "every 5" },
  sixes: { name: "Sixes", hint: "every 6" },
  threeKind: { name: "Three of a kind", hint: "all dice" },
  fourKind: { name: "Four of a kind", hint: "all dice" },
  fullHouse: { name: "Full house", hint: "25" },
  smallStraight: { name: "Small straight", hint: "4 in a row: 30" },
  largeStraight: { name: "Large straight", hint: "5 in a row: 40" },
  yacht: { name: "Yacht", hint: "5 alike: 50" },
  chance: { name: "Chance", hint: "all dice" },
};
