import Link from "@/components/ui/Link";

import { thousands } from "@/components/about/XpCurve";
import { mySolvePath, solvePath } from "@/lib/gomoku/slugs";
import { puzzleRecordHref } from "@/lib/puzzles/puzzleRecordAddress";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

/**
 * A MEMBER'S POINTS AT A PUZZLE, LEADING TO THE SOLVES THEY WERE MADE OF.
 *
 * A points figure on a board is a sum somebody already ran: each grid once, at
 * the member's best solve of it. So it leads to the puzzle's record narrowed to
 * that member, and to the month or the week when the board was this month's
 * or this week's — where the
 * same sum is printed again with the rows that make it marked. The rule is
 * `GameCount`'s: any number that refers to games (here, solves) leads to
 * exactly those.
 */
export function SolvePoints({
  kind,
  memberId,
  points,
  month = null,
  week = null,
  testId = "solve-points-link",
  className = "",
}: {
  kind: PuzzleKind;
  memberId: string;
  points: number;
  /** "2026-09" when the figure is one month's. */
  month?: string | null;
  /** "2026-09-21", the Monday, when the figure is one week's. */
  week?: string | null;
  testId?: string;
  className?: string;
}) {
  return (
    <Link
      href={puzzleRecordHref(kind, { member: memberId, month, week })}
      className={`font-mono tabular-nums underline-offset-2 hover:underline ${className}`}
      title="The solves these points were made of"
      data-testid={testId}
    >
      {thousands(points)}
    </Link>
  );
}

/**
 * ONE SOLVE'S POINTS, LEADING TO THAT SOLVE — the figure is a fact about one
 * finished grid, so it opens that grid, as its time does (`SolveTime`). The
 * reader's own leads to their own place for it.
 */
export function OneSolvePoints({
  kind,
  solveId,
  points,
  mine = false,
  testId = "one-solve-points",
  className = "",
}: {
  kind: string;
  solveId: string;
  points: number;
  mine?: boolean;
  testId?: string;
  className?: string;
}) {
  return (
    <Link
      href={mine ? mySolvePath(kind, solveId) : solvePath(kind, solveId)}
      className={`font-mono tabular-nums underline-offset-2 hover:underline ${className}`}
      title="Open this solve"
      data-testid={testId}
      data-solve={solveId}
    >
      {thousands(points)}
    </Link>
  );
}
