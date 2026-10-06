"use client";

import { setUpPath } from "@/lib/gomoku/slugs";
import { EndGameButton, GameEnding, NewGameLink } from "@/components/play/GameEnding";
import { ENDINGS } from "@/components/play/gameEnding.constants";
import { useEffect, useMemo, useRef, useState } from "react";
import { countsAsMove, cubeSolved, decodeCubeMoves, encodeCubeMoves, movesNotation, turnAll, turnCube, undoAll, undoOf, type CubeMove } from "@johnmorrisdotca/kyuubu";
import type { KyuubuHandle } from "@johnmorrisdotca/kyuubu/react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_SURFACE, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { decodeCubeProgress, encodeCubeProgress } from "@/lib/puzzles/puzzleProgress";
import { SOLVE_HELPS } from "@/lib/puzzles/solveHelp";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { CUBE_COPY, CUBE_INSPECTION_MS } from "./cube.constants";
import { CubeBoard } from "./CubeBoard";
import { CubeGuide, stepsFrom } from "./CubeGuide";
import { SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";

/**
 * SOLVING THE CUBE: Kyuubu turning on the reader's wood, through the puzzles'
 * machinery, as Solitaire is played.
 *
 * A LOOK FIRST, as a competition gives: fifteen seconds with the scramble in
 * plain sight before the clock starts, turning the whole cube to see every
 * side costing nothing. The clock starts with the first turn of a layer, or
 * when the look runs out. It stops the moment every face is one colour, and
 * the solve is handed in with its turns, which the server turns again from
 * the scramble (`checkCube`). A member's cube half turned waits in My games
 * (`useSolve` keeps the turns).
 */
export function CubeSolve({
  puzzle,
  hasAccount,
  race = null,
  resumed = null,
  appearance = DEFAULT_APPEARANCE,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  resumed?: ResumedRun | null;
  appearance?: Appearance;
}) {
  const hydrated = useHydrated();
  const n = puzzle.size;
  // A kept run's turns are made at once, not played out again.
  const kept = resumed === null ? null : decodeCubeProgress(resumed.progress);
  /*
   * THE TURNS AND THE CUBE THEY LEAVE, kept together. Each turn made or taken back is turned onto the cube as it stands, one
   * turn's work, not every turn since the scramble again: a first 7×7 is a thousand turns or more, and turning them all
   * from the start for every one more was about fifty milliseconds on a phone by the three-thousandth.
   */
  const [run, setRun] = useState(() => {
    const turns = kept?.moves ?? [];
    return { moves: turns, state: turnAll(puzzle.givens, n, turns) };
  });
  const { moves, state } = run;
  // Shown its steps (`CubeGuide`): kept with the run, and the solve is handed in as guided.
  const [guided, setGuided] = useState(kept?.guided ?? false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [onCube, setOnCube] = useState(false);
  const solved = cubeSolved(state, n);
  // The method's next move, drawn on the cube while the guide is open and asked to show it there.
  const hint = useMemo(() => (guideOpen && onCube && !solved ? (stepsFrom(state, n)?.[0]?.moves.slice(0, 1) ?? null) : null), [guideOpen, onCube, solved, state, n]);
  const cube = useRef<KyuubuHandle>(null);
  const theme = BOARD_THEMES[appearance.boardTheme] ?? BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme];

  const { startedAt, elapsedMs, done, begin, finish, runOut, pausing } = useSolve(puzzle, hasAccount, race, null, { progress: encodeCubeProgress(moves, guided), resumed }, false);
  const live = done === null && !pausing.paused;
  const counted = moves.filter(countsAsMove).length;

  /* THE LOOK: counted down from when the cube is first shown, never for a run opened again, a race, or once the clock runs. */
  const inspects = resumed === null && race === null;
  const [lookLeft, setLookLeft] = useState(CUBE_INSPECTION_MS);
  useEffect(() => {
    if (!inspects || startedAt !== null || !hydrated) return;
    const from = Date.now();
    const timer = window.setInterval(() => {
      const left = CUBE_INSPECTION_MS - (Date.now() - from);
      setLookLeft(Math.max(0, left));
      if (left <= 0) begin();
    }, 250);
    return () => window.clearInterval(timer);
  }, [inspects, startedAt, hydrated, begin]);

  /* Solved: handed in once, with every turn that got it there. */
  const handedIn = useRef(false);
  useEffect(() => {
    if (!solved || moves.length === 0 || handedIn.current || done !== null) return;
    handedIn.current = true;
    void finish(encodeCubeMoves(moves), Date.now(), guided ? SOLVE_HELPS.guided : null);
  }, [solved, moves, done, finish, guided]);

  const turned = (move: CubeMove) => {
    // A turn of the whole cube is a look, and starts nothing.
    if (countsAsMove(move)) begin();
    setRun((so) => ({ moves: [...so.moves, move], state: turnCube(so.state, n, move) }));
  };

  const undo = () => {
    const last = moves.at(-1);
    if (last === undefined || !live) return;
    cube.current?.turn(undoOf(last));
    setRun((so) => {
      const back = so.moves.at(-1);
      return back === undefined ? so : { moves: so.moves.slice(0, -1), state: turnCube(so.state, n, undoOf(back)) };
    });
  };

  const turnFor = (steps: readonly CubeMove[]) => {
    if (!live) return;
    for (const move of steps) cube.current?.turn(move, { report: true });
  };

  const giveUp = () => {
    if (!live || startedAt === null || counted === 0) return;
    void runOut(encodeCubeMoves(moves), Date.now());
  };

  const inspecting = inspects && startedAt === null && done === null;
  const said = inspecting ? CUBE_COPY.inspecting(Math.ceil(lookLeft / 1000)) : startedAt === null ? CUBE_COPY.howTo : CUBE_COPY.solving;
  return (
    <section
      className={`${PLAY_SURFACE} flex flex-col gap-3`}
      data-testid="puzzle-play"
      data-kind={puzzle.kind}
      data-seed={puzzle.seed}
      data-moves={encodeCubeMoves(moves)}
      data-solved={solved ? "true" : "false"}
      data-inspecting={inspecting ? "true" : "false"}
      {...readyMark(hydrated)}
    >
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <div className="mx-auto w-full" data-bare-board>
          <CubeBoard size={n} state={state} theme={theme} interactive={live && !solved} zoomable keyboard="page" onTurn={turned} cube={cube} hint={live ? hint : null} />
        </div>
      </SolvePaused>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={undo} disabled={!live || moves.length === 0 || solved} data-testid="cube-undo">
          {CUBE_COPY.undo}
        </button>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={() => cube.current?.resetLook()} data-testid="cube-look">
          {CUBE_COPY.resetLook}
        </button>
        <p className="text-sm tabular-nums" data-testid="cube-move-count">
          {CUBE_COPY.moves(counted)}
        </p>
        {done === null ? (
          <div className="ml-auto">
            <GameEnding>
              <EndGameButton ending={ENDINGS.giveUp} onEnd={giveUp} disabled={!live || startedAt === null || counted === 0} testId="cube-give-up" />
              {race === null ? <NewGameLink href={setUpPath(puzzle.kind)} testId="cube-new" /> : null}
            </GameEnding>
          </div>
        ) : null}
      </div>
      {done === null ? (
        <>
          <p className="min-h-10 text-sm text-muted" data-testid="cube-said" aria-live="polite">
            {said}
          </p>
          {race === null ? (
            <CubeGuide
              state={state}
              n={n}
              enabled={live && !solved}
              open={guideOpen}
              used={guided}
              onOpen={() => {
                setGuided(true);
                setGuideOpen(true);
              }}
              onHide={() => setGuideOpen(false)}
              onTurnFor={turnFor}
              onCube={onCube}
              onToggleCube={() => setOnCube((so) => !so)}
            />
          ) : null}
          <p className="text-xs text-muted" data-testid="cube-scramble">
            {CUBE_COPY.scramble}: <span className="font-mono">{movesNotation(undoAll(decodeCubeMoves(puzzle.solution) ?? []), n)}</span>
          </p>
        </>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} moves={counted} />
      )}
    </section>
  );
}
