"use client";

import { useMemo, useRef, type CSSProperties } from "react";
import { WORDS, countsAsMove, cubeSolved, decodeCubeMoves, fill, moveName, movesNotation, scrubPath, turnAll, type CubeMove, type KyuubuLanguage } from "@johnmorrisdotca/kyuubu";
import { KyuubuMoves, type KyuubuHandle } from "@johnmorrisdotca/kyuubu/react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { cubeCopy } from "./mazeWords";
import { CubeBoard } from "./CubeBoard";

/** The list of moves wears the site's own ink and paper, through the custom properties Kyuubu's list reads. */
const MOVES_LOOK = {
  "--kyuubu-moves-ink": "var(--ink)",
  "--kyuubu-moves-paper": "var(--paper)",
  "--kyuubu-moves-rule": "var(--rule-strong)",
  "--kyuubu-moves-focus": "var(--moss)",
  "--kyuubu-moves-height": "9.5rem",
} as CSSProperties;

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
  const steps = useMemo(() => {
    const all = decodeCubeMoves(moves) ?? [];
    const ends: number[] = [0];
    all.forEach((move, index) => {
      if (countsAsMove(move)) ends.push(index + 1);
    });
    const each: CubeMove[][] = ends.slice(1).map((end, index) => all.slice(ends[index], end));
    return { all, ends, each };
  }, [moves]);
  const last = steps.ends.length - 1;
  const viewing = at === null ? last : Math.max(0, Math.min(at, last));
  const stateAt = (position: number) => turnAll(givens, size, steps.all.slice(0, steps.ends[position]));
  const state = useMemo(() => turnAll(givens, size, steps.all.slice(0, steps.ends[viewing])), [givens, size, steps, viewing]);
  const hydrated = useHydrated();
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
  // What the replay stands at, in code and in words: the turns of the step, a turn of the whole cube first where the step has one.
  const made = viewing === 0 ? [] : steps.each[viewing - 1];
  const turned = made.length === 0 ? "" : movesNotation(made, size);
  const turnedSays = say.list(made.flatMap((move) => moveName(movesNotation([move], size), language) ?? []));
  const where = fill(WORDS[language].playerMoveOf, { at: viewing, total: last });
  const items = useMemo(
    () =>
      steps.each.map((step, index) => {
        const code = movesNotation(step, size);
        const name = step.map((move) => moveName(movesNotation([move], size), language) ?? "").filter((word) => word !== "");
        const said = name.join(" + ");
        return { code, name: said, label: fill(WORDS[language].playerToken, { code, name: said, where: fill(WORDS[language].playerMoveOf, { at: index + 1, total: last }) }) };
      }),
    [steps, size, language, last],
  );
  const solvedAtEnd = cubeSolved(turnAll(givens, size, steps.all), size);
  return (
    <>
      <div className="mx-auto w-full" data-focus-board>
        <CubeBoard size={size} state={state} cube={cube} zoomable theme={BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme]} />
      </div>
      {last > 0 ? (
        <div className="flex flex-col gap-2" data-testid="cube-replay" {...readyMark(hydrated)}>
          <div className="flex min-h-14 items-center gap-3" data-testid="cube-replay-readout">
            <span className="min-w-[4.5ch] rounded-lg border-2 border-ink px-2 py-1 text-center font-mono text-3xl leading-none font-bold text-ink" data-testid="cube-replay-turn" aria-hidden="true">
              {turned === "" ? "–" : turned}
            </span>
            <span className="min-w-0 text-sm font-semibold text-ink" data-testid="cube-replay-says" aria-live="polite">
              {turned === "" ? CUBE_COPY.replayStart : turnedSays}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => step(viewing - 1)} disabled={viewing === 0} aria-label={say.say("puzzle.replay.back")}>
              ‹
            </button>
            <input
              type="range"
              min={0}
              max={last}
              value={viewing}
              onChange={(event) => step(Number(event.target.value))}
              className="min-w-0 flex-1 accent-moss"
              aria-label={say.say("puzzle.replay.move")}
              data-testid="cube-replay-scrubber"
            />
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => step(viewing + 1)} disabled={viewing === last} aria-label={say.say("puzzle.replay.on")}>
              ›
            </button>
            <span className="w-28 text-right text-sm tabular-nums whitespace-nowrap text-muted" data-testid="cube-replay-at">
              {viewing === 0 ? CUBE_COPY.replayStart : where}
            </span>
          </div>
          <KyuubuMoves
            className="w-full text-ink"
            style={MOVES_LOOK}
            locale={language}
            groups={[{ label: WORDS[language].playerSolutionLabel, main: true, items }]}
            current={viewing === 0 ? null : viewing - 1}
            onPick={(index) => step(index + 1)}
          />
        </div>
      ) : null}
      <p className="text-sm text-muted">{last === 0 ? CUBE_COPY.replayNone : solvedAtEnd ? CUBE_COPY.replaySolved : CUBE_COPY.replayGivenUp}</p>
    </>
  );
}
