import { puzzleTable } from "@/lib/i18n/puzzleTables";
import type { Locale } from "@/lib/i18n/i18n.types";

import { JIRAI_COPY } from "./jirai.constants";
import { PENCIL_COPY } from "./pencil/pencil.constants";
import { BRIDGES_CELL_WORDS, BRIDGES_COPY, PICTURE_CELL_WORDS, PICTURE_COPY } from "./puzzles.constants";

/**
 * The grid puzzles' tables of words in the reader's language: the English tables
 * stay where the code reads them (two of them in a file the pictures' stamp
 * hashes, `puzzleArtFingerprint.ts`), and the Japanese, read as text from
 * `jaText()`, is laid over them (`copyTable.ts`).
 */
export const bridgesCopy = (locale: Locale): typeof BRIDGES_COPY => puzzleTable(BRIDGES_COPY, "bridges", locale);
export const bridgesCellWords = (locale: Locale): typeof BRIDGES_CELL_WORDS => puzzleTable(BRIDGES_CELL_WORDS, "bridgesCells", locale);
export const pictureCopy = (locale: Locale): typeof PICTURE_COPY => puzzleTable(PICTURE_COPY, "picture", locale);
export const pictureCellWords = (locale: Locale): typeof PICTURE_CELL_WORDS => puzzleTable(PICTURE_CELL_WORDS, "pictureCells", locale);
export const pencilCopy = (locale: Locale): typeof PENCIL_COPY => puzzleTable(PENCIL_COPY, "pencil", locale);
export const jiraiCopy = (locale: Locale): typeof JIRAI_COPY => puzzleTable(JIRAI_COPY, "jirai", locale);
