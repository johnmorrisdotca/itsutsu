"use client";

import { tsunagiMarks, tsunagiRole, type Challenge } from "@johnmorrisdotca/tsunagi";

import type { TsunagiSet } from "@/lib/puzzles/tsunagi/levels";

import { LevelChips } from "./LevelChips";
import { TSUNAGI_CHIPS } from "./puzzles.constants";

/**
 * ONE ROW UNDER A TSUNAGI LEVEL: how hard it measured, what it asks, and where
 * it sits in its block's lesson — "New: Bridges" at a 15th that brings one,
 * "Block's test" at a 16th (`tsunagiRole`). The row is the one every game of
 * fixed levels has (`LevelChips`); what is Tsunagi's is its words
 * (`TSUNAGI_CHIPS`) and its challenges, read from the package.
 */
export function TsunagiLevelChips({ size, level, set = "classic", challenges }: { size: number; level: number; set?: TsunagiSet; challenges: readonly Challenge[] }) {
  const role = tsunagiRole(size, level, set);
  return (
    <LevelChips
      prefix="tsunagi"
      level={level}
      marks={tsunagiMarks(size, level, set)}
      role={role === null ? null : { role: role.role, newOnes: role.newOnes.map((challenge) => TSUNAGI_CHIPS[challenge].label) }}
      twists={challenges.map((challenge) => ({ key: challenge, label: TSUNAGI_CHIPS[challenge].label, kanji: TSUNAGI_CHIPS[challenge].kanji, says: TSUNAGI_CHIPS[challenge].says }))}
      copy={{ difficulty: TSUNAGI_CHIPS.difficulty, teaches: TSUNAGI_CHIPS.teaches, tests: TSUNAGI_CHIPS.tests }}
    />
  );
}
