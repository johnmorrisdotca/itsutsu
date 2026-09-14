import { RAISED_LINK } from "@/components/ui/ui.constants";

import type { GameCardKind, GamePictureSize } from "./games.types";

/*
 * THE PICTURES OF GAMES AND OF FAMILIES, AT NAMED SIZES.
 *
 * John, 2026-09-14: "Looks like we aren't showing the icons for all the variant
 * games in a family! Why is this when we do it in the other page. The size for
 * the Top Level Family size is better to be larger too, and should be
 * consistent between some pages."
 *
 * A picture's size is a decision about WHERE it sits — a card, a row, a table
 * cell — and not about the page, so it is named by that and chosen once here.
 * `gamePictures.coverage.test.ts` refuses a `<GameThumb>` or a `<FamilyMark>`
 * drawn at a size of its own, which is how the family icon came to be 20px on
 * one page and 64px on another.
 */
export const GAME_PICTURE_SIZE = {
  /** A card of its own: a family's games, the Cards view, the practice browser. 48px. */
  card: "size-12",
  /** A row of a list: /play, the open seats, the record, the set-up picker. 40px. */
  row: "size-10",
  /** A table cell, or a line of small text: By game, Recent games, a ledger, a champion. 24px. */
  table: "size-6",
  /** A tag the size of a word: the games a guide is about. 20px. */
  chip: "size-5",
} as const satisfies Record<GamePictureSize, string>;

/**
 * A family's icon, on every page that shows a family: 56px.
 *
 * LARGER THAN A CARD'S GAME PICTURE, on purpose. A family's icon heads the games
 * under it on /games, and at the same 48px the header and its cards read as one
 * row of equals. /games drew it at 48 and John called that size the better one,
 * asking for it larger still; /games/new drew it at 20 in a chip and the game's
 * own page at 40. One size for all of them now.
 */
export const FAMILY_ICON_SIZE = "size-14";

/*
 * The figures strip under a game on /games (`GameStats.tsx`).
 *
 * Each figure is a small shaded chip rather than a run of text with dots
 * between, because a strip that wraps on a phone puts a dot at the start of a
 * line, and a chip wraps whole. `bg-shade` is a token with a light and a dark
 * value, so the chips read in both themes without a second class.
 */
export const STAT_CHIP = "inline-flex flex-wrap items-baseline gap-x-1 rounded-md bg-shade px-1.5 py-0.5";
/** The small capital label in a chip — TOP PLAYER, MOST CROWNS. */
export const STAT_LABEL = "text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase";
/** Which ladder a top player tops, as a tag after their record. */
export const STAT_POOL_TAG = "rounded-full border border-rule px-1.5 text-[0.62rem] leading-4 text-muted";
/** 首, the mark of a first place, in the vermilion-adjacent ochre the site uses for a highlight. */
export const CROWN_MARK = "font-mincho text-ochre";
/** A link inside a strip: above the card's stretched face, which is the game. */
export const STAT_LINK = `${RAISED_LINK} underline-offset-2 hover:underline`;

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
