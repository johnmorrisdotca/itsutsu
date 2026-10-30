"use client";

import { readFound, readHive } from "@/lib/puzzles/hachinosu/code";

import { HachinosuWords } from "./HachinosuFound";
import { HachinosuHive } from "./HachinosuHive";

/** A kept hive, as it ended: its letters and the words found. A page keeping an answer back has none to show, and shows the hive. */
export function HachinosuFinished({ givens, answer }: { givens: string; answer: string | null }) {
  const hive = readHive(givens);
  if (hive === null) return null;
  const found = answer === null ? null : readFound(answer);
  return (
    <div className="flex flex-col gap-3" data-testid="hachinosu-finished">
      <HachinosuHive centre={hive.centre} letters={hive.letters} />
      {found === null ? null : <HachinosuWords words={found} testId="hachinosu-found" />}
    </div>
  );
}
