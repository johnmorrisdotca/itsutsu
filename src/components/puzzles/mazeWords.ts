import { puzzleTable } from "@/lib/i18n/puzzleTables";
import type { Locale } from "@/lib/i18n/i18n.types";
import { LOOK_COPY } from "@/lib/puzzles/meikyuu/look.constants";

import { CUBE_COPY } from "./cube.constants";
import {
  MEIKYUU_CHIPS,
  MEIKYUU_COPY,
  MEIKYUU_SHAPE_COPY,
  MEIKYUU_SOLID_COPY,
  MEIKYUU_SURFACE_COPY,
  MEIKYUU_WAY_COPY,
  MOVE_COPY,
  PROGRESS_COPY,
  SHAPE_COPY,
  SOLID_STEP_COPY,
  STONE_COPY,
  TURN_COPY,
  WAY_UP_COPY,
} from "./meikyuu.constants";
import { TSUNAGI_CHIPS } from "./puzzles.constants";
import { SUIDO_CHIPS, SUIDO_COPY, SUIDO_KINDS, SUIDO_MODES, SUIDO_SETS, SUIDO_SQUARES, SUIDO_TWISTS } from "./suido.constants";
import { TOBIISHI_CHIPS, TOBIISHI_COPY } from "./tobiishi.constants";

/**
 * The level puzzles' tables of words in the reader's language. The English
 * tables stay where the code reads them (some in files the pictures' stamp hashes,
 * `puzzleArtFingerprint.ts`, which a translation must not edit), and the Japanese is
 * laid over them (`copyTable.ts`); a name with its kanji beside it is shown by
 * `Speaker.pairName`, so only the sentences are overlaid.
 */
const MEIKYUU = {
  shape: MEIKYUU_SHAPE_COPY,
  way: MEIKYUU_WAY_COPY,
  solid: MEIKYUU_SOLID_COPY,
  surface: MEIKYUU_SURFACE_COPY,
  step: SOLID_STEP_COPY,
  turn: TURN_COPY,
  chips: MEIKYUU_CHIPS,
  wayUp: WAY_UP_COPY,
  progress: PROGRESS_COPY,
  move: MOVE_COPY,
  stone: STONE_COPY,
  shapeCopy: SHAPE_COPY,
  copy: MEIKYUU_COPY,
};
export const meikyuuWords = (locale: Locale): typeof MEIKYUU => puzzleTable(MEIKYUU, "meikyuu", locale);

const SUIDO = { kinds: SUIDO_KINDS, squares: SUIDO_SQUARES, twists: SUIDO_TWISTS, chips: SUIDO_CHIPS, modes: SUIDO_MODES, sets: SUIDO_SETS, copy: SUIDO_COPY };
export const suidoWords = (locale: Locale): typeof SUIDO => puzzleTable(SUIDO, "suido", locale);

const TOBIISHI = { chips: TOBIISHI_CHIPS, copy: TOBIISHI_COPY };
export const tobiishiWords = (locale: Locale): typeof TOBIISHI => puzzleTable(TOBIISHI, "tobiishi", locale);

export const cubeCopy = (locale: Locale): typeof CUBE_COPY => puzzleTable(CUBE_COPY, "cube", locale);
export const lookCopy = (locale: Locale): typeof LOOK_COPY => puzzleTable(LOOK_COPY, "look", locale);
export const tsunagiChips = (locale: Locale): typeof TSUNAGI_CHIPS => puzzleTable(TSUNAGI_CHIPS, "tsunagiChips", locale);

/** The English tables and their Japanese, for the coverage test to hold one against the other. */
export const MAZE_TABLES = { MEIKYUU, SUIDO, TOBIISHI } as const;

/** The language the Meikyuu package draws its own words in: Japanese for a Japanese reader, English for everybody else (the package has those two). */
export const packageLanguage = (locale: Locale): "en" | "ja" => (locale === "ja" ? "ja" : "en");
