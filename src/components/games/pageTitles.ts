import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";

/**
 * A page's title as the tab and the heading say it: the words, and for a reader
 * of English the kanji beside them ("Rules 規則"). A Japanese reader's words are
 * Japanese already, so the kanji is not added.
 */
export function titleWithKanji(say: Speaker, key: PhraseKey, kanji: string, vars?: Record<string, string>): string {
  const words = say.say(key, vars);
  return say.pairsWithKanji ? `${words} ${kanji}` : words;
}
