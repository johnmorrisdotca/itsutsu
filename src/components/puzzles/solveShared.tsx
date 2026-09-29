"use client";

import type { SolveHelp } from "@/lib/puzzles/solveHelp";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { IdleModal } from "@/components/game/IdleModal";
import { GAME_COPY } from "@/components/game/game.constants";
import { useIdleWatch } from "@/components/game/useIdleWatch";

import { useHints } from "./useHints";
import { useKeptRun } from "./useKeptRun";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { clockLimitMs } from "@/lib/puzzles/puzzleClock";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";

import { PUZZLE_CLOCK_TICK_MS } from "./puzzles.constants";
import { usePuzzleClock } from "./PuzzleClockContext";

/**
 * What every kind of solve shares: the clock, handing the answer in, and the
 * card at the end. A kind's solve owns its grid and its entries and calls
 * `begin` on the first entry and `finish` with the answer as a string; this
 * does the rest, the same for a grid of numbers and a grid of stones.
 *
 * The clock is a browser interval while the puzzle is being solved and
 * nothing before or after. The one server call is `POST /api/puzzles/solved`,
 * made once, on finishing.
 */
export type Done = {
  elapsedMs: number;
  paid: { points: number; awards: string[] } | null;
  problem: string | null;
  /** Ended without being solved: a word whose guesses ran out, or any puzzle whose countdown did. Kept, and paid for playing it out. */
  outOfGuesses?: true;
  /** Ended by its countdown reaching nought (`puzzleClock.ts`); `outOfGuesses` is set too, as the ending every kind already draws. */
  outOfTime?: true;
  /** The kept solve, once the site has said which it is: the card opens it again, replay and all. */
  solveId?: string | null;
  /** How the solve was helped (`solveHelp.ts`), or null for none: the card says what that costs it. */
  helped?: SolveHelp | null;
};

/** A race this solve is one seat of: its id, when the server started this seat's clock, and the Check allowance both seats race under. */
export type SolveRace = { id: string; since: number; checksAllowed: number | null };

/** How many times Check may still be pressed (null for no limit), and the press that spends one. */
export type Checking = { allowed: number | null; used: number; left: number | null; spend: () => boolean };

/** An unfinished run kept on the account, opened where it was left: what was written, the time so far and the checks spent. */
export type ResumedRun = { progress: string; elapsedMs: number; checksUsed: number; hintsUsed: number; steps?: string | null };

/** What the solve screen is keeping: what is written now, and the run it opened with, if any. */
export type Keeping = {
  progress: string;
  resumed: ResumedRun | null;
  /** Every grid it has been, as a step log (`stepLog.ts`), worked out only when the run is kept: none for a Gomoji, whose grid is its history. */
  steps?: () => string;
  /** Whether Gomoji's Strict was chosen, kept so Continue opens it Strict; none for any other puzzle. */
  strict?: boolean;
  /** Whether Gomoji's Head start was chosen, kept (as a hint, `headStart.ts`) so Continue opens with it and the solve is priced with it. */
  headStart?: boolean;
};

