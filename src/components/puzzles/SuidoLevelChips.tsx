"use client";

import type { Twist } from "@johnmorrisdotca/suido";
import { suidoMarks, suidoRole } from "@johnmorrisdotca/suido/levels";

import { suidoSizeKey } from "@/lib/puzzles/suido/sizes";

import { LevelChips } from "./LevelChips";
import { SUIDO_CHIPS, SUIDO_TWISTS } from "./suido.constants";

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
export function SuidoLevelChips({ size, level, twists }: { size: number; level: number; twists: readonly Twist[] }) {
  const key = suidoSizeKey(size);
  const role = key === null ? null : suidoRole(key, level);
  return (
    <LevelChips
      prefix="suido"
      level={level}
      marks={key === null ? null : suidoMarks(key, level)}
      role={role === null ? null : { role: role.role, newOnes: role.newOnes.map((twist) => SUIDO_TWISTS[twist].label) }}
      twists={twists.map((twist) => ({ key: twist, label: SUIDO_TWISTS[twist].label, kanji: SUIDO_TWISTS[twist].kanji, says: SUIDO_TWISTS[twist].says }))}
      copy={SUIDO_CHIPS}
    />
  );
}
