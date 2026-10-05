"use client";

import { useCallback, useMemo, useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, PLAY_SURFACE } from "@/components/ui/ui.constants";
import { COVERED, FLAG, jiraiBoardOf, jiraiCheck, jiraiFix, jiraiMissing, jiraiPress, jiraiRecipeOf, jiraiWon, jiraiWrong, type JiraiMove } from "@/lib/puzzles/jirai/board";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { encodeStepLog, openingSteps } from "@/lib/puzzles/stepLog";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { JiraiBoard } from "./JiraiBoard";
import { JIRAI_COPY, jiraiChecked, jiraiStepWord } from "./jirai.constants";
import { PuzzleSteps } from "./PuzzleSteps";
import { SolveCheck, SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { SolveHint } from "./SolveHint";
import { SolveShow } from "./SolveShow";
import { useStepHistory } from "./useStepHistory";

/**
 * Solving a Jirai: a board the browser has dealt and Jirai has proved needs no guess, opened at its middle.
 *
 * What is on the board is one string, a character a square (`lib/puzzles/jirai/board.ts`),
 * and everything the screen does is a function of it, as for every puzzle on Kazu (`PencilSolve`): a
 * press makes a new string (`jiraiPress`), the board draws it (`JiraiBoard`), the steps are the strings
 * it has been, and the puzzle is done the moment every safe square is uncovered. The mines are in the
 * answer this tab holds, as a Number Place's numbers are: Check, Show and Hint read it, and a mine
 * uncovered is flagged where it lies, counted as a mistake and charged as a Hint is.
 */
export function JiraiSolve({
  puzzle,
  hasAccount,
  race = null,
  checks = null,
  resumed = null,
  hints = false,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  checks?: number | null;
  resumed?: ResumedRun | null;
  hints?: boolean;
}) {
  const hydrated = useHydrated();
  const { size, seed, givens, solution } = puzzle;
  const recipe = useMemo(() => jiraiRecipeOf(size, givens)!, [size, givens]);
  const board = useMemo(() => jiraiBoardOf(recipe, solution)!, [recipe, solution]);
  const [code, setCode] = useState<string>(() => (resumed !== null && resumed.progress.length === recipe.cells.length && /^[.f\-0-8]+$/.test(resumed.progress) ? resumed.progress : recipe.cells));
  const [flagging, setFlagging] = useState(false);
  const [said, setSaid] = useState<string | null>(null);
  const [checked, setChecked] = useState<{ wrong: number; missing: number } | null>(null);
  const [lit, setLit] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const opening = useMemo(() => (resumed === null ? null : openingSteps(resumed.steps, resumed.progress, size, (each) => (each.length === recipe.cells.length && /^[.f\-0-8]+$/.test(each) ? each : null))), [resumed, size, recipe]);
  const history = useStepHistory(code, opening);
  const { startedAt, elapsedMs, done, begin, finish, pausing, checking, hinting } = useSolve(puzzle, hasAccount, race, checks, { progress: code, steps: () => encodeStepLog(history.steps), resumed }, hints);
  const live = done === null && !pausing.paused && !history.reviewing;

  /* Every change goes through here: the first starts the clock, the one that uncovers the last safe square is handed in. */
  const write = useCallback(
    (next: string, hit: readonly number[] = []) => {
      const at = begin();
      if (next !== code) {
        setCode(next);
        for (let place = 0; place < next.length; place += 1) if (next[place] !== code[place]) hinting.unmark(place);
      }
      setChecked(null);
      setLit(null);
      if (hit.length > 0) {
        hinting.charge(hit.length);
        setMistakes((so) => so + hit.length);
        setSaid(JIRAI_COPY.boom(hit.length));
      } else {
        setSaid(null);
      }
      if (next !== code && jiraiWon(next, solution) && jiraiCheck(size, givens, next).ok) void finish(next, at);
    },
    [begin, code, hinting, solution, size, givens, finish],
  );

  const move = useCallback(
    (each: JiraiMove) => {
      if (!live) return;
      const pressed = jiraiPress(recipe, board, code, each);
      if (pressed.code === code && pressed.hit.length === 0) return;
      write(pressed.code, pressed.hit);
    },
    [live, recipe, board, code, write],
  );

  const wrongNow = () => jiraiWrong(code, solution);
  /* Show: the flags that are on no mine, marked until each is changed. A Check's worth, so paid for as one. */
  const show = () => {
    if (!checking.spend()) return;
    const wrong = wrongNow();
    hinting.mark(wrong);
    setChecked({ wrong: wrong.length, missing: jiraiMissing(code, solution) });
  };
  const check = () => {
    if (!checking.spend()) return;
    setChecked({ wrong: wrongNow().length, missing: jiraiMissing(code, solution) });
  };
  /* Hint: one move the numbers prove (Jirai's own hint), made, and the square lit. */
  const hint = () => {
    const next = jiraiFix(recipe, board, code, solution);
    if (next === null || !hinting.spend()) return;
    write(next.code);
    setLit(next.at);
  };

  const flags = [...code].filter((character) => character === FLAG).length;
  const left = recipe.settings.mines - flags;
  const steps = useMemo(() => history.steps.map((each) => [...each]), [history.steps]);
  const disabled = startedAt === null || pausing.paused;
  const count = [...code].filter((character) => character === COVERED).length;

  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind="jirai" data-seed={seed} data-code={code} data-mistakes={mistakes} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <JiraiBoard
          size={size}
          givens={givens}
          code={history.shown}
          flagging={flagging}
          wrong={hinting.marked}
          hint={history.reviewing ? null : lit}
          readOnly={!live}
          label={JIRAI_COPY.label(size)}
          onMove={move}
        />
      </SolvePaused>
      <PuzzleSteps<string> steps={steps} viewing={history.viewing} go={history.go} size={size} say={jiraiStepWord} />
      {done === null ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <SolveCheck checking={checking} onCheck={check} disabled={disabled} />
            <SolveShow checking={checking} onShow={show} disabled={disabled} />
            <button
              type="button"
              className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
              aria-pressed={flagging}
              onClick={() => setFlagging((so) => !so)}
              disabled={pausing.paused}
              data-testid="jirai-flag"
            >
              Flag
            </button>
            <SolveHint hinting={hinting} onHint={hint} disabled={disabled} racing={race !== null} />
          </div>
          <span className="text-sm text-muted" data-testid="jirai-mines" data-left={left} data-covered={count}>
            {JIRAI_COPY.minesLeft(left, mistakes)}
          </span>
          <span className="text-sm text-muted" data-testid={checked !== null ? "puzzle-checked" : "jirai-said"} aria-live="polite">
            {checked !== null ? jiraiChecked(checked) : (said ?? (flagging ? JIRAI_COPY.flagging : JIRAI_COPY.howTo))}
          </span>
        </div>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={checking.allowed} />
      )}
    </section>
  );
}
