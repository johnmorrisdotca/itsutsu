import { FORMATS, type FormatSpec } from "./format.constants";
import type { Locale } from "./i18n.types";

/**
 * Numbers, lists and counts in the reader's language, with no `Intl`.
 *
 * Pure: hand it a locale and it answers the same string on any runtime in any
 * zone, which is what lets a server component and the browser hydrating it
 * draw the same text. The words and marks are in `format.constants.ts`; the
 * dates are in `ui/when.ts`, beside the moment formatters they share a reason
 * with. `Speaker` carries all of these, so a page asks `say.number(n)` and not
 * for a table.
 */

/**
 * The row for a language, or English where it has none, as an unanswered
 * phrase reads English. (English by name rather than `DEFAULT_LOCALE`, so a
 * page that only formats a number does not carry the phrase catalogue.)
 */
export function formatSpecFor(locale: Locale): FormatSpec {
  return FORMATS[locale] ?? (FORMATS.en as FormatSpec);
}

/**
 * A number with its thousands marked, in the reader's own marks: 12,345 in
 * English and in Japanese. A fraction keeps the digits it was given. Not a
 * number is printed as it is, since "NaN" is at least honest where a plausible
 * figure is not.
 */
export function numberIn(locale: Locale, value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const spec = formatSpecFor(locale);
  const text = String(Math.abs(value));
  // A very large or very small number prints with an exponent; leave it alone rather than mangle it.
  if (/e/i.test(text)) return String(value);
  const [whole = "0", fraction] = text.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, spec.group);
  const sign = value < 0 ? "-" : "";
  return fraction === undefined ? `${sign}${grouped}` : `${sign}${grouped}${spec.decimal}${fraction}`;
}

/** Which form of a counted phrase a count takes: English has "one" for exactly 1, Japanese only "other". */
export type PluralForm = "one" | "other";

export function pluralFormIn(locale: Locale, count: number): PluralForm {
  return formatSpecFor(locale).hasSingular && count === 1 ? "one" : "other";
}

/**
 * A list as the language joins one, with the items left whole: "a and b",
 * "a, b and c" in English, "aとb" and "a、b、c" in Japanese. The separators
 * come between the items, so a caller drawing each item as more than text
 * (a picture and a link) can keep the joins and swap the items.
 */
export function listPiecesIn<T>(locale: Locale, items: readonly T[]): (T | string)[] {
  const { pair, between, last } = formatSpecFor(locale).list;
  const out: (T | string)[] = [];
  items.forEach((item, index) => {
    if (index > 0) out.push(items.length === 2 ? pair : index === items.length - 1 ? last : between);
    out.push(item);
  });
  return out;
}

/** Items joined by the language's plain separator, with no "and": "a, b, c" in English, "a、b、c" in Japanese. */
export function joinedIn(locale: Locale, items: readonly string[]): string {
  return items.join(formatSpecFor(locale).list.between);
}

/** Sentences set one after another: a space between them where words are spaced, none where they are not. */
/** A sentence with its stop on: "Won on time" as "Won on time." or "時間切れの勝ち。". */
export function sentenceIn(locale: Locale, text: string): string {
  return `${text}${formatSpecFor(locale).sentenceEnd}`;
}

export function sentencesIn(locale: Locale, sentences: readonly string[]): string {
  return sentences.join(formatSpecFor(locale).sentenceGap);
}

/** A list of words, joined as the language joins one. */
export function listIn(locale: Locale, items: readonly string[]): string {
  return listPiecesIn(locale, items).join("");
}

/**
 * A whole count in words where the language spells small ones out ("sixty-four",
 * "hundred and forty-four"), and in digits where it does not. A sentence that
 * says "none" or "one" for 0 and 1 in English reads "0" and "1" in Japanese,
 * which is how a Japanese sentence counts.
 */
export function wordsIn(locale: Locale, count: number): string {
  const words = formatSpecFor(locale).numberWords;
  if (words === null || !Number.isInteger(count) || count < 0 || count >= 200) return numberIn(locale, count);
  if (count >= 100) return count === 100 ? words.hundred : `${words.hundredAnd}${wordsIn(locale, count - 100)}`;
  if (count < 20) return words.small[count] as string;
  const unit = count % 10;
  const tens = words.tens[Math.floor(count / 10)] as string;
  return unit === 0 ? tens : `${tens}${words.hyphen}${words.small[unit]}`;
}
