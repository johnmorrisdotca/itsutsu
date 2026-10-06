"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { checkSentence } from "@/lib/puzzles/checkWords";
import type { Speaker } from "@/lib/i18n/i18n";
import { PLAY_SURFACE } from "@/components/ui/ui.constants";
import { useCallback, useMemo, useState } from "react";

import { checkBridges } from "@/lib/puzzles/bridges/check";
import { boardOf, bridgesAt, crossedBy, decodeBridges, encodeBridges, spanBetween } from "@/lib/puzzles/bridges/code";
import { bridgeHint, bridgesChecked, bridgesWrong } from "@/lib/puzzles/bridges/help";
import { encodeBridgesProgress } from "@/lib/puzzles/puzzleProgress";
import { encodeStepLog, openingSteps } from "@/lib/puzzles/stepLog";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { BridgesGrid } from "./BridgesGrid";
import { PuzzleSteps } from "./PuzzleSteps";
import { bridgesCellWords, bridgesCopy } from "./gridWords";
import { SolveCheck, SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { SolveHint } from "./SolveHint";
import { SolveShow } from "./SolveShow";
import { TsunagiViewport } from "./TsunagiViewport";
import { useStepHistory } from "./useStepHistory";

/**
 * From this side the board opens at twice the box (Fit shows it whole): fitted to a phone a 21×21 has islands seventeen pixels
 * across and a 25×25 fourteen, too small for their numbers to be read or an island pressed.
 */
const OPENS_ZOOMED_FROM = 21;

/**
 * Solving Bridges: tap an island and then one in line with it for a bridge,
 * the same two again for a second, and again to take both away; or drag from
 * one to the other, which does the same. A bridge that would cross another is
 * refused and said so. The puzzle is done the moment the drawing passes the
 * check the server runs (`checkBridges`): every island its number, and all of
 * them joined. The answer handed in, and the run kept half way, is the
 * drawing itself (`bridges/code.ts`).
 *
 * The big boards, 11×11 and up, are looked at through the zoom Tsunagi's big
 * boards have (`TsunagiViewport`): Fit, the arrows, the wheel, and the view
 * nudged when a drag nears an edge.
 */
export function BridgesSolve({
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
  const copy = bridgesCopy(say.locale);
  const { kind, size, seed } = puzzle;
  const board = useMemo(() => boardOf(puzzle.givens, size)!, [puzzle.givens, size]);
  const answer = useMemo(() => decodeBridges(board, puzzle.solution) ?? [], [board, puzzle.solution]);
  const empty = useMemo(() => encodeBridges(board, board.spans.map(() => 0)), [board]);
  // The drawing as it stands, as it is kept: a run picked up again starts from what it was left with.
  const [drawing, setDrawing] = useState<string>(() => (resumed !== null && decodeBridges(board, resumed.progress) !== null ? resumed.progress : empty));
  const [chosen, setChosen] = useState<number | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [checked, setChecked] = useState<{ wrong: number; missing: number } | null>(null);

  const opening = useMemo(() => (resumed === null ? null : openingSteps(resumed.steps, resumed.progress, size, (code) => (decodeBridges(board, code) === null ? null : code))), [resumed, size, board]);
  const history = useStepHistory(drawing, opening);
  const counts = useMemo(() => decodeBridges(board, history.shown) ?? answer.map(() => 0), [board, history.shown, answer]);
  const current = useMemo(() => decodeBridges(board, drawing) ?? answer.map(() => 0), [board, drawing, answer]);

  const { startedAt, elapsedMs, done, begin, finish, pausing, checking, hinting } = useSolve(puzzle, hasAccount, race, checks, {
    progress: encodeBridgesProgress(board, current),
    steps: () => encodeStepLog(history.steps),
    resumed,
  }, hints);
  const live = done === null && !pausing.paused && !history.reviewing;

  /* One span set to a count, from a tap, a drag or a hint: the one door every change goes through. */
  const set = useCallback(
    (span: number, count: number, clearing: readonly number[] = []) => {
      const at = begin();
      const next = [...current];
      for (const other of clearing) next[other] = 0;
      next[span] = count;
      const code = encodeBridges(board, next);
      setDrawing(code);
      for (const each of [span, ...clearing]) hinting.unmark(each);
      setChecked(null);
      setSaid(null);
      if (checkBridges(size, puzzle.givens, code).ok) void finish(code, at);
      else if (board.islands.every((island, at) => bridgesAt(board, next, at) === island.count)) setSaid(copy.allNumbers);
    },
    [begin, current, board, hinting, size, puzzle.givens, finish, copy.allNumbers],
  );

  /* A bridge between two islands: one more, or none after two. Refused, and said, where it would cross one already drawn. */
  const bridge = useCallback(
    (from: number, to: number) => {
      const span = spanBetween(board, from, to);
      if (span === null) return false;
      const count = ((current[span] ?? 0) + 1) % 3;
      if (count > 0 && crossedBy(board, current, span).length > 0) {
        setSaid(copy.crossing);
        return true;
      }
      set(span, count);
      return true;
    },
    [board, current, set, copy.crossing],
  );

  const tap = (island: number) => {
    if (!live) return;
    if (island === -1 || island === chosen) {
      setChosen(null);
      return;
    }
    if (chosen !== null && bridge(chosen, island)) {
      setChosen(null);
      return;
    }
    // Not in line with the island chosen, or none chosen: this one is chosen instead.
    setChosen(island);
    setSaid(copy.chosen);
  };
  const drag = (from: number, to: number) => {
    if (!live) return;
    setChosen(null);
    bridge(from, to);
  };

  /* Show: the bridges drawn that the answer does not have, marked until changed. A Check's worth, so paid for as one. */
  const show = () => {
    if (!checking.spend()) return;
    const wrong = bridgesWrong(current, answer);
    hinting.mark(wrong);
    setChecked(bridgesChecked(current, answer));
  };
  const check = () => {
    if (!checking.spend()) return;
    setChecked(bridgesChecked(current, answer));
  };
  /* Hint: one span drawn as the answer has it, clearing whatever it would cross (which the answer never has). */
  const hint = () => {
    const span = bridgeHint(board, current, answer);
    if (span === null || !hinting.spend()) return;
    set(span, answer[span]!, answer[span]! > 0 ? crossedBy(board, current, span) : []);
  };

  const steps = useMemo(() => history.steps.map((code) => [...code]), [history.steps]);
  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={seed} data-drawing={drawing} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <TsunagiViewport size={size} name="bridges" startZoom={size >= OPENS_ZOOMED_FROM ? 2 : undefined}>
          <BridgesGrid board={board} counts={counts} chosen={live ? chosen : null} wrong={hinting.marked} done={done !== null || history.reviewing} onTap={tap} onDrag={drag} />
        </TsunagiViewport>
      </SolvePaused>
      <PuzzleSteps steps={steps} viewing={history.viewing} go={history.go} size={size} say={(value) => bridgesCellWords(say.locale)[value] ?? say.say("pgrid.step.island", { count: value })} />
      {done === null ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <SolveCheck checking={checking} onCheck={check} disabled={startedAt === null || pausing.paused} />
            <SolveShow checking={checking} onShow={show} disabled={startedAt === null || pausing.paused} />
            <SolveHint hinting={hinting} onHint={hint} disabled={startedAt === null || pausing.paused} racing={race !== null} />
          </div>
          <span className="text-sm text-muted" data-testid={checked !== null ? "puzzle-checked" : "bridges-said"} data-said={said === copy.crossing ? "crossing" : said === copy.allNumbers ? "all-numbers" : undefined} aria-live="polite">
            {checked !== null ? checkedLine(checked, say) : (said ?? copy.howTo)}
          </span>
        </div>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={checking.allowed} />
      )}
    </section>
  );
}

/** What Check says: how many bridges drawn are wrong, and how many are still to draw, never which. */
function checkedLine({ wrong, missing }: { wrong: number; missing: number }, say: Speaker): string {
  return checkSentence(say, "pgrid.check.okBridges", wrong, "pgrid.check.wrongBridge", missing > 0 ? say.say("pgrid.check.leftDraw", { count: String(missing) }) : null);
}
