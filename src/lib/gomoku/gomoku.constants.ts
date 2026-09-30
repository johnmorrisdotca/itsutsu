/*
 * The rules tables are Narabe's, the site's rules engine, kept as its own
 * package in packages/narabe; everything here re-exports them, so domain values
 * are still compared through this module. What stays is the site's own: the
 * words a player reads for a colour, a seat, a first move, a board and a draw
 * limit. The words for each game are in variants.constants.ts.
 */
import type { DrawLimit, FirstPlayer, ObstacleLayout, Seat, Stone } from "@johnmorrisdotca/narabe/types";

export * from "@johnmorrisdotca/narabe/constants";

export const STONE_DISPLAY: Record<Stone, { label: string; kanji: string }> = {
  black: { label: "Black", kanji: "黒" },
  white: { label: "White", kanji: "白" },
};

export const SEAT_DISPLAY: Record<Seat, { label: string }> = {
  one: { label: "Player 1" },
  two: { label: "Player 2" },
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
  { label: string; kanji: string; description: string }
> = {
  none: {
    label: "Open board",
    kanji: "平盤",
    description: "Every intersection is playable.",
  },
  hoshi: {
    label: "Star blocks",
    kanji: "星塞ぎ",
    description: "The star points are sealed off. Tengen, at the centre, stays open.",
  },
};

export const BOARD_SIZE_DISPLAY: Record<
  number,
  { label: string; kanji: string; note: string }
> = {
  3: { label: "Three", kanji: "三路", note: "Tic-tac-toe" },
  4: { label: "Four", kanji: "四路", note: "Twist Four, Mini Reversi" },
  5: { label: "Five", kanji: "五路", note: "Trap Three, Square Four" },
  6: { label: "Six", kanji: "六路", note: "Twist Five, Mini Reversi" },
  7: { label: "Seven", kanji: "七路", note: "Drop Four, the small Honeycomb" },
  8: { label: "Eight", kanji: "八路", note: "Reversi, small Halma, Checkers and the 8×8 draughts games" },
  10: { label: "Ten", kanji: "十路", note: "The big drop board, Grand Reversi, Halma, International Draughts" },
  11: { label: "Eleven", kanji: "十一路", note: "Hex, Honeycomb" },
  12: { label: "Twelve", kanji: "十二路", note: "Canadian Checkers" },
  16: { label: "Sixteen", kanji: "十六路", note: "Halma" },
  17: { label: "Seventeen", kanji: "十七路", note: "Chinese Checkers" },
  9: { label: "Mini", kanji: "小盤", note: "Quick game" },
  13: { label: "Medium", kanji: "中盤", note: "Shorter game, the big Honeycomb" },
  15: { label: "Standard", kanji: "正盤", note: "Tournament size" },
  19: { label: "Go board", kanji: "碁盤", note: "Long game" },
};

export const DRAW_LIMIT_DISPLAY: Record<DrawLimit, { label: string; kanji: string; blurb: string }> = {
  none: {
    label: "Play it out",
    kanji: "無制限",
    blurb: "No limit. The game ends when somebody wins or the board fills.",
  },
  half: {
    label: "Half the board",
    kanji: "半盤",
    blurb: "A draw once half as many moves as the board has points have been played with nobody winning.",
  },
  threeQuarters: {
    label: "Three quarters",
    kanji: "四分三",
    blurb: "A draw once three quarters as many moves as the board has points have been played with nobody winning.",
  },
};
