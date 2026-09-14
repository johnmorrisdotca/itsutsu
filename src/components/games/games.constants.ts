import { RAISED_LINK } from "@/components/ui/ui.constants";

import type { GameCardKind } from "./games.types";

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
