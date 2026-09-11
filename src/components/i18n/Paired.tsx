"use client";

import { useSpeaker } from "./LocaleProvider";

/**
 * A word and its kanji: "Players 対局者", or just "対局者".
 *
 * The site had this pattern in fifty-odd places and no component for it —
 * every one of them an `{english} <span className="font-mincho">{kanji}</span>`
 * written out by hand. That was harmless while there was one language, and
 * became the whole problem the moment there were two: the rule for when the
 * kanji belongs has to live somewhere, and fifty copies of a rule is no rule.
 *
 * What it does is the LOCALE + JP pattern and nothing else:
 *
 *   English  Players 対局者   — unchanged, kanji and all. The sprinkle of
 *                              Japanese on the English site is wanted.
 *   Japanese 対局者          — the kanji alone, because for that reader the
 *                              kanji IS the word and the English beside it
 *                              would be the same thing said twice.
 *
 * The Japanese costs nothing and carries no risk: it is the kanji John
 * already wrote, already on the site, already read. Nothing here is
 * translated and nothing here needs a Japanese reader to check it.
 */
export function Paired({
  en,
  kanji,
  kanjiClassName = "",
  className = "",
}: {
  /** The English, as it reads today. */
  en: string;
  /** The kanji already beside it. Empty means there is none, so no pairing. */
  kanji: string;
  /** How the kanji half is drawn — it differs by where the heading sits. */
  kanjiClassName?: string;
  /** Applied when the kanji stands alone, so it keeps the heading's shape. */
  className?: string;
}) {
  const shown = useSpeaker().pairName(en, kanji);
  if (shown.kanji === null) {
    /*
     * Either the reader's own script, or a word with no kanji at all. Both
     * end as one piece of text; only the first is Japanese, and only the
     * first wants the mincho face.
     */
    return shown.text === kanji && kanji !== "" ? (
      <span className={`font-mincho ${className}`}>{shown.text}</span>
    ) : (
      <>{shown.text}</>
    );
  }
  return (
    <>
      {shown.text} <span className={`font-mincho ${kanjiClassName}`}>{shown.kanji}</span>
    </>
  );
}
