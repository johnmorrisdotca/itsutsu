import type { Dictionary } from "./dictionaries";
import { JA_DRAFTED } from "./dictionaries/ja.drafted.constants";
import { JA_ALREADY_SAID } from "./dictionaries/ja.site.constants";
import { PHRASES, PHRASE_KEYS } from "./i18n.constants";
import type { Locale } from "./i18n.types";

/**
 * Japanese, assembled from its two halves, with everything that was written
 * beside it. The tests and the review sheet read this; no page and no browser
 * does (`jaText.coverage.test.ts`), because a reader is given the text alone
 * (`jaText.ts`, made from this by `pnpm i18n:text`).
 *
 * They are two files rather than one because they carry different risk, and
 * the difference is invisible once they are joined: `JA_ALREADY_SAID` is
 * John's own kanji, already published on the site, and `JA_DRAFTED` is text a
 * machine wrote that no Japanese reader has seen. Joining them here rather
 * than writing one file is what keeps that line drawn where anybody can find
 * it — and `japanese.coverage.test.ts` refuses a key claimed by both halves,
 * or missed by both.
 */
export const JA: Dictionary = Object.fromEntries(
  PHRASE_KEYS.map((key) => [
    key,
    JA_ALREADY_SAID[key]?.text ?? JA_DRAFTED[key]?.text ?? PHRASES[key],
  ]),
) as Dictionary;

/** The dictionaries as the review side holds them: English as the catalogue, Japanese as joined above. */
export const DICTIONARIES: Partial<Record<Locale, Dictionary>> = {
  en: PHRASES,
  ja: JA,
};
