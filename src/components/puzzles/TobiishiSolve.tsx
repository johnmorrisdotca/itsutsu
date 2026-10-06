"use client";

import Link from "@/components/ui/Link";
import { useEffect, useMemo, useRef, useState } from "react";

import { phraseWith } from "@/components/i18n/phraseWith";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PLAY_SURFACE, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import { nextLevelLabel } from "@/lib/puzzles/fixedLevel";
import { tobiishiLevelCount } from "@/lib/puzzles/tobiishi/levelCounts";
import { tobiishiGoalOf, tobiishiPackOf, tobiishiRefOfCode } from "@/lib/puzzles/tobiishi/levels";
import { tobiishiSizeLabel } from "@/lib/puzzles/tobiishi/sizes";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { SolveTime } from "./SolveTime";
import { tobiishiWords } from "./mazeWords";
import { keepSolveHere, keptSolves } from "./tobiishiKept";
import { TobiishiBoard, type TobiishiHandle, type TobiishiReading } from "./TobiishiBoard";
import { TobiishiLevelChips } from "./TobiishiLevelChips";
import { tobiishiLevelPath } from "./TobiishiLevelPicker";
import { TobiishiStill } from "./TobiishiStill";

/** The lowest level of a length not yet solved, or null when every one is. */
function firstUnsolved(count: number, done: ReadonlySet<number>): number | null {
  for (let level = 1; level <= count; level += 1) if (!done.has(level)) return level;
  return null;
}

/** The board of levels at a length: the levels' set-up, opened on that length. */
function levelsPath(size: number): string {
  return `${setUpPath("tobiishi")}?size=${size}`;
}

/**
 * Solving Tobiishi: jump pegs over pegs into empty holes until one is left, in the goal hole. The board is
 * ours over the package's engine (`TobiishiBoard`): tap a peg and then a hole, or drag one across, and the
 * engine allows only the jumps the rules do. The puzzle is done the moment one peg is left in the goal, and
 * what is handed in, and kept half way, is the run of jumps as the site keeps one (`tobiishi/way.ts`), which
 * the server replays on the level's own board before it pays (`checkTobiishi`).
 *
 * The clock starts with the first jump. The buttons under the board are the site's own and press the
 * board's (`TobiishiHandle`): Undo takes back the last jump, Restart sets the pegs out again.
 *
 * A LEVEL is the same board for everybody, so it is played the same way with what a level adds to this
 * screen, as Meikyuu's and Suido's levels add: "Level 12 of 27" in place of a seed's number, the next level
 * and the board of levels at the end in place of Another, and a level already solved opening on its
 * finished board. A level has no hint and no clock.
 */
