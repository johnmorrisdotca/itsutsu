"use client";

import { tsunagiMarks, tsunagiRole, type Challenge } from "@johnmorrisdotca/tsunagi";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { TsunagiSet } from "@/lib/puzzles/tsunagi/levels";

import { LevelChips } from "./LevelChips";
import { tsunagiChips } from "./mazeWords";
import { readerName } from "./readerName";

/**
 * ONE ROW UNDER A TSUNAGI LEVEL: how hard it measured, what it asks, and where
 * it sits in its block's lesson — "New: Bridges" at a 15th that brings one,
 * "Block's test" at a 16th (`tsunagiRole`). The row is the one every game of
 * fixed levels has (`LevelChips`); what is Tsunagi's is its words
 * (`TSUNAGI_CHIPS`) and its challenges, read from the package.
 */
export function TsunagiLevelChips({ size, level, set = "classic", challenges }: { size: number; level: number; set?: TsunagiSet; challenges: readonly Challenge[] }) {
  const say = useSpeaker();
  const words = tsunagiChips(say.locale);
  const role = tsunagiRole(size, level, set);
  return (
    <LevelChips
      prefix="tsunagi"
      level={level}
      marks={tsunagiMarks(size, level, set)}
      role={role === null ? null : { role: role.role, newOnes: role.newOnes.map((challenge) => readerName(say, words[challenge])) }}
      twists={challenges.map((challenge) => ({ key: challenge, label: words[challenge].label, kanji: words[challenge].kanji, says: words[challenge].says }))}
      copy={{ difficulty: words.difficulty, teaches: words.teaches, tests: words.tests }}
    />
  );
}
