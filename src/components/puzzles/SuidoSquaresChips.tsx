"use client";

import type { Twist } from "@johnmorrisdotca/suido";

import { useSpeaker } from "@/components/i18n/LocaleProvider";

import { LevelChips } from "./LevelChips";
import { suidoWords } from "./mazeWords";

/**
 * THE ROW UNDER A BOARD MADE WITH SQUARES: a chip for each twist it has (big pieces, block turns), as a level's row names its own, so a reader
 * is told what a board of four-square pieces is before pressing one. A board made on request has no difficulty marks and no
 * place in a block, so the row is the twists alone (`LevelChips`, with the marks and the lesson left out).
 */
export function SuidoSquaresChips({ twists }: { twists: readonly Twist[] }) {
  const words = suidoWords(useSpeaker().locale);
  return (
    <LevelChips
      prefix="suido"
      level={0}
      marks={null}
      role={null}
      twists={twists.map((twist) => ({ key: twist, label: words.twists[twist].label, kanji: words.twists[twist].kanji, says: words.twists[twist].says }))}
      copy={words.chips}
    />
  );
}
