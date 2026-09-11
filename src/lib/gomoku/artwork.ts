/**
 * Where a game's pictures live, as addresses.
 *
 * Two files per game, both cut by scripts and committed under public/:
 *
 *   /art/games/<variant>.jpg          the board mid-game, 712×712 — the rules
 *                                     page, the game's front door, the cards
 *   /art/games/thumbs/<variant>.jpg   the same board at 96×96 — every list
 *                                     that names a game beside other games
 *
 * This module holds only the addresses, and touches no file system, so a
 * client component can import it. Whether the files EXIST is a build-time
 * question, asked by `hasGameImage` / `hasGameThumb` in lib/learn/images.ts
 * and enforced by variants.coverage.test.ts — a page never asks it.
 */

/** The directory under public/ that holds every game's board, as an address. */
export const GAME_ART_DIR = "/art/games";

/**
 * The thumbnail's edge in pixels. Drawn at 40–48 CSS pixels, so this is crisp
 * on a two-density screen. scripts/make-game-thumbs.mjs cuts to the same
 * number and says so; the two are kept in step by hand because a script
 * cannot import this file.
 */
export const THUMB_SIZE = 96;

/** The full board of a game, for a page about that game. */
export function gameArtPath(variant: string): string {
  return `${GAME_ART_DIR}/${variant}.jpg`;
}

/** The small board of a game, for a row that names it among others. */
export function gameThumbPath(variant: string): string {
  return `${GAME_ART_DIR}/thumbs/${variant}.jpg`;
}
