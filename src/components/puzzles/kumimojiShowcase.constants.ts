/*
 * The look of Kumimoji's showcase on its own pages — the try-it on the front
 * door and the tiles counted on the rules page — kept apart from
 * `kumimoji.constants.ts`, which is the game's own look and is watched by the
 * puzzle pictures' stamp (`puzzleArtFingerprint.ts`).
 */

/**
 * THE TRY-IT ON THE FRONT DOOR (`KumimojiTryIt`): the game's own table in a
 * box of its own height, short enough that the hand and the presses under it
 * are on a phone's screen with it.
 */
export const TRY_IT_BOX = "relative h-64 w-full touch-none overflow-hidden rounded-xl select-none sm:h-72";

/**
 * What the try-it fetches, said before it is fetched: the game's English word
 * list (`words.en.data.ts`, `loadTileWords`), about 600 KB of words that
 * compress to about 280 KB (measured with gzip on 2026-09-28). A static file,
 * fetched once by the first tap and never by a page view; no server work.
 */
export const TRY_IT_LIST_KB = 280;

/** A tile in the rules page's count of the set: small enough for seven to a row on a phone. */
export const MIX_TILE_PX = 34;
