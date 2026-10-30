"use client";

import { generateKuniate } from "@/lib/puzzles/kuniate/generate";
import { readQuestion } from "@/lib/puzzles/kuniate/code";
import type { PuzzleLevel } from "@/lib/puzzles/puzzles.types";

import { KuniateClue } from "./KuniateClue";

/** A seed nobody is given by the day's date: an example of each way of asking, the live clue itself. */
const PREVIEW_SEED = 7;

/** A Kuniate before it is played: a real question at the way and level chosen, fetched in the browser only (`PuzzleBoardPreview`). */
export function KuniatePreview({ size, level }: { size: number; level: PuzzleLevel }) {
  const made = generateKuniate(size, level, PREVIEW_SEED);
  return <KuniateClue code={readQuestion(made.givens, size)!} size={size} />;
}
