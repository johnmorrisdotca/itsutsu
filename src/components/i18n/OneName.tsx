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
 *
 * `wrap` is the one exception, for the set-up screen's tiles (`PICK_TILE`), which
 * are one fixed size so that nothing on that screen moves when something is
 * chosen (John, 2026-09-24: "The Board size boxes should all have same height
 * and even same width. Game boxes should also be consistent"). A tile as wide as
 * a family's cannot hold "International Draughts" on one line, and cutting the
 * name short is the thing this component exists not to do — so there the name
 * may take a second line, in room the tile keeps for it whatever it holds. It
 * is still one language.
 */
export function OneName({ en, kanji, className = "", wrap = false }: { en: string; kanji: string; className?: string; wrap?: boolean }) {
  const text = useSpeaker().pairName(en, kanji).text;
  const script = text === kanji && kanji !== "" ? "font-mincho" : "";
  return <span className={`${wrap ? "whitespace-normal" : "whitespace-nowrap"} ${script} ${className}`.trim()}>{text}</span>;
}
