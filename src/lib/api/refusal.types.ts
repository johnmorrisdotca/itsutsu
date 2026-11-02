import type { PhraseKey } from "@/lib/i18n/i18n.constants";

/**
 * What the site says when it refuses something, as a KEY and its values rather than a sentence (ENJA-13).
 *
 * A route, a server function or a puzzle's check never types the sentence a person reads: it names the phrase
 * (`err.name.taken`) and fills its gaps (`values`), and the page says it through the speaker in the reader's
 * language. The phrases are the `err.*` and `chk.*` areas of the catalogue.
 */
export type RefusalCode = Extract<PhraseKey, `err.${string}` | `chk.${string}`>;

/** A value that fills a gap in a refusal: a name or a figure, or another refusal said in its own words (a puzzle's reason inside "not solved: …"). */
export type RefusalValue = string | number | RefusalPart;

export type RefusalValues = Readonly<Record<string, RefusalValue>>;

/** A refusal with no sentence of its own: the key and what fills it. */
export type RefusalPart = { code: RefusalCode; values?: RefusalValues };

/**
 * A refusal as it travels: the key and values for a page to say in the reader's language, and `error`, the same
 * sentence in English, for a caller that is not a page (a script, a test, a log line) and for any page that has not
 * learned the key.
 */
export type Said = RefusalPart & { error: string };
