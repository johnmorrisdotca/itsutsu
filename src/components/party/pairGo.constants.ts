/** Where this browser keeps the Pair Go game: one at a time, apart from the board for two's. */
export const PAIR_GO_STORAGE_KEY = "itsutsu.pairGo";

/** Every word Pair Go's pages say, in one place. */
export const PAIR_GO_COPY = {
  title: "Pair Go",
  kanji: "ペア碁",
  /** On Go's own page, the way in. */
  offer: "Pair Go: two teams of two on this device",
  resume: "Continue the Pair Go game",
  lead: "Go for four: two teams of two, Black and White, round one phone or tablet. The turns go round the table — Black's first player, White's first, Black's second, White's second — and partners may not talk. Or choose Several devices, and each plays on their own, with the site's Go programs in any seat you like. Nothing here is rated.",
  teams: "The two teams",
  /** Beside each name box: the seat's colour, and where its first turn comes. */
  seatLabel: (colour: string, turn: number) => `${colour}, plays ${["first", "second", "third", "fourth"][turn]}`,
  size: "Board",
  start: "Start",
  pass: "Pass",
  resign: "Resign",
  confirmResign: (team: string) => `Resign for ${team}? The other team wins.`,
  resignYes: "Yes, resign",
  again: "Play again, same teams",
  noTalking: "Partners play in turn and may not talk.",
  /** After one pass, whose it was and what another would do. */
  passed: (who: string) => `${who} passed. Another pass now ends the game, and the board is counted.`,
  counted: "Two passes in a row: the board is counted, stones and walled-in ground.",
  kept: "Kept in this browser: leave and come back, and it is here.",
  idleDetail: "Nothing has moved for a couple of minutes. Pair Go has no clock, so nothing is lost.",
  away: "The Pair Go game is kept in this browser; come back to it whenever the table is ready.",
  /** On My games' Pass and play tab. */
  card: "Pair Go on this device",
  about: "About Go, its rules and its rated game for two →",
} as const;
