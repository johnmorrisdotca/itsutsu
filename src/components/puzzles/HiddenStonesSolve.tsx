"use client";

import { useCallback, useMemo, useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { decodeRegions, decodeStones, encodeStones } from "@/lib/puzzles/hiddenStones/code";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { HiddenStonesGrid, type StoneMark } from "./HiddenStonesGrid";
import { SolveCheck, SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { decodeStoneProgress, encodeStoneProgress } from "@/lib/puzzles/puzzleProgress";

/**
 * Solving Hidden Stones: tap a cell for a stone, again for a cross, again to
 * clear it. The puzzle is done the moment every row holds one stone and
 * every stone is where the answer has it; a full set of stones that is not
 * the answer is said in numbers — how many are wrong, never which — and
 * Check says the same on demand. The answer handed in is the column of each
 * row's stone (`encodeStones`).
 */
export function HiddenStonesSolve({
  puzzle,
  hasAccount,
  race = null,
  checks = null,
  resumed = null,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  /** The run kept of this grid, opened where it was left; null for a fresh one. */
  resumed?: ResumedRun | null;
  /** How many times Check may be pressed on one's own; null for no limit. A race's is the race's. */
  checks?: number | null;
}) {
  const hydrated = useHydrated();
  const { kind, size, seed } = puzzle;
  const regions = useMemo(() => decodeRegions(puzzle.givens, size) ?? [], [puzzle.givens, size]);
  const answer = useMemo(() => decodeStones(puzzle.solution, size) ?? [], [puzzle.solution, size]);
  const [marks, setMarks] = useState<StoneMark[]>(
    () => (resumed === null ? null : decodeStoneProgress(resumed.progress, size)) ?? new Array<StoneMark>(size * size).fill(""),
  );
  const [checked, setChecked] = useState<{ wrong: number; missing: number } | null>(null);
  // A full grid that is not right, said without a count under an allowance: see NumberSolve.
  const [fullNotRight, setFullNotRight] = useState(false);
  const { startedAt, elapsedMs, done, begin, finish, pausing, checking } = useSolve(puzzle, hasAccount, race, checks, {
    progress: encodeStoneProgress(marks),
    resumed,
  });

  /** The column of each row's stone, or -1 for a row with none or more than one. */
  const stonesOf = useCallback(
    (from: readonly StoneMark[]): number[] =>
      Array.from({ length: size }, (_, row) => {
        const cols = Array.from({ length: size }, (_, col) => col).filter((col) => from[row * size + col] === "stone");
        return cols.length === 1 ? cols[0] : -1;
      }),
    [size],
  );

  const press = useCallback(
    (index: number) => {
      if (done !== null) return;
      const at = begin();
      const next = [...marks];
      next[index] = next[index] === "" ? "stone" : next[index] === "stone" ? "cross" : "";
      setMarks(next);
      setChecked(null);
      setFullNotRight(false);
      const stones = stonesOf(next);
      if (stones.every((col) => col !== -1)) {
        const wrong = stones.filter((col, row) => col !== answer[row]).length;
        if (wrong === 0) void finish(encodeStones(stones), at);
        else if (checking.allowed === null) setChecked({ wrong, missing: 0 });
        else setFullNotRight(true);
      }
    },
    [done, begin, marks, stonesOf, answer, finish, checking.allowed],
  );

  const check = () => {
    if (!checking.spend()) return;
    setFullNotRight(false);
    const stones = stonesOf(marks);
    const wrong = stones.filter((col, row) => col !== -1 && col !== answer[row]).length;
    const missing = stones.filter((col) => col === -1).length;
    setChecked({ wrong, missing });
  };

  return (
    <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-seed={seed} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <HiddenStonesGrid size={size} regions={regions} marks={marks} done={done !== null} onPress={press} />
      </SolvePaused>
      {done === null ? (
        <div className="flex flex-wrap items-center gap-3">
          <SolveCheck checking={checking} onCheck={check} disabled={startedAt === null || pausing.paused} />
          {checked !== null ? (
            <span className="text-sm text-muted" data-testid="puzzle-checked" aria-live="polite">
              {checkedWords(checked)}
            </span>
          ) : fullNotRight ? (
            <span className="text-sm text-muted" data-testid="puzzle-not-right" aria-live="polite">
              A stone in every row, and it is not right yet.
            </span>
          ) : (
            <span className="text-sm text-muted">Tap a cell for a stone, again for a cross, again to clear it. The clock starts on your first tap.</span>
          )}
        </div>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={checking.allowed} />
      )}
    </section>
  );
}

/** What Check says: how many stones are wrong and how many rows have none yet, never which. */
export function checkedWords(checked: { wrong: number; missing: number }): string {
  if (checked.wrong === 0 && checked.missing === 0) return "Every stone is right.";
  const wrong = checked.wrong === 0 ? "Nothing wrong so far" : `${checked.wrong} ${checked.wrong === 1 ? "stone is" : "stones are"} wrong`;
  const missing = checked.missing > 0 ? `, ${checked.missing} ${checked.missing === 1 ? "row" : "rows"} without one stone` : "";
  return `${wrong}${missing}.`;
}
