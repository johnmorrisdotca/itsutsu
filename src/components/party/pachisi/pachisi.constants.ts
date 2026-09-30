/** Where this browser keeps its game of Pachisi: one at a time, apart from every other table's. */
export const PACHISI_STORAGE_KEY = "itsutsu.pachisi";

/** How long a computer waits before each of its moves: long enough to watch the dice land and the pawn go. */
export const PACHISI_COMPUTER_PAUSE_MS = 900;
export const PACHISI_COMPUTER_PAUSE_REDUCED_MS = 200;

export const PACHISI_COPY = {
  lead: "Pachisi for two to four round one phone or tablet, with a computer in any seat you like: race your four pawns round the cross and home, sending your opponents back as you go. Nothing here is rated or kept anywhere but this browser.",
  play: "Play Pachisi",
  continue: "Continue your game of Pachisi",
  howMany: "How many are playing?",
  seats: "Who is at the table",
  computer: "Computer",
  computerHelp: "A computer plays this seat, in this browser.",
  roll: "Roll the dice",
  toRoll: (name: string) => `${name} to roll`,
  toMove: (name: string) => `${name} to move`,
  thinking: (name: string) => `${name} is playing…`,
  choose: "Choose a number, then tap a ringed pawn to move it that far.",
  both: (sum: number) => `${sum}: both dice`,
  bonus: (value: number) => `${value} bonus`,
  rolled: (name: string, a: number, b: number) => `${name} threw ${a} and ${b}${a === b ? ": doubles, and another throw after" : ""}.`,
  noMove: "Nothing could move.",
  moved: (name: string, by: number) => `${name} moved a pawn ${by}.`,
  entered: (name: string) => `${name} brought a pawn out of the nest.`,
  took: (name: string) => ` ${name}'s pawn goes back to the nest, and 20 to move.`,
  home: " A pawn home, and 10 to move.",
  thirdDouble: (name: string) => `${name} threw a third double: their leading pawn goes back to the nest.`,
  home4: (count: number) => `${count} of 4 home`,
  about: "About Pachisi and its rules",
} as const;
