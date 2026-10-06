"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import Link from "@/components/ui/Link";
import { useMemo } from "react";
import { SOLVABLE_SIZES, movementSays, movesNotation, solveSteps, type CubeMove, type SolveStep } from "@johnmorrisdotca/kyuubu";

import { BUTTON_BASE, BUTTON_QUIET, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { CUBE_ALGORITHM_NAMES, CUBE_GUIDE_COPY, CUBE_STAGE_WORDS } from "@/lib/learn/cubeMethod";

import { cubeCopy } from "./mazeWords";

/** The method's steps from here, or null where it is not written for this size or could not be worked out. */
export function stepsFrom(state: string, n: number): SolveStep[] | null {
  try {
    return solveSteps(state, n);
  } catch {
    return null;
  }
}

/**
 * SHOW ME HOW: the next step of the beginner's method for the cube as it
 * stands (`solveSteps` in Kyuubu), with what it is for, the turns that do it
 * in the parts they are taught in, and a button that turns them. Worked out
 * again after every turn, so a solver who goes their own way is shown the
 * step from where they are.
 *
 * Opening it is the help: the solve is kept as guided (`solveHelp.ts`),
 * which the button says before it is pressed.
 *
 * SHOW ME ON THE CUBE: the step's next move drawn on the cube itself (Kyuubu's
 * visual guide: the layer lit, an arrow the way to drag it), with the same
 * move in words beside the step; turning it moves the guide on to the next.
 */
export function CubeGuide({
  state,
  n,
  enabled,
  open,
  used,
  onOpen,
  onHide,
  onTurnFor,
  onCube,
  onToggleCube,
}: {
  state: string;
  n: number;
  enabled: boolean;
  open: boolean;
  /** Opened before on this solve: the cost is paid, and the button says so no more. */
  used: boolean;
  onOpen: () => void;
  onHide: () => void;
  onTurnFor: (moves: readonly CubeMove[]) => void;
  /** Whether the next move is drawn on the cube. */
  onCube: boolean;
  onToggleCube: () => void;
}) {
  const CUBE_COPY = cubeCopy(useSpeaker().locale);
  const steps = useMemo(() => (open ? stepsFrom(state, n) : null), [open, state, n]);
  if (!SOLVABLE_SIZES.includes(n)) {
    return (
      <p className="text-xs text-muted" data-testid="cube-guide-sizes">
        {CUBE_COPY.guideSizes}{" "}
        <Link href="/learn/cube" className="underline">
          {CUBE_COPY.guideLearn}
        </Link>
      </p>
    );
  }
  if (!open) {
    return (
      <div className="flex flex-col gap-1" data-testid="cube-guide">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={onOpen} disabled={!enabled} data-testid="cube-guide-open">
            {used ? CUBE_COPY.guideShow : CUBE_COPY.guideOpen}
          </button>
          <Link href="/learn/cube" className="text-sm underline">
            {CUBE_COPY.guideLearn}
          </Link>
        </div>
        {used ? null : <p className="text-xs text-muted">{CUBE_COPY.guideCost}</p>}
      </div>
    );
  }
  const next = steps?.[0];
  if (next === undefined) return null;
  const words = CUBE_STAGE_WORDS[next.stage];
  return (
    <div className="flex flex-col gap-2 rounded-md border border-rule p-3" data-testid="cube-guide" data-stage={next.stage} data-step-moves={movesNotation(next.moves, n)}>
      <p className="text-xs uppercase tracking-wide text-muted">
        {CUBE_COPY.guideNext} · {CUBE_COPY.guideLeft(steps?.length ?? 0)}
      </p>
      <h3 className="font-semibold" data-testid="cube-guide-title">
        {words.title}
      </h3>
      <p className="text-sm">{words.aim}</p>
      <ol className="flex flex-col gap-1 text-sm">
        {next.parts.map((part, at) => (
          <li key={at} className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-muted">{part.algorithm === undefined ? CUBE_GUIDE_COPY.lineUp : CUBE_ALGORITHM_NAMES[part.algorithm]}</span>
            <span className="font-mono">{movesNotation(part.moves, n)}</span>
          </li>
        ))}
      </ol>
      {onCube && next.moves[0] !== undefined ? (
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm" data-testid="cube-guide-now" aria-live="polite">
          <span className="text-muted">{CUBE_COPY.guideMoveNow}</span>
          <span className="font-mono font-semibold">{movesNotation([next.moves[0]], n)}</span>
          <span>{movementSays([next.moves[0]], n) ?? ""}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={onToggleCube} disabled={!enabled} aria-pressed={onCube} data-testid="cube-guide-on-cube">
          {onCube ? CUBE_COPY.guideOffCube : CUBE_COPY.guideOnCube}
        </button>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={() => onTurnFor(next.moves)} disabled={!enabled} data-testid="cube-guide-turn">
          {CUBE_COPY.guideTurn}
        </button>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={onHide} data-testid="cube-guide-hide">
          {CUBE_COPY.guideHide}
        </button>
      </div>
    </div>
  );
}
