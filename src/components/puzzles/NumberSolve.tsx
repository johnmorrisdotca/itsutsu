"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { decodeJigsaw } from "@/lib/puzzles/jigsaw/code";
import { decodeKiller, type Cage } from "@/lib/puzzles/killer/code";
import { decodeMoreOrLess, type Mark } from "@/lib/puzzles/moreOrLess/code";
import { decodeCells, encodeCells, symbolOf, valueOfSymbol } from "@/lib/puzzles/puzzleCode";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { decodeTowers, type TowerClues } from "@/lib/puzzles/towers/code";
import { stepEntry } from "@/lib/puzzles/stepEntry";
import { decodeNumberProgress, encodeNumberProgress } from "@/lib/puzzles/puzzleProgress";
import { encodeStepLog, openingSteps } from "@/lib/puzzles/stepLog";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PuzzleGrid } from "./PuzzleGrid";
import { PUZZLE_KEY, PUZZLE_KEYS, PUZZLE_KEYS_PER_ROW } from "./puzzles.constants";
import { SolveCheck, SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { SolveHint } from "./SolveHint";
import { PuzzleSteps } from "./PuzzleSteps";
import { useStepHistory } from "./useStepHistory";
import { SolveShow } from "./SolveShow";
import { cellHint } from "@/lib/puzzles/hintCell";

/**
 * Solving a grid of numbers — Number Place and its variants, More or Less and Towers.
 *
 * Tap a cell, then a number key (or type it) — or tap the chosen cell again
 * to step it on, 1, 2, 3 … and back to empty (`stepEntry`); Backspace clears,
 * the arrows move, Escape lets the chosen cell go. Check compares against the answer this tab holds and says how many
 * cells are wrong, never which. When the last cell is right the puzzle is
 * done and the whole grid — the givens where they were printed, the entries
 * everywhere else — is handed in through `useSolve`.
 */
export function NumberSolve({
  puzzle,
  hasAccount,
  race = null,
  checks = null,
  resumed = null,
  hints = false,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  /** The run kept of this grid, opened where it was left; null for a fresh one. */
  resumed?: ResumedRun | null;
  /** Whether Hint was chosen for this puzzle; see `useHints`. */
  hints?: boolean;
  /** How many times Check may be pressed on one's own, from the address; null for no limit. A race's is the race's. */
  checks?: number | null;
}) {
  const hydrated = useHydrated();
  const { kind, size, seed } = puzzle;
  // A More or Less code is the cells and then the marks, a Jigsaw's the cells and then the regions, a Towers the cells
  // and then its clues; the rest are the cells alone.
  const asked = useMemo<{ cells: number[]; marks: Mark[]; regions: number[] | null; cages: Cage[] | null; clues: TowerClues | null }>(() => {
    const plain = { marks: [], regions: null, cages: null, clues: null };
    if (kind === "moreOrLess") {
      const read = decodeMoreOrLess(puzzle.givens, size);
      return { ...plain, cells: read?.cells ?? [], marks: read?.marks ?? [] };
    }
    if (kind === "sumCages") {
      const read = decodeKiller(puzzle.givens, size);
      return { ...plain, cells: read?.cells ?? [], cages: read?.cages ?? null };
    }
    if (kind === "jigsaw") {
      const read = decodeJigsaw(puzzle.givens, size);
      return { ...plain, cells: read?.cells ?? [], regions: read?.regions ?? null };
    }
    if (kind === "towers") {
      const read = decodeTowers(puzzle.givens, size);
      return { ...plain, cells: read?.cells ?? [], clues: read?.clues ?? null };
    }
    return { ...plain, cells: decodeCells(puzzle.givens, size) ?? [] };
  }, [kind, puzzle.givens, size]);
  const givens = asked.cells;
  const solution = useMemo(() => decodeCells(puzzle.solution, size) ?? [], [puzzle.solution, size]);
  const [entries, setEntries] = useState<number[]>(
    () => (resumed === null ? null : decodeNumberProgress(resumed.progress, size)) ?? new Array<number>(size * size).fill(0),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState<{ wrong: number; empty: number } | null>(null);
  /*
   * A FULL GRID THAT IS NOT RIGHT says so — it was handed in and nothing
   * happened, which needs a word — but under a Check allowance it does not say
   * HOW MANY are wrong, or filling the grid would be a Check nobody spent.
   */
  const [fullNotRight, setFullNotRight] = useState(false);
  const { startedAt, elapsedMs, done, begin, finish, pausing, checking, hinting } = useSolve(puzzle, hasAccount, race, checks, {
    progress: encodeNumberProgress(entries),
    steps: () => encodeStepLog(history.steps.map(encodeNumberProgress)),
    resumed,
  }, hints);

  // Every grid it has been, for the scrubber under the board (`useStepHistory`); an earlier one is looked at, not written on.
  const opening = useMemo(() => (resumed === null ? null : openingSteps(resumed.steps, resumed.progress, size, decodeNumberProgress)), [resumed, size]);
  const history = useStepHistory(entries, opening);

  /* A value into one cell, from a key, a tap or a hint: the one door every entry goes through. */
  const write = useCallback(
    (cell: number, value: number) => {
      if (done !== null || pausing.paused || history.reviewing || givens[cell] !== 0) return;
      const at = begin();
      const next = [...entries];
      next[cell] = value;
      setEntries(next);
      hinting.unmark(cell);
      setChecked(null);
      setFullNotRight(false);
      if (next.every((cell, index) => givens[index] !== 0 || cell !== 0)) {
        const wrong = next.filter((cell, index) => givens[index] === 0 && cell !== solution[index]).length;
        if (wrong === 0) void finish(encodeCells(next.map((cell, index) => (givens[index] !== 0 ? givens[index] : cell))), at);
        else if (checking.allowed === null) setChecked({ wrong, empty: 0 });
        else setFullNotRight(true);
      }
    },
    [done, pausing.paused, history.reviewing, givens, entries, solution, begin, finish, checking.allowed, hinting],
  );
  const enter = useCallback(
    (value: number) => {
      if (selected !== null) write(selected, value);
    },
    [selected, write],
  );

  /* A tap on the chosen cell steps it on; a tap anywhere else chooses that cell. A given never steps. */
  const tap = (index: number) => {
    if (index === selected && givens[index] === 0) enter(stepEntry(entries[index] ?? 0, size));
    else setSelected(index);
  };

  /* The keyboard: digits fill, Backspace clears, arrows move, Escape lets the cell go. Only while a cell is chosen, and not while paused. */
  useEffect(() => {
    if (selected === null || done !== null || pausing.paused) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // 1–9, and past nine the letters A–G, either case (`valueOfSymbol`).
      const typed = valueOfSymbol(event.key);
      if (typed >= 1 && typed <= size) {
        event.preventDefault();
        enter(typed);
      } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
        event.preventDefault();
        enter(0);
      } else if (event.key === "Escape") {
        event.preventDefault();
        setSelected(null);
      } else if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        const step = { ArrowUp: -size, ArrowDown: size, ArrowLeft: -1, ArrowRight: 1 }[event.key] ?? 0;
        const next = selected + step;
        if (next >= 0 && next < size * size) setSelected(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, done, pausing.paused, size, enter]);

  /* Show: every entry that is not the answer, marked on the grid until it is changed. A Check's worth, so paid for as one. */
  const show = () => {
    if (!checking.spend()) return;
    const wrong = entries.flatMap((cell, index) => (givens[index] === 0 && cell !== 0 && cell !== solution[index] ? [index] : []));
    hinting.mark(wrong);
    setChecked({ wrong: wrong.length, empty: entries.filter((cell, index) => givens[index] === 0 && cell === 0).length });
  };

  /* Hint: one right number into the tightest cell not yet right (`cellHint`), chosen so it can be seen. */
  const hint = () => {
    const cell = cellHint(size, (index) => givens[index] !== 0, entries.map((value, index) => (givens[index] !== 0 ? givens[index]! : value)), solution);
    if (cell === null || !hinting.spend()) return;
    setSelected(cell);
    write(cell, solution[cell]!);
  };

  const check = () => {
    if (!checking.spend()) return;
    setFullNotRight(false);
    const wrong = entries.filter((cell, index) => givens[index] === 0 && cell !== 0 && cell !== solution[index]).length;
    const empty = entries.filter((cell, index) => givens[index] === 0 && cell === 0).length;
    setChecked({ wrong, empty });
  };

  return (
    <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-seed={seed} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <PuzzleGrid
          kind={kind}
          size={size}
          givens={givens}
          entries={history.shown}
          marks={asked.marks}
          regions={asked.regions}
          cages={asked.cages}
          wrong={hinting.marked}
          clues={asked.clues}
          selected={selected}
          done={done !== null}
          onSelect={tap}
        />
      </SolvePaused>
      <PuzzleSteps steps={history.steps} viewing={history.viewing} go={history.go} size={size} say={(value) => (value === 0 ? "cleared" : symbolOf(value))} />
      {done === null ? (
        <>
          <div className={PUZZLE_KEYS} style={{ gridTemplateColumns: `repeat(${Math.min(size + 1, PUZZLE_KEYS_PER_ROW)}, minmax(0, 1fr))` }} data-testid="puzzle-keys">
            {Array.from({ length: size }, (_, i) => i + 1).map((value) => (
              <button key={value} type="button" className={PUZZLE_KEY} onClick={() => enter(value)} disabled={pausing.paused} data-testid={`puzzle-key-${value}`}>
                {symbolOf(value)}
              </button>
            ))}
            <button type="button" className={PUZZLE_KEY} onClick={() => enter(0)} disabled={pausing.paused} aria-label="clear the cell" data-testid="puzzle-key-clear">
              ×
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {/* Check and Show at one end of the row, Hint at the other (John: "LHS Check, Show, RHS Hint"). */}
            <div className="flex items-center gap-3">
              <SolveCheck checking={checking} onCheck={check} disabled={startedAt === null || pausing.paused} />
              <SolveShow checking={checking} onShow={show} disabled={startedAt === null || pausing.paused} />
              <SolveHint hinting={hinting} onHint={hint} disabled={startedAt === null || pausing.paused} racing={race !== null} />
            </div>
            {checked !== null ? (
              <span className="text-sm text-muted" data-testid="puzzle-checked" aria-live="polite">
                {checkedWords(checked)}
              </span>
            ) : fullNotRight ? (
              <span className="text-sm text-muted" data-testid="puzzle-not-right" aria-live="polite">
                Every cell is filled, and it is not right yet.
              </span>
            ) : (
              <span className="text-sm text-muted">Tap a cell, then a number.</span>
            )}
          </div>
        </>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={checking.allowed} />
      )}
    </section>
  );
}

/** What Check says: how many are wrong and how many are still empty, never which. */
export function checkedWords(checked: { wrong: number; empty: number }): string {
  if (checked.wrong === 0 && checked.empty === 0) return "Everything is filled and right.";
  const wrong = checked.wrong === 0 ? "Nothing wrong so far" : `${checked.wrong} ${checked.wrong === 1 ? "cell is" : "cells are"} wrong`;
  const empty = checked.empty > 0 ? `, ${checked.empty} still to fill` : "";
  return `${wrong}${empty}.`;
}
