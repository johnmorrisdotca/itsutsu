"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import Link from "@/components/ui/Link";

import { mySolvePath, solvePath } from "@/lib/gomoku/slugs";
import { clockText } from "@/lib/puzzles/clockText";

/**
 * A PUZZLE'S TIME, LEADING TO THE SOLVE IT WAS. The twin of `GameCount` for a
 * puzzle: John, 2026-09-26, on a board of fastest times ("5x5 easy 2:41 John
 * M."): "No way to view played games". A time is one finished grid, so it opens
 * that grid as it ended, with its replay (`PuzzleSolvePage`).
 *
 * `mine` leads to the reader's own place for it, under their solves; anybody
 * else's leads under the puzzle's record. One honest exception, a decision
 * here rather than a link left off somewhere, with its reason on hover:
 * `solveId={null}`, a time told once (a best time on the feed) whose solve is
 * no longer kept. There is nothing to open, and no link is better than a link
 * to nothing.
 */
export function SolveTime({
  kind,
  solveId,
  elapsedMs,
  mine = false,
  testId = "solve-time-link",
  className = "",
}: {
  kind: string;
  solveId: string | null;
  elapsedMs: number;
  mine?: boolean;
  testId?: string;
  className?: string;
}) {
  const say = useSpeaker();
  const text = clockText(elapsedMs);
  if (solveId === null) {
    return (
      <span className={`font-mono tabular-nums ${className}`} title={say.say("pset.time.noLonger")} data-testid={testId}>
        {text}
      </span>
    );
  }
  return (
    <Link
      href={mine ? mySolvePath(kind, solveId) : solvePath(kind, solveId)}
      className={`font-mono tabular-nums underline-offset-2 hover:underline ${className}`}
      title={say.say("pset.time.open")}
      data-testid={testId}
      data-solve={solveId}
    >
      {text}
    </Link>
  );
}
