"use client";

import { useCallback, useMemo, useState } from "react";

import { BLACK, decodeBlackAndWhite, EMPTY, encodeBlackAndWhite, WHITE } from "@/lib/puzzles/blackAndWhite/code";
import { decodeBlackAndWhiteProgress, encodeBlackAndWhiteProgress } from "@/lib/puzzles/puzzleProgress";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { BlackAndWhiteGrid } from "./BlackAndWhiteGrid";
import { checkedWords } from "./NumberSolve";
import { SolveCheck, SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { SolveHint } from "./SolveHint";
import { SolveShow } from "./SolveShow";
import { cellHint } from "@/lib/puzzles/hintCell";

/** What a tap puts in an open cell: black, then white, then nothing. */
function nextStone(stone: number): number {
  return stone === EMPTY ? BLACK : stone === BLACK ? WHITE : EMPTY;
}

/**
 * Solving Black and White: tap a cell for a black stone, again for white,
 * again to clear it; a printed stone does not move. The puzzle is done the
 * moment every cell holds the answer's stone; a full grid that is not the
 * answer is said in numbers — how many are wrong, never which — and Check
 * says the same on demand. The answer handed in is the whole grid.
 */
export function BlackAndWhiteSolve({
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
  /** How many times Check may be pressed on one's own; null for no limit. A race's is the race's. */
  checks?: number | null;
  /** What was written on this puzzle when it was last left, to start from; null for a fresh start. */
  resumed?: ResumedRun | null;
  /** Whether Hint was chosen for this puzzle; see `useHints`. */
  hints?: boolean;
}) {
  const hydrated = useHydrated();
  const { kind, size, seed } = puzzle;
  const givens = useMemo<number[]>(() => decodeBlackAndWhite(puzzle.givens, size) ?? [], [puzzle.givens, size]);
  const answer = useMemo<number[]>(() => decodeBlackAndWhite(puzzle.solution, size) ?? [], [puzzle.solution, size]);
  // A kept run starts where it was left; the printed stones are laid over it, so a kept grid can never move one.
  const [stones, setStones] = useState<number[]>(() => {
    const kept = resumed === null ? null : decodeBlackAndWhiteProgress(resumed.progress, size);
    return givens.map((given, index) => (given !== EMPTY ? given : (kept?.[index] ?? EMPTY)));
  });
  const [checked, setChecked] = useState<{ wrong: number; empty: number } | null>(null);
  // A full grid that is not right, said without a count under an allowance: see NumberSolve.
  const [fullNotRight, setFullNotRight] = useState(false);
  const { startedAt, elapsedMs, done, begin, finish, pausing, checking, hinting } = useSolve(puzzle, hasAccount, race, checks, {
    progress: encodeBlackAndWhiteProgress(stones),
    resumed,
  }, hints);

  /* One cell set to a stone, from a tap or a hint: the one door every change goes through. */
  const place = useCallback(
    (index: number, stone: number) => {
      if (done !== null || pausing.paused || givens[index] !== EMPTY) return;
      const at = begin();
      const next = [...stones];
      next[index] = stone;
      setStones(next);
      hinting.unmark(index);
      setChecked(null);
      setFullNotRight(false);
      if (next.every((stone) => stone !== EMPTY)) {
        const wrong = next.filter((stone, cell) => stone !== answer[cell]).length;
        if (wrong === 0) void finish(encodeBlackAndWhite(next), at);
        else if (checking.allowed === null) setChecked({ wrong, empty: 0 });
        else setFullNotRight(true);
      }
    },
    [done, pausing.paused, givens, begin, stones, answer, finish, checking.allowed, hinting],
  );
  const press = useCallback((index: number) => place(index, nextStone(stones[index] ?? EMPTY)), [place, stones]);

  /* Show: every stone put down that is not the answer's, marked until changed. A Check's worth, so paid for as one. */
  const show = () => {
    if (!checking.spend()) return;
    const wrong = stones.flatMap((stone, cell) => (givens[cell] === EMPTY && stone !== EMPTY && stone !== answer[cell] ? [cell] : []));
    hinting.mark(wrong);
    setChecked({ wrong: wrong.length, empty: stones.filter((stone) => stone === EMPTY).length });
  };

  /* Hint: the right stone into the tightest cell not yet right (`cellHint`). */
  const hint = () => {
    const cell = cellHint(size, (index) => givens[index] !== EMPTY, stones, answer);
    if (cell === null || !hinting.spend()) return;
    place(cell, answer[cell]!);
  };

  const check = () => {
    if (!checking.spend()) return;
    setFullNotRight(false);
    const wrong = stones.filter((stone, cell) => stone !== EMPTY && stone !== answer[cell]).length;
    const empty = stones.filter((stone) => stone === EMPTY).length;
    setChecked({ wrong, empty });
  };

  return (
    <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-seed={seed} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <BlackAndWhiteGrid size={size} givens={givens} stones={stones} wrong={hinting.marked} done={done !== null} onPress={press} />
      </SolvePaused>
      {done === null ? (
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
              Every cell holds a stone, and it is not right yet.
            </span>
          ) : (
            <span className="text-sm text-muted">Tap for black, again for white, again to clear.</span>
          )}
        </div>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={checking.allowed} />
      )}
    </section>
  );
}
