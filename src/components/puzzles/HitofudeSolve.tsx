"use client";

import { useCallback, useMemo, useState, type KeyboardEvent } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_SURFACE, ROOM_FOR_A_WORD, ROOM_FOR_THREE_LINES, ROOM_FOR_TWO_WORDS, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { checkHitofude } from "@/lib/puzzles/hitofude/check";
import { blankLine, decodeLine, decodeNumbers, encodeLine } from "@/lib/puzzles/hitofude/code";
import { lineAfter, lineAfterArrow, nextNumberOf } from "@/lib/puzzles/hitofude/draw";
import { hintedLine, offTheAnswer } from "@/lib/puzzles/hitofude/help";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { encodeStepLog, openingSteps } from "@/lib/puzzles/stepLog";
import { ARROW_KEY } from "@/lib/ui/keyNames.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { HitofudeBoard } from "./hitofude/HitofudeBoard";
import { hitofudeChecked, hitofudeStepWord } from "./hitofude/hitofudeWords";
import { PuzzleSteps } from "./PuzzleSteps";
import { SolveCheck, SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { SolveHint } from "./SolveHint";
import { SolveShow } from "./SolveShow";
import { useStepHistory } from "./useStepHistory";

/**
 * Solving an Hitofude: one line from the first number, through every square, passing
 * the numbers in order.
 *
 * What is drawn is one string (`hitofude/code.ts`), and everything on the screen is a
 * function of it: a press or a drag makes a new string (`lineAfter`), the board draws
 * it, the steps are the strings it has been (`useStepHistory`), and the puzzle is done
 * the moment the string passes the check the server runs. Check, Show and Hint read
 * it against the answer this tab holds, and cost what theirs do on any grid (`useSolve`).
 *
 * Undo takes back the last stroke, a press and a drag together, as a person thinks of
 * it, and Restart goes back to the first number. The arrow keys draw when the board has
 * the focus, stepping back along the line where that is the way it came.
 */
export function HitofudeSolve({
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
  const say = useSpeaker();
  const { kind, size, seed, givens, solution } = puzzle;
  const numbers = useMemo(() => decodeNumbers(givens, size) ?? [], [givens, size]);
  const blank = useMemo(() => blankLine(givens, size) ?? "", [givens, size]);

  // A kept line opens where it was left, if it is a line that starts on this board's first number.
  const [code, setCode] = useState<string>(() => {
    const kept = resumed === null ? null : decodeLine(resumed.progress, size);
    return kept !== null && numbers[kept[0]!] === 1 ? resumed!.progress : blank;
  });
  /* The line before each stroke, newest last, for Undo. */
  const [strokes, setStrokes] = useState<readonly string[]>([]);
  const [checked, setChecked] = useState<{ wrong: number; missing: number } | null>(null);

  const opening = useMemo(() => (resumed === null ? null : openingSteps(resumed.steps, resumed.progress, size, (each) => (decodeLine(each, size) === null ? null : each))), [resumed, size]);
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
    (next: string) => {
      if (next === code) return;
      const at = begin();
      setCode(next);
      for (let place = 0; place < next.length; place += 1) if (next[place] !== code[place]) hinting.unmark(place);
      setChecked(null);
      if (checkHitofude(size, givens, next).ok) void finish(next, at);
    },
    [code, begin, hinting, size, givens, finish],
  );

  const line = useMemo(() => decodeLine(code, size) ?? [], [code, size]);

  const onSquare = useCallback(
    (square: number, begins: boolean) => {
      if (!live) return;
      if (begins) setStrokes((so) => (so.at(-1) === code ? so : [...so, code]));
      write(encodeLine(lineAfter(line, numbers, square, size, !begins), size));
    },
    [live, code, line, numbers, size, write],
  );

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!live || event.metaKey || event.ctrlKey || event.altKey || !event.key.startsWith(ARROW_KEY)) return;
    event.preventDefault();
    const direction = event.key.slice(ARROW_KEY.length).toLowerCase() as "up" | "down" | "left" | "right";
    setStrokes((so) => (so.at(-1) === code ? so : [...so, code]));
    write(encodeLine(lineAfterArrow(line, numbers, direction, size), size));
  };

  const undo = () => {
    // A press that changed nothing left its line on the list: those are passed over, so Undo always changes something.
    const rest = [...strokes];
    let back = rest.pop();
    while (back === code) back = rest.pop();
    setStrokes(rest);
    if (back !== undefined) write(back);
  };

  /* Show: the squares of the line after it leaves the answer, marked until each is changed. A Check's worth, so paid for as one. */
  const show = () => {
    if (!checking.spend()) return;
    const off = offTheAnswer(size, code, solution);
    hinting.mark(off.wrongCells);
    setChecked({ wrong: off.wrongCells.length, missing: off.left });
  };
  const check = () => {
    if (!checking.spend()) return;
    const off = offTheAnswer(size, code, solution);
    setChecked({ wrong: off.wrongCells.length, missing: off.left });
  };
  /* Hint: the line cut back to where it agrees with the answer, and one more right step. */
  const hint = () => {
    const next = hintedLine(size, code, solution);
    if (next === null || !hinting.spend()) return;
    setStrokes((so) => [...so, code]);
    write(encodeLine(next, size));
  };

  const steps = useMemo(() => history.steps.map((each) => [...each]), [history.steps]);
  const disabled = startedAt === null || pausing.paused;
  const press = `${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} px-3 py-1 text-sm`;
  const last = numbers.reduce((most, number) => Math.max(most, number), 0);
  const next = nextNumberOf(line, numbers);
  const left = size * size - line.length;
  const said = checked !== null ? hitofudeChecked(checked, say) : line.length === 1 ? say.say("pgrid.hitofude.howTo") : next > last ? say.say("pgrid.hitofude.tooSoon") : `${say.say("pgrid.hitofude.next", { number: String(next) })} ${say.count("pgrid.hitofude.left", left)}`;

  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={seed} data-code={code} data-wrong={[...hinting.marked].join(",")} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <HitofudeBoard
          size={size}
          givens={givens}
          code={history.shown}
          wrong={hinting.marked}
          solved={done !== null && done.outOfGuesses !== true}
          readOnly={done !== null || history.reviewing}
          label={say.say("pgrid.hitofude.label", { size: String(size), howTo: say.say("pgrid.hitofude.howTo") })}
          onSquare={onSquare}
          onKey={onKey}
        />
      </SolvePaused>
      <PuzzleSteps<string> steps={steps} viewing={history.viewing} go={history.go} size={size} say={(value) => hitofudeStepWord(value, say)} />
      {done === null ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={`${press} ${ROOM_FOR_A_WORD}`} onClick={undo} disabled={!live || strokes.length === 0} data-testid="hitofude-undo">
              {say.say("puzzle.press.undo")}
            </button>
            <button type="button" className={`${press} ${ROOM_FOR_TWO_WORDS}`} onClick={() => write(blank)} disabled={!live || code === blank} data-testid="hitofude-restart">
              {say.say("puzzle.press.restart")}
            </button>
            <SolveCheck checking={checking} onCheck={check} disabled={disabled} />
            <SolveShow checking={checking} onShow={show} disabled={disabled} />
            <SolveHint hinting={hinting} onHint={hint} disabled={disabled} racing={race !== null} />
          </div>
          <span className={`text-sm text-muted ${ROOM_FOR_THREE_LINES}`} data-testid={checked !== null ? "puzzle-checked" : "hitofude-said"} data-left={left} data-next={next} aria-live="polite">
            {said}
          </span>
        </div>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={checking.allowed} />
      )}
    </section>
  );
}
