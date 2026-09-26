/**
 * KUMIMOJI 組文字: build one crossword of your own from letter tiles drawn
 * from a bag, and draw more whenever the hand is used and the grid is sound.
 *
 * Every number the game is played by is here, in one table each, so John can
 * tune the game without reading the code that plays it.
 */

/**
 * THE MIX: how many of each letter a full set holds, 144 tiles in all. This is
 * the letter-frequency table of the best-known anagram-grid tile game, a fact
 * about how often English uses its letters and nobody's rule text. A solo game
 * never uses the whole set: its bag is drawn from it (`KUMIMOJI_BAG`), and no
 * bag holds more of a letter than this table does.
 *
 * To tune the letters, change the counts here. The total is checked by
 * `tiles.test.ts`, so an edit that loses a tile says so.
 */
export const TILE_MIX: Readonly<Record<string, number>> = {
  a: 13, b: 3, c: 3, d: 6, e: 18, f: 3, g: 4, h: 3, i: 12, j: 2, k: 2, l: 5, m: 3,
  n: 8, o: 11, p: 3, q: 2, r: 9, s: 6, t: 9, u: 6, v: 3, w: 3, x: 2, y: 3, z: 2,
};

/** The whole set, counted from the table. */
export const TILE_MIX_TOTAL = Object.values(TILE_MIX).reduce((sum, count) => sum + count, 0);

/**
 * THERE IS NO BOARD. John, 2026-09-26: "curious if we just have a large board
 * that iphone users have to zoom in and out, scroll, etc… since literally
 * there is no board in the real world game." The tiles lie on a table that
 * grows with them (`tableView.ts`), so a grid is as wide and as tall as its
 * player builds it. This is only the most a finished grid may measure either
 * way before the check refuses it unread: fifty tiles in one line is fifty.
 */
export const KUMIMOJI_GRID_MOST = 60;

/**
 * THE HANDS, which are the puzzle's sizes: the tiles a game opens with. John,
 * 2026-09-26: "you were given seven or 11 starting tiles". Three is for the
 * browser tests alone — a game that can be finished in a few presses — and is
 * never offered on the set-up screen.
 */
export const KUMIMOJI_HANDS = { tiny: 3, quick: 7, classic: 11 } as const;

/**
 * HOW MANY TILES A GAME USES IN ALL, by its hand: the bag is this many tiles,
 * the hand included, and the game ends when every one of them is on a sound
 * grid. Chosen so a game is a sitting, not an evening: a Quick game is forty
 * tiles, a Classic fifty. The full set of 144 is the mix they are drawn from,
 * not a bag anybody plays alone.
 */
export const KUMIMOJI_BAG: Readonly<Record<number, number>> = {
  [KUMIMOJI_HANDS.tiny]: 5,
  [KUMIMOJI_HANDS.quick]: 40,
  [KUMIMOJI_HANDS.classic]: 50,
};

/** How many tiles one Draw takes from the bag, once the hand is used and the grid is sound. */
export const KUMIMOJI_DRAW = 1;

/**
 * THE TRADE: one awkward tile back into the bag for three new ones — the
 * classic way out of a hand of Q, X and J. The tile given back goes to the
 * bottom of the bag, so it comes round again before the end; offered only
 * while the bag has three to give.
 */
export const KUMIMOJI_TRADE = { give: 1, take: 3 } as const;

/**
 * WHAT A FINISHED GAME SCORES on its leaderboard, as the other puzzles score
 * theirs (`puzzlePoints.ts`): ten for every tile laid, and as much again for
 * speed, which falls away evenly until a game that took half a minute a tile
 * earns no speed at all. A Classic game of fifty tiles in ten minutes is
 * 500 + 300 = 800. The time is the browser's clock, as every solo time here is.
 */
export const KUMIMOJI_SCORE = { tile: 10, slowestMsATile: 30_000 } as const;
