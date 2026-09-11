import type { GameCardKind } from "./games.types";

/** The A–Z bar over the card view. */
export const CARD_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** What a game can be won by, in the order a reader would scan them. */
export const GAME_CARD_KINDS: { kind: GameCardKind; label: string; kanji: string }[] = [
  { kind: "3", label: "Three in a row", kanji: "三目" },
  { kind: "4", label: "Four in a row", kanji: "四目" },
  { kind: "5", label: "Five in a row", kanji: "五目" },
  { kind: "6", label: "Six in a row", kanji: "六目" },
  { kind: "flips", label: "Flips", kanji: "反転" },
];

/** A quiet text link in a row of them, as the plain list uses. */
export const CATALOGUE_LINK_CLASS = "text-muted underline-offset-2 hover:text-ink hover:underline";
