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
import { explosionAfter, strokesToExplosion } from "@/lib/puzzles/tsunagi/explosions";
import { blockOf, TSUNAGI_BLOCK } from "@/lib/puzzles/tsunagi/levelBlocks";
import { challengesOf } from "@/lib/puzzles/tsunagi/ladder";
import { firstUnsolvedTsunagiLevel, nextLevelLabel, openTsunagiLevels, TSUNAGI_LEVEL_COUNTS } from "@/lib/puzzles/tsunagi/levels";
import { allJoined, answerOf, decodeLines, dragThrough, encodeLines, filled, joined, letGo, linesOfAnswer, noLines, pressAt, unjoinedPairs, type Lines } from "@/lib/puzzles/tsunagi/lines";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { feltOrWoodTheme } from "./GomojiGrid";
import { SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { TsunagiGrid } from "./TsunagiGrid";
import { TsunagiLevelChips } from "./TsunagiLevelChips";
import { TsunagiViewport } from "./TsunagiViewport";
import { TsunagiSolvedView } from "./TsunagiSolvedView";
import { tsunagiLevelPath } from "./TsunagiLevelBoard";
import { TsunagiFillPicker, TsunagiMarksPicker } from "./TsunagiMarksPicker";
import type { TsunagiFill, TsunagiMarks } from "./puzzles.constants";
import { keepSolveHere, keptSolves } from "./tsunagiKept";
import { useTsunagiAttempts } from "./useTsunagiAttempts";
import { useTsunagiFill, useTsunagiMarks } from "./useTsunagiMarks";

/** How long Check's flashing lasts; its words stay until the board changes. */
const CHECK_FLASH_MS = 2400;

/** How long an explosion's burst shows; its words stay until the next stroke. */
const BLAST_MS = 1200;

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
 * On a board with explosions (`tsunagi/explosions.ts`) every stroke is counted,
 * the count to the next one is shown under the board and turns to a warning a
 * stroke before, and the stroke that sets one off breaks a line, bursts where
 * it was, and leaves nothing to undo: an explosion is not taken back. Restart
 * starts the count again; a kept run picks up with a fresh count.
 *
 * A level past the open blocks is shut, and says which block opens it. A member's
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
  attempts: attemptsKnown = {},
  bestSolves = {},
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
  /** How many times the member has started each level at this size, on the account. */
  attempts?: Record<number, number>;
  /** The member's best solve of each level at this size, to open from its time. */
  bestSolves?: Record<number, string>;
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
  // Past the open blocks is shut, except a level already solved: it opens on its finished board wherever it now sits.
  const shut = race === null && resumed === null && level > open && !solvedSet.has(level);
  // Where "next" leads once this one is solved: the lowest level still unsolved, this one counted in.
  const onwardTo = firstUnsolvedTsunagiLevel(size, new Set([...solvedSet, level]));
  const onward = {
    next: onwardTo === null ? null : { href: tsunagiLevelPath(size, onwardTo), label: nextLevelLabel(level, onwardTo) },
    all: { href: tsunagiLevelsPath(size), label: "All levels" },
  };
  // A level already solved opens on its finished board; only Restart starts it again (`TsunagiSolvedView`).
  const answerLines = useMemo(() => linesOfAnswer(layout, puzzle.solution), [layout, puzzle.solution]);
  const [reviewing, setReviewing] = useState(race === null && resumed === null && solvedSet.has(level) && answerLines !== null);
  // An attempt is a board started from empty: counted at its first line, once, and again after Restart. A kept run was counted when it began.
  const { attempts, countOne } = useTsunagiAttempts(size, level, hasAccount, attemptsKnown[level] ?? 0);
  const counted = useRef(resumed !== null);
  // Check: the pairs not joined yet, their marbles flashing a moment; the words stay until the board changes.
  const [flagged, setFlagged] = useState<ReadonlySet<number> | null>(null);
  const [checkSays, setCheckSays] = useState<string | null>(null);
  // Explosions: the strokes so far, the cells the last one burst, and what it did.
  const strokes = useRef(0);
  const [strokeCount, setStrokeCount] = useState(0);
  const [blasted, setBlasted] = useState<ReadonlySet<number> | null>(null);
  const [blastSays, setBlastSays] = useState<string | null>(null);
  useEffect(() => {
    if (blasted === null) return;
    const off = window.setTimeout(() => setBlasted(null), BLAST_MS);
    return () => window.clearTimeout(off);
  }, [blasted]);
  useEffect(() => {
    if (flagged === null) return;
    const off = window.setTimeout(() => setFlagged(null), CHECK_FLASH_MS);
    return () => window.clearTimeout(off);
  }, [flagged]);

  const { startedAt, elapsedMs, done, begin, finish, pausing } = useSolve(puzzle, hasAccount, race, null, {
    progress: encodeLines(layout, lines),
    resumed,
  });
  const idle = done !== null || pausing.paused || shut || reviewing;

  const show = useCallback((next: Lines) => {
    now.current = next;
    setLines(next);
    setFlagged(null);
    setCheckSays(null);
  }, []);

  const press = useCallback(
    (cell: number) => {
      if (idle) return;
      const pressed = pressAt(layout, now.current, cell);
      if (pressed.drawing === null) return;
      begin();
      if (!counted.current) {
        counted.current = true;
        countOne();
      }
      before.current = now.current;
      drawing.current = pressed.drawing;
      show(pressed.lines);
      setBlastSays(null);
    },
    [idle, layout, begin, show, countOne],
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
    const next = letGo(now.current, layout);
    show(next);
    const was = before.current;
    before.current = null;
    if (was === null || JSON.stringify(was) === JSON.stringify(next)) return;
    const stroke = strokes.current + 1;
    strokes.current = stroke;
    setStrokeCount(stroke);
    if (allJoined(layout, next)) {
      const answer = answerOf(layout, next);
      // Every level has one answer, so a board joined and full is it; compared all the same, never assumed.
      if (answer === puzzle.solution) {
        const at = Date.now();
        void finish(answer, at).then(() => undefined);
        return;
      }
    }
    // A stroke that solves the level sets nothing off; any other may.
    const blown = explosionAfter(layout, puzzle.givens, next, stroke);
    if (blown === null) {
      setUndo((stack) => [...stack.slice(-199), was]);
      return;
    }
    show(blown.lines);
    setUndo([]);
    setBlasted(new Set(blown.cells));
    setBlastSays(blown.hit.length > 1 ? "Blast! A line was wiped, and the one beside it cut back to half." : "Boom! A line was cut back to half.");
  }, [layout, show, finish, puzzle.solution, puzzle.givens]);

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
    counted.current = false;
    strokes.current = 0;
    setStrokeCount(0);
    setBlastSays(null);
  };
  const playAgain = () => {
    setReviewing(false);
    setUndo([]);
    show(noLines(layout));
    counted.current = false;
    strokes.current = 0;
    setStrokeCount(0);
  };
  const check = () => {
    if (idle) return;
    const missing = unjoinedPairs(layout, now.current);
    setFlagged(new Set(missing));
    const empty = filled(layout, now.current);
    setCheckSays(
      missing.length > 0
        ? `${missing.length} ${missing.length === 1 ? "pair is" : "pairs are"} not joined yet: ${missing.length === 1 ? "its marbles are" : "their marbles are"} flashing.`
        : `Every pair is joined; ${empty.of - empty.done} ${empty.of - empty.done === 1 ? "cell is" : "cells are"} still empty.`,
    );
  };

  const pairs = layout.ends.length;
  const pairsJoined = layout.ends.filter((_, pair) => joined(layout, lines, pair)).length;
  const cover = filled(layout, lines);
  const boomIn = strokesToExplosion(layout, strokeCount);
  const asked = (
    <>
      {size}×{size} · Level {level} <span className="text-xs">of {count}</span>{" "}
      <span className="text-xs text-muted" data-testid="tsunagi-attempts" data-count={attempts}>
        · {attempts} {attempts === 1 ? "attempt" : "attempts"}
      </span>
    </>
  );

  if (shut) {
    const block = blockOf(level);
    const first = firstUnsolvedTsunagiLevel(size, solvedSet) ?? 1;
    return (
      <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind="tsunagi" data-seed={level} {...readyMark(hydrated)}>
        <p className="text-sm" data-testid="tsunagi-shut">
          Level {level} at {size}×{size} opens when every level in block {block - 1} (levels {(block - 2) * TSUNAGI_BLOCK + 1}–{(block - 1) * TSUNAGI_BLOCK}) is solved.
        </p>
        <p className="flex flex-wrap gap-2">
          <Link href={tsunagiLevelPath(size, first)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="tsunagi-shut-first">
            Play level {first}, the first one you have not finished
          </Link>
          <Link href={tsunagiLevelsPath(size)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
            All levels
          </Link>
        </p>
      </section>
    );
  }

  const chips = <TsunagiLevelChips size={size} level={level} challenges={challengesOf(puzzle.givens)} />;
  const pickers = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-3">
        <TsunagiMarksPicker marks={marks} onChoose={chooseMarks} />
        <TsunagiFillPicker fill={fill} onChoose={chooseFill} />
      </div>
      <FeltPatches felt={felt} wood={appearance.boardTheme} onChoose={chooseFelt} />
    </div>
  );

  if (reviewing && answerLines !== null) {
    return (
      <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind="tsunagi" data-seed={level} data-reviewing="true" {...readyMark(hydrated)}>
        <p className="text-sm text-muted" data-testid="puzzle-asked">
          {asked}
        </p>
        <TsunagiSolvedView
          layout={layout}
          lines={answerLines}
          marks={marks}
          fill={fill}
          theme={theme}
          best={solvedHere[level] === undefined ? null : { elapsedMs: solvedHere[level]!, solveId: bestSolves[level] ?? null }}
          attempts={attempts}
          next={onward.next}
          all={onward.all}
          onRestart={playAgain}
          under={chips}
        />
        {pickers}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind="tsunagi" data-seed={level} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} asked={asked} />
      <SolvePaused pausing={pausing}>
        <TsunagiViewport size={size}>
          <TsunagiGrid layout={layout} lines={lines} marks={marks} fill={fill} theme={theme} done={done !== null} flagged={flagged} blasted={blasted} onPress={press} onDrag={drag} onLift={lift} />
        </TsunagiViewport>
      </SolvePaused>
      {chips}
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
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={check} disabled={pausing.paused} data-testid="tsunagi-check">
              Check
            </button>
            <span className="text-sm text-muted tabular-nums" data-testid="tsunagi-progress" data-joined={pairsJoined} data-filled={cover.done} aria-live="polite">
              {pairsJoined === pairs && cover.done < cover.of
                ? `Every pair joined; ${cover.of - cover.done} ${cover.of - cover.done === 1 ? "cell is" : "cells are"} still empty.`
                : `${pairsJoined} of ${pairs} joined · ${Math.round((100 * cover.done) / cover.of)}% of the board`}
            </span>
          </div>
          {boomIn === null ? null : (
            <p className={`text-sm ${boomIn === 1 ? "font-semibold text-shu" : "text-muted"}`} data-testid="tsunagi-boom-countdown" data-left={boomIn} data-strokes={strokeCount} aria-live="polite">
              {blastSays === null ? "" : `${blastSays} `}
              {boomIn === 1 ? "The next stroke sets off an explosion." : `An explosion in ${boomIn} strokes.`}
            </p>
          )}
          {checkSays === null ? null : (
            <p className="text-sm" data-testid="tsunagi-check-says" data-missing={flagged?.size ?? undefined} aria-live="polite">
              {checkSays}
            </p>
          )}
          <p className="text-sm text-muted">Press a marble and drag to its partner. Drag back to shorten a line; tap a marble to clear it.</p>
        </div>
      ) : (
        <SolveDone
          puzzle={puzzle}
          done={done}
          hasAccount={hasAccount}
          race={race}
          onward={onward}
        />
      )}
      {pickers}
    </section>
  );
}
