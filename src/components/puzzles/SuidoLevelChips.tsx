"use client";

import type { Twist } from "@johnmorrisdotca/suido";
import { suidoBigMarks, suidoBigRole, suidoMarks, suidoRole } from "@johnmorrisdotca/suido/levels-info";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { SuidoSet } from "@/lib/puzzles/suido/seed";
import { suidoSizeKey } from "@/lib/puzzles/suido/sizes";

import { LevelChips } from "./LevelChips";
import { suidoWords } from "./mazeWords";
import { readerName } from "./readerName";

/**
 * ONE ROW UNDER A SUIDO LEVEL: how hard it measured, the twists it has, and where
 * it sits in its block's lesson — "New: Walls" at a 15th level that brings one,
 * "Block's test" at a 16th (`suidoRole`). The row is the one every game of
 * fixed levels has (`LevelChips`); what is Suido's is its words (`SUIDO_TWISTS`)
 * and its twists, which the board declares.
 *
 * `twists` are the ones the level has, in the order the levels teach them; the
 * set-up passes a loaded level's own, and where its size is not loaded yet the
 * 15th and 16th of a block still say theirs, from the marks (`suidoRole`).
 */
export function SuidoLevelChips({ size, level, twists, set = "classic" }: { size: number; level: number; twists: readonly Twist[]; set?: SuidoSet }) {
  const say = useSpeaker();
  const words = suidoWords(say.locale);
  const key = suidoSizeKey(size);
  const role = set === "big" ? suidoBigRole(level) : key === null ? null : suidoRole(key, level);
  return (
    <LevelChips
      prefix="suido"
      level={level}
      marks={set === "big" ? suidoBigMarks(level) : key === null ? null : suidoMarks(key, level)}
      role={role === null ? null : { role: role.role, newOnes: role.newOnes.map((twist) => readerName(say, words.twists[twist])) }}
      twists={twists.map((twist) => ({ key: twist, label: words.twists[twist].label, kanji: words.twists[twist].kanji, says: words.twists[twist].says }))}
      copy={words.chips}
    />
  );
}
