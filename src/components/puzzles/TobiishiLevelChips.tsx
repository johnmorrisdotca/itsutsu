"use client";

import { tobiishiGoalOf, tobiishiPackOf, tobiishiRefOfCode } from "@/lib/puzzles/tobiishi/levels";

import { LevelChips, type LevelChip } from "./LevelChips";
import { TOBIISHI_CHIPS, tobiishiMarks } from "./tobiishi.constants";

/**
 * ONE ROW UNDER A TOBIISHI LEVEL: how hard it measured, which board it is on, which hole it
 * finishes in and how many pegs it starts with. The row is the one every game of fixed levels has
 * (`LevelChips`); what is Tobiishi's is its chips, read from the level's code and the package's own
 * names for its boards and goals. Null for a code that is no level, and nothing is guessed.
 */
export function TobiishiLevelChips({ code, level }: { code: string; level: number }) {
  const ref = tobiishiRefOfCode(code);
  if (ref === null) return null;
  const pack = tobiishiPackOf(ref.pack);
  const goal = tobiishiGoalOf(ref);
  // Every level starts with one peg more than its shortest way has jumps.
  const pegs = ref.jumps + 1;
  const chips: LevelChip[] = [
    { key: "board", label: pack.title.en, kanji: pack.title.ja, says: "The board this level is played on." },
    { key: "goal", label: goal.names.en, kanji: goal.names.ja, says: "The hole the last peg has to be in: it is drawn with a dashed ring." },
    { key: "pegs", label: `${pegs} pegs`, says: "How many pegs the level starts with. Each jump takes one, so it takes one jump fewer than that to leave one peg." },
  ];
  return <LevelChips prefix="tobiishi" level={level} marks={tobiishiMarks(ref.jumps)} role={null} twists={chips} copy={TOBIISHI_CHIPS} />;
}
