"use client";

import Link from "@/components/ui/Link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { FeltPatches } from "@/components/board/FeltPatches";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { decodeLayout } from "@/lib/puzzles/tsunagi/code";
import { openTsunagiLevels, TSUNAGI_LEVEL_COUNTS } from "@/lib/puzzles/tsunagi/levels";
import { allJoined, answerOf, decodeLines, dragThrough, encodeLines, filled, joined, letGo, noLines, pressAt, type Lines } from "@/lib/puzzles/tsunagi/lines";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { feltOrWoodTheme } from "./GomojiGrid";
import { SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { TsunagiGrid } from "./TsunagiGrid";
import { tsunagiLevelPath } from "./TsunagiLevelBoard";
import { TsunagiFillPicker, TsunagiMarksPicker } from "./TsunagiMarksPicker";
import type { TsunagiFill, TsunagiMarks } from "./puzzles.constants";
import { keepSolveHere, keptSolves } from "./tsunagiKept";
import { useTsunagiFill, useTsunagiMarks } from "./useTsunagiMarks";

/** The board of levels at a size: the set-up, opened on that size. */
export function tsunagiLevelsPath(size: number): string {
  return `${setUpPath("tsunagi")}?size=${size}`;
}

/**
 * SOLVING A TSUNAGI LEVEL: press a marble or a line's end and drag. The rules
 * of a press and a drag are `tsunagi/lines.ts`; this holds the lines, the
 * undo, the clock (`useSolve`, as every puzzle), and the end: when every pair
 * is joined and every cell has a line through it, the answer is handed in and
 * the done card offers the next level and the board of levels.
 *
 * A level past the open rows is shut, and says which row opens it. A member's
 * solved levels come from the page (`tsunagiSolvedBy`); anybody's are also in
 * this browser (`tsunagiKept`), written the moment a level is solved.
 */
export function TsunagiSolve({
  puzzle,
  hasAccount,
  race = null,
  resumed = null,
  appearance = DEFAULT_APPEARANCE,
  known = {},
  marksChosen = null,
  fillChosen = null,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  resumed?: ResumedRun | null;
  appearance?: Appearance;
  /** The levels at this size the member has solved on the account, with their best times. */
  known?: Record<number, number>;
  /** Colours or numbers, as the account last chose; null where it never has. */
  marksChosen?: TsunagiMarks | null;
  /** Marbles or lines, as the account last chose; null where it never has. */
  fillChosen?: TsunagiFill | null;
}) {
  const hydrated = useHydrated();
  const { size, seed: level } = puzzle;
  const layout = useMemo(() => decodeLayout(puzzle.givens, size)!, [puzzle.givens, size]);
  const [lines, setLines] = useState<Lines>(() => (resumed === null ? null : decodeLines(layout, resumed.progress)) ?? noLines(layout));
  const [undo, setUndo] = useState<Lines[]>([]);
  const now = useRef(lines);
  const drawing = useRef<number | null>(null);
  const before = useRef<Lines | null>(null);
  const { felt, chooseFelt } = useFeltChoice(appearance);
  const { marks, chooseMarks } = useTsunagiMarks(marksChosen, hasAccount);
  const { fill, chooseFill } = useTsunagiFill(fillChosen, hasAccount);
  const theme = feltOrWoodTheme({ ...appearance, felt });

  // This page is drawn in the browser only (`PuzzlePlayClient`), so the browser's own solves are read at once.
  const [solvedHere] = useState(() => ({ ...keptSolves(size), ...known }));
  const solvedSet = useMemo(() => new Set(Object.keys(solvedHere).map(Number)), [solvedHere]);
  const open = openTsunagiLevels(size, solvedSet);
  const count = TSUNAGI_LEVEL_COUNTS[size] ?? 0;
  const shut = race === null && resumed === null && level > open;

  const { startedAt, elapsedMs, done, begin, finish, pausing } = useSolve(puzzle, hasAccount, race, null, {
    progress: encodeLines(layout, lines),
    resumed,
  });
  const idle = done !== null || pausing.paused || shut;

  const show = useCallback((next: Lines) => {
    now.current = next;
    setLines(next);
  }, []);

  const press = useCallback(
    (cell: number) => {
      if (idle) return;
      const pressed = pressAt(layout, now.current, cell);
      if (pressed.drawing === null) return;
      begin();
      before.current = now.current;
      drawing.current = pressed.drawing;
      show(pressed.lines);
    },
    [idle, layout, begin, show],
  );
  const drag = useCallback(
    (cell: number) => {
      if (drawing.current === null || idle) return;
      show(dragThrough(layout, now.current, drawing.current, cell));
    },
    [idle, layout, show],
  );
  const lift = useCallback(() => {
    if (drawing.current === null) return;
    drawing.current = null;
    const next = letGo(now.current);
    show(next);
    const was = before.current;
    before.current = null;
    if (was !== null && JSON.stringify(was) !== JSON.stringify(next)) setUndo((stack) => [...stack.slice(-199), was]);
    if (allJoined(layout, next)) {
      const answer = answerOf(layout, next);
      // Every level has one answer, so a board joined and full is it; compared all the same, never assumed.
      if (answer === puzzle.solution) {
        const at = Date.now();
        void finish(answer, at).then(() => undefined);
      }
    }
  }, [layout, show, finish, puzzle.solution]);

  // Kept in this browser as soon as it is solved, so the board of levels opens the next row with or without an account.
  useEffect(() => {
    if (done !== null && race === null) keepSolveHere(size, level, done.elapsedMs);
  }, [done, race, size, level]);

  const takeBack = () => {
    if (idle || undo.length === 0) return;
    show(undo[undo.length - 1]!);
    setUndo((stack) => stack.slice(0, -1));
  };
  const restart = () => {
    if (idle || now.current.every((line) => line.length === 0)) return;
    setUndo((stack) => [...stack.slice(-199), now.current]);
    show(noLines(layout));
  };

  const pairs = layout.ends.length;
  const pairsJoined = layout.ends.filter((_, pair) => joined(layout, lines, pair)).length;
  const cover = filled(layout, lines);
  const asked = (
    <>
      {size}×{size} · Level {level} <span className="text-xs">of {count}</span>
    </>
  );

  if (shut) {
    const row = Math.ceil(level / 10);
    return (
      <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind="tsunagi" data-seed={level} {...readyMark(hydrated)}>
        <p className="text-sm" data-testid="tsunagi-shut">
          Level {level} at {size}×{size} opens when every level in row {row - 1} of the board of levels is solved.
        </p>
        <p className="flex flex-wrap gap-2">
          <Link href={tsunagiLevelPath(size, Math.min(open, level))} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
            Play level {Math.min(open, level)}
          </Link>
          <Link href={tsunagiLevelsPath(size)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
            All levels
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind="tsunagi" data-seed={level} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} asked={asked} />
      <SolvePaused pausing={pausing}>
        <TsunagiGrid layout={layout} lines={lines} marks={marks} fill={fill} theme={theme} done={done !== null} onPress={press} onDrag={drag} onLift={lift} />
      </SolvePaused>
      {done === null ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={takeBack} disabled={undo.length === 0 || pausing.paused} data-testid="tsunagi-undo">
              Undo
            </button>
            <button
              type="button"
              className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
              onClick={restart}
              disabled={startedAt === null || pausing.paused || lines.every((line) => line.length === 0)}
              data-testid="tsunagi-restart"
            >
              Restart
            </button>
            <span className="text-sm text-muted tabular-nums" data-testid="tsunagi-progress" data-joined={pairsJoined} data-filled={cover.done} aria-live="polite">
              {pairsJoined === pairs && cover.done < cover.of
                ? `Every pair joined; ${cover.of - cover.done} ${cover.of - cover.done === 1 ? "cell is" : "cells are"} still empty.`
                : `${pairsJoined} of ${pairs} joined · ${Math.round((100 * cover.done) / cover.of)}% of the board`}
            </span>
          </div>
          <p className="text-sm text-muted">Press a marble and drag to its partner. Drag back to shorten a line; tap a marble to clear it.</p>
        </div>
      ) : (
        <SolveDone
          puzzle={puzzle}
          done={done}
          hasAccount={hasAccount}
          race={race}
          onward={{
            next: level < count ? { href: tsunagiLevelPath(size, level + 1), label: `Level ${level + 1} →` } : null,
            all: { href: tsunagiLevelsPath(size), label: "All levels" },
          }}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <TsunagiMarksPicker marks={marks} onChoose={chooseMarks} />
          <TsunagiFillPicker fill={fill} onChoose={chooseFill} />
        </div>
        <FeltPatches felt={felt} wood={appearance.boardTheme} onChoose={chooseFelt} />
      </div>
    </section>
  );
}
