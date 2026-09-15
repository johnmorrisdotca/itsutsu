"use client";

import { useSpeaker } from "./LocaleProvider";

/**
 * A name in ONE language, on one line — the words under a picture.
 *
 * `Paired` sets the English and the kanji side by side, which is right in a
 * heading and wrong under an icon. John, 2026-09-15, on the set-up page: labels
 * under icons are English only, one row of text, no wrapping — "Pieces and
 * twists" with its kanji under it took two lines. So the label under a picture
 * is the reader's own half of the pair, chosen by `pairName`, the rule `Paired`
 * already uses: the English for an English reader, the kanji alone for a
 * reader whose script it is. The kanji stays everywhere the name is a heading.
 *
 * `whitespace-nowrap`, because one line is the rule: the tile around it is sized
 * to fit the longest name rather than this cutting it short.
 */
export function OneName({ en, kanji, className = "" }: { en: string; kanji: string; className?: string }) {
  const text = useSpeaker().pairName(en, kanji).text;
  const script = text === kanji && kanji !== "" ? "font-mincho" : "";
  return <span className={`whitespace-nowrap ${script} ${className}`.trim()}>{text}</span>;
}
