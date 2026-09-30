import type { TilePlay } from "./play.ts";
import type { TileWords } from "./tileWords.ts";

/**
 * HELP: THE HAND ARRANGED INTO A WORD. John, 2026-09-28: "a help button next
 * to the sort button where if you click it, the letters in your board are all
 * arranged to make words. Every time you click the help button it cycles
 * through a different word… Even though it's a little cheating, they still
 * have to find a place for it on the board so it's not super powerful."
 *
 * Chosen on the set-up screen or not at all (the puzzles' `hints=1`), and each
 * press is counted as a hint, so a helped game is kept and priced as one.
 * Only the hand's own tiles are read — a wild is left for the player to place
 * — and nothing on the table is moved.
 */

/** How many words one hand offers before the presses go round again: the longest first. */
export const HELP_WORDS_MOST = 40;

/** The words the hand's own tiles spell, longest first and then in the list's order; wilds are not used. */
export function wordsInHand(hand: readonly string[], words: TileWords): string[] {
  const have = new Map<string, number>();
  for (const tile of hand) if (!words.isWild(tile)) have.set(tile, (have.get(tile) ?? 0) + 1);
  const tiles = [...have.values()].reduce((sum, count) => sum + count, 0);
  const found: string[] = [];
  const need = new Map<string, number>();
  for (let length = tiles; length >= 2 && found.length < HELP_WORDS_MOST; length -= 1) {
    for (const word of words.byLength.get(length) ?? []) {
      need.clear();
      let spelt = true;
      for (const tile of word) {
        const count = (need.get(tile) ?? 0) + 1;
        if (count > (have.get(tile) ?? 0)) {
          spelt = false;
          break;
        }
        need.set(tile, count);
      }
      if (!spelt) continue;
      found.push(word);
      if (found.length >= HELP_WORDS_MOST) break;
    }
  }
  return found;
}

/** The hand with `word`'s tiles first, in its order, and the rest after them as they were. */
export function handSpelling(play: TilePlay, word: string): TilePlay {
  const rest = [...play.hand];
  const front: string[] = [];
  for (const tile of word) {
    const at = rest.indexOf(tile);
    if (at === -1) return play;
    front.push(tile);
    rest.splice(at, 1);
  }
  return { ...play, hand: [...front, ...rest] };
}
