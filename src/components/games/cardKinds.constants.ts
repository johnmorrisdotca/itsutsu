import type { GameCardKind } from "./games.types";

/*
 * Each kind is a name with its own kanji, which a Japanese reader is shown instead
 * of the English (`Paired`), so the words are a table of names rather than copy.
 */
/** What a game can be won by, in the order a reader would scan them. */
export const GAME_CARD_KINDS: { kind: GameCardKind; label: string; kanji: string }[] = [
  { kind: "3", label: "Three in a row", kanji: "三目" },
  { kind: "4", label: "Four in a row", kanji: "四目" },
  { kind: "5", label: "Five in a row", kanji: "五目" },
  { kind: "6", label: "Six in a row", kanji: "六目" },
  { kind: "flips", label: "Flips", kanji: "反転" },
  // Plural, as the filter is read: "Puzzles" (John, 2026-09-26: "Rename A PUZZLE to Puzzles").
  { kind: "puzzle", label: "Puzzles", kanji: "詰" },
  // A table round one device, won by the most boxes or whatever the game counts: not a line of any length.
  { kind: "party", label: "Party games", kanji: "団欒" },
  // Played alone for a minute a level, and kept nowhere but the browser (Karakuri's eight).
  { kind: "casual", label: "Casual games", kanji: "気軽" },
];
