"use client";

import { useMemo, useRef, useState } from "react";
import { movesNotation, solveSteps, turnAll, type CubeMove, type SolveStage } from "kyuubu";
import type { KyuubuHandle } from "kyuubu/react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { SectionHeading } from "@/components/layout/Headings";
import { CubeBoard } from "@/components/puzzles/CubeBoard";
import { BUTTON_BASE, BUTTON_QUIET, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { CUBE_ALGORITHM_NAMES, CUBE_GUIDE_COPY, CUBE_STAGE_WORDS, CUBE_STAGES_BY_SIZE } from "@/lib/learn/cubeMethod";
import { practiceCube, stageDone, type TaughtSize } from "@/lib/learn/cubePractice";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

const THEME = BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme];

/**
 * THE METHOD, STEP BY STEP, WITH A CUBE TO TRY EACH ON (`/learn/cube`). Every
 * stage is told in words (`cubeMethod.ts`), and one at a time opens a live
 * cube where that stage is the next thing to do (`practiceCube`): turn it
 * until the step is done, or be shown the turns, or have them turned. One cube
 * on the page at once, so the page stays light and its keys stay its own.
 */
export function CubeMethodGuide() {
  const hydrated = useHydrated();
  const [n, setN] = useState<TaughtSize>(3);
  const [practising, setPractising] = useState<SolveStage | null>(null);
  const stages = CUBE_STAGES_BY_SIZE[n];
  return (
    <div className="flex flex-col gap-6" data-testid="cube-method" data-size={String(n)} {...readyMark(hydrated)}>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={CUBE_GUIDE_COPY.sizeLabel}>
        {([3, 2] as const).map((size) => (
          <button
            key={size}
            type="button"
            className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`}
            aria-pressed={n === size}
            onClick={() => {
              setN(size);
              setPractising(null);
            }}
            data-testid={`cube-method-size-${size}`}
          >
            {CUBE_GUIDE_COPY.sizes[size]}
          </button>
        ))}
      </div>
      {n === 2 ? <p className="text-sm leading-relaxed">{CUBE_GUIDE_COPY.twoByTwo}</p> : null}
      <ol className="flex flex-col gap-6">
        {stages.map((stage, at) => {
          const words = CUBE_STAGE_WORDS[stage];
          return (
            <li key={stage} className="flex flex-col gap-2" data-testid="cube-method-stage" data-stage={stage}>
              <SectionHeading title={`${at + 1}. ${words.title}`} />
              <p className="text-sm leading-relaxed">{words.aim}</p>
              <p className="text-sm leading-relaxed">{words.how}</p>
              {practising === stage ? (
                <CubePractice key={`${n}-${stage}`} n={n} stage={stage} />
              ) : (
                <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} self-start`} onClick={() => setPractising(stage)} data-testid="cube-method-practise">
                  {CUBE_GUIDE_COPY.practise}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** One stage's practice: a cube with that stage next, turned by the reader until it is done. */
function CubePractice({ n, stage }: { n: TaughtSize; stage: SolveStage }) {
  const [seed, setSeed] = useState(1);
  const start = useMemo(() => practiceCube(n, stage, seed), [n, stage, seed]);
  const [moves, setMoves] = useState<CubeMove[]>([]);
  const [shown, setShown] = useState(false);
  const cube = useRef<KyuubuHandle>(null);
  const state = useMemo(() => turnAll(start.state, n, moves), [start.state, n, moves]);
  const done = stageDone(state, n, stage);
  // The turns that finish the stage from here: every step of it the method still has to do.
  const rest = useMemo(() => {
    const steps = solveSteps(state, n) ?? [];
    const through = steps.findIndex((step) => step.stage !== stage);
    return steps.slice(0, through < 0 ? steps.length : through);
  }, [state, n, stage]);

  const fresh = (next: number) => {
    setSeed(next);
    setMoves([]);
    setShown(false);
  };
  const turnFor = () => {
    for (const move of rest.flatMap((step) => step.moves)) cube.current?.turn(move, { report: true });
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-rule p-3" data-testid="cube-practice" data-done={done ? "true" : "false"}>
      <div className="mx-auto w-full max-w-sm">
        <CubeBoard size={n} state={state} theme={THEME} interactive={!done} keyboard="page" onTurn={(move) => setMoves((so) => [...so, move])} cube={cube} />
      </div>
      <p className="min-h-10 text-sm text-muted" aria-live="polite" data-testid="cube-practice-said">
        {done ? CUBE_GUIDE_COPY.done : CUBE_GUIDE_COPY.practising}
      </p>
      {shown && !done ? (
        <ol className="flex flex-col gap-1 text-sm" data-testid="cube-practice-turns">
          {rest.flatMap((step) => step.parts).map((part, at) => (
            <li key={at} className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-muted">{part.algorithm === undefined ? CUBE_GUIDE_COPY.lineUp : CUBE_ALGORITHM_NAMES[part.algorithm]}</span>
              <span className="font-mono">{movesNotation(part.moves, n)}</span>
            </li>
          ))}
        </ol>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {!done ? (
          <>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={() => setShown(true)} disabled={shown} data-testid="cube-practice-show">
              {CUBE_GUIDE_COPY.showTurns}
            </button>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={turnFor} data-testid="cube-practice-turn">
              {CUBE_GUIDE_COPY.turnFor}
            </button>
          </>
        ) : null}
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={() => fresh(seed)} disabled={moves.length === 0} data-testid="cube-practice-again">
          {CUBE_GUIDE_COPY.again}
        </button>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={() => fresh(start.seed + 1)} data-testid="cube-practice-another">
          {CUBE_GUIDE_COPY.another}
        </button>
      </div>
    </div>
  );
}
