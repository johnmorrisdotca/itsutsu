/** The page a game on one device opens at from the history (`/games/<slug>/kept/<id>`). */
export const KEPT_COPY = {
  title: "From your history",
  kanji: "履歴",
  going: "Still going. Carry on with it on this device, where you left it.",
  over: "Finished. Open it on this device to see the table as it ended.",
  left: "Put away before it ended. Open it on this device to carry on from where it stopped.",
  carryOn: "Carry on here",
  look: "Open the finished game",
  opening: "Opening…",
  unreadable: "This device cannot open that game. It may have been kept by an older version of the site.",
  replaces: "A game of this kind already going on this device stays in your history, and can be opened from there again.",
  back: "Every game",
  /** Read from somebody else's history (`PlayerHistory`): looked at, never offered to this device. */
  theirs: {
    title: "From a player's history",
    whose: "Kept in the history of",
    lead: "Played on their device and kept in their history. Who sat where, and how it ended.",
    back: "Their games",
  },
} as const;
