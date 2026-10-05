"use client";

import type { Twist } from "@johnmorrisdotca/suido";

import { LevelChips } from "./LevelChips";
import { SUIDO_CHIPS, SUIDO_TWISTS } from "./suido.constants";

/**
 * THE ROW UNDER A BOARD MADE WITH SQUARES: a chip for each twist it has (big pieces), as a level's row names its own, so a reader
 * is told what a board of four-square pieces is before pressing one. A board made on request has no difficulty marks and no
 * place in a block, so the row is the twists alone (`LevelChips`, with the marks and the lesson left out).
 */
export function SuidoSquaresChips({ twists }: { twists: readonly Twist[] }) {
  return (
    <LevelChips
      prefix="suido"
      level={0}
      marks={null}
      role={null}
      twists={twists.map((twist) => ({ key: twist, label: SUIDO_TWISTS[twist].label, kanji: SUIDO_TWISTS[twist].kanji, says: SUIDO_TWISTS[twist].says }))}
      copy={SUIDO_CHIPS}
    />
  );
}
