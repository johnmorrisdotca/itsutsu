"use client";

import Link from "@/components/ui/Link";
import { useEffect, useMemo, useRef, useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PLAY_SURFACE, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import { nextLevelLabel } from "@/lib/puzzles/fixedLevel";
import { meikyuuLevelCount } from "@/lib/puzzles/meikyuu/levelCounts";
import { meikyuuLevelsAt, meikyuuLevelsLoaded } from "@/lib/puzzles/meikyuu/levels";
import { isMeikyuuTall, meikyuuSizeInAddress, meikyuuSizeLabel } from "@/lib/puzzles/meikyuu/sizes";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MEIKYUU_COPY } from "./meikyuu.constants";
import { MeikyuuBoard, type MeikyuuHandle, type MeikyuuReading } from "./MeikyuuBoard";
import { MeikyuuColours } from "./MeikyuuColours";
import { MeikyuuLevelChips } from "./MeikyuuLevelChips";
import { meikyuuLevelPath } from "./MeikyuuLevelPicker";
import { keepSolveHere, keptSolves } from "./meikyuuKept";
import { MeikyuuStill } from "./MeikyuuStill";
import { MeikyuuWayUp } from "./MeikyuuStand";
import { SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { SolveTime } from "./SolveTime";

/** The lowest level of a size not yet solved, or null when every one is. */
function firstUnsolved(count: number, done: ReadonlySet<number>): number | null {
  for (let level = 1; level <= count; level += 1) if (!done.has(level)) return level;
  return null;
}

/** The board of levels at a size: the levels' set-up, opened on that size. */
function levelsPath(size: number): string {
  return `${setUpPath("meikyuu")}?size=${meikyuuSizeInAddress(size)}`;
}

/**
 * Solving Meikyuu: draw a line from the start to the goal, with a finger or the
 * mouse. The board is the package's (`MeikyuuBoard`): press the start and drag, and
 * the line follows the corridors, cannot pass a wall and shortens when drawn back;
 * zoom and pan are its own. The puzzle is done the moment the line reaches the goal
 * with every key picked up, and what is handed in, and kept half way, is the line as
 * the site keeps one (`meikyuu/steps.ts`), which the server walks on the maze before it
 * pays (`checkMeikyuu`).
 *
 * The clock starts with the first step the line takes. The buttons under the board
 * are the site's own and press the package's (`MeikyuuHandle`): Undo takes back the
 * last stroke, Restart clears the line, and the zoom pair and Fit are for a maze too
 * big to draw through at its first size.
 *
 * A LEVEL is the same maze for everybody, so it is played the same way with what a
 * level adds to this screen, as Tsunagi's and Suido's levels add: "Level 12 of 217" in
 * place of a seed's number, the next level and the board of levels at the end in place
 * of Another, and a level already solved opening on its finished maze. A level has no
 * hint and no clock.
 */
export function MeikyuuSolve({
  puzzle,
  hasAccount,
  race = null,
  resumed = null,
  known = {},
  bestSolves = {},
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  resumed?: ResumedRun | null;
  /** The levels at this size the member has solved on the account, with their best times. */
  known?: Record<number, number>;
  /** The member's best solve of each level at this size, to open from its time. */
  bestSolves?: Record<number, string>;
}) {
  const hydrated = useHydrated();
  const { kind, size, seed: level } = puzzle;
  const count = meikyuuLevelCount(size);
  const tall = isMeikyuuTall(size);
  const row = meikyuuLevelsLoaded(size) ? meikyuuLevelsAt(size)[level - 1] : undefined;
  const handle = useRef<MeikyuuHandle>(null);
  const [reading, setReading] = useState<MeikyuuReading | null>(null);
  /* The line as it stands, for the run to keep: what a resumed run was left with until the board says otherwise. */
  const [way, setWay] = useState(resumed?.progress ?? "");

  /*
   * THE LEVELS SOLVED, as this page knows them: the account's (`known`) and this browser's (`meikyuuKept`), read now:
   * this page is drawn in the browser only (`PuzzlePlayClient`), and its levels are here (`PuzzlePlay` waits for
   * them), which is what says which mazes the browser's solves were.
   */
  const [solvedHere] = useState<Record<number, number>>(() => (meikyuuLevelsLoaded(size) ? { ...keptSolves(size), ...known } : { ...known }));
  const solvedSet = useMemo(() => new Set(Object.keys(solvedHere).map(Number)), [solvedHere]);
  // A level already solved opens on its finished maze; only "Play it again" starts it over.
  const [reviewing, setReviewing] = useState(race === null && resumed === null && solvedSet.has(level));

  const { startedAt, elapsedMs, done, begin, finish, pausing } = useSolve(puzzle, hasAccount, race, null, { progress: way, resumed });
  const live = done === null && !pausing.paused && !reviewing;

  /* The board says what the line is after every change; the clock starts at its first step and the line is handed in the moment it is solved. */
  const latest = useRef({ begin, finish, startedAt, done });
  useEffect(() => {
    latest.current = { begin, finish, startedAt, done };
  });
  const handedIn = useRef(false);
  const told = (next: MeikyuuReading) => {
    setReading(next);
    if (next.way !== null) setWay(next.way);
    const now = latest.current;
    if (now.done !== null || handedIn.current) return;
    if (now.startedAt === null && next.cells >= 2) now.begin();
    if (next.solved && next.way !== null) {
      handedIn.current = true;
      void now.finish(next.way, now.begin());
    }
  };

  // Kept in this browser as soon as a level is solved, so the board of levels shows it with or without an account.
  useEffect(() => {
    if (done !== null && race === null && !done.outOfTime) keepSolveHere(puzzle.givens, done.elapsedMs);
  }, [done, race, puzzle.givens]);

  // Where "next" leads once this one is solved: the lowest level still unsolved, this one counted in.
  const onwardTo = firstUnsolved(count, new Set([...solvedSet, level]));
  const onward = {
    next: onwardTo === null ? null : { href: meikyuuLevelPath(size, onwardTo), label: nextLevelLabel(level, onwardTo) },
    all: { href: levelsPath(size), label: "All levels" },
  };
  const asked = (
    <>
      {meikyuuSizeLabel(size)} · Level {level} <span className="text-xs">of {count}</span>
    </>
  );
  const chips = row === undefined ? null : <MeikyuuLevelChips code={row.code} cells={row.cells} score={row.score} level={level} />;

  if (reviewing && onward !== undefined) {
    // The level as it was solved: the way through it, drawn as a won line, and the ways on.
    return (
      <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={level} data-level={level} data-maze={puzzle.givens} data-reviewing="true" data-solved="true" {...readyMark(hydrated)}>
        <p className="text-sm text-muted" data-testid="puzzle-asked">
          {asked}
        </p>
        <MeikyuuStill code={puzzle.givens} solved tall={tall} />
        {chips}
        <MeikyuuColours className="self-start" />
        {tall ? <MeikyuuWayUp className="self-start" /> : null}
        <div className="flex flex-col gap-2" data-testid="meikyuu-solved-view">
          <p className="text-sm">
            Solved
            {solvedHere[level] === undefined ? null : (
              <>
                , best <SolveTime kind="meikyuu" solveId={bestSolves[level] ?? null} elapsedMs={solvedHere[level]!} mine testId="meikyuu-best-time" />
              </>
            )}
            .
          </p>
          <div className="flex flex-wrap gap-2">
            {onward.next === null ? null : (
              <Link href={onward.next.href} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="puzzle-next-level">
                {onward.next.label}
              </Link>
            )}
            <Link href={onward.all.href} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-all-levels">
              {onward.all.label}
            </Link>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => setReviewing(false)} data-testid="meikyuu-play-again">
              Play it again
            </button>
          </div>
        </div>
      </section>
    );
  }

  const cells = reading?.cells ?? 0;
  const press = "px-3 py-1 text-sm";
  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={level} data-level={level} data-maze={puzzle.givens} data-cells={cells} data-solved={reading?.solved === true ? "true" : "false"} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} asked={asked} />
      <SolvePaused pausing={pausing}>
        <MeikyuuBoard code={puzzle.givens} tall={tall} way={resumed?.progress ?? ""} locked={!live} onChange={told} handle={handle} />
      </SolvePaused>
      {chips}
      {done === null ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2" data-testid="meikyuu-controls">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="The line">
              <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${press}`} onClick={() => handle.current?.undo()} disabled={!live || reading?.undoable !== true} data-testid="meikyuu-undo">
                Undo
              </button>
              <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${press}`} onClick={() => handle.current?.restart()} disabled={!live || reading?.clearable !== true} data-testid="meikyuu-restart">
                Restart
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Zoom" data-testid="meikyuu-zoom">
              <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${press}`} onClick={() => handle.current?.zoomOut()} disabled={!live} aria-label="Zoom out" data-testid="meikyuu-zoom-out">
                −
              </button>
              <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${press}`} onClick={() => handle.current?.zoomIn()} disabled={!live} aria-label="Zoom in" data-testid="meikyuu-zoom-in">
                +
              </button>
              <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${press}`} onClick={() => handle.current?.fit()} disabled={!live} data-testid="meikyuu-fit">
                Fit
              </button>
            </div>
            {/* In the row of presses under the board, so it takes no row of its own and Just the board still fits a desk. */}
            <MeikyuuColours />
            {/* A tall maze can lie on its side: which way up is the reader's to choose, beside the colours. */}
            {tall ? <MeikyuuWayUp /> : null}
          </div>
          <span className="text-sm text-muted" data-testid="meikyuu-said" data-cells={cells} data-keys={reading?.keys ?? 0} aria-live="polite">
            {cells === 0 ? MEIKYUU_COPY.howTo : MEIKYUU_COPY.status(cells, reading?.keys ?? 0, reading?.keysOf ?? 0)}
          </span>
        </div>
      ) : (
        <>
          <MeikyuuColours className="self-start" />
          {tall ? <MeikyuuWayUp className="self-start" /> : null}
          <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} onward={race === null ? onward : undefined} />
        </>
      )}
    </section>
  );
}
