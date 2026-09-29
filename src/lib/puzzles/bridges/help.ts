import type { BridgeCounts, BridgesBoard } from "./bridges.types";

/**
 * Check, Show and Hint for Bridges, worked out against the puzzle's one answer
 * as every puzzle's are (`hintCell.ts` for the grids of cells).
 */

/** How many bridges drawn are more than the answer has, and how many it has that are not drawn yet. */
export function bridgesChecked(counts: BridgeCounts, answer: BridgeCounts): { wrong: number; missing: number } {
  let wrong = 0;
  let missing = 0;
  answer.forEach((want, span) => {
    const drawn = counts[span] ?? 0;
    if (drawn > want) wrong += drawn - want;
    else missing += want - drawn;
  });
  return { wrong, missing };
}

/** The spans with bridges drawn that the answer does not have as drawn: what Show marks. */
export function bridgesWrong(counts: BridgeCounts, answer: BridgeCounts): number[] {
  return answer.flatMap((want, span) => ((counts[span] ?? 0) > 0 && counts[span] !== want ? [span] : []));
}

/**
 * The span a Hint draws right: one with a bridge drawn wrongly first, since a
 * wrong bridge is the one misleading the solver; else the answer's span nearest
 * to done — at the island with the fewest bridges still to find — so the hint
 * is the one a person would have found next. Null when every span is right.
 */
export function bridgeHint(board: BridgesBoard, counts: BridgeCounts, answer: BridgeCounts): number | null {
  const wrong = bridgesWrong(counts, answer);
  if (wrong.length > 0) return wrong[0]!;
  let best: number | null = null;
  let bestLeft = Infinity;
  board.spans.forEach((span, at) => {
    if ((counts[at] ?? 0) === answer[at]) return;
    const left = Math.min(stillToFind(board, counts, answer, span.a), stillToFind(board, counts, answer, span.b));
    if (left < bestLeft) {
      best = at;
      bestLeft = left;
    }
  });
  return best;
}

function stillToFind(board: BridgesBoard, counts: BridgeCounts, answer: BridgeCounts, island: number): number {
  return board.spansOf[island]!.reduce((total, span) => total + Math.max(0, (answer[span] ?? 0) - (counts[span] ?? 0)), 0);
}
