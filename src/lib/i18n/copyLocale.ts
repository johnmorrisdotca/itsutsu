import type { Locale } from "./i18n.types";

/**
 * The languages a table of copy that sits beside its data is written in.
 *
 * `Locale` names every language the site knows the name of; a table typed
 * `Record<CopyLocale, …>` is complete in the two it can actually speak, so
 * adding a third means widening this one type and the compiler listing every
 * table that is short. `es`, `zh` and `de` are declared and have no dictionary
 * (`dictionaries.ts`), so a table that had to answer for them would be a table
 * of guesses.
 */
export type CopyLocale = Extract<Locale, "en" | "ja">;

export const COPY_LOCALES: readonly CopyLocale[] = ["en", "ja"];

/** The table to read for a reader's language: their own where there is one, English otherwise. */
export function copyLocale(locale: Locale): CopyLocale {
  return locale === "ja" ? "ja" : "en";
}
