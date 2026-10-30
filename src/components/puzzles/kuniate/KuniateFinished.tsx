"use client";

import { readGuesses, readQuestion } from "@/lib/puzzles/kuniate/code";

import { KuniateClue } from "./KuniateClue";
import { KuniateRows } from "./KuniateRows";

/**
 * A kept Kuniate, as it ended: the clue and the guesses. A page keeping today's answer back from somebody who
 * has not played it gets no guesses (`answer` is null), so it shows the clue alone and no name.
 */
export function KuniateFinished({ size, givens, answer }: { size: number; givens: string; answer: string | null }) {
  const hidden = readQuestion(givens, size);
  if (hidden === null) return null;
  const guesses = answer === null ? null : readGuesses(answer);
  return (
    <div className="flex flex-col gap-3" data-testid="kuniate-finished">
      <KuniateClue code={hidden} size={size} />
      {guesses === null ? null : <KuniateRows guesses={guesses} hidden={hidden} />}
    </div>
  );
}
