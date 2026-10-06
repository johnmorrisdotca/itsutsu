import type { Speaker } from "../i18n/i18n";

import { cardSizeWords } from "./puzzleCopy";
import { PUZZLE_SIZE_NAMES } from "./puzzles.constants";
import type { PuzzleKind } from "./puzzles.types";
import { suidoSizeWord } from "./suido/sizes";

/**
 * What a page says about a size: the cells across a grid, the letters of a
 * Gomoji word, a hand of tiles, a card game's draw or cells or suits, a Mahjong
 * layout by its name, a Suido's width and height. The one place that decides it,
 * for both languages; a Japanese reader is told in counters (5文字, 7枚) and in
 * the kanji a layout is called by (`PUZZLE_SIZE_NAMES`).
 */
export function sizeWordIn(size: number, kind: PuzzleKind | undefined, say: Speaker): string {
  if (kind === "gomoji" || kind === "gomojiMot" || kind === "gomojiWort" || kind === "gomojiPop") return say.count("puzzle.count.letter", size);
  if (kind === "gomojiKana") return say.count("puzzle.count.kana", size);
  // A Kumimoji's size is the hand it opens with.
  if (kind === "kumimoji") return say.count("puzzle.count.tile", size);
  // Koushi comes at one size, the lattice; what a reader wants told is what is in it.
  if (kind === "koushi") return say.count("puzzle.count.word", 6);
  // A card game's is what its size tiles choose: the cards Solitaire's stock turns, FreeCell's cells, Spider's suits.
  const cards = kind === undefined ? undefined : cardSizeWords(say.locale)[kind];
  if (cards !== undefined) return cards.word(size);
  // A Mahjong size is a layout, called by its name; its width in tiles is only the number on its picture.
  if (kind === "mahjong") {
    const named = PUZZLE_SIZE_NAMES.mahjong[size];
    return named === undefined ? say.say("puzzle.size.across", { count: String(size) }) : say.locale === "ja" ? named.kanji : named.label;
  }
  // A Suido's long boards are a width and a height in one number (`suido/sizes.ts`): 507 is 5×7.
  if (kind === "suido") return suidoSizeWord(size);
  return `${size}×${size}`;
}
