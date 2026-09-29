"use client";

import { useCallback, useMemo, useState } from "react";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { checkPictureLogic } from "@/lib/puzzles/pictureLogic/check";
import { answerOfCells, decodeCells, decodeClues, decodePicture, encodeCells } from "@/lib/puzzles/pictureLogic/code";
import { hintedState, pictureChecked, pictureHint, pictureWrong } from "@/lib/puzzles/pictureLogic/help";
import { painted, type Pen } from "@/lib/puzzles/pictureLogic/paint";
import type { CellState } from "@/lib/puzzles/pictureLogic/pictureLogic.types";
import { encodeStepLog, openingSteps } from "@/lib/puzzles/stepLog";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PictureLogicGrid } from "./PictureLogicGrid";
import { PuzzleSteps } from "./PuzzleSteps";
import { PICTURE_CELL_WORDS, PICTURE_COPY } from "./puzzles.constants";
import { SolveCheck, SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { SolveHint } from "./SolveHint";
import { SolveShow } from "./SolveShow";
import { TsunagiViewport } from "./TsunagiViewport";
import { useStepHistory } from "./useStepHistory";

const PENS: readonly Pen[] = ["shade", "mark"];

/**
 * Solving Picture logic: tap a square to shade it, again to mark it ✕, again
 * to clear it — or, with the ✕ pen, ✕ first — and drag along a row or a column
 * to do the same to every square like the first. The puzzle is done the moment
 * the shading meets every clue, the check the server runs
 * (`checkPictureLogic`); the ✕s are the player's notes and never count. The
 * answer handed in is the picture; the run kept half way is the grid with its
 * ✕s (`pictureLogic/code.ts`).
 *
 * The two big boards are looked at through the zoom Tsunagi's and Bridges' big
 * boards have (`TsunagiViewport`): Fit, the arrows, the wheel, and the view
 * nudged when a drag nears an edge.
 */
export function PictureLogicSolve({
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
  const { kind, size, seed } = puzzle;
  const clues = useMemo(() => decodeClues(puzzle.givens, size)!, [puzzle.givens, size]);
  const picture = useMemo(() => decodePicture(puzzle.solution, size) ?? [], [puzzle.solution, size]);
  const blank = useMemo(() => encodeCells(new Array<CellState>(size * size).fill(0)), [size]);
  // The grid as it stands, as it is kept: a run picked up again starts from what it was left with.
  const [drawing, setDrawing] = useState<string>(() => (resumed !== null && decodeCells(resumed.progress, size) !== null ? resumed.progress : blank));
  const [pen, setPen] = useState<Pen>("shade");
  const [checked, setChecked] = useState<{ wrong: number; toShade: number } | null>(null);

  const opening = useMemo(() => (resumed === null ? null : openingSteps(resumed.steps, resumed.progress, size, (code) => (decodeCells(code, size) === null ? null : code))), [resumed, size]);
  const history = useStepHistory(drawing, opening);
  const current = useMemo(() => decodeCells(drawing, size) ?? [], [drawing, size]);
  const shown = useMemo(() => decodeCells(history.shown, size) ?? current, [history.shown, size, current]);

  const { startedAt, elapsedMs, done, begin, finish, pausing, checking, hinting } = useSolve(puzzle, hasAccount, race, checks, {
    progress: drawing,
    steps: () => encodeStepLog(history.steps),
    resumed,
  }, hints);
  const live = done === null && !pausing.paused && !history.reviewing;

  /* The grid set to a new state, from a tap, a drag or a hint: the one door every change goes through. */
  const change = useCallback(
    (next: CellState[], touched: readonly number[]) => {
      const at = begin();
      const code = encodeCells(next);
      setDrawing(code);
      for (const cell of touched) hinting.unmark(cell);
      setChecked(null);
      const answer = answerOfCells(next);
      if (checkPictureLogic(size, puzzle.givens, answer).ok) void finish(answer, at);
    },
    [begin, hinting, size, puzzle.givens, finish],
  );

  const paint = (run: readonly number[]) => {
    if (!live) return;
    change(painted(current, run, pen), run);
  };

  /* Show: every shade and ✕ the picture does not have, marked until changed. A Check's worth, so paid for as one. */
  const show = () => {
    if (!checking.spend()) return;
    hinting.mark(pictureWrong(current, picture));
    setChecked(pictureChecked(current, picture));
  };
  const check = () => {
    if (!checking.spend()) return;
    setChecked(pictureChecked(current, picture));
  };
  /* Hint: one square put as the picture has it, shaded or ✕. */
  const hint = () => {
    const cell = pictureHint(size, current, picture);
    if (cell === null || !hinting.spend()) return;
    const next = [...current];
    next[cell] = hintedState(picture, cell);
    change(next, [cell]);
  };

  const steps = useMemo(() => history.steps.map((code) => [...code]), [history.steps]);
  const finished = done !== null && done.outOfGuesses !== true;
  return (
    <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-seed={seed} data-drawing={drawing} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <TsunagiViewport size={size} name="picture">
          <PictureLogicGrid clues={clues} cells={finished ? picture.map((shaded): CellState => (shaded ? 1 : 0)) : shown} wrong={hinting.marked} done={done !== null || history.reviewing} finished={finished} onPaint={paint} />
        </TsunagiViewport>
      </SolvePaused>
      <PuzzleSteps steps={steps} viewing={history.viewing} go={history.go} size={size} say={(value) => PICTURE_CELL_WORDS[value] ?? value} />
      {done === null ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1.5" role="radiogroup" aria-label={PICTURE_COPY.pensLabel} data-testid="picture-pens">
              {PENS.map((each) => (
                <button
                  key={each}
                  type="button"
                  role="radio"
                  aria-checked={pen === each}
                  onClick={() => setPen(each)}
                  className={`${PICK_WORD_CHIP} ${pen === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                  data-testid={`picture-pen-${each}`}
                >
                  {PICTURE_COPY.pens[each]}
                </button>
              ))}
            </div>
            <SolveCheck checking={checking} onCheck={check} disabled={startedAt === null || pausing.paused} />
            <SolveShow checking={checking} onShow={show} disabled={startedAt === null || pausing.paused} />
            <SolveHint hinting={hinting} onHint={hint} disabled={startedAt === null || pausing.paused} racing={race !== null} />
          </div>
          <span className="text-sm text-muted" data-testid={checked !== null ? "puzzle-checked" : "picture-said"} aria-live="polite">
            {checked !== null ? checkedLine(checked) : pen === "shade" ? PICTURE_COPY.howTo : PICTURE_COPY.howToMark}
          </span>
        </div>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={checking.allowed} />
      )}
    </section>
  );
}

/** What Check says: how many squares are wrong, and how many of the picture's are still to shade, never which. */
function checkedLine({ wrong, toShade }: { wrong: number; toShade: number }): string {
  if (wrong === 0 && toShade === 0) return "Every square is shaded and right.";
  const bad = wrong === 0 ? "Nothing wrong so far" : `${wrong} ${wrong === 1 ? "square is" : "squares are"} wrong`;
  const left = toShade > 0 ? `, ${toShade} still to shade` : "";
  return `${bad}${left}.`;
}
