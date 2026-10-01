import type { Suit } from "@/lib/cards/cards.types";

import type { CardBackField } from "./cards.types";

/**
 * THE DECK'S DRAWING: one constants module for every card component
 * (`PlayingCard`, `CardPile`, `CardHand`, the drag ghost).
 *
 * A card is drawn in a box of 100 by 140 — the 5:7 of a poker-size card — and
 * scales to whatever width its parent gives it, so a tableau at 390 pixels and
 * a hand at a desk draw the same card.
 */
export const CARD_BOX = { width: 100, height: 140 } as const;

/** A card's height over its width, for a layout that reserves room for a stack before it draws one. */
export const CARD_ASPECT = CARD_BOX.height / CARD_BOX.width;

/**
 * The fixed colours of a card, which never follow the theme: a card is a light
 * object on the table at night as by day (`.surface-light`). The ink and ivory
 * are the brand's (`docs/brand/START-HERE.md`); red is the site's shu 朱, a
 * shade deeper so a small red index reads as well as a black one on ivory.
 */
export const CARD_INK = {
  face: "#fffef9",
  edge: "#c6bfb1",
  black: "#22231f",
  red: "#a82a28",
  /** The pale panel behind a court card's kanji, and a picked card's wash. */
  court: "#f6ecd7",
  picked: "#52664b",
} as const;

/**
 * The field a back's pattern is laid on. Charcoal is the brand's own; shu and
 * moss are there for a game that wants two decks told apart at a glance (the
 * site's warm palette, never a colour of its own).
 */
export const CARD_BACK_FIELDS: Record<CardBackField, string> = {
  ink: "#22231f",
  shu: "#8f2826",
  moss: "#3d4d38",
};

/**
 * THE SUITS, drawn by us in a box of 100: no font's glyph, so every browser
 * and every phone draws the same shapes at the same weight. Each is filled in
 * one colour; a club is three lobes and a stem, a spade a heart turned over
 * with a stem, so the four are told apart by outline alone.
 */
export const SUIT_PATHS: Record<Suit, string> = {
  hearts: "M50 90C22 68 5 51 5 32C5 17 16 7 29 7C38 7 45 12 50 21C55 12 62 7 71 7C84 7 95 17 95 32C95 51 78 68 50 90Z",
  diamonds: "M50 4Q70 30 86 50Q70 70 50 96Q30 70 14 50Q30 30 50 4Z",
  spades:
    "M50 5C39 22 7 39 7 60C7 74 17 82 29 82C37 82 43 78 47 72C46 83 42 90 33 96L67 96C58 90 54 83 53 72C57 78 63 82 71 82C83 82 93 74 93 60C93 39 61 22 50 5Z",
  clubs:
    "M31 30a19 19 0 1 0 38 0a19 19 0 1 0 -38 0ZM10 60a19 19 0 1 0 38 0a19 19 0 1 0 -38 0ZM52 60a19 19 0 1 0 38 0a19 19 0 1 0 -38 0ZM42 40L40 62L60 62L58 40ZM47 64C46 80 42 89 33 96L67 96C58 89 54 80 53 64Z",
};

/**
 * WHERE A FACE PUTS THINGS, in the 100 × 140 box. The rank sits in the top
 * left with its suit under it, so a hand fanned to the right shows both; a
 * bigger suit sits in the top right, so a column overlapped downward shows the
 * rank and the suit on its top strip alone. Both corners are drawn large on
 * purpose: at 390 pixels a Klondike card is about 47 pixels wide, and its rank
 * is still about fifteen.
 */
export const FACE_LAYOUT = {
  rank: { x: 18, y: 36, size: 37 },
  cornerPip: { x: 18, y: 52, size: 17 },
  topPip: { x: 79, y: 21, size: 28 },
  bigPip: { x: 50, y: 93, size: 42 },
  acePip: { x: 50, y: 88, size: 54 },
  court: { x: 29, y: 60, width: 42, height: 62 },
  /** How much of a face-up card's height its top strip needs to show its rank and suit. */
  strip: 0.29,
} as const;

