import { overlay } from "./copyTable";
import type { Locale } from "./i18n.types";
import { jaText } from "./jaText";
import type { JaPuzzleText } from "./jaText.types";

/**
 * A puzzle's table of words in the reader's language: the English table as it
 * is for everybody but a reader of Japanese, and for them the same table with
 * the Japanese laid over its sentences (`copyTable.ts`), read from the text
 * alone (`jaText()`), never from the files it is authored in. The name is a key
 * of `JaPuzzleText["tables"]`, so a table with no Japanese does not compile.
 * What the Japanese says for each of an English table's sentences is held by the
 * coverage tests, which lay the authored overlay and this one over the same table.
 */
export function puzzleTable<T>(english: T, name: keyof JaPuzzleText["tables"], locale: Locale): T {
  return locale === "ja" ? overlay(english, jaText().puzzles.tables[name] as never) : english;
}