export function useSolve(
  puzzle: Puzzle,
  hasAccount: boolean,
  race: SolveRace | null = null,
  checks: number | null = null,
  keeping: Keeping = { progress: "", resumed: null },
  /** Whether Hint was chosen for this puzzle; never in a race. */
  hints = false,
  /** A puzzle typed in letters (Gomoji), where P is a letter: only Space pauses it. */
  typesLetters = false,
) {
  const router = useRouter();
  /*
   * A RUN OPENED WHERE IT WAS LEFT is running the moment it opens, with its
   * time so far carried in. It used to open covered and paused, waiting for a
   * Resume; John, 2026-09-25, having pressed Continue in My games: "why is the
   * Game paused??? The fact we just clicked to enter the game should mean it's
   * Resumed, no?" Continue is the resume. This page is only ever drawn in the
   * browser (`PuzzlePlayClient`, `ssr: false`), so reading the clock here
   * cannot differ between a server and a browser.
   */
  const [carriedMs] = useState(keeping.resumed?.elapsedMs ?? 0);
  /* In a race the clock is the server's, started at Start; here it is read from then rather than from the first entry. */
  const [startedAt, setStartedAt] = useState<number | null>(() =>
    race !== null ? race.since : keeping.resumed !== null ? Date.now() : null,
  );
  const [now, setNow] = useState(0);
  const [done, setDone] = useState<Done | null>(null);
  /*
   * PAUSE. John, 2026-09-24: "Also a Game Pause, since I notice there is a
   * clock." The time paused so far, and when the pause now running began (null
   * while solving). A pause stops the clock AND covers the grid (`SolvePaused`),
   * so it cannot be spent looking for free. Not in a race: a race's clock is the
   * server's, started at Start and stopped at the finish, and nothing in this
   * browser can stop it — a Pause there would say it had.
   *
   * A run is kept on the account when it is paused or its page is left
   * (`useKeptRun`), and opened again from the member's games.
   */
  /* THE CHECK ALLOWANCE: a race's is the race's, the same for both seats; one's own is the address's. */
  const allowed = race === null ? checks : race.checksAllowed;
  const [used, setUsed] = useState(keeping.resumed?.checksUsed ?? 0);
  const left = allowed === null ? null : Math.max(0, allowed - used);
  const spend = useCallback((): boolean => {
    if (left === 0) return false;
    setUsed((so) => so + 1);
    return true;
  }, [left]);
  const checking: Checking = { allowed, used, left, spend };
  const hinting = useHints(race === null && hints, keeping.resumed?.hintsUsed ?? 0);

  const [pausedMs, setPausedMs] = useState(0);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const canPause = race === null && startedAt !== null && done === null;

  /*
   * THE COUNTDOWN, where one was chosen (`puzzleClock.ts`): not a timer of its
   * own but this clock read against the allowance, checked on the tick the
   * clock already makes. So it stops when the clock stops — a pause, Are you
   * still there, the page left — and starts on the first entry, as the clock
   * does. Never in a race, which is a contest already.
   */
  const chosenClock = usePuzzleClock();
  const clock = race === null ? chosenClock : "none";
  const limit = clockLimitMs(clock);
  const ranOut = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (startedAt === null || done !== null || pausedAt !== null) return;
    const timer = window.setInterval(() => {
      const at = Date.now();
      setNow(at);
      if (limit !== null && carriedMs + at - startedAt - pausedMs >= limit) ranOut.current();
    }, PUZZLE_CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, [startedAt, done, pausedAt, limit, carriedMs, pausedMs]);

  /* What is kept of this run, when it is paused or its page is left: nothing for a visitor, a race, or a puzzle finished or never started. */
  const keep = useKeptRun(() => {
    if (!hasAccount || race !== null || done !== null || startedAt === null) return null;
    const at = Date.now();
    const elapsedMs = carriedMs + (startedAt === null ? 0 : Math.max(0, (pausedAt ?? at) - startedAt - pausedMs));
    return {
      kind: puzzle.kind,
      size: puzzle.size,
      level: puzzle.level,
      seed: puzzle.seed,
      ...(puzzle.kind === "kumimoji" ? { gameLength: puzzle.gameLength ?? "short", language: puzzle.language ?? "english", doubleSet: puzzle.doubleSet ?? false, diagonals: puzzle.diagonals ?? false } : {}),
      checksAllowed: allowed,
      checksUsed: used,
      hintsAllowed: hinting.allowed,
      hintsUsed: hinting.used,
      progress: keeping.progress,
      ...(keeping.steps === undefined ? {} : { steps: keeping.steps() }),
      ...(keeping.strict === undefined ? {} : { strict: keeping.strict }),
      ...(keeping.headStart === true ? { headStart: true } : {}),
      ...(clock === "none" ? {} : { clock }),
      elapsedMs,
    };
  });

  const togglePause = useCallback(() => {
    if (!canPause) return;
    const at = Date.now();
    if (pausedAt === null) {
      setNow(at);
      setPausedAt(at);
      keep();
    } else {
      setPausedMs((so) => so + (at - pausedAt));
      setPausedAt(null);
      setNow(at);
    }
  }, [canPause, pausedAt, keep]);

  /*
   * "ARE YOU STILL THERE?", the same watch and question as every game. Away
   * pauses the run as Pause does — clock stopped, grid covered — so two minutes
   * of nobody is not two minutes on the time; "Still here" resumes it, but only
   * a pause the watch made, never one the solver chose. In a race nothing can
   * pause, so the question only asks.
   */
  const pausedByAway = useRef(false);
  const { idle: away, confirm } = useIdleWatch({
    enabled: startedAt !== null && done === null,
    onIdle: () => {
      if (!canPause || pausedAt !== null) return;
      pausedByAway.current = true;
      togglePause();
    },
  });
  const here = useCallback(() => {
    confirm();
    if (pausedByAway.current && pausedAt !== null) togglePause();
    pausedByAway.current = false;
  }, [confirm, pausedAt, togglePause]);

  /* P, or Space when no button has the focus (a focused button already takes Space as its own press). */
  useEffect(() => {
    if (!canPause) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const onControl = event.target instanceof HTMLElement && event.target.closest("button, a, input, select, textarea") !== null;
      if ((!typesLetters && (event.key === "p" || event.key === "P")) || (event.key === " " && !onControl)) {
        event.preventDefault();
        togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canPause, togglePause, typesLetters]);

  /** The first entry: the clock starts. Returns the moment, for `finish`. */
  const begin = useCallback((): number => {
    const at = Date.now();
    if (startedAt === null) {
      setStartedAt(at);
      setNow(at);
    }
    return at;
  }, [startedAt]);

  const finish = useCallback(
    async (answer: string, at: number, helped: SolveHelp | null = null) => {
      const elapsedMs = carriedMs + (startedAt === null ? 0 : Math.max(0, at - startedAt - pausedMs));
      // The last entry made after the countdown reached nought, before the tick that says so: out of time, not solved.
      if (limit !== null && elapsedMs >= limit) {
        ranOut.current();
        return;
      }
      setDone({ elapsedMs, paid: null, problem: null, helped });
      if (!hasAccount) return;
      try {
        /* One's own solve goes to the solved route with the browser's time; a
           race's goes to the race, which stamps its own and says it back. */
        const answered = await fetch(race === null ? "/api/puzzles/solved" : `/api/puzzles/races/${race.id}/finish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            race === null
              ? {
                  kind: puzzle.kind, size: puzzle.size, level: puzzle.level, seed: puzzle.seed, givens: puzzle.givens, answer, elapsedMs,
                  ...(puzzle.kind === "kumimoji" ? { gameLength: puzzle.gameLength ?? "short", language: puzzle.language ?? "english", doubleSet: puzzle.doubleSet ?? false, diagonals: puzzle.diagonals ?? false } : {}),
                  checksAllowed: allowed, checksUsed: used, hintsUsed: hinting.used, pausedMs, headStart: keeping.headStart === true,
                  // The grids on the way, for the replay on the solve's page: up to the one before the last entry, which the answer is.
                  ...(keeping.steps === undefined ? {} : { steps: keeping.steps() }),
                  // How it was helped, kept with the solve: solved, and scoring nothing (`solveHelp.ts`).
                  ...(helped === null ? {} : { helped }),
                  ...(clock === "none" ? {} : { clock }),
                }
              : { answer, checksUsed: used },
          ),
        });
        const body = (await answered.json().catch(() => null)) as { points?: number; awards?: string[]; elapsedMs?: number; error?: string; solveId?: string | null } | null;
        if (!answered.ok) {
          setDone({ elapsedMs, paid: null, problem: body?.error ?? "The site could not record that solve.", helped });
          return;
        }
        setDone({ elapsedMs: body?.elapsedMs ?? elapsedMs, paid: { points: body?.points ?? 0, awards: body?.awards ?? [] }, problem: null, solveId: body?.solveId ?? null, helped });
        // The race page above the solve reads the stamps again, so the result shows without a reload.
        if (race !== null) router.refresh();
      } catch {
        setDone({ elapsedMs, paid: null, problem: "The site could not be reached to record that solve.", helped });
      }
    },
    [puzzle, startedAt, pausedMs, carriedMs, allowed, used, hinting.used, hasAccount, race, router, keeping, clock, limit],
  );

  /**
   * A PUZZLE THAT ENDED UNSOLVED: a word whose guesses ran out. The route
   * checks the loss as it checks a solve, keeps it for the letters it found
   * and pays for playing it out, then takes the kept run off the member's
   * games. A race sends nothing: its seat simply never finishes, as a seat
   * left does.
   */
  const runOut = useCallback(
    async (answer: string, at: number) => {
      const elapsedMs = carriedMs + (startedAt === null ? 0 : Math.max(0, at - startedAt - pausedMs));
      setDone({ elapsedMs, paid: null, problem: null, outOfGuesses: true });
      if (!hasAccount || race !== null) return;
      try {
        const answered = await fetch("/api/puzzles/solved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: puzzle.kind, size: puzzle.size, level: puzzle.level, seed: puzzle.seed, givens: puzzle.givens, answer, elapsedMs, pausedMs, outOfGuesses: true, headStart: keeping.headStart === true, ...(clock === "none" ? {} : { clock }) }),
        });
        const body = (await answered.json().catch(() => null)) as { points?: number; awards?: string[] } | null;
        if (answered.ok) setDone({ elapsedMs, paid: { points: body?.points ?? 0, awards: body?.awards ?? [] }, problem: null, outOfGuesses: true });
      } catch {
        // Nothing is owed that cannot wait: a run left kept is opened again as it was and can be ended again.
      }
    },
    [puzzle, startedAt, pausedMs, carriedMs, hasAccount, race, keeping.headStart, clock],
  );

  /**
   * OUT OF TIME: the countdown reached nought. The puzzle ends unsolved, at
   * exactly its allowance, and what is written on it is handed in to be kept
   * as it stood (`POST /api/puzzles/solved` with `outOfTime`), which takes the
   * run off the member's games and pays for playing it out, as a word whose
   * guesses ran out is paid. A visitor's ends here, kept nowhere.
   */
  const timeUp = () => {
    if (limit === null || done !== null) return;
    const ended: Done = { elapsedMs: limit, paid: null, problem: null, outOfGuesses: true, outOfTime: true };
    setDone(ended);
    if (!hasAccount) return;
    void fetch("/api/puzzles/solved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: puzzle.kind, size: puzzle.size, level: puzzle.level, seed: puzzle.seed, givens: puzzle.givens, answer: keeping.progress, elapsedMs: limit, pausedMs,
        checksAllowed: allowed, checksUsed: used, hintsUsed: hinting.used, headStart: keeping.headStart === true, clock, outOfTime: true,
        ...(keeping.steps === undefined ? {} : { steps: keeping.steps() }),
      }),
    })
      .then(async (answered) => {
        const body = (await answered.json().catch(() => null)) as { points?: number; awards?: string[]; error?: string; solveId?: string | null } | null;
        setDone(answered.ok ? { ...ended, paid: { points: body?.points ?? 0, awards: body?.awards ?? [] }, solveId: body?.solveId ?? null } : { ...ended, problem: body?.error ?? "The site could not keep it." });
      })
      .catch(() => setDone({ ...ended, problem: "The site could not be reached to keep it." }));
  };
  // The tick reads the latest, with what is written now, without restarting the clock on every entry.
  useEffect(() => {
    ranOut.current = timeUp;
  });

  const elapsedMs = done !== null ? done.elapsedMs : carriedMs + (startedAt === null ? 0 : Math.max(0, (pausedAt ?? now) - startedAt - pausedMs));
  const pausing: Pausing = {
    paused: pausedAt !== null,
    canPause,
    toggle: togglePause,
    away,
    here,
    racing: race !== null,
    keptOnLeaving: hasAccount && race === null,
  };
  return { startedAt, elapsedMs, done, begin, finish, runOut, pausing, checking, hinting, clock };
}

/** Whether the run is paused, whether it may be, and the press that pauses or resumes it. */
export type Pausing = {
  paused: boolean;
  canPause: boolean;
  toggle: () => void;
  /** Nobody has touched anything for a while, and the question is up. */
  away: boolean;
  /** The answer "Still here". */
  here: () => void;
  racing: boolean;
  /** Whether leaving keeps this run: a member's own puzzle does; a visitor's lasts the page. */
  keptOnLeaving: boolean;
};

// The line over the grid lives in its own file; re-exported here for the solves that import it from this one.
export { SolveHeader } from "./SolveHeader";

/**
 * The Check press, saying how many are left when there is a limit, and saying
 * so plainly — rather than going grey without a word — once they are spent.
 */
export function SolveCheck({ checking, onCheck, disabled }: { checking: Checking; onCheck: () => void; disabled: boolean }) {
  const spent = checking.left === 0;
  return (
    <button
      type="button"
      className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
      onClick={onCheck}
      disabled={disabled || spent}
      title={spent ? "No checks left" : undefined}
      data-testid="puzzle-check"
      data-left={checking.left ?? "unlimited"}
    >
      {checking.left === null ? "Check" : spent ? "No checks left" : `Check · ${checking.left} left`}
    </button>
  );
}

/**
 * The grid, covered while the run is paused. The grid stays where it is and
 * only stops being drawn (`invisible`), so the page does not move and nothing
 * under the cover can be pressed; the cover says so and offers Resume.
 */
export function SolvePaused({ pausing, children }: { pausing: Pausing; children: ReactNode }) {
  return (
    <div className="relative" data-testid="puzzle-pausable" data-paused={pausing.paused ? "true" : "false"}>
      <div className={pausing.paused ? "invisible" : undefined} aria-hidden={pausing.paused || undefined}>
        {children}
      </div>
      {pausing.paused ? (
        <div className={`${PANEL_CLASS} absolute inset-0 flex flex-col items-center justify-center gap-3 text-center`} data-testid="puzzle-paused">
          <p className="text-lg font-semibold">
            Paused <span className="font-mincho text-base font-normal opacity-70">一時停止</span>
          </p>
          <p className="text-sm text-muted" data-testid="puzzle-paused-words">
            The clock has stopped, and the grid is covered until you come back.
          </p>
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG} ${TAP_HEIGHT}`} onClick={pausing.toggle} data-testid="puzzle-resume">
            Resume
          </button>
        </div>
      ) : null}
      <IdleModal
        open={pausing.away}
        onConfirm={pausing.here}
        detail={pausing.racing ? GAME_COPY.idleRaceDetail : GAME_COPY.idlePuzzleDetail}
        kept={pausing.racing ? GAME_COPY.idleRaceKept : pausing.keptOnLeaving ? GAME_COPY.idlePuzzleKept : GAME_COPY.idlePuzzleNotKept}
      />
    </div>
  );
}

// The card at the end lives in its own file; re-exported here for the solves that import it from this one.
export { SolveDone } from "./SolveDone";
