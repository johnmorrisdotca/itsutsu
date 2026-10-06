import type { Speaker } from "@/lib/i18n/i18n";
import { DEFAULT_LOCALE, type PhraseKey } from "@/lib/i18n/i18n.constants";

/**
 * THE LINE AT THE HEAD OF A TRANSLATED LEGAL PAGE: the English version governs.
 *
 * Privacy and Terms are legal text, and John's own order is that a translation is offered for reference while
 * English is what the site is held to (ENJA-11). It is drawn for every reader whose language is not the one the
 * page was written in, and for an English reader never, since the page they are reading is the one that governs.
 */
export function GoverningNote({ say, phrase, testId }: { say: Speaker; phrase: PhraseKey; testId: string }) {
  if (say.locale === DEFAULT_LOCALE) return null;
  return (
    <p className="mt-2 rounded-md border border-rule bg-ivory px-3 py-2 text-sm text-ink-soft" data-testid={testId} lang={say.tag}>
      {say.say(phrase)}
    </p>
  );
}
