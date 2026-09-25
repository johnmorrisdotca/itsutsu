"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { decodeJigsaw } from "@/lib/puzzles/jigsaw/code";
import { decodeMoreOrLess, type Mark } from "@/lib/puzzles/moreOrLess/code";
import { decodeCells, encodeCells } from "@/lib/puzzles/puzzleCode";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { stepEntry } from "@/lib/puzzles/stepEntry";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PuzzleGrid } from "./PuzzleGrid";
import { PUZZLE_KEY, PUZZLE_KEYS } from "./puzzles.constants";
import { SolveDone, SolveHeader, SolvePaused, type SolveRace, useSolve } from "./solveShared";

/**
 * Solving a grid of numbers — Number Place, and More or Less after it.
 *
 * Tap a cell, then a number key (or type it) — or tap the chosen cell again
 * to step it on, 1, 2, 3 … and back to empty (`stepEntry`); Backspace clears,
 * the arrows move. Check compares against the answer this tab holds and says how many
 * cells are wrong, never which. When the last cell is right the puzzle is
 * done and the whole grid — the givens where they were printed, the entries
 * everywhere else — is handed in through `useSolve`.
 */
export function NumberSolve({ puzzle, hasAccount, race = null }: { puzzle: Puzzle; hasAccount: boolean; race?: SolveRace | null }) {
  const hydrated = useHydrated();
  const { kind, size, seed } = puzzle;
  // A More or Less code is the cells and then the marks, a Jigsaw's the cells and then the regions; the rest are the cells alone.
  const asked = useMemo<{ cells: number[]; marks: Mark[]; regions: number[] | null }>(() => {
    if (kind === "moreOrLess") {
      const read = decodeMoreOrLess(puzzle.givens, size);
      return { cells: read?.cells ?? [], marks: read?.marks ?? [], regions: null };
    }
    if (kind === "jigsaw") {
      const read = decodeJigsaw(puzzle.givens, size);
      return { cells: read?.cells ?? [], marks: [], regions: read?.regions ?? null };
    }
    return { cells: decodeCells(puzzle.givens, size) ?? [], marks: [], regions: null };
  }, [kind, puzzle.givens, size]);
  const givens = asked.cells;
  const solution = useMemo(() => decodeCells(puzzle.solution, size) ?? [], [puzzle.solution, size]);
  const [entries, setEntries] = useState<number[]>(() => new Array<number>(size * size).fill(0));
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState<{ wrong: number; empty: number } | null>(null);
  const { startedAt, elapsedMs, done, begin, finish, pausing } = useSolve(puzzle, hasAccount, race);

  const enter = useCallback(
    (value: number) => {
      if (selected === null || done !== null || pausing.paused || givens[selected] !== 0) return;
      const at = begin();
      const next = [...entries];
      next[selected] = value;
      setEntries(next);
      setChecked(null);
      if (next.every((cell, index) => givens[index] !== 0 || cell !== 0)) {
        const wrong = next.filter((cell, index) => givens[index] === 0 && cell !== solution[index]).length;
        if (wrong === 0) void finish(encodeCells(next.map((cell, index) => (givens[index] !== 0 ? givens[index] : cell))), at);
        else setChecked({ wrong, empty: 0 });
      }
    },
    [selected, done, pausing.paused, givens, entries, solution, begin, finish],
  );

  /* A tap on the chosen cell steps it on; a tap anywhere else chooses that cell. A given never steps. */
  const tap = (index: number) => {
    if (index === selected && givens[index] === 0) enter(stepEntry(entries[index] ?? 0, size));
    else setSelected(index);
  };

  /* The keyboard: digits fill, Backspace clears, arrows move. Only while a cell is chosen. */
  useEffect(() => {
    if (selected === null || done !== null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= size) {
        event.preventDefault();
        enter(digit);
      } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
        event.preventDefault();
        enter(0);
      } else if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        const step = { ArrowUp: -size, ArrowDown: size, ArrowLeft: -1, ArrowRight: 1 }[event.key] ?? 0;
        const next = selected + step;
        if (next >= 0 && next < size * size) setSelected(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, done, size, enter]);

  const check = () => {
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
          entries={entries}
          marks={asked.marks}
          regions={asked.regions}
          selected={selected}
          done={done !== null}
          onSelect={tap}
        />
      </SolvePaused>
      {done === null ? (
        <>
          <div className={PUZZLE_KEYS} style={{ gridTemplateColumns: `repeat(${size + 1}, minmax(0, 1fr))` }} data-testid="puzzle-keys">
            {Array.from({ length: size }, (_, i) => i + 1).map((value) => (
              <button key={value} type="button" className={PUZZLE_KEY} onClick={() => enter(value)} data-testid={`puzzle-key-${value}`}>
                {value}
              </button>
            ))}
            <button type="button" className={PUZZLE_KEY} onClick={() => enter(0)} aria-label="clear the cell" data-testid="puzzle-key-clear">
              ×
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={check} disabled={startedAt === null || pausing.paused} data-testid="puzzle-check">
              Check
            </button>
            {checked !== null ? (
              <span className="text-sm text-muted" data-testid="puzzle-checked" aria-live="polite">
                {checkedWords(checked)}
              </span>
            ) : (
              <span className="text-sm text-muted">Tap a cell, then a number, or tap it again to count up. The clock starts on your first entry.</span>
            )}
          </div>
        </>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} />
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
