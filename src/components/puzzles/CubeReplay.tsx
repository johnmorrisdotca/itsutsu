"use client";

import { useMemo, useRef } from "react";
import { WORDS, cubeSolved, decodeCubeMoves, scrubPath, turnAll, type KyuubuLanguage } from "@johnmorrisdotca/kyuubu";
import type { KyuubuHandle } from "@johnmorrisdotca/kyuubu/react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { groupCubeSteps } from "@/lib/puzzles/cube/steps";

import { cubeCopy } from "./mazeWords";
import { CubeBoard } from "./CubeBoard";
import { CubeReplayPanel } from "./CubeReplayPanel";

/**
 * A FINISHED CUBE, played back: the cube as each turn left it, from the
 * scramble to solved (or to where it was given up), with a scrubber and a
 * press either side, and the cube itself free to be looked round at any
 * point. The turns are the solve (`encodeCubeMoves`), so every cube on the way
 * is turned from them here; turns that no longer read show the scramble.
 *
 * The move the replay stands at is said: its code in large type and what it
 * turns in words (Kyuubu's `moveName`, in the reader's language), and the
 * moves are a list of buttons that follows the replay and takes it anywhere
 * (`KyuubuMoves`), with the arrow keys, Home and End. What moves the replay TURNS
 * the layers on the live cube, forwards going on and each undone going back
 * (the cube's own animation, none for a device that asks for reduced motion):
 * a step either way, and a drag of the scrubber or a press on a move that goes
 * further, which catches up quickly, turning only the last few moves
 * (`scrubPath`). `animate` is that choice, on unless a consumer turns it off, the way
 * a word's replay's is (`WordReplay`): off, every move shows the position at once.
 */
export function CubeReplay({
  size,
  givens,
  moves,
  at,
  go,
  animate = true,
}: {
  size: number;
  givens: string;
  moves: string;
  at: number | null;
  go: (at: number) => void;
  /** Whether moving the replay turns the cube between where it was and where it goes. */
  animate?: boolean;
}) {
  const say = useSpeaker();
  const language: KyuubuLanguage = say.locale === "ja" ? "ja" : "en";
  const CUBE_COPY = cubeCopy(say.locale);
  // Only the turns that count are steps; a turn of the whole cube in the hand rides with the turn after it.
  const steps = useMemo(() => groupCubeSteps(decodeCubeMoves(moves) ?? []), [moves]);
  const last = steps.each.length;
  const viewing = at === null ? last : Math.max(0, Math.min(at, last));
  const stateAt = (position: number) => turnAll(givens, size, steps.all.slice(0, steps.ends[position]));
  const state = useMemo(() => turnAll(givens, size, steps.all.slice(0, steps.ends[viewing])), [givens, size, steps, viewing]);
  const cube = useRef<KyuubuHandle>(null);
  const step = (to: number) => {
    const target = Math.max(0, Math.min(to, last));
    if (animate && target !== viewing && cube.current) {
      // The turns are drawn before the state they end in arrives, so the cube already shows them and does not jump to it.
      const path = scrubPath(steps.each, viewing, target);
      if (path.from !== viewing) cube.current.setState(stateAt(path.from));
      for (const turn of path.turns) for (const move of turn) cube.current.turn(move);
    }
    go(target);
  };
  const solvedAtEnd = cubeSolved(turnAll(givens, size, steps.all), size);
  return (
    <>
      <div className="mx-auto w-full" data-focus-board>
        <CubeBoard size={size} state={state} cube={cube} zoomable theme={BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme]} />
      </div>
      {last > 0 ? <CubeReplayPanel size={size} each={steps.each} viewing={viewing} go={step} startLabel={CUBE_COPY.replayStart} listLabel={WORDS[language].playerSolutionLabel} /> : null}
      <p className="text-sm text-muted">{last === 0 ? CUBE_COPY.replayNone : solvedAtEnd ? CUBE_COPY.replaySolved : CUBE_COPY.replayGivenUp}</p>
    </>
  );
}
