import { overlay } from "./copyTable";
import type { Locale } from "./i18n.types";
import { jaText } from "./jaText";
import type { JaPartyText } from "./jaText.types";

/**
 * A party, card or casual game's table of words in the reader's language: the
 * English table as it is for everybody but a reader of Japanese, and for them
 * the same table with the Japanese laid over its sentences (`copyTable.ts`),
 * read from the text alone (`jaText()`), never from the files it is authored
 * in. The name is a key of `JaPartyText["tables"]`, so a table with no Japanese
 * does not compile; the coverage tests (`partyCopyTables.coverage.test.ts`)
 * hold what the Japanese says for each of an English table's sentences.
 */
export function partyTable<T>(english: T, name: keyof JaPartyText["tables"], locale: Locale): T {
  return locale === "ja" ? overlay(english, jaText().party.tables[name] as never) : english;
}