/** The court cards' kanji: 士 the knight for the jack, 妃 the queen, 王 the king. */
export const COURT_KANJI: Record<11 | 12 | 13, string> = { 11: "士", 12: "妃", 13: "王" };

/**
 * THE BACK'S TILE: the logo's five stones, dark, light, light, light, dark,
 * in rows laid like bricks — every other row half a motif along — with a
 * stone's gap between one five and the next. The brand's geometry, shrunk:
 * stones eight apart, radius 2.7 and a fine border (the kit's 42, 15 and 5, with the border thinned so a dark stone reads as dark at a card's size).
 */
export const BACK_TILE = {
  spacing: 8,
  radius: 2.7,
  border: 0.55,
  /** Six places a row: the five stones and the gap. */
  places: 6,
  /** Which of the five are the dark stones. */
  dark: [0, 4],
} as const;

/**
 * THE 五つ OF THE BRAND AVATAR (`public/brand/itsutsu-avatar-*.svg`), its two
 * glyphs in the kit's own 240-unit box, copied path for path so the medallion
 * on a card's back is the site's mark and not a font's approximation of it.
 */
export const BRAND_GLYPH_PATHS: readonly string[] = [
  "M33.360 134.970C26.540 134.970 23.350 134.750 19.390 134.200L19.390 147.180C24.120 146.630 28.410 146.410 33.690 146.410L104.640 146.410C110.580 146.410 114.210 146.630 118.830 147.180L118.830 134.200C114.760 134.860 111.680 134.970 105.410 134.970L100.350 134.970L100.350 101.200C100.350 96.580 100.570 92.840 100.900 88.880C96.940 89.210 93.530 89.320 87.920 89.320L67.240 89.320C69.220 78.760 69.550 76.230 70.650 67.210L99.580 67.210C105.520 67.210 108.930 67.320 113.440 67.870L113.440 55.220C109.370 55.660 105.850 55.880 99.580 55.880L39.190 55.880C32.700 55.880 29.180 55.660 25.330 55.220L25.330 67.870C29.620 67.430 33.360 67.210 39.410 67.210L57.890 67.210C57.120 74.470 56.570 78.100 54.480 89.320L43.040 89.320C38.090 89.320 34.020 89.100 31.160 88.660L31.160 100.980C34.460 100.650 38.420 100.430 42.710 100.430L52.280 100.430C48.980 115.060 46.890 122.320 42.490 134.970ZM55.800 134.970C59.100 125.070 62.400 112.860 65.040 100.430L87.920 100.430L87.920 134.970Z",
  "M131.810 91.300C134.120 90.090 135.000 89.870 140.610 88.220C158.320 82.940 172.510 80.410 183.950 80.410C190.000 80.410 194.620 81.400 198.140 83.380C203.420 86.350 206.500 91.630 206.500 97.680C206.500 100.540 206.060 103.290 205.290 105.490C203.090 111.980 196.600 118.250 188.680 121.770C179.330 125.840 170.090 127.490 152.490 128.260C155.680 134.200 156.670 136.510 158.100 142.450C178.230 140.250 186.810 138.270 196.820 133.320C212.440 125.730 221.240 113.080 221.240 98.120C221.240 79.420 207.050 67.210 185.270 67.210C172.510 67.210 166.570 68.090 141.490 73.480C134.120 75.130 132.360 75.350 128.620 75.680Z",
];

/** The medallion's five stones, in the same 240-unit box: the kit's y and centres. */
export const BRAND_STONES = { y: 187, xs: [36, 78, 120, 162, 204], radius: 15, border: 5 } as const;

/** How far a press moves before it is a drag rather than a tap. */
export const DRAG_FROM_PX = 6;

/** The most time between two taps on one card for them to be a double tap. */
export const DOUBLE_TAP_MS = 350;

/** Where this browser remembers whether the cards make a sound (`useCardSounds`): "on", or off by default. */
export const CARD_SOUND_KEY = "itsutsu.cardSound";
