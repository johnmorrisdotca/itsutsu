import { wordsIn } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/i18n.types";

/**
 * A count under two hundred in words, as a sentence uses one: "sixty-four",
 * "hundred and forty-four" in English; the digits in a language that writes a
 * count that way (Japanese). Moved here from the checkers rules page when the XP
 * awards needed it to say how many games there are. The words themselves are
 * the language's own table in `i18n/format.constants.ts`.
 */
export function inWords(count: number, locale: Locale): string {
  return wordsIn(locale, count);
}
