// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.

/**
 * GUNJIN 軍人, the hidden-rank military board games, as the site names them.
 * Free of the package (`@johnmorrisdotca/gunjin`), so a page that only names
 * the game never carries the engine: every word and number here is the site's
 * own, and the engine is reached through `gunjin.ts` alone.
 *
 * A BOARD IS A GAME. The package holds five hidden-rank games; the set-up
 * offers four boards and each one is its game, as Mancala's two boards are
 * Kalah and Oware. The number a board is called by in `PARTY_SPECS` is its
 * squares (7 × 8 is 56), which no two share, so "size" says which game with no
 * table of its own to keep in step. Hidden Hasami, the fifth, is not offered: it
 * is a stone-capturing game with one secret leader, not a military one, and the
 * set-up holds four boards (docs/plans/party-games/README.md).
 */
export type GunjinMode = "luzhanqi-mini" | "salpakan" | "gunjin-shogi" | "stratego-lite";

/** What the site needs to know of each game before it asks the engine. */
export type GunjinBoardSpec = {
  mode: GunjinMode;
  /** Squares across and down. */
  width: number;
  height: number;
  /** The rows of each player's own side that their pieces fill. */
  homeRows: number;
  /** How many pieces a side has. */
  pieces: number;
  /** Whether a battle shows both ranks to both players (the rules' "reveal"), or only who was taken. */
  reveals: boolean;
  /** The game's name on this site. */
  name: string;
  kanji: string;
  /** One line under the tile: what is special about it. */
  note: string;
};

/** The four boards, in the order the set-up shows them, keyed by their squares. */
export const GUNJIN_BOARDS: Record<number, GunjinBoardSpec> = {
  56: { mode: "luzhanqi-mini", width: 7, height: 8, homeRows: 2, pieces: 14, reveals: false, name: "Luzhanqi Mini", kanji: "陸戦棋", note: "14 pieces, camps and headquarters" },
  72: { mode: "salpakan", width: 9, height: 8, homeRows: 3, pieces: 21, reveals: false, name: "Salpakan", kanji: "星", note: "21 pieces, a spy and a flag that can march" },
  81: { mode: "gunjin-shogi", width: 9, height: 9, homeRows: 4, pieces: 31, reveals: false, name: "Gunjin Shogi", kanji: "軍人将棋", note: "31 pieces, aircraft, tanks and mines" },
  100: { mode: "stratego-lite", width: 10, height: 10, homeRows: 4, pieces: 40, reveals: true, name: "Capture Flag", kanji: "旗取り", note: "40 pieces, lakes, bombs and scouts" },
};

/**
 * THE LAKES OF CAPTURE FLAG, as columns and rows from the top left: eight
 * squares nothing may enter or cross. The package's engine knows them and its
 * drawing (0.1.0) does not paint them, so the board shades them here from the
 * engine's own list; `gunjin.test.ts` plays games and fails if the engine ever
 * offers a move onto one, which is how a change on its side is noticed.
 */
export const GUNJIN_LAKES: Partial<Record<GunjinMode, readonly (readonly [number, number])[]>> = {
  "stratego-lite": [
    [2, 4],
    [3, 4],
    [6, 4],
    [7, 4],
    [2, 5],
    [3, 5],
    [6, 5],
    [7, 5],
  ],
};

/** The squares of every board offered, in the set-up's order: what `PARTY_SPECS.gunjin` offers as sizes. */
export const GUNJIN_SIZES: readonly number[] = [56, 72, 81, 100];

/** The board the set-up opens on: the Japanese game the site is named for. */
export const GUNJIN_DEFAULT_SIZE = 81;

/** A board by its squares, or null for a number no board has. */
export function gunjinBoardOf(size: number): GunjinBoardSpec | null {
  return GUNJIN_BOARDS[size] ?? null;
}

/** The two seats: the red side sits at the foot of the board, the blue side at the head. */
export const GUNJIN_SEATS = 2;

/** The key the kept game is written under in this browser. */
export const GUNJIN_STORAGE_KEY = "itsutsu.gunjin";

/** The kept text's version: a later release that cannot read an older one refuses it rather than guessing. */
export const GUNJIN_SAVE_VERSION = 1;

/** How many different arrangements of a side `moves` offers in the set-up, where a person chooses their own. */
export const GUNJIN_OFFERED_SETUPS = 3;

/** The reasons a game ends, in the words a table says them, by the engine's own word for each. */
export const GUNJIN_REASONS: Record<string, string> = {
  "objective-captured": "the leader was taken",
  "capture-threshold": "too few pieces were left",
  blocked: "the other side had no move",
  "flag-won": "the flag was taken",
  "flag-held": "the flag reached the far row and stayed there",
  resigned: "resigned",
  "agreed-draw": "a draw was agreed",
  repetition: "the position came round three times",
};
