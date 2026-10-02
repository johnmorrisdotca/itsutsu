"use client";

import { useMemo, useRef } from "react";
import { countsAsMove, cubeSolved, decodeCubeMoves, movesNotation, turnAll, undoOf } from "@johnmorrisdotca/kyuubu";
import type { KyuubuHandle } from "@johnmorrisdotca/kyuubu/react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { CUBE_COPY } from "./cube.constants";
import { CubeBoard } from "./CubeBoard";

/**
 * A FINISHED CUBE, played back: the cube as each turn left it, from the
 * scramble to solved (or to where it was given up), with a scrubber and a
 * press either side, and the cube itself free to be looked round at any
 * point. The turns are the solve (`encodeCubeMoves`), so every cube on the way
 * is turned from them here; turns that no longer read show the scramble.
 * One step on or back TURNS the layer on the live cube (the cube's own
 * animation, none for a device that asks for reduced motion) and names the
 * turn; a drag of the scrubber over several moves shows the position at once.
 */
export function CubeReplay({ size, givens, moves, at, go }: { size: number; givens: string; moves: string; at: number | null; go: (at: number) => void }) {
  // Only the turns that count are steps; a turn of the whole cube in the hand rides with the turn after it.
  const steps = useMemo(() => {
    const all = decodeCubeMoves(moves) ?? [];
    const ends: number[] = [0];
    all.forEach((move, index) => {
      if (countsAsMove(move)) ends.push(index + 1);
    });
    return { all, ends };
  }, [moves]);
  const last = steps.ends.length - 1;
  const viewing = at === null ? last : Math.max(0, Math.min(at, last));
  const state = useMemo(() => turnAll(givens, size, steps.all.slice(0, steps.ends[viewing])), [givens, size, steps, viewing]);
  const hydrated = useHydrated();
  const cube = useRef<KyuubuHandle>(null);
  const step = (to: number) => {
    const target = Math.max(0, Math.min(to, last));
    // One step is shown as the turn it is, drawn before the state it ends in arrives (the cube then already shows it and does not jump).
    if (Math.abs(target - viewing) === 1 && cube.current) {
      if (target > viewing) {
        for (const move of steps.all.slice(steps.ends[viewing], steps.ends[target])) cube.current.turn(move);
      } else {
        for (const move of steps.all.slice(steps.ends[target], steps.ends[viewing]).reverse()) cube.current.turn(undoOf(move));
      }
    }
    go(target);
  };
  const turned = viewing === 0 ? "" : movesNotation(steps.all.slice(steps.ends[viewing - 1], steps.ends[viewing]), size);
  const solvedAtEnd = cubeSolved(turnAll(givens, size, steps.all), size);
  return (
    <>
      <div className="mx-auto w-full" data-focus-board>
        <CubeBoard size={size} state={state} cube={cube} zoomable theme={BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme]} />
      </div>
      {last > 0 ? (
        <div className="flex items-center gap-2" data-testid="cube-replay" {...readyMark(hydrated)}>
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => step(viewing - 1)} disabled={viewing === 0} aria-label="One move back">
            ‹
          </button>
          <input
            type="range"
            min={0}
            max={last}
            value={viewing}
            onChange={(event) => step(Number(event.target.value))}
            className="min-w-0 flex-1 accent-moss"
            aria-label="Move"
            data-testid="cube-replay-scrubber"
          />
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => step(viewing + 1)} disabled={viewing === last} aria-label="One move on">
            ›
          </button>
          <span className="flex w-28 flex-col text-right text-sm tabular-nums whitespace-nowrap text-muted">
            <span data-testid="cube-replay-at">{viewing === 0 ? CUBE_COPY.replayStart : CUBE_COPY.replayAt(viewing, last)}</span>
            <span className="min-h-5 font-semibold text-ink" data-testid="cube-replay-turn" aria-live="polite">
              {turned}
            </span>
          </span>
        </div>
      ) : null}
      <p className="text-sm text-muted">{last === 0 ? CUBE_COPY.replayNone : solvedAtEnd ? CUBE_COPY.replaySolved : CUBE_COPY.replayGivenUp}</p>
    </>
  );
}
