"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { DEFAULT_APPEARANCE, STONE_SETS } from "@/components/board/Board.constants";
import type { StoneSetTokens } from "@/components/board/board.types";

import { decodeRegions, decodeStones, encodeStones } from "@/lib/puzzles/hiddenStones/code";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { HiddenStonesGrid, type StoneMark } from "./HiddenStonesGrid";
import { SolveCheck, SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { SolveHint } from "./SolveHint";
import { PuzzleSteps } from "./PuzzleSteps";
import { useStepHistory } from "./useStepHistory";
import { SolveShow } from "./SolveShow";
import { StoneLinesToggle, useStoneLines } from "./StoneLinesToggle";
import { rowHint } from "@/lib/puzzles/hintCell";
import { decodeStoneProgress, encodeStoneProgress } from "@/lib/puzzles/puzzleProgress";
import { encodeStepLog, openingSteps } from "@/lib/puzzles/stepLog";

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
  hints = false,
  set = STONE_SETS[DEFAULT_APPEARANCE.stoneSet],
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  /** The run kept of this grid, opened where it was left; null for a fresh one. */
  resumed?: ResumedRun | null;
  /** Whether Hint was chosen for this puzzle; see `useHints`. */
  hints?: boolean;
  /** How many times Check may be pressed on one's own; null for no limit. A race's is the race's. */
  checks?: number | null;
  /** The reader's stone set, so the stones are the ones their game boards draw. */
  set?: StoneSetTokens;
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
  const { startedAt, elapsedMs, done, begin, finish, pausing, checking, hinting } = useSolve(puzzle, hasAccount, race, checks, {
    progress: encodeStoneProgress(marks),
    steps: () => encodeStepLog(history.steps.map(encodeStoneProgress)),
    resumed,
  }, hints);

  /** The column of each row's stone, or -1 for a row with none or more than one. */
  const stonesOf = useCallback(
    (from: readonly StoneMark[]): number[] =>
      Array.from({ length: size }, (_, row) => {
        const cols = Array.from({ length: size }, (_, col) => col).filter((col) => from[row * size + col] === "stone");
        return cols.length === 1 ? cols[0] : -1;
      }),
    [size],
  );

  /*
   * LINES, where hints were chosen: each stone's row and column drawn to the
   * edge. A help, so counted as a Hint is (`POINTS_A_HELP` off the score, and
   * the count beside the time): once a puzzle, the first time the lines are on
   * while the clock runs — switched on during the solve, or on already (the
   * choice is remembered) when the first stone goes down. Never in a race,
   * where `hinting.allowed` is false.
   */
  const stoneLines = useStoneLines();
  const linesOn = hinting.allowed && stoneLines.on;
  const linesCounted = useRef(false);
  const countLines = useCallback(() => {
    if (linesCounted.current) return;
    linesCounted.current = hinting.spend();
  }, [hinting]);
  const toggleLines = () => {
    if (pausing.paused || done !== null) return;
    if (stoneLines.toggle() && startedAt !== null) countLines();
  };

  /* The grid's marks replaced, from a tap or a hint: the one door every change goes through. `changed` are the cells it touched. */
  // Every grid it has been, for the scrubber under the board (`useStepHistory`); an earlier one is looked at, not written on.
  const opening = useMemo(() => (resumed === null ? null : openingSteps(resumed.steps, resumed.progress, size, decodeStoneProgress)), [resumed, size]);
  const history = useStepHistory(marks, opening);

  const apply = useCallback(
    (next: StoneMark[], changed: readonly number[]) => {
      // Nothing is pressed while paused (John, 2026-09-25: "if a game is paused, DISABLE the controls, all the controls").
      if (done !== null || pausing.paused || history.reviewing) return;
      const at = begin();
      if (linesOn) countLines();
      setMarks(next);
      changed.forEach((index) => hinting.unmark(index));
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
    [done, pausing.paused, history.reviewing, begin, linesOn, countLines, stonesOf, answer, finish, checking.allowed, hinting],
  );
  const press = useCallback(
    (index: number) => {
      const next = [...marks];
      next[index] = next[index] === "" ? "stone" : next[index] === "stone" ? "cross" : "";
      apply(next, [index]);
    },
    [marks, apply],
  );

  /* Show: every stone where the answer has none, and every cross on the answer's stone, marked until changed. A Check's worth. */
  const show = () => {
    if (!checking.spend()) return;
    const wrong = marks.flatMap((mark, index) => {
      const onAnswer = answer[Math.floor(index / size)] === index % size;
      return (mark === "stone" && !onAnswer) || (mark === "cross" && onAnswer) ? [index] : [];
    });
    hinting.mark(wrong);
    setChecked({ wrong: wrong.length, missing: stonesOf(marks).filter((col) => col === -1).length });
  };

  /* Hint: one row's stone put where the answer has it, and any other stone in that row taken up (`rowHint`). */
  const hint = () => {
    const row = rowHint(size, stonesOf(marks), answer, (at) => marks.slice(at * size, at * size + size).filter((mark) => mark === "cross").length);
    if (row === null || !hinting.spend()) return;
    const next = [...marks];
    const changed: number[] = [];
    for (let col = 0; col < size; col += 1) {
      const index = row * size + col;
      const want: StoneMark = col === answer[row] ? "stone" : next[index] === "stone" ? "" : next[index]!;
      if (next[index] !== want) {
        next[index] = want;
        changed.push(index);
      }
    }
    apply(next, changed);
  };

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
        <HiddenStonesGrid size={size} regions={regions} marks={history.shown} wrong={hinting.marked} done={done !== null} onPress={press} lines={linesOn} set={set} />
      </SolvePaused>
      <PuzzleSteps steps={history.steps} viewing={history.viewing} go={history.go} size={size} say={(mark) => (mark === "stone" ? "a stone" : mark === "cross" ? "a cross" : "cleared")} />
      {done === null ? (
        <div className="flex flex-col gap-2">
          {/* Check and Show at one end of the row, Hint at the other (John: "LHS Check, Show, RHS Hint"), and Lines beside Hint where hints were chosen. */}
          <div className="flex flex-wrap items-center gap-3">
            <SolveCheck checking={checking} onCheck={check} disabled={startedAt === null || pausing.paused} />
            <SolveShow checking={checking} onShow={show} disabled={startedAt === null || pausing.paused} />
            <div className="ml-auto flex items-center gap-3">
              {hinting.allowed ? <StoneLinesToggle on={stoneLines.on} onToggle={toggleLines} disabled={pausing.paused} /> : null}
              <SolveHint hinting={hinting} onHint={hint} disabled={startedAt === null || pausing.paused} racing={race !== null} />
            </div>
          </div>
          {checked !== null ? (
            <span className="text-sm text-muted" data-testid="puzzle-checked" aria-live="polite">
              {checkedWords(checked)}
            </span>
          ) : fullNotRight ? (
            <span className="text-sm text-muted" data-testid="puzzle-not-right" aria-live="polite">
              A stone in every row, and it is not right yet.
            </span>
          ) : (
            <span className="text-sm text-muted">Tap for a stone, again for a cross, again to clear.</span>
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
