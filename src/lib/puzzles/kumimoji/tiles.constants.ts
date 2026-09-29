import type { KumimojiLength } from "./kumimoji.types";

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
 * about how often English uses its letters and nobody's rule text. Short and
 * Medium games draw from it; Full uses all 144 tiles. Double uses two copies.
 *
 * To tune the letters, change the counts here. The total is checked by
 * `tiles.test.ts`, so an edit that loses a tile says so.
 */
export const TILE_MIX: Readonly<Record<string, number>> = {
  a: 13, b: 3, c: 3, d: 6, e: 18, f: 3, g: 4, h: 3, i: 12, j: 2, k: 2, l: 5, m: 3,
  n: 8, o: 11, p: 3, q: 2, r: 9, s: 6, t: 9, u: 6, v: 3, w: 3, x: 2, y: 3, z: 2,
};

/**
 * THE JAPANESE SET: 144 hiragana tiles in 45 kinds (`kana.ts`), as the English
 * set is 144 letters. Shared by how often each kana is used in the commonest
 * words — the answers the kana Gomoji hides, each kana read as its tile — with
 * one of any kana that comes out below one; measured that way, English comes
 * out the shape of the table above. So ぬ, へ, ね, ろ, れ, む and の are the
 * hard tiles, Japanese's Q, X and Z, and う, ん, い and し, which end and join
 * everything, are its E's. John, 2026-09-28: "the letters that you don't
 * really wanna get… should really be low counts just like Z and XNQ".
 *
 * Fixed here rather than taken from the monthly dictionary refresh, which
 * prints what it measures beside this table (`scripts/word-lists-ja.mjs`): a
 * kept game's bag is checked against these counts.
 */
export const JAPANESE_TILE_MIX: Readonly<Record<string, number>> = {
  あ: 2, い: 11, う: 12, え: 1, お: 2, か: 7, き: 6, く: 6, け: 3, こ: 4,
  さ: 3, し: 10, す: 2, せ: 3, そ: 2, た: 4, ち: 3, つ: 6, て: 2, と: 3,
  な: 1, に: 1, ぬ: 1, ね: 1, の: 1, は: 2, ひ: 2, ふ: 2, へ: 1, ほ: 1,
  ま: 2, み: 1, む: 1, め: 1, も: 1, や: 2, ゆ: 4, よ: 6, ら: 1, り: 3,
  る: 3, れ: 1, ろ: 1, わ: 1, ん: 11,
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
 * SHORT GAME TOTALS, by opening hand. Medium and Full derive from the tile
 * inventory in `kumimojiTileCount`; these stay the existing Short lengths.
 */
export const KUMIMOJI_BAG: Readonly<Record<number, number>> = {
  [KUMIMOJI_HANDS.tiny]: 5,
  [KUMIMOJI_HANDS.quick]: 40,
  [KUMIMOJI_HANDS.classic]: 50,
};

/** Wild tiles per original 40/50-tile game, included within the bag total. */
export const KUMIMOJI_WILDS: Readonly<Record<number, Readonly<Record<"easy" | "medium" | "hard", number>>>> = {
  [KUMIMOJI_HANDS.tiny]: { easy: 0, medium: 0, hard: 0 },
  [KUMIMOJI_HANDS.quick]: { easy: 6, medium: 3, hard: 0 },
  [KUMIMOJI_HANDS.classic]: { easy: 8, medium: 4, hard: 0 },
};

/** Tile count for a selected length and inventory size. Double supplies two sets. */
export function kumimojiTileCount(hand: number, length: KumimojiLength, setSize = TILE_MIX_TOTAL, doubleSet = false): number {
  const short = KUMIMOJI_BAG[hand];
  if (short === undefined) throw new Error(`No Kumimoji with a hand of ${hand}.`);
  if (!Number.isInteger(setSize) || setSize < 1) throw new Error(`Invalid Kumimoji set size: ${setSize}.`);
  const multiplier = doubleSet ? 2 : 1;
  const available = setSize * multiplier;
  if (short * multiplier > available) throw new Error(`A short game needs more tiles than the ${available}-tile set holds.`);
  if (length === "short") return short * multiplier;
  if (length === "medium") return Math.floor(available / 2);
  return available;
}

/** Wilds scale with the bag; doubling the tile set doubles the wild count too. */
export function kumimojiWildCount(hand: number, level: "easy" | "medium" | "hard", totalTiles: number): number {
  const short = KUMIMOJI_BAG[hand];
  const wilds = KUMIMOJI_WILDS[hand];
  if (short === undefined || wilds === undefined) throw new Error(`No Kumimoji with a hand of ${hand}.`);
  if (!Number.isInteger(totalTiles) || totalTiles < short) throw new Error(`Invalid Kumimoji tile count: ${totalTiles}.`);
  return Math.round((wilds[level] * totalTiles) / short);
}

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

/**
 * PASS AND PLAY: up to eight people round one device, each with a hand and a
 * table of their own from one shared bag (`party.ts`). John, 2026-09-28: "pass
 * and play with up to eight players". One player is the solo game, unchanged.
 * A name is optional and kept to a line: it is shown on the cover and the
 * finish, never sent anywhere.
 */
export const KUMIMOJI_PARTY = { least: 2, most: 8, nameMost: 20 } as const;
