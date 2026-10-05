"use client";

import Link from "@/components/ui/Link";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

import { decodeLayout, flowOfGame, gameCode, hintFor, isGameSolved, newGame, turnAt, turnedToFaceAt, type Game } from "@johnmorrisdotca/suido";
import { SUIDO_FIT, type SuidoView, type SuidoViewer } from "@johnmorrisdotca/suido/draw";
import { declaredTwists } from "@johnmorrisdotca/suido/levels-info";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PLAY_SURFACE } from "@/components/ui/ui.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import { nextLevelLabel } from "@/lib/puzzles/fixedLevel";
import { resumedGame, suidoReading } from "@/lib/puzzles/suido/play";
import {
  blockOf,
  blockRange,
  firstUnsolvedSuidoLevelAt,
  openSuidoLevelsAt,
  suidoLevelCount,
  suidoLevelsAt,
  suidoLevelsLoaded,
} from "@/lib/puzzles/suido/levels";
import { suidoLevelOfSeed, suidoSquaresOfSeed } from "@/lib/puzzles/suido/seed";
import { isSuidoHugeSize, suidoShapeOf, suidoSizeInAddress, suidoSizeWord } from "@/lib/puzzles/suido/sizes";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { SUIDO_COPY, SUIDO_WAYS } from "./suido.constants";
import { SuidoBoard } from "./SuidoBoard";
import { SuidoLevelChips } from "./SuidoLevelChips";
import { SuidoSquaresChips } from "./SuidoSquaresChips";
import { SuidoZoomBar } from "./SuidoZoomBar";
import { suidoLevelPath } from "./SuidoLevelPicker";
import { keepSolveHere, keptSolves } from "./suidoKept";
import { SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { SolveHint } from "./SolveHint";
import { SolveTime } from "./SolveTime";
import { TsunagiViewport } from "./TsunagiViewport";

/**
 * A LONG BOARD'S COLUMN ON A DESK. A 5×7, 6×10 or 8×14 is taller than it is wide, and the page's column is as wide as
 * every board's, so on a desk the 8×14 stood a thousand pixels tall with its foot below the fold. From a tablet's width
 * up (`md:`) its width is held to what the window's height can show of it — the height less the page's furniture over
 * and under, times its width over its height — so the whole board is in view; on a phone it is the screen's width, as
 * every board is, and the page scrolls. A square or a wider board has no such limit. In Just the board a tall board is
 * as wide as its height allows and the modal as wide as it and the column beside it, so the play stands in the middle
 * of the modal and nothing in it is empty (`globals.css`, `data-suido-tall`).
 */
function TallFit({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  if (height <= width) return <>{children}</>;
  return (
    <div className="mx-auto w-full md:max-w-(--suido-tall-fit)" style={{ "--suido-tall-fit": `calc((100dvh - 18rem) * ${width} / ${height})`, "--suido-ratio": width / height } as CSSProperties} data-testid="suido-tall-fit" data-suido-tall>
      {children}
    </div>
  );
}

/**
 * THE BOARD, LOOKED AT AS ITS SIZE ASKS. A huge board (20×20 and up) is zoomed and moved about by the package's own view (`SuidoBoard`'s
 * `zoomable`: a pinch, a drag once zoomed in, the wheel with control held) with its three buttons under it; a board from 10 wide to 14 is
 * looked at through Tsunagi's box (`TsunagiViewport`), as it always was; a smaller one is the board alone.
 */
function SuidoLooked({ size, board }: { size: number; board: (more: { zoomable: boolean; onViewer?: (viewer: SuidoViewer | null) => void; onView?: (view: SuidoView) => void }) => ReactNode }) {
  const huge = isSuidoHugeSize(size);
  const [viewer, setViewer] = useState<SuidoViewer | null>(null);
  const [view, setView] = useState<SuidoView>(SUIDO_FIT);
  if (!huge) {
    const shape = suidoShapeOf(size) ?? { width: size, height: size };
    return (
      <TsunagiViewport size={shape.width} name="suido">
        {board({ zoomable: false })}
      </TsunagiViewport>
    );
  }
  return (
    <div className="flex flex-col gap-2" data-testid="suido-huge">
      {board({ zoomable: true, onViewer: setViewer, onView: setView })}
      <SuidoZoomBar viewer={viewer} view={view} />
    </div>
  );
}

/** The board of levels at a size: the levels' set-up, opened on that size. */
function suidoLevelsPath(size: number): string {
  return `${setUpPath("suido")}?size=${suidoSizeInAddress(size)}`;
}

/**
 * Solving Suido: tap a piece to turn it a quarter, and watch where the water
 * goes. The puzzle is done the moment the board passes the check the server
 * runs (`checkSuidoAnswer`), which the board is held to as every piece is
 * turned (`isGameSolved` is that same test); what is handed in, and what is
 * kept half way, is the board as it stands in the package's own code
 * (`gameCode`).
 *
 * The clock starts with the first turn. A big board is looked at through the
 * zoom Tsunagi's big boards have (`TsunagiViewport`), a turn being a click that
 * the box lets through.
 *
 * A LEVEL (`suidoLevelOfSeed`) is the same board for everybody, and is played the
 * same way with what its twists add: a locked piece will not turn (`turnAt`), the
 * water crosses a joined edge or stops at a wall as the package draws it. What a
 * level adds to this screen is Tsunagi's too: "Level 12 of 256" in place of a
 * board's seed, its twists under the board, a level past the open blocks shut
 * (and saying which block opens it), a level already solved opening on its
 * finished board, and at the end the next level and the board of levels in place
 * of Another. A level has no hint and no clock.
 */
export function SuidoSolve({
  puzzle,
  hasAccount,
  race = null,
  resumed = null,
  hints = false,
  known = {},
  bestSolves = {},
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  resumed?: ResumedRun | null;
  hints?: boolean;
  /** The levels at this size the member has solved on the account, with their best times: a level's play only. */
  known?: Record<number, number>;
  /** The member's best solve of each level at this size, to open from its time. */
  bestSolves?: Record<number, string>;
}) {
  const hydrated = useHydrated();
  const { kind, size, seed } = puzzle;
  const level = suidoLevelOfSeed(seed);
  const shape = suidoShapeOf(size) ?? { width: size, height: size };
  const dealt = useMemo(() => newGame(puzzle.givens)!, [puzzle.givens]);
  const answer = useMemo(() => decodeLayout(puzzle.solution)!.cells, [puzzle.solution]);
  // A run picked up again starts from what it was left with, where that is this board's.
  const [game, setGame] = useState<Game>(() => (resumed === null ? null : resumedGame(dealt, resumed.progress)) ?? dealt);
  const [anticlockwise, setAnticlockwise] = useState(false);
  const [hinted, setHinted] = useState<number | null>(null);

  /*
   * THE LEVELS SOLVED, as this page knows them: the account's (`known`) and this browser's (`suidoKept`), read now:
   * this page is drawn in the browser only (`PuzzlePlayClient`), and its size's levels are here (`PuzzlePlay` waits
   * for them), which is what says which boards the browser's solves were.
   */
  const [solvedHere] = useState<Record<number, number>>(() => (level === null || !suidoLevelsLoaded(size) ? {} : { ...keptSolves(size), ...known }));
  const solvedSet = useMemo(() => new Set(Object.keys(solvedHere).map(Number)), [solvedHere]);
  const open = level === null ? 0 : openSuidoLevelsAt(size, solvedSet);
  // Past the open blocks is shut, except a level already solved (it opens on its finished board) and a run kept of it, which was open when it was begun.
  const shut = level !== null && race === null && resumed === null && level > open && !solvedSet.has(level);
  // A level already solved opens on its finished board; only "Play it again" starts it over.
  const [reviewing, setReviewing] = useState(level !== null && race === null && resumed === null && solvedSet.has(level));

  const { startedAt, elapsedMs, done, begin, finish, pausing, hinting } = useSolve(puzzle, hasAccount, race, null, { progress: gameCode(game), resumed }, hints);
  const live = done === null && !pausing.paused && !reviewing && !shut;

  /* Every change goes through here: a tap, a key, or a Hint. Solved, the board is handed in once. */
  const change = (next: Game, cell: number | null) => {
    const at = begin();
    setGame(next);
    setHinted(cell);
    if (isGameSolved(next)) void finish(gameCode(next), at);
  };
  const turn = (cell: number, by: 1 | -1) => {
    if (!live) return;
    const next = turnAt(game, cell, by);
    // Bare ground, a cross and a locked piece look the same turned any way, or will not turn: nothing happened, so nothing starts.
    if (next !== game) change(next, null);
  };
  /* Hint: the piece nearest the pump that does not face as the answer has it, turned to face so, and lit. */
  const hint = () => {
    const cell = hintFor(game, answer);
    if (cell === null || !live || !hinting.spend()) return;
    change(turnedToFaceAt(game, cell, answer), cell);
  };
  // Kept in this browser as soon as a level is solved, so the board of levels opens the next block with or without an account.
  useEffect(() => {
    if (done !== null && level !== null && race === null && !done.outOfTime) keepSolveHere(size, puzzle.givens, done.elapsedMs);
  }, [done, level, race, size, puzzle.givens]);

  const reading = useMemo(() => suidoReading(game, flowOfGame(game)), [game]);
  const said = SUIDO_COPY.status(reading);

  // Where "next" leads once this one is solved: the lowest level still unsolved, this one counted in.
  const onwardTo = level === null ? null : firstUnsolvedSuidoLevelAt(size, new Set([...solvedSet, level]));
  const onward =
    level === null
      ? undefined
      : {
          next: onwardTo === null ? null : { href: suidoLevelPath(size, onwardTo), label: nextLevelLabel(level, onwardTo) },
          all: { href: suidoLevelsPath(size), label: "All levels" },
        };
  const count = suidoLevelCount(size);
  const asked =
    level === null ? undefined : (
      <>
        {suidoSizeWord(size)} · Level {level} <span className="text-xs">of {count}</span>
      </>
    );
  const twists = level === null || !suidoLevelsLoaded(size) ? [] : declaredTwists(suidoLevelsAt(size)[level - 1]!);
  // A board made with squares says so in a row of its own, as a level's row says its twists.
  const squares = suidoSquaresOfSeed(seed);
  const chips = level === null ? (squares === "none" ? null : <SuidoSquaresChips twists={squares === "big" ? ["big-pieces"] : ["block-turns"]} />) : <SuidoLevelChips size={size} level={level} twists={twists} />;

  if (shut && level !== null) {
    const block = blockOf(level);
    const first = firstUnsolvedSuidoLevelAt(size, solvedSet) ?? 1;
    const { first: from, last: to } = blockRange(block - 1, count);
    return (
      <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={seed} data-level={level} {...readyMark(hydrated)}>
        <p className="text-sm" data-testid="suido-shut">
          Level {level} at {suidoSizeWord(size)} opens when every level in block {block - 1} (levels {from}–{to}) is solved.
        </p>
        <p className="flex flex-wrap gap-2">
          <Link href={suidoLevelPath(size, first)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="suido-shut-first">
            Play level {first}, the first one you have not finished
          </Link>
          <Link href={suidoLevelsPath(size)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
            All levels
          </Link>
        </p>
      </section>
    );
  }

  if (reviewing && level !== null && onward !== undefined) {
    // The level as it was solved: its answer, the water running through all of it, and the ways on.
    const finished: Game = { start: dealt.start, masks: answer, quarters: answer.map(() => 0), turns: 0 };
    return (
      <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={seed} data-level={level} data-reviewing="true" data-solved="true" {...readyMark(hydrated)}>
        <p className="text-sm text-muted" data-testid="puzzle-asked">
          {asked}
        </p>
        <TallFit width={shape.width} height={shape.height}>
          <SuidoLooked size={size} board={(more) => <SuidoBoard layout={finished.start} masks={finished.masks} quarters={finished.quarters} readOnly done {...more} />} />
        </TallFit>
        {chips}
        <div className="flex flex-col gap-2" data-testid="suido-solved-view">
          <p className="text-sm">
            Solved
            {solvedHere[level] === undefined ? null : (
              <>
                , best <SolveTime kind="suido" solveId={bestSolves[level] ?? null} elapsedMs={solvedHere[level]!} mine testId="suido-best-time" />
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
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => setReviewing(false)} data-testid="suido-play-again">
              Play it again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={seed} data-level={level ?? undefined} data-code={gameCode(game)} data-solved={reading.solved ? "true" : "false"} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} asked={asked} />
      <SolvePaused pausing={pausing}>
        <TallFit width={shape.width} height={shape.height}>
          <SuidoLooked size={size} board={(more) => <SuidoBoard layout={game.start} masks={game.masks} quarters={game.quarters} hint={hinted} done={done !== null} anticlockwise={anticlockwise} onTurn={turn} {...more} />} />
        </TallFit>
      </SolvePaused>
      {chips}
      {done === null ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap" role="radiogroup" aria-label={SUIDO_COPY.turn} data-testid="suido-way">
              {(["clockwise", "anticlockwise"] as const).map((each) => (
                <button
                  key={each}
                  type="button"
                  role="radio"
                  aria-checked={anticlockwise === (each === "anticlockwise")}
                  className={`${PICK_WORD_CHIP} ${anticlockwise === (each === "anticlockwise") ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                  onClick={() => setAnticlockwise(each === "anticlockwise")}
                  data-testid={`suido-way-${each}`}
                >
                  {SUIDO_WAYS[each].label} <span className="font-mincho opacity-70">{SUIDO_WAYS[each].kanji}</span>
                </button>
              ))}
            </div>
            <SolveHint hinting={hinting} onHint={hint} disabled={!live} racing={race !== null} without={level === null ? undefined : SUIDO_COPY.levelsNoHint} />
          </div>
          <span className="text-sm text-muted" data-testid="suido-said" data-leaks={reading.leaks} data-reached={reading.reached} aria-live="polite">
            {startedAt === null ? SUIDO_COPY.howTo : said}
          </span>
        </div>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} onward={race === null ? onward : undefined} />
      )}
    </section>
  );
}
