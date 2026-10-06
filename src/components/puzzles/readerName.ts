import type { Speaker } from "@/lib/i18n/i18n";

const JAPANESE = /[぀-ヿ一-鿿]/;

/**
 * A name that has its kanji beside it, as this reader is shown it. An English reader gets the English
 * (with the kanji drawn beside it by the caller); a Japanese reader gets the table's own Japanese name where it has
 * one (a chip named 端がつながる, where its kanji 巡 says too little), and the kanji where it has not.
 */
export function readerName(say: Speaker, entry: { label: string; kanji?: string }): string {
  if (say.locale !== "ja" || JAPANESE.test(entry.label) || entry.kanji === undefined || entry.kanji === "") return entry.label;
  return say.pairName(entry.label, entry.kanji).text;
}