export function TobiishiSolve({
  puzzle,
  hasAccount,
  race = null,
  resumed = null,
  known = {},
  bestSolves = {},
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  resumed?: ResumedRun | null;
  /** The levels at this length the member has solved on the account, with their best times. */
  known?: Record<number, number>;
  /** The member's best solve of each level at this length, to open from its time. */
  bestSolves?: Record<number, string>;
}) {
  const say = useSpeaker();
  const TOBIISHI_COPY = tobiishiWords(say.locale).copy;
  const hydrated = useHydrated();
  const { kind, size, seed: level } = puzzle;
  const count = tobiishiLevelCount(size);
  const ref = tobiishiRefOfCode(puzzle.givens);
  const handle = useRef<TobiishiHandle>(null);
  const [reading, setReading] = useState<TobiishiReading | null>(null);
  /* The run as it stands, for the run to keep: what a resumed run was left with until the board says otherwise. */
  const [way, setWay] = useState(resumed?.progress ?? "");

  /* THE LEVELS SOLVED, as this page knows them: the account's (`known`) and this browser's (`tobiishiKept`), read now: this page is drawn in the browser only (`PuzzlePlayClient`). */
  const [solvedHere] = useState<Record<number, number>>(() => ({ ...keptSolves(size), ...known }));
  const solvedSet = useMemo(() => new Set(Object.keys(solvedHere).map(Number)), [solvedHere]);
  // A level already solved opens on its finished board; only "Play it again" starts it over.
  const [reviewing, setReviewing] = useState(race === null && resumed === null && solvedSet.has(level));

  const { startedAt, elapsedMs, done, begin, finish, pausing } = useSolve(puzzle, hasAccount, race, null, { progress: way, resumed });
  const live = done === null && !pausing.paused && !reviewing;

  /* The board says what the run is after every change; the clock starts at its first jump and the run is handed in the moment it is solved. */
  const latest = useRef({ begin, finish, startedAt, done });
  useEffect(() => {
    latest.current = { begin, finish, startedAt, done };
  });
  const handedIn = useRef(false);
  const told = (next: TobiishiReading) => {
    setReading(next);
    setWay(next.way);
    const now = latest.current;
    if (now.done !== null || handedIn.current) return;
    if (now.startedAt === null && next.jumps >= 1) now.begin();
    if (next.solved) {
      handedIn.current = true;
      void now.finish(next.way, now.begin());
    }
  };

  // Kept in this browser as soon as a level is solved, so the board of levels shows it with or without an account.
  useEffect(() => {
    if (done !== null && race === null && !done.outOfTime) keepSolveHere(puzzle.givens, done.elapsedMs);
  }, [done, race, puzzle.givens]);

  // Where "next" leads once this one is solved: the lowest level still unsolved, this one counted in.
  const onwardTo = firstUnsolved(count, new Set([...solvedSet, level]));
  const onward = {
    next: onwardTo === null ? null : { href: tobiishiLevelPath(size, onwardTo), label: nextLevelLabel(level, onwardTo, say) },
    all: { href: levelsPath(size), label: say.say("pset.mine.allLevels") },
  };
  const asked = (
    <>
      {tobiishiSizeLabel(size, say)} · {say.say("puzzle.level.number", { number: String(level) })} <span className="text-xs">{say.say("pmaze.ofCount", { count: String(count) })}</span>
      {ref === null ? null : (
        <span className="text-xs">
          {" "}
          · {say.pairName(tobiishiPackOf(ref.pack).title.en, tobiishiPackOf(ref.pack).title.ja).text}{say.locale === "ja" ? "、" : ", "}{say.pairName(tobiishiGoalOf(ref).names.en, tobiishiGoalOf(ref).names.ja).text}
        </span>
      )}
    </>
  );
  const chips = <TobiishiLevelChips code={puzzle.givens} level={level} />;

  if (reviewing) {
    // The level as it was solved: the board with its one peg in the goal, and the ways on.
    return (
      <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={level} data-level={level} data-code={puzzle.givens} data-reviewing="true" data-solved="true" {...readyMark(hydrated)}>
        <p className="text-sm text-muted" data-testid="puzzle-asked">
          {asked}
        </p>
        <TobiishiStill code={puzzle.givens} solved />
        {chips}
        <div className="flex flex-col gap-2" data-testid="tobiishi-solved-view">
          <p className="text-sm">
            {solvedHere[level] === undefined
              ? say.say("puzzle.press.solved")
              : phraseWith(say.say("puzzle.press.solvedBest"), { time: <SolveTime kind="tobiishi" solveId={bestSolves[level] ?? null} elapsedMs={solvedHere[level]!} mine testId="tobiishi-best-time" /> })}
          </p>
          <div className="flex flex-wrap gap-2">
            {onward.next === null ? null : (
              <Link href={onward.next.href} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="puzzle-next-level">
                {onward.next.label}
              </Link>
            )}
            <Link href={onward.all.href} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-all-levels">
              {onward.all.label}
            </Link>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => setReviewing(false)} data-testid="tobiishi-play-again">
              {say.say("puzzle.press.playAgain")}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const press = "px-3 py-1 text-sm";
  const said =
    reading === null || reading.jumps === 0
      ? TOBIISHI_COPY.howTo
      : reading.solved
        ? TOBIISHI_COPY.status(reading.pegs, reading.jumps)
        : reading.stuck
          ? reading.pegs === 1
            ? TOBIISHI_COPY.wrongHole
            : TOBIISHI_COPY.stuck
          : TOBIISHI_COPY.status(reading.pegs, reading.jumps);
  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={level} data-level={level} data-code={puzzle.givens} data-jumps={reading?.jumps ?? 0} data-solved={reading?.solved === true ? "true" : "false"} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} asked={asked} />
      <SolvePaused pausing={pausing}>
        <TobiishiBoard code={puzzle.givens} way={resumed?.progress ?? ""} locked={!live} onChange={told} handle={handle} />
      </SolvePaused>
      {chips}
      {done === null ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2" data-testid="tobiishi-controls">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={say.say("pmaze.theJumps")}>
              <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${press}`} onClick={() => handle.current?.undo()} disabled={!live || reading?.undoable !== true} data-testid="tobiishi-undo">
                {say.say("puzzle.press.undo")}
              </button>
              <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${press}`} onClick={() => handle.current?.restart()} disabled={!live || reading?.undoable !== true} data-testid="tobiishi-restart">
                {say.say("puzzle.press.restart")}
              </button>
            </div>
          </div>
          <span className="text-sm text-muted" data-testid="tobiishi-said" data-jumps={reading?.jumps ?? 0} data-pegs={reading?.pegs ?? 0} aria-live="polite">
            {said}
          </span>
        </div>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} onward={race === null ? onward : undefined} />
      )}
    </section>
  );
}
