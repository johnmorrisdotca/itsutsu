"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";
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

  useEffect(() => {
    if (startedAt === null || done !== null) return;
    const timer = window.setInterval(() => setNow(Date.now()), PUZZLE_CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, [startedAt, done]);

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
      const elapsedMs = startedAt === null ? 0 : at - startedAt;
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
    [puzzle, startedAt, hasAccount, race, router],
  );

  const elapsedMs = done !== null ? done.elapsedMs : startedAt === null ? 0 : Math.max(0, now - startedAt);
  return { startedAt, elapsedMs, done, begin, finish };
}

/** The line over the grid: what was asked, the seed, and the clock. */
export function SolveHeader({ puzzle, elapsedMs }: { puzzle: Puzzle; elapsedMs: number }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <p className="text-sm text-muted" data-testid="puzzle-asked">
        {sizeWord(puzzle.size)} · {PUZZLE_LEVEL_DISPLAY[puzzle.level].label}{" "}
        <span className="font-mincho">{PUZZLE_LEVEL_DISPLAY[puzzle.level].kanji}</span>
        <span className="ml-2 text-xs">№ {puzzle.seed}</span>
      </p>
      <p className={PUZZLE_CLOCK} data-testid="puzzle-clock" aria-label="time taken">
        {clockText(elapsedMs)}
      </p>
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
