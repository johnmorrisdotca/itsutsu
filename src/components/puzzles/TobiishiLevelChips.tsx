"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { tobiishiGoalOf, tobiishiPackOf, tobiishiRefOfCode } from "@/lib/puzzles/tobiishi/levels";

import { LevelChips, type LevelChip } from "./LevelChips";
import { tobiishiWords } from "./mazeWords";
import { tobiishiMarks } from "./tobiishi.constants";

/**
 * ONE ROW UNDER A TOBIISHI LEVEL: how hard it measured, which board it is on, which hole it
 * finishes in and how many pegs it starts with. The row is the one every game of fixed levels has
 * (`LevelChips`); what is Tobiishi's is its chips, read from the level's code and the package's own
 * names for its boards and goals. Null for a code that is no level, and nothing is guessed.
 */
export function TobiishiLevelChips({ code, level }: { code: string; level: number }) {
  const say = useSpeaker();
  const ref = tobiishiRefOfCode(code);
  if (ref === null) return null;
  const pack = tobiishiPackOf(ref.pack);
  const goal = tobiishiGoalOf(ref);
  // Every level starts with one peg more than its shortest way has jumps.
  const pegs = ref.jumps + 1;
  const chips: LevelChip[] = [
    { key: "board", label: pack.title.en, kanji: pack.title.ja, says: say.say("pmaze.tobiishi.boardSays") },
    { key: "goal", label: goal.names.en, kanji: goal.names.ja, says: say.say("pmaze.tobiishi.goalSays") },
    { key: "pegs", label: say.count("pmaze.count.peg", pegs), says: say.say("pmaze.tobiishi.pegsSays") },
  ];
  return <LevelChips prefix="tobiishi" level={level} marks={tobiishiMarks(ref.jumps)} role={null} twists={chips} copy={tobiishiWords(say.locale).chips} />;
}
