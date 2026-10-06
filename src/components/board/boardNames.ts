import { speaker, type Speaker } from "@/lib/i18n/i18n";
import { SITE_NAME } from "@/lib/i18n/siteName";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";

import { BOARD_THEMES, FELTS, type STONE_SETS } from "./Board.constants";
import type { BoardScale } from "@/lib/preferences/boardScale";
import type { BoardThemeTokens, GridStyle } from "./board.types";

/**
 * What the board's looks are called, in the reader's language, with the kanji
 * beside the words for an English reader only (a Japanese reader's words are
 * the kanji already). The tables of colours in `Board.constants.ts` hold the
 * paint and nothing a person reads, so a browser test can import them without
 * the phrase table.
 */

type Named = { label: string; kanji: string };

const named = (say: Speaker, key: PhraseKey, kanji: string): Named => ({
  label: say.say(key),
  kanji: say.pairsWithKanji ? kanji : "",
});

/** The name of a board surface: Kaya 榧. */
export function themeName(say: Speaker, theme: keyof typeof BOARD_THEMES): Named {
  switch (theme) {
    case "kaya":
      return named(say, "boardlook.themeKaya", "榧");
    case "shinkaya":
      return named(say, "boardlook.themeShinkaya", "新榧");
    case "washi":
      return named(say, "boardlook.themeWashi", "和紙");
    case "sumi":
      return named(say, "boardlook.themeSumi", "墨");
    case "matcha":
      return named(say, "boardlook.themeMatcha", "抹茶");
  }
}

/** The name of a felt: Green 緑. */
export function feltName(say: Speaker, felt: keyof typeof FELTS): Named {
  switch (felt) {
    case "green":
      return named(say, "boardlook.feltGreen", "緑");
    case "blue":
      return named(say, "boardlook.feltBlue", "青");
    case "red":
      return named(say, "boardlook.feltRed", "赤");
    case "black":
      return named(say, "boardlook.feltBlack", "黒");
  }
}

/** The name of a pair of stones: Slate & shell 那智黒. */
export function stoneSetName(say: Speaker, set: keyof typeof STONE_SETS): Named {
  switch (set) {
    case "classic":
      return named(say, "boardlook.stonesClassic", "那智黒");
    case "jade":
      return named(say, "boardlook.stonesJade", "翡翠");
    case "sakura":
      return named(say, "boardlook.stonesSakura", "桜");
    case "indigo":
      return named(say, "boardlook.stonesIndigo", "藍");
    case "neon":
      return named(say, "boardlook.stonesNeon", "電光");
  }
}

/** The name of one of the three ways of drawing a board, and what it does. */
export function gridStyleName(say: Speaker, grid: GridStyle): Named & { hint: string } {
  switch (grid) {
    case "auto":
      return { ...named(say, "boardlook.gridAuto", "伝統"), hint: say.say("boardlook.gridAutoHint") };
    case "lines":
      return { ...{ label: say.say("boardlook.gridLines", { site: SITE_NAME }), kanji: say.pairsWithKanji ? "碁盤" : "" }, hint: say.say("boardlook.gridLinesHint") };
    case "cells":
      return { ...named(say, "boardlook.gridCells", "升目"), hint: say.say("boardlook.gridCellsHint") };
  }
}

/** A name with its kanji in one string, for a title: "Kaya 榧" or "榧". */
export function nameWithKanji({ label, kanji }: Named): string {
  return kanji === "" ? label : `${label} ${kanji}`;
}

/** The same with a dot between: "Traditional view · 伝統" for an option, "伝統の表示" for a Japanese reader. */
export function dottedName({ label, kanji }: Named): string {
  return kanji === "" ? label : `${label} · ${kanji}`;
}

/**
 * The English name of a surface, for the attribute a browser test reads to
 * learn which surface is drawn ("Kaya", "Green"). It is for tests and never
 * shown, so it is the same in every language.
 */
export function surfaceTestName(theme: BoardThemeTokens): string {
  if (theme.surfaceName !== undefined) return theme.surfaceName;
  const english = speaker("en");
  for (const key of Object.keys(BOARD_THEMES) as (keyof typeof BOARD_THEMES)[]) {
    if (BOARD_THEMES[key] === theme) return themeName(english, key).label;
  }
  for (const key of Object.keys(FELTS) as (keyof typeof FELTS)[]) {
    if (FELTS[key] === theme) return feltName(english, key).label;
  }
  return "";
}

/** What the board-size chooser says: the short name, its kanji, and the whole of it for a screen reader. */
export function scaleWords(say: Speaker, scale: BoardScale): Named & { whole: string } {
  switch (scale) {
    case "regular":
      return { ...named(say, "boardlook.scaleRegular", "標準"), whole: say.say("boardlook.scaleRegularWhole") };
    case "large":
      return { ...named(say, "boardlook.scaleLarge", "大"), whole: say.say("boardlook.scaleLargeWhole") };
    case "full":
      return { ...named(say, "boardlook.scaleFull", "全画面"), whole: say.say("boardlook.scaleFullWhole") };
  }
}
