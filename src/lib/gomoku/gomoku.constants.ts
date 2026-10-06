/*
 * The rules tables are Narabe's, the site's rules engine, which is its own
 * package (github.com/johnmorrisdotca/narabe); everything here re-exports them, so domain values
 * are still compared through this module. What stays is the site's own: the
 * words a player reads for a colour, a seat, a first move, a board and a draw
 * limit. The words for each game are in variants.constants.ts.
 */
import type { PhraseKey } from "../i18n/i18n.constants";
import type { DrawLimit, FirstPlayer, ObstacleLayout, Stone } from "@johnmorrisdotca/narabe/types";

export * from "@johnmorrisdotca/narabe/constants";

export const STONE_DISPLAY: Record<Stone, { label: string; kanji: string }> = {
  black: { label: "Black", kanji: "黒" },
  white: { label: "White", kanji: "白" },
};

export const FIRST_PLAYER_DISPLAY: Record<
  FirstPlayer,
  { label: string; kanji: string }
> = {
  black: { label: "Black opens", kanji: "黒先" },
  white: { label: "White opens", kanji: "白先" },
  random: { label: "Random", kanji: "振り駒" },
};

export const OBSTACLE_LAYOUT_DISPLAY: Record<
  ObstacleLayout,
  { label: string; kanji: string; description: PhraseKey }
> = {
  none: {
    label: "Open board",
    kanji: "平盤",
    description: "gomoku.obstacleNone",
  },
  hoshi: {
    label: "Star blocks",
    kanji: "星塞ぎ",
    description: "gomoku.obstacleHoshi",
  },
};

export const BOARD_SIZE_DISPLAY: Record<
  number,
  { label: string; kanji: string }
> = {
  3: { label: "Three", kanji: "三路" },
  4: { label: "Four", kanji: "四路" },
  5: { label: "Five", kanji: "五路" },
  6: { label: "Six", kanji: "六路" },
  7: { label: "Seven", kanji: "七路" },
  8: { label: "Eight", kanji: "八路" },
  10: { label: "Ten", kanji: "十路" },
  11: { label: "Eleven", kanji: "十一路" },
  12: { label: "Twelve", kanji: "十二路" },
  16: { label: "Sixteen", kanji: "十六路" },
  17: { label: "Seventeen", kanji: "十七路" },
  9: { label: "Mini", kanji: "小盤" },
  13: { label: "Medium", kanji: "中盤" },
  15: { label: "Standard", kanji: "正盤" },
  19: { label: "Go board", kanji: "碁盤" },
};

export const DRAW_LIMIT_DISPLAY: Record<DrawLimit, { label: string; kanji: string; blurb: PhraseKey }> = {
  none: {
    label: "Play it out",
    kanji: "無制限",
    blurb: "gomoku.drawNone",
  },
  half: {
    label: "Half the board",
    kanji: "半盤",
    blurb: "gomoku.drawHalf",
  },
  threeQuarters: {
    label: "Three quarters",
    kanji: "四分三",
    blurb: "gomoku.drawThreeQuarters",
  },
};
