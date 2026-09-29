import type { BlocksRefusal } from "@/lib/gomoku/party/partyBlocks.types";

/** Where this browser keeps the Block Five game for four: one at a time, apart from every other table's and the board for two's. */
export const PARTY_BLOCKS_STORAGE_KEY = "itsutsu.partyBlocks";

/** Every word Block Five's table for four says, in one place. */
export const PARTY_BLOCKS_COPY = {
  title: "Block Five for four",
  kanji: "四人積み",
  /** On Block Five's own page, the way in. */
  offer: "Pass and play: 4 players on this device",
  resume: "Continue the Block Five game for four",
  lead: "A different game from Block Five for two: four people round one phone or tablet, a corner each, each laying their own twenty-one shapes of one to five squares. Every new piece must touch one of your own at a corner and never along a side. When nobody can lay another piece, the most squares covered wins. Take your turn, then pass it on — or choose Several devices, and each plays on their own. Nothing here is rated.",
  names: "The four players, a corner each",
  start: "Start",
  preview: "Each player starts from the corner in their colour.",
  tray: "Your pieces",
  trayKanji: "手駒",
  /** Under the tray: how a piece is laid. */
  how: "Choose a piece, turn or flip it, then tap where it goes. Tap it again to lay it.",
  keys: "Keys: R turns, F flips.",
  refusals: {
    over: "The game is over.",
    used: "That piece is already on the board.",
    offBoard: "It does not fit on the board there.",
    taken: "Part of it would cover a square already taken.",
    sideTouch: "It would touch one of your own pieces along a side.",
    firstCorner: "Your first piece must cover your own corner square.",
    noCorner: "It must touch one of your own pieces corner to corner.",
  } satisfies Record<BlocksRefusal, string>,
  /** Beside a player who has nothing that fits. */
  out: "Out",
  /** Under the turn line, once somebody has had to stop. */
  sittingOut: (names: string) => `Passing for the rest of the game, with no piece that fits: ${names}.`,
  squares: (count: number) => `${count} ${count === 1 ? "square" : "squares"}`,
  piecesLeft: (count: number) => `${count} left`,
  won: (name: string, squares: number) => `${name} wins, with ${squares} squares covered.`,
  shared: (names: string, squares: number) => `${names} share the win, with ${squares} squares each.`,
  ended: "Nobody can lay another piece: the game is over, and the squares are counted.",
  newGame: "New game",
  confirmNew: "Start a new game? This one will be gone.",
  confirmYes: "Yes, start again",
  confirmNo: "Keep playing",
  again: "Play again, same table",
  kept: "Kept in this browser: leave and come back, and it is here.",
  idleDetail: "Nothing has been laid at this table for a couple of minutes. There is no clock here; the game simply waits.",
  idleKept: "This game is kept in this browser. It will be here when you come back.",
  /** On My games' Pass and play tab. */
  card: "Pass and play on this device",
  about: "About Block Five, its rules and its rated game for two",
} as const;
