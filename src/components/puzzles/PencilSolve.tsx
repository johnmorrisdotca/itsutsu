"use client";

import { useCallback, useMemo, useState, type KeyboardEvent } from "react";

import { PLAY_SURFACE } from "@/components/ui/ui.constants";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { entered, FRESH_UI, moved, pressed, type PencilPress, type PencilUi } from "@/lib/puzzles/pencil/input";
import { pencilEngine } from "@/lib/puzzles/pencil/engines";
import type { PencilKind } from "@/lib/puzzles/pencil/pencil.types";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { encodeStepLog, openingSteps } from "@/lib/puzzles/stepLog";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PuzzleSteps } from "./PuzzleSteps";
import { PUZZLE_KEY, PUZZLE_KEYS } from "./puzzles.constants";
import { SolveCheck, SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { SolveHint } from "./SolveHint";
import { SolveShow } from "./SolveShow";
import { useStepHistory } from "./useStepHistory";
import { PencilBoard } from "./pencil/PencilBoard";
import { edgeWords, PENCIL_COPY, pencilChecked, pencilStepWord } from "./pencil/pencil.constants";

/** The puzzles whose marks are numbers, which a keypad under the board enters. */
const NUMBER_KINDS: readonly PencilKind[] = ["fillomino", "kakuro"];

/**
 * Solving a pencil puzzle: Shikaku, Akari, Slitherlink, Hitori, Fillomino or
 * Kakuro, all of them Kazu's (`@johnmorrisdotca/kazu`).
 *
 * What is written on the board is one string, a character a mark place
 * (`lib/puzzles/pencil/`), and everything the screen does is a function of it:
 * a press makes a new string (`pressed`), the board draws it (`PencilBoard`),
 * the steps are the strings it has been (`useStepHistory`), and the puzzle is
 * done the moment the string passes the check the server runs. Check, Show and
 * Hint compare it with the answer this tab holds, as a Number Place's do, and
 * cost what theirs do (`useSolve`).
 */
export function PencilSolve({
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
  const kind = puzzle.kind as PencilKind;
  const engine = pencilEngine(kind);
  const copy = PENCIL_COPY[kind];

  const [code, setCode] = useState<string>(() => (resumed !== null && engine.fits(size, resumed.progress) ? resumed.progress : engine.blank(size, givens)));
  const [ui, setUi] = useState<PencilUi>(FRESH_UI);
  const [said, setSaid] = useState<string | null>(null);
  const [checked, setChecked] = useState<{ wrong: number; missing: number } | null>(null);
  // Whether the cursor shows: after a key, never after a press, so a tapped board is not left with a ring on it.
  const [keyed, setKeyed] = useState(false);

  const opening = useMemo(() => (resumed === null ? null : openingSteps(resumed.steps, resumed.progress, size, (each) => (engine.fits(size, each) ? each : null))), [resumed, size, engine]);
  const history = useStepHistory(code, opening);
  const { startedAt, elapsedMs, done, begin, finish, pausing, checking, hinting } = useSolve(
    puzzle,
    hasAccount,
    race,
    checks,
    { progress: code, steps: () => encodeStepLog(history.steps), resumed },
    hints,
  );
  const live = done === null && !pausing.paused && !history.reviewing;

  /* Every change goes through here: the first one starts the clock, the one that solves it is handed in. */
  const write = useCallback(
    (next: string, nextUi: PencilUi) => {
      setUi(nextUi);
      if (next === code) return;
      const at = begin();
      setCode(next);
      for (let place = 0; place < next.length; place += 1) if (next[place] !== code[place]) hinting.unmark(place);
      setChecked(null);
      setSaid(null);
      if (engine.check(size, givens, next).ok) void finish(next, at);
    },
    [code, begin, hinting, engine, size, givens, finish],
  );

  const press = useCallback(
    (each: PencilPress) => {
      if (!live) return;
      setKeyed(false);
      const next = pressed(kind, size, givens, code, ui, each);
      write(next.code, next.ui);
      if (kind === "shikaku") setSaid(next.ui.anchor !== null ? (copy.corner ?? null) : null);
    },
    [live, kind, size, givens, code, ui, write, copy.corner],
  );
  const enter = useCallback(
    (value: number) => {
      if (!live) return;
      const next = entered(kind, givens, code, ui, value);
      write(next.code, next.ui);
    },
    [live, kind, givens, code, ui, write],
  );

  /* The keyboard, on the board when it has the focus: arrows move, Enter or Space presses, digits enter, Escape lets go. */
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!live || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key.startsWith("Arrow")) {
      event.preventDefault();
      setKeyed(true);
      setUi({ ...ui, selected: moved(kind, size, ui.selected, event.key) });
    } else if (event.key === "Enter" || event.key === " ") {
      if (NUMBER_KINDS.includes(kind) || ui.selected === null) return;
      event.preventDefault();
      setKeyed(true);
      press(kind === "slitherlink" ? { edge: ui.selected } : { cell: ui.selected });
    } else if (NUMBER_KINDS.includes(kind) && /^[0-9]$/.test(event.key)) {
      event.preventDefault();
      enter(Number(event.key));
    } else if (NUMBER_KINDS.includes(kind) && (event.key === "Backspace" || event.key === "Delete")) {
      event.preventDefault();
      enter(0);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setUi({ ...ui, selected: null, anchor: null });
      setSaid(null);
    }
  };

  const wrongNow = (): number[] => engine.wrong(size, code, solution);
  /* Show: the marks that are not the answer's, marked on the board until each is changed. A Check's worth, so paid for as one. */
  const show = () => {
    if (!checking.spend()) return;
    const wrong = wrongNow();
    hinting.mark(wrong);
    setChecked({ wrong: wrong.length, missing: engine.missing(size, code, solution) });
  };
  const check = () => {
    if (!checking.spend()) return;
    setChecked({ wrong: wrongNow().length, missing: engine.missing(size, code, solution) });
  };
  /* Hint: one right mark, the next the answer has (or one wrong one taken off), and the board points at it. */
  const hint = () => {
    const next = engine.fix(size, code, solution);
    if (next === null || !hinting.spend()) return;
    setKeyed(true);
    write(next.code, { ...ui, selected: next.at, anchor: null });
  };

  const view = useMemo(
    () => ({
      selected: keyed || NUMBER_KINDS.includes(kind) ? ui.selected : kind === "shikaku" ? ui.anchor : null,
      // A corner waiting is no more once the board is paused, or done, or looked at in its past.
      anchor: live ? ui.anchor : null,
      wrong: hinting.marked,
    }),
    [keyed, kind, ui.selected, ui.anchor, live, hinting.marked],
  );
  const steps = useMemo(() => history.steps.map((each) => [...each]), [history.steps]);
  const shown = history.shown;
  const disabled = startedAt === null || pausing.paused;

  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={seed} data-code={code} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <PencilBoard
          kind={kind}
          size={size}
          givens={givens}
          code={shown}
          view={history.reviewing ? undefined : view}
          readOnly={done !== null || history.reviewing}
          label={`${PENCIL_COPY[kind].thing[1]} puzzle, ${size} by ${size}. ${copy.howTo}`}
          onPress={press}
          onKey={onKey}
        />
      </SolvePaused>
      <PuzzleSteps<string>
        steps={steps}
        viewing={history.viewing}
        go={history.go}
        size={size}
        say={(value) => pencilStepWord(kind, value)}
        where={kind === "slitherlink" ? (index) => edgeWords(size, index) : undefined}
      />
      {done === null ? (
        <>
          {NUMBER_KINDS.includes(kind) ? (
            <div className={PUZZLE_KEYS} style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }} data-testid="puzzle-keys">
              {Array.from({ length: 9 }, (_, at) => at + 1).map((value) => (
                <button key={value} type="button" className={PUZZLE_KEY} onClick={() => enter(value)} disabled={pausing.paused} data-testid={`puzzle-key-${value}`}>
                  {value}
                </button>
              ))}
              <button type="button" className={PUZZLE_KEY} onClick={() => enter(0)} disabled={pausing.paused} aria-label="clear the cell" data-testid="puzzle-key-clear">
                ×
              </button>
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <SolveCheck checking={checking} onCheck={check} disabled={disabled} />
              <SolveShow checking={checking} onShow={show} disabled={disabled} />
              {kind === "shikaku" ? (
                <button
                  type="button"
                  className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
                  aria-pressed={ui.erase}
                  onClick={() => setUi({ ...ui, erase: !ui.erase, anchor: null })}
                  disabled={pausing.paused}
                  data-testid="shikaku-remove"
                >
                  Remove
                </button>
              ) : null}
              <SolveHint hinting={hinting} onHint={hint} disabled={disabled} racing={race !== null} />
            </div>
            <span className="text-sm text-muted" data-testid={checked !== null ? "puzzle-checked" : "pencil-said"} aria-live="polite">
              {checked !== null ? pencilChecked(kind, checked) : (said ?? (kind === "shikaku" && ui.erase ? "Tap a rectangle to take it away." : copy.howTo))}
            </span>
          </div>
        </>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={checking.allowed} />
      )}
    </section>
  );
}
