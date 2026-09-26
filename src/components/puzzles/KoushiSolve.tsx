"use client";

import Link from "@/components/ui/Link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { FeltPatches } from "@/components/board/FeltPatches";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import type { Appearance } from "@/components/board/board.types";
import { BUTTON_BASE, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { viewHref } from "@/lib/history/myGamesViews";
import { playPath } from "@/lib/gomoku/slugs";
import { sparesOf } from "@/lib/puzzles/koushi/check";
import {
  SPARE_SWAPS,
  decodeGivens,
  decodePlay,
  encodePlay,
  isSolved,
  markLattice,
  replay,
  swapped,
  swapsAllowed,
  wordsOf,
  type Swap,
} from "@/lib/puzzles/koushi/lattice";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { KoushiGrid } from "./KoushiGrid";
import { KOUSHI_MARK_KEPT, KOUSHI_MARK_SPENT } from "./puzzles.constants";
import { PuzzleWayBack } from "./PuzzleWayBack";
import { type ResumedRun, SolveDone, SolveHeader, SolvePaused, type SolveRace, useSolve } from "./solveShared";

/**
 * Solving Koushi: swap letters two at a time until all six words are right,
 * before the swaps run out.
 *
 * The grid is never stored on its own: it is the scramble with every swap so
 * far played on it (`replay`), so what is kept, handed in and checked is one
 * list of swaps, and the grid on the screen cannot disagree with it. A solve
 * hands in the grid and its swaps (`encodePlay`); the last swap spent without
 * solving ends the puzzle unsolved (`runOut`), kept in My games, and the six
 * words are shown.
 */
export function KoushiSolve({
  puzzle,
  hasAccount,
  race = null,
  resumed = null,
  appearance = DEFAULT_APPEARANCE,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  /** What was played on this puzzle when it was last left, to start from; null for a fresh start. */
  resumed?: ResumedRun | null;
  /** The reader's board, so the colour patches start where they left them (`useFeltChoice`). */
  appearance?: Appearance;
}) {
  const hydrated = useHydrated();
  const { felt, chooseFelt } = useFeltChoice(appearance);
  const dressed = useMemo(() => ({ ...appearance, felt }), [appearance, felt]);
  const { kind, size, level, seed } = puzzle;
  const asked = useMemo(() => decodeGivens(puzzle.givens)!, [puzzle.givens]);
  const allowed = swapsAllowed(level);
  const [swaps, setSwaps] = useState<Swap[]>(() => {
    const kept = resumed === null ? null : decodePlay(resumed.progress);
    return kept !== null && kept.swaps.length < allowed ? kept.swaps : [];
  });
  const grid = useMemo(() => replay(asked.scramble, swaps), [asked, swaps]);
  const marks = useMemo(() => markLattice(grid, asked.solution), [grid, asked]);
  const [chosen, setChosen] = useState<number | null>(null);
  const { elapsedMs, done, begin, finish, runOut, pausing } = useSolve(puzzle, hasAccount, race, null, { progress: encodePlay(grid, swaps), resumed });
  const closed = done !== null || pausing.paused;
  const left = allowed - swaps.length;

  const swap = useCallback(
    (a: number, b: number) => {
      if (closed || a === b || marks[a] === "hit" || marks[b] === "hit") return;
      const at = begin();
      const made: Swap = a < b ? [a, b] : [b, a];
      const next = [...swaps, made];
      const after = swapped(grid, made);
      setSwaps(next);
      setChosen(null);
      if (isSolved(after, asked.solution)) void finish(encodePlay(after, next), at);
      else if (next.length >= allowed) void runOut(encodePlay(after, next), at);
    },
    [closed, marks, begin, swaps, grid, asked, finish, runOut, allowed],
  );

  /* A tap: the first picks a tile up (and starts the clock), the second swaps it, the same tile again puts it down. */
  const press = useCallback(
    (cell: number) => {
      if (closed || marks[cell] === "hit") return;
      if (chosen === null) {
        begin();
        setChosen(cell);
      } else if (chosen === cell) setChosen(null);
      else swap(chosen, cell);
    },
    [closed, marks, chosen, begin, swap],
  );

  /* Escape puts a picked-up tile down again. */
  useEffect(() => {
    if (chosen === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChosen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chosen]);

  const words = wordsOf(asked.solution);
  return (
    <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-seed={seed} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <KoushiGrid grid={grid} marks={marks} chosen={done === null ? chosen : null} done={done !== null} onPress={press} onSwap={swap} appearance={dressed} />
      </SolvePaused>
      {done === null ? (
        <>
          <p className="text-sm" aria-live="polite">
            <strong className="tabular-nums" data-testid="koushi-swaps-left" data-left={left}>
              {left} {left === 1 ? "swap" : "swaps"} left
            </strong>{" "}
            <span className="text-muted">· Tap a letter, then another, to swap them, or drag one onto the other.</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <FeltPatches felt={felt} wood={appearance.boardTheme} onChoose={chooseFelt} />
          </div>
        </>
      ) : done.outOfGuesses ? (
        <div className="flex flex-col gap-2" data-testid="koushi-out">
          <p className="text-base">
            Out of swaps. The words were{" "}
            <strong className="uppercase tracking-wide" data-testid="koushi-words">
              {words.join(" · ")}
            </strong>
            .
          </p>
          {hasAccount && race === null ? (
            <p className="text-xs text-muted" data-testid="koushi-kept">
              {done.paid !== null && done.paid.points > 0 ? `+${done.paid.points} XP for playing it out. ` : ""}
              Kept in{" "}
              <Link href={viewHref("completed")} className="underline">
                My games
              </Link>{" "}
              as you left it.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2" data-testid="puzzle-way-on">
            <Link href={`${playPath(kind)}${puzzleQuery({ size, level, seed: null })}`} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="koushi-another">
              Another lattice →
            </Link>
            <PuzzleWayBack kind={kind} />
          </div>
        </div>
      ) : (
        <>
          <KoushiMarks spare={sparesOf(level, swaps.length).spare} used={swaps.length} />
          <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={null} />
        </>
      )}
    </section>
  );
}

/**
 * THE MARKS AT THE END: one black stone for every swap left unused, an empty
 * ring for each of the five spent, so a perfect solve is five black stones.
 */
export function KoushiMarks({ spare, used }: { spare: number; used: number }) {
  const kept = Math.min(spare, SPARE_SWAPS);
  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="koushi-marks" data-spare={kept}>
      <span className="flex gap-1.5" role="img" aria-label={`${kept} of ${SPARE_SWAPS} swaps to spare`}>
        {Array.from({ length: SPARE_SWAPS }, (_, at) => (
          <span key={at} className={at < kept ? KOUSHI_MARK_KEPT : KOUSHI_MARK_SPENT} />
        ))}
      </span>
      <span className="text-sm text-muted">
        {used} {used === 1 ? "swap" : "swaps"}, {kept} to spare{kept === SPARE_SWAPS ? ": as few as it can be done in" : ""}.
      </span>
    </div>
  );
}
