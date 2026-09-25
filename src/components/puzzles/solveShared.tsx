"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { IdleModal } from "@/components/game/IdleModal";
import { GAME_COPY } from "@/components/game/game.constants";
import { useIdleWatch } from "@/components/game/useIdleWatch";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { playPath, setUpPath } from "@/lib/gomoku/slugs";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { clockText } from "@/lib/puzzles/clockText";
import { freshSeed } from "@/lib/puzzles/random";

import { PUZZLE_CLOCK, PUZZLE_CLOCK_TICK_MS, sizeWord } from "./puzzles.constants";

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
export type Done = { elapsedMs: number; paid: { points: number; awards: string[] } | null; problem: string | null };

/** A race this solve is one seat of: its id, and when the server started this seat's clock. */
export type SolveRace = { id: string; since: number };

export function useSolve(puzzle: Puzzle, hasAccount: boolean, race: SolveRace | null = null) {
  const router = useRouter();
  /* In a race the clock is the server's, started at Start; here it is read from then rather than from the first entry. */
  const [startedAt, setStartedAt] = useState<number | null>(race === null ? null : race.since);
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
   * Nothing about a run outlives the page, paused or not: the entries and the
   * clock are this tab's alone, so leaving loses the run either way.
   */
  const [pausedMs, setPausedMs] = useState(0);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const canPause = race === null && startedAt !== null && done === null;

  useEffect(() => {
    if (startedAt === null || done !== null || pausedAt !== null) return;
    const timer = window.setInterval(() => setNow(Date.now()), PUZZLE_CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, [startedAt, done, pausedAt]);

  const togglePause = useCallback(() => {
    if (!canPause) return;
    const at = Date.now();
    if (pausedAt === null) {
      setNow(at);
      setPausedAt(at);
    } else {
      setPausedMs((so) => so + (at - pausedAt));
      setPausedAt(null);
      setNow(at);
    }
  }, [canPause, pausedAt]);

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
      if (event.key === "p" || event.key === "P" || (event.key === " " && !onControl)) {
        event.preventDefault();
        togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canPause, togglePause]);

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
    async (answer: string, at: number) => {
      const elapsedMs = startedAt === null ? 0 : Math.max(0, at - startedAt - pausedMs);
      setDone({ elapsedMs, paid: null, problem: null });
      if (!hasAccount) return;
      try {
        /* One's own solve goes to the solved route with the browser's time; a
           race's goes to the race, which stamps its own and says it back. */
        const answered = await fetch(race === null ? "/api/puzzles/solved" : `/api/puzzles/races/${race.id}/finish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            race === null
              ? { kind: puzzle.kind, size: puzzle.size, level: puzzle.level, givens: puzzle.givens, answer, elapsedMs }
              : { answer },
          ),
        });
        const body = (await answered.json().catch(() => null)) as { points?: number; awards?: string[]; elapsedMs?: number; error?: string } | null;
        if (!answered.ok) {
          setDone({ elapsedMs, paid: null, problem: body?.error ?? "The site could not record that solve." });
          return;
        }
        setDone({ elapsedMs: body?.elapsedMs ?? elapsedMs, paid: { points: body?.points ?? 0, awards: body?.awards ?? [] }, problem: null });
        // The race page above the solve reads the stamps again, so the result shows without a reload.
        if (race !== null) router.refresh();
      } catch {
        setDone({ elapsedMs, paid: null, problem: "The site could not be reached to record that solve." });
      }
    },
    [puzzle, startedAt, pausedMs, hasAccount, race, router],
  );

  const elapsedMs = done !== null ? done.elapsedMs : startedAt === null ? 0 : Math.max(0, (pausedAt ?? now) - startedAt - pausedMs);
  const pausing: Pausing = { paused: pausedAt !== null, canPause, toggle: togglePause, away, here, racing: race !== null };
  return { startedAt, elapsedMs, done, begin, finish, pausing };
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
};

/** The line over the grid: what was asked, the seed, and the clock. */
export function SolveHeader({ puzzle, elapsedMs, pausing }: { puzzle: Puzzle; elapsedMs: number; pausing?: Pausing }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <p className="text-sm text-muted" data-testid="puzzle-asked">
        {sizeWord(puzzle.size)} · {PUZZLE_LEVEL_DISPLAY[puzzle.level].label}{" "}
        <span className="font-mincho">{PUZZLE_LEVEL_DISPLAY[puzzle.level].kanji}</span>
        <span className="ml-2 text-xs">№ {puzzle.seed}</span>
      </p>
      <div className="flex items-center gap-2">
        {pausing?.canPause ? (
          <button
            type="button"
            className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} px-3 py-1 text-sm`}
            onClick={pausing.toggle}
            aria-pressed={pausing.paused}
            aria-keyshortcuts="P"
            data-testid="puzzle-pause"
          >
            {pausing.paused ? "Resume" : "Pause"}
          </button>
        ) : null}
        <p className={PUZZLE_CLOCK} data-testid="puzzle-clock" aria-label="time taken">
          {clockText(elapsedMs)}
        </p>
      </div>
    </div>
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
          <p className="text-sm text-muted">The clock has stopped, and the grid is covered until you come back.</p>
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG} ${TAP_HEIGHT}`} onClick={pausing.toggle} data-testid="puzzle-resume">
            Resume
          </button>
        </div>
      ) : null}
      <IdleModal
        open={pausing.away}
        onConfirm={pausing.here}
        detail={pausing.racing ? GAME_COPY.idleRaceDetail : GAME_COPY.idlePuzzleDetail}
        kept={GAME_COPY.idlePuzzleKept}
      />
    </div>
  );
}

/** The card at the end: the time, what was paid, another puzzle, or a different size. */
export function SolveDone({ puzzle, done, hasAccount, race = null }: { puzzle: Puzzle; done: Done; hasAccount: boolean; race?: SolveRace | null }) {
  const router = useRouter();
  const copy = PUZZLE_DISPLAY[puzzle.kind];
  const another = () => {
    router.push(`${playPath(puzzle.kind)}${puzzleQuery({ size: puzzle.size, level: puzzle.level, seed: freshSeed() })}`);
  };
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="puzzle-done" aria-live="polite">
      <p className="text-lg font-semibold">
        Solved <span className="font-mincho text-base font-normal opacity-70">解決</span> in {clockText(done.elapsedMs)}.
      </p>
      <p className="text-sm text-muted" data-testid="puzzle-paid">
        {!hasAccount
          ? "A member is paid XP for a solve. Join, and the next one counts."
          : done.paid !== null
            ? done.paid.points > 0
              ? `+${done.paid.points} XP, for ${awardWords(done.paid.awards)}.`
              : "Already paid for this puzzle, or the day's allowance is spent — the solve still stands."
            : (done.problem ?? "Recording your solve…")}
      </p>
      {race === null ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={another} data-testid="puzzle-another">
            Another {copy.label} →
          </button>
          <Link href={setUpPath(puzzle.kind)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-set-up">
            Change the size or level
          </Link>
        </div>
      ) : (
        <p className="text-sm text-muted">Handed in. The race above says how it stands.</p>
      )}
    </div>
  );
}

const AWARD_WORDS: Record<string, string> = {
  puzzleSolved: "the solve",
  firstOfVariant: "your first of this puzzle",
  firstOfFamily: "your first puzzle at all",
  everyVariantPlayed: "every game on the site played",
  everyFamilyPlayed: "every family met",
  raceWon: "winning the race",
};

function awardWords(awards: readonly string[]): string {
  const words = awards.map((award) => AWARD_WORDS[award] ?? award);
  if (words.length <= 1) return words[0] ?? "the solve";
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}
