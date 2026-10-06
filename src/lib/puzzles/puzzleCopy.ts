import { overlay, pickLine } from "../i18n/copyTable";
import type { Locale } from "../i18n/i18n.types";
import { jaText } from "../i18n/jaText";
import { puzzleTable } from "../i18n/puzzleTables";
import type { VariantCopy } from "../gomoku/variants.constants";

import { WORD_STYLE_DISPLAY } from "./gomoji/wordStyles";
import { KUMIMOJI_SHOTS } from "./kumimoji/shots.constants";
import { KUMIMOJI_WALLPAPER_COPY } from "./kumimoji/wallpaper.constants";
import { JIRAI_GRID_DISPLAY, JIRAI_LEVEL_BLURBS } from "./jirai/jirai.constants";
import {
  CARD_SIZE_WORDS,
  PUZZLE_CLOCK_DISPLAY,
  PUZZLE_DISPLAY,
  PUZZLE_LEVEL_BLURBS,
  PUZZLE_LEVEL_DISPLAY,
  checkAllowanceWords,
} from "./puzzles.constants";
import type { PuzzleClock, PuzzleKind, PuzzleLevel } from "./puzzles.types";

/**
 * What a puzzle is called and how it is described, in the reader's language.
 *
 * English is the row in `PUZZLE_DISPLAY`; Japanese lays its sentences (tagline,
 * origin, every rule bullet, the board advice, and `inspiredBy` where that is a
 * description and not a name) over that row (`copyTable.ts`) and keeps every
 * field that is a name or a code: `label`, `kanji`, `country`, `wikipedia` and
 * `alsoKnownAs`. Made once per puzzle and handed back, so a client component
 * that asks on every render gets the same object each time.
 */
export function puzzleCopy(kind: PuzzleKind, locale: Locale): VariantCopy {
  const english = PUZZLE_DISPLAY[kind];
  return locale === "ja" ? overlay(english, jaText().puzzles.copy[kind] as never) : english;
}

/**
 * A puzzle's name in a sentence: the English label, or for a Japanese reader the
 * kanji beside it (ナンプレ, 水道), which is its Japanese name.
 */
export function puzzleName(kind: PuzzleKind, locale: Locale): string {
  const copy = PUZZLE_DISPLAY[kind];
  return locale === "ja" ? copy.kanji : copy.label;
}

/** `PUZZLE_LEVEL_DISPLAY` in the reader's language: the level's blurb is read in Japanese, its name is the kanji. */
export function levelDisplay(locale: Locale): typeof PUZZLE_LEVEL_DISPLAY {
  return puzzleTable(PUZZLE_LEVEL_DISPLAY, "levelDisplay", locale);
}

/** A level's name in a sentence: "easy", or 初級. */
export function levelName(level: PuzzleLevel, locale: Locale): string {
  const display = PUZZLE_LEVEL_DISPLAY[level];
  return locale === "ja" ? display.kanji : display.label.toLowerCase();
}

/** `PUZZLE_CLOCK_DISPLAY` in the reader's language. */
export function clockDisplay(locale: Locale): typeof PUZZLE_CLOCK_DISPLAY {
  return puzzleTable(PUZZLE_CLOCK_DISPLAY, "clockDisplay", locale);
}

/** A countdown's name in a sentence: "Tortoise", or 亀. */
export function clockName(clock: PuzzleClock, locale: Locale): string {
  const display = PUZZLE_CLOCK_DISPLAY[clock];
  return locale === "ja" ? display.kanji : display.label;
}

/** `checkAllowanceWords` in the reader's language. */
export function checkAllowanceWordsIn(allowed: number | null, locale: Locale): { label: string; kanji: string; blurb: string } {
  const english = checkAllowanceWords(allowed);
  return locale === "ja" ? { ...english, blurb: pickLine(jaText().puzzles.tables.checkAllowance, [allowed]) ?? english.blurb } : english;
}

/** The line under the level chips on a puzzle's set-up screen, in the reader's language (`levelBlurb`). */
export function levelBlurbIn(kind: PuzzleKind, level: PuzzleLevel, locale: Locale): string {
  const own = puzzleTable(PUZZLE_LEVEL_BLURBS, "levelBlurbs", locale)[kind]?.[level];
  return own ?? levelDisplay(locale)[level].blurb;
}

/** `CARD_SIZE_WORDS` in the reader's language. */
export function cardSizeWords(locale: Locale): typeof CARD_SIZE_WORDS {
  return puzzleTable(CARD_SIZE_WORDS, "cardSizes", locale);
}

/** Jirai's level blurbs and neighbour counts in the reader's language. */
export function jiraiLevelBlurbs(locale: Locale): typeof JIRAI_LEVEL_BLURBS {
  return puzzleTable(JIRAI_LEVEL_BLURBS, "jiraiLevelBlurbs", locale);
}
export function jiraiGridDisplay(locale: Locale): typeof JIRAI_GRID_DISPLAY {
  return puzzleTable(JIRAI_GRID_DISPLAY, "jiraiGridDisplay", locale);
}

/** A level's name as a label or a heading: "Easy", or 初級. */
export function levelLabel(level: PuzzleLevel, locale: Locale): string {
  const display = PUZZLE_LEVEL_DISPLAY[level];
  return locale === "ja" ? display.kanji : display.label;
}

/** A level's name, or what an unknown one was called, for a kept row. */
export function levelLabelOf(level: string, locale: Locale): string {
  const display = PUZZLE_LEVEL_DISPLAY[level as PuzzleLevel];
  return display === undefined ? level : locale === "ja" ? display.kanji : display.label;
}

/** `WORD_STYLE_DISPLAY` in the reader's language: how a Gomoji's grid can be drawn, and what each does. */
export function wordStyleDisplay(locale: Locale): typeof WORD_STYLE_DISPLAY {
  return puzzleTable(WORD_STYLE_DISPLAY, "wordStyles", locale);
}

/** A level's name inside a sentence, lower case where the language has case: "easy", or 初級; what a kept row called it, when this site does not know it. */
export function levelNameOf(level: string, locale: Locale): string {
  const display = PUZZLE_LEVEL_DISPLAY[level as PuzzleLevel];
  return display === undefined ? level : locale === "ja" ? display.kanji : display.label.toLowerCase();
}

/** `KUMIMOJI_SHOTS` in the reader's language: the pictures of Kumimoji being played, what each shows and what to notice. */
export function kumimojiShots(locale: Locale): typeof KUMIMOJI_SHOTS {
  return puzzleTable(KUMIMOJI_SHOTS, "kumimojiShots", locale);
}

/** `KUMIMOJI_WALLPAPER_COPY` in the reader's language: the press, the window and the picture of every crossword built. */
export function kumimojiWallpaperCopy(locale: Locale): typeof KUMIMOJI_WALLPAPER_COPY {
  return puzzleTable(KUMIMOJI_WALLPAPER_COPY, "kumimojiWallpaper", locale);
}
