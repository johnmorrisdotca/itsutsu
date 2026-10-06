import type { Speaker } from "../i18n/i18n";

/**
 * The marks a sentence is put together with, in the reader's language: where a
 * line is made of pieces that cannot be one phrase (a link, a time that is set
 * in the reader's own zone, a name drawn as a link), the glue between them is
 * the language's. Japanese is written with full-width marks and no space after
 * them, English with the half-width ones and a space.
 */
const JA = (say: Speaker): boolean => say.locale === "ja";

/** ", " or "、". */
export const commaOf = (say: Speaker): string => (JA(say) ? "、" : ", ");

/** "; " or "；". */
export const semicolonOf = (say: Speaker): string => (JA(say) ? "；" : "; ");

/** ". " is not wanted at the end of a line, so this is "." or "。". */
export const stopOf = (say: Speaker): string => (JA(say) ? "。" : ".");

/** ": " or "：". */
export const colonOf = (say: Speaker): string => (JA(say) ? "：" : ": ");

/** "a (b)" or "a（b）". */
export const withNote = (say: Speaker, text: string, note: string): string => (JA(say) ? `${text}（${note}）` : `${text} (${note})`);

/** "a, b and c" is `say.list`; this is the plain joins a line of facts uses, "a, b, c" or "a、b、c". */
export const joinedWith = (say: Speaker, parts: readonly string[]): string => parts.join(commaOf(say));
