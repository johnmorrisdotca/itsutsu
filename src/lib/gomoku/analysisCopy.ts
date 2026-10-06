import { FATAL_MOVE_COPY_JA, OUTLOOK_COPY_JA } from "../i18n/dictionaries/analysis.ja.constants";
import { jaText } from "../i18n/copyJa.types";
import type { Locale } from "../i18n/i18n.types";

import { FATAL_MOVE_DISPLAY, OUTLOOK_DISPLAY, type AdviceTone } from "./analysis.constants";
import type { Outlook } from "./analysis.types";

/**
 * The threat reading's heading and detail in the reader's language. Japanese
 * puts its own `label` and `detail` over the English row and keeps the kanji
 * and the tone; read from here rather than from `OUTLOOK_DISPLAY`, because
 * `analysis.constants.ts` is hashed by the measured ladder's fingerprint
 * (`ladderFingerprint.ts`): a word edited there silences the strength tables
 * until they are measured again, so the Japanese sits beside it and never in it.
 */
export function outlookCopy(outlook: Outlook, locale: Locale): { label: string; kanji: string; tone: AdviceTone; detail: string } {
  const english = OUTLOOK_DISPLAY[outlook];
  if (locale !== "ja") return english;
  const ja = OUTLOOK_COPY_JA[outlook];
  return { ...english, label: jaText(ja.label), detail: jaText(ja.detail) };
}

/** The losing-move note's heading and detail, in the reader's language. */
export function fatalMoveCopy(locale: Locale): { label: string; kanji: string; detail: string } {
  if (locale !== "ja") return FATAL_MOVE_DISPLAY;
  return { ...FATAL_MOVE_DISPLAY, label: jaText(FATAL_MOVE_COPY_JA.label), detail: jaText(FATAL_MOVE_COPY_JA.detail) };
}
