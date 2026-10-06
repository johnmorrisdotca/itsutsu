"use client";

import Link from "@/components/ui/Link";
import { useEffect, useMemo, useRef, useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PLAY_SURFACE, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import { nextLevelLabel } from "@/lib/puzzles/fixedLevel";
import { completesSize } from "@/lib/puzzles/meikyuu/completion";
import { meikyuuLevelCount } from "@/lib/puzzles/meikyuu/levelCounts";
import { meikyuuLevelsAt, meikyuuLevelsLoaded } from "@/lib/puzzles/meikyuu/levels";
import { isMeikyuuSolid, isMeikyuuTall, meikyuuSizeInAddress, meikyuuSizeLabel } from "@/lib/puzzles/meikyuu/sizes";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MEIKYUU_COPY, MOVE_COPY, PROGRESS_COPY, STONE_COPY, TURN_COPY } from "./meikyuu.constants";
import { MeikyuuBoard, type MeikyuuHandle, type MeikyuuReading } from "./MeikyuuBoard";
import { MeikyuuColours } from "./MeikyuuColours";
import { MeikyuuLevelChips } from "./MeikyuuLevelChips";
import { meikyuuLevelPath } from "./MeikyuuLevelPicker";
import { keepSolveHere, keptSolves } from "./meikyuuKept";
import { useStoneLimit } from "./meikyuuStonesStore";
import { MeikyuuStill } from "./MeikyuuStill";
import { SolidBoard } from "./SolidBoard";
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
  /* A maze over a solid (`SolidBoard`): the solid is turned as well as drawn on, so the presses under it are Turn's and not the zoom pad's Move. */
  const solid = isMeikyuuSolid(size);
  const row = meikyuuLevelsLoaded(size) ? meikyuuLevelsAt(size)[level - 1] : undefined;
  const handle = useRef<MeikyuuHandle>(null);
  const [reading, setReading] = useState<MeikyuuReading | null>(null);
  /* Move: while it is on a finger drags the view and draws nothing (the board's `pan`). */
  const [moving, setMoving] = useState(false);
  /* The run as it stands, for it to keep: the line and the stones laid beside it (`MeikyuuReading.run`). What a resumed run was left with until the board says otherwise. */
  const [way, setWay] = useState(resumed?.progress ?? "");
  /* How many stones may lie at once: the reader's choice, kept on this device. */
  const { stones: stoneLimit } = useStoneLimit();

  /*
   * THE LEVELS SOLVED, as this page knows them: the account's (`known`) and this browser's (`meikyuuKept`), read now:
   * this page is drawn in the browser only (`PuzzlePlayClient`), and its levels are here (`PuzzlePlay` waits for
   * them), which is what says which mazes the browser's solves were.
   */
  const [solvedHere] = useState<Record<number, number>>(() => (meikyuuLevelsLoaded(size) ? { ...keptSolves(size), ...known } : { ...known }));
  const solvedSet = useMemo(() => new Set(Object.keys(solvedHere).map(Number)), [solvedHere]);
  // Solving this level would finish its size: every other level is already solved, here or on the account, and this one is not (`completion.ts`).
  const lastOfSize = useMemo(() => completesSize(size, level, { [size]: [...solvedSet] }), [size, level, solvedSet]);
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
    if (next.run !== null) setWay(next.run);
    const now = latest.current;
    if (now.done !== null || handedIn.current) return;
    if (now.startedAt === null && next.cells >= 2) now.begin();
    if (next.solved && next.way !== null) {
      handedIn.current = true;
      void now.finish(next.way, now.begin());
    }
  };

  // The last stroke of a big maze is drawn zoomed in on the goal. Once it is solved the whole maze comes back into view with its line, so a finished maze is read as a map and not left in a corner of it.
  useEffect(() => {
    if (done !== null) handle.current?.fit();
  }, [done]);

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
  const stoning = reading?.stoneMode === true;
  /* "Stones left: 3", or, with no limit, how many are laid: the one line a Stone press keeps beside it, in the room it always has. */
  const stonesLine = reading === null ? STONE_COPY.left(0) : reading.stonesLeft === null ? STONE_COPY.laid(reading.stones) : STONE_COPY.left(reading.stonesLeft);
  /* The view is the reader's for as long as the board is on show, a finished maze included (a map to be read, not a picture): only a paused board, which is hidden, turns the pad off. */
  const viewable = done !== null || live;
  const viewPad = (
    <>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Zoom" data-testid="meikyuu-zoom">
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${press}`} onClick={() => handle.current?.zoomOut()} disabled={!viewable} aria-label="Zoom out" data-testid="meikyuu-zoom-out">
          −
        </button>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${press}`} onClick={() => handle.current?.zoomIn()} disabled={!viewable} aria-label="Zoom in" data-testid="meikyuu-zoom-in">
          +
        </button>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${press}`} onClick={() => handle.current?.fit()} disabled={!viewable} data-testid="meikyuu-fit">
          Fit
        </button>
        <button
          type="button"
          className={`${BUTTON_BASE} ${moving ? BUTTON_STRONG : BUTTON_QUIET} ${TAP_HEIGHT} ${press}`}
          onClick={() => setMoving(handle.current?.pan(!moving) ?? false)}
          disabled={!viewable}
          aria-pressed={moving}
          title={solid ? TURN_COPY.onlySays : MOVE_COPY.says}
          data-testid={solid ? "meikyuu-turn-only" : "meikyuu-move"}
          data-moving={moving ? "true" : "false"}
        >
          {solid ? TURN_COPY.only : MOVE_COPY.press}
        </button>
      </div>
      {/* A solid is turned as well as zoomed: the four turns and Face me, in a row of their own that a flat maze does not have. */}
      {solid ? (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={TURN_COPY.legend} data-testid="meikyuu-turn">
          {([["left", "◀", TURN_COPY.left], ["up", "▲", TURN_COPY.up], ["down", "▼", TURN_COPY.down], ["right", "▶", TURN_COPY.right]] as const).map(([by, mark, words]) => (
            <button key={by} type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${press}`} onClick={() => handle.current?.turn?.(by)} disabled={!viewable} aria-label={words} title={words} data-testid={`meikyuu-turn-${by}`}>
              {mark}
            </button>
          ))}
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${press}`} onClick={() => handle.current?.faceMe?.()} disabled={!viewable} title={TURN_COPY.faceMeSays} data-testid="meikyuu-face-me">
            {TURN_COPY.faceMe}
          </button>
        </div>
      ) : null}
    </>
  );
  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={level} data-level={level} data-maze={puzzle.givens} data-cells={cells} data-solved={reading?.solved === true ? "true" : "false"} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} asked={asked} />
      <SolvePaused pausing={pausing}>
        {solid ? (
          <SolidBoard code={puzzle.givens} way={resumed?.progress ?? ""} locked={!live} stones={stoneLimit} onChange={told} handle={handle} />
        ) : (
          <MeikyuuBoard code={puzzle.givens} tall={tall} way={resumed?.progress ?? ""} locked={!live} stones={stoneLimit} onChange={told} handle={handle} />
        )}
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
              {/* A marble laid beside the line, which the line cannot enter (`meikyuu/stones.ts`): a toggle, like Move, so a tap lays one and nothing draws until it is pressed again. */}
              <button
                type="button"
                className={`${BUTTON_BASE} ${stoning ? BUTTON_STRONG : BUTTON_QUIET} ${TAP_HEIGHT} ${press}`}
                onClick={() => handle.current?.stoneMode(!stoning)}
                disabled={!live}
                aria-pressed={stoning}
                title={`${STONE_COPY.says} ${STONE_COPY.other}`}
                data-testid="meikyuu-stone"
                data-stone-mode={stoning ? "true" : "false"}
              >
                {STONE_COPY.press}
              </button>
              <span className="min-w-[8.5rem] text-sm text-muted tabular-nums" data-testid="meikyuu-stones-left" data-stones={reading?.stones ?? 0} data-left={reading?.stonesLeft ?? "none"} aria-live="polite">
                {stonesLine}
              </span>
            </div>
            {viewPad}
            {/* In the row of presses under the board, so it takes no row of its own and Just the board still fits a desk. */}
            <MeikyuuColours />
            {/* A tall maze can lie on its side: which way up is the reader's to choose, beside the colours. */}
            {tall ? <MeikyuuWayUp className="basis-full" /> : null}
          </div>
          <span className="min-h-10 text-sm text-muted" data-testid="meikyuu-said" data-cells={cells} data-keys={reading?.keys ?? 0} aria-live="polite">
            {stoning ? STONE_COPY.how : cells === 0 ? (solid ? TURN_COPY.howTo : MEIKYUU_COPY.howTo) : MEIKYUU_COPY.status(cells, reading?.keys ?? 0, reading?.keysOf ?? 0)}
          </span>
        </div>
      ) : (
        <>
          {/* Zoom, Fit and Move (and a solid's turns) stay: the finished maze is a map, and a phone has no other way to move it. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2" data-testid="meikyuu-controls" data-finished="true">
            {viewPad}
          </div>
          <MeikyuuColours className="self-start" />
          {tall ? <MeikyuuWayUp className="self-start" /> : null}
          {/* A size finished is cheered in a line, never a window (John, 2026-10-02: "encouraging people to finish them all"). */}
          {lastOfSize && race === null && !done.outOfTime ? (
            <p className="text-sm font-semibold text-moss" data-testid="meikyuu-size-done" role="status">
              ★ {PROGRESS_COPY.last(meikyuuSizeLabel(size).toLowerCase(), count)}
            </p>
          ) : null}
          <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} onward={race === null ? onward : undefined} />
        </>
      )}
    </section>
  );
}
